using Abp.Application.Services;
using Abp.Application.Services.Dto;
using Abp.Authorization;
using Abp.BackgroundJobs;
using Abp.Domain.Repositories;
using Abp.Runtime.Session;
using Abp.UI;
using AttendanceModule.AttendanceModuleEntities;
using AttendanceModule.Roster.Dtos;
using AttendanceModule.Shift.BackgroundJobs;
using AttendanceModule.Shift.Dtos;
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using static AttendanceModule.Authorization.AttendanceModuleAuthorizationProvider;

namespace AttendanceModule.Roster
{
    public class RosterAppService : ApplicationService, IRosterAppService
    {
        private readonly IRepository<AttendanceModuleEntities.Roster, int> _rosterRepository;
        private readonly IRepository<AttendanceModuleEntities.ShiftSwapRequest, int> _shiftSwapRequestRepository;
        private readonly IRepository<AttendanceModuleEntities.Employee, int> _employeeRepository;
        private readonly IRepository<AttendanceModuleEntities.Shift, int> _shiftRepository;
        private readonly IBackgroundJobManager _backgroundJobManager;
        private readonly IAbpSession _abpSession;
        private readonly ILogger<RosterAppService> _logger;
        private readonly IMapper _mapper;

        public RosterAppService(
            IRepository<AttendanceModuleEntities.Roster, int> rosterRepository,
            IRepository<AttendanceModuleEntities.ShiftSwapRequest, int> shiftSwapRequestRepository,
            IRepository<AttendanceModuleEntities.Employee, int> employeeRepository,
            IRepository<AttendanceModuleEntities.Shift, int> shiftRepository,
            IBackgroundJobManager backgroundJobManager,
            IAbpSession abpSession,
            ILogger<RosterAppService> logger,
            IMapper mapper)
        {
            _rosterRepository = rosterRepository;
            _shiftSwapRequestRepository = shiftSwapRequestRepository;
            _employeeRepository = employeeRepository;
            _shiftRepository = shiftRepository;
            _backgroundJobManager = backgroundJobManager;
            _abpSession = abpSession;
            _logger = logger;
            _mapper = mapper;
        }

        [AbpAuthorize(RosterPermissions.Pages_Rosters_Assign)]
        public async Task<RosterDto> AssignRosterAsync(CreateRosterDto input)
        {
            var roster = _mapper.Map<AttendanceModuleEntities.Roster>(input);
            roster.TenantId = 1;

            await _rosterRepository.InsertAsync(roster);

            return _mapper.Map<RosterDto>(roster);
        }

        [AbpAuthorize(RosterPermissions.Pages_Rosters_View)]
        public async Task<List<RosterDto>> GetEmployeeRosterAsync(int employeeId, DateTime startDate, DateTime endDate)
        {
            var query = await _rosterRepository
                .GetAllIncluding(r => r.Employee, r => r.Shift)
                .Where(r => r.EmployeeId == employeeId &&
                            r.RosterDate >= startDate &&
                            r.RosterDate <= endDate)
                .OrderBy(r => r.RosterDate)
                .ToListAsync();

            return _mapper.Map<List<RosterDto>>(query);
        }


        [AbpAuthorize(RosterPermissions.Pages_Rosters_View)]
        public async Task<PagedResultDto<RosterDto>> GetPagedRosterAsync(GetRosterListInputDto input)
        {
            var query = _rosterRepository.GetAllIncluding(r => r.Employee, r => r.Shift);

            if (!string.IsNullOrWhiteSpace(input.Keyword))
            {
                query = query.Where(r => r.Employee.FirstName.Contains(input.Keyword) ||
                                         r.Employee.LastName.Contains(input.Keyword) ||
                                         r.Shift.Name.Contains(input.Keyword));
            }

            var totalCount = await query.CountAsync();

            var rosters = await query
                .OrderBy(r => r.RosterDate)
                .Skip(input.SkipCount)
                .Take(input.MaxResultCount)
                .ToListAsync();

            var rosterDtos = _mapper.Map<List<RosterDto>>(rosters);

            return new PagedResultDto<RosterDto>(totalCount, rosterDtos);
        }

        [AbpAuthorize(RosterPermissions.Pages_Rosters_Assign)]
        public async Task<ShiftSwapRequestDto> RequestShiftSwapAsync(CreateShiftSwapRequestDto input)
        {
            var requestToSwapShift = new ShiftSwapRequest
            {
                RequesterId = input.RequesterId,
                TargetEmployeeId = input.TargetEmployeeId,
                ShiftId = input.ShiftId,
                RosterDate = input.RosterDate,
                Reason = input.Reason,
                ProposedDate = input.ProposedDate,
                Status = "PENDING",
                TenantId = _abpSession.TenantId ?? 1
            };

            await _shiftSwapRequestRepository.InsertAsync(requestToSwapShift);

            // Load related data for email
            var requester = await _employeeRepository.GetAsync(input.RequesterId);
            var targetEmployee = await _employeeRepository.GetAsync(input.TargetEmployeeId);
            var shift = await _shiftRepository.GetAsync(input.ShiftId);

            // Send email notification to target employee
            await _backgroundJobManager.EnqueueAsync<ShiftSwapEmailJob, ShiftSwapEmailJobArgs>(
                new ShiftSwapEmailJobArgs
                {
                    EmployeeEmail = targetEmployee.Email,
                    EmployeeName = $"{targetEmployee.FirstName} {targetEmployee.LastName}",
                    ShiftName = shift.Name,
                    RosterDate = input.RosterDate,
                    Reason = input.Reason,
                    TargetEmployeeName = $"{requester.FirstName} {requester.LastName}",
                    Type = EmailType.SwapRequest
                }
            );

            return _mapper.Map<ShiftSwapRequestDto>(requestToSwapShift);
        }

        [AbpAuthorize(RosterPermissions.Pages_Rosters_View)]
        public async Task<PagedResultDto<ShiftSwapRequestDto>> GetPendingSwapRequestsAsync(GetSwapRequestsInputDto input)
        {
            try
            {
                var query = _shiftSwapRequestRepository.GetAll()
                    .Where(s => s.Status == "PENDING");

                if (input.StartDate.HasValue)
                    query = query.Where(s => s.RosterDate >= input.StartDate.Value);

                if (input.EndDate.HasValue)
                    query = query.Where(s => s.RosterDate <= input.EndDate.Value);

                var totalCount = await query.CountAsync();

                var swapRequests = await query
                    .OrderByDescending(s => s.CreationTime)
                    .Skip(input.SkipCount)
                    .Take(input.MaxResultCount)
                    .ToListAsync();

                var dtos = new List<ShiftSwapRequestDto>();
                foreach (var s in swapRequests)
                {
                    var requester = await _employeeRepository.GetAsync(s.RequesterId);
                    var targetEmployee = await _employeeRepository.GetAsync(s.TargetEmployeeId);
                    var shift = await _shiftRepository.GetAsync(s.ShiftId);

                    dtos.Add(new ShiftSwapRequestDto
                    {
                        Id = s.Id,
                        RequesterId = s.RequesterId,
                        RequesterName = $"{requester?.FirstName} {requester?.LastName}",
                        TargetEmployeeId = s.TargetEmployeeId,
                        TargetEmployeeName = $"{targetEmployee?.FirstName} {targetEmployee?.LastName}",
                        ShiftId = s.ShiftId,
                        ShiftName = shift?.Name,
                        RosterDate = s.RosterDate,
                        Reason = s.Reason,
                        ProposedDate = s.ProposedDate,
                        Status = s.Status,
                        CreationTime = s.CreationTime
                    });
                }

                return new PagedResultDto<ShiftSwapRequestDto>(totalCount, dtos);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in GetPendingSwapRequestsAsync");
                throw;
            }
        }

        [AbpAuthorize(RosterPermissions.Pages_Rosters_View)]
        public async Task<PagedResultDto<ShiftSwapRequestDto>> GetMySwapRequestsAsync(GetSwapRequestsInputDto input)
        {
            try
            {
                var currentUserId = _abpSession.UserId;
                var currentEmployee = await _employeeRepository.FirstOrDefaultAsync(e => e.UserId == (int)currentUserId.Value);

                if (currentEmployee == null)
                {
                    return new PagedResultDto<ShiftSwapRequestDto>(0, new List<ShiftSwapRequestDto>());
                }

                var query = _shiftSwapRequestRepository.GetAll()
                    .Where(s => s.RequesterId == currentEmployee.Id || s.TargetEmployeeId == currentEmployee.Id);

                if (!string.IsNullOrEmpty(input.Status))
                    query = query.Where(s => s.Status == input.Status);

                var totalCount = await query.CountAsync();

                var swapRequests = await query
                    .OrderByDescending(s => s.CreationTime)
                    .Skip(input.SkipCount)
                    .Take(input.MaxResultCount)
                    .ToListAsync();

                var dtos = new List<ShiftSwapRequestDto>();
                foreach (var s in swapRequests)
                {
                    var requester = await _employeeRepository.GetAsync(s.RequesterId);
                    var targetEmployee = await _employeeRepository.GetAsync(s.TargetEmployeeId);
                    var shift = await _shiftRepository.GetAsync(s.ShiftId);
                    AttendanceModuleEntities.Employee approver = null;
                    if (s.ApproverId.HasValue)
                    {
                        approver = await _employeeRepository.FirstOrDefaultAsync(s.ApproverId.Value);
                    }

                    dtos.Add(new ShiftSwapRequestDto
                    {
                        Id = s.Id,
                        RequesterId = s.RequesterId,
                        RequesterName = $"{requester?.FirstName} {requester?.LastName}",
                        TargetEmployeeId = s.TargetEmployeeId,
                        TargetEmployeeName = $"{targetEmployee?.FirstName} {targetEmployee?.LastName}",
                        ShiftId = s.ShiftId,
                        ShiftName = shift?.Name,
                        RosterDate = s.RosterDate,
                        Reason = s.Reason,
                        ProposedDate = s.ProposedDate,
                        Status = s.Status,
                        ApproverId = s.ApproverId,
                        ApproverName = approver != null ? $"{approver.FirstName} {approver.LastName}" : null,
                        ApproverComments = s.ApproverComments,
                        ActionDate = s.ActionDate,
                        CreationTime = s.CreationTime
                    });
                }

                return new PagedResultDto<ShiftSwapRequestDto>(totalCount, dtos);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in GetMySwapRequestsAsync");
                throw;
            }
        }

        [AbpAuthorize(RosterPermissions.Pages_Rosters_Swap)]
        public async Task ApproveShiftSwapAsync(int swapRequestId, ApproveRejectSwapRequestDto input)
        {
            var swapRequest = await _shiftSwapRequestRepository.GetAsync(swapRequestId);

            if (swapRequest == null)
            {
                throw new UserFriendlyException("Swap request not found.");
            }

            if (swapRequest.Status != "PENDING")
            {
                throw new UserFriendlyException("Swap request already processed.");
            }

            var currentUserId = _abpSession.UserId;
            var approverEmployee = await _employeeRepository.FirstOrDefaultAsync(e => e.UserId == (int)currentUserId.Value);

            swapRequest.Status = "APPROVED";
            swapRequest.ApproverId = approverEmployee?.Id;
            swapRequest.ApproverComments = input.Comments;
            swapRequest.ActionDate = DateTime.Now;
            swapRequest.LastModificationTime = DateTime.Now;
            swapRequest.LastModifierUserId = currentUserId;

            await _shiftSwapRequestRepository.UpdateAsync(swapRequest);

            // Swap the rosters
            var rosters = await _rosterRepository.GetAll()
                .Where(r => r.RosterDate == swapRequest.RosterDate && r.ShiftId == swapRequest.ShiftId &&
                            (r.EmployeeId == swapRequest.RequesterId || r.EmployeeId == swapRequest.TargetEmployeeId))
                .ToListAsync();

            if (rosters.Count == 2)
            {
                var requesterRoster = rosters.First(r => r.EmployeeId == swapRequest.RequesterId);
                var targetRoster = rosters.First(r => r.EmployeeId == swapRequest.TargetEmployeeId);

                requesterRoster.EmployeeId = swapRequest.TargetEmployeeId;
                targetRoster.EmployeeId = swapRequest.RequesterId;

                await _rosterRepository.UpdateAsync(requesterRoster);
                await _rosterRepository.UpdateAsync(targetRoster);
            }

            // Load related entities for email
            var requester = await _employeeRepository.GetAsync(swapRequest.RequesterId);
            var targetEmployee = await _employeeRepository.GetAsync(swapRequest.TargetEmployeeId);
            var shift = await _shiftRepository.GetAsync(swapRequest.ShiftId);

            // Send email notifications
            await _backgroundJobManager.EnqueueAsync<ShiftSwapEmailJob, ShiftSwapEmailJobArgs>(
                new ShiftSwapEmailJobArgs
                {
                    EmployeeEmail = requester.Email,
                    EmployeeName = $"{requester.FirstName} {requester.LastName}",
                    ShiftName = shift.Name,
                    RosterDate = swapRequest.RosterDate,
                    TargetEmployeeName = $"{targetEmployee.FirstName} {targetEmployee.LastName}",
                    ApproverComments = input.Comments,
                    Type = EmailType.SwapApproved
                }
            );

            await _backgroundJobManager.EnqueueAsync<ShiftSwapEmailJob, ShiftSwapEmailJobArgs>(
                new ShiftSwapEmailJobArgs
                {
                    EmployeeEmail = targetEmployee.Email,
                    EmployeeName = $"{targetEmployee.FirstName} {targetEmployee.LastName}",
                    ShiftName = shift.Name,
                    RosterDate = swapRequest.RosterDate,
                    TargetEmployeeName = $"{requester.FirstName} {requester.LastName}",
                    ApproverComments = input.Comments,
                    Type = EmailType.SwapApproved
                }
            );

            _logger.LogInformation($"Shift swap request {swapRequestId} approved by user {currentUserId}");
        }

        [AbpAuthorize(RosterPermissions.Pages_Rosters_Swap)]
        public async Task RejectShiftSwapAsync(int swapRequestId, ApproveRejectSwapRequestDto input)
        {
            var swapRequest = await _shiftSwapRequestRepository.GetAsync(swapRequestId);

            if (swapRequest == null)
            {
                throw new UserFriendlyException("Swap request not found.");
            }

            if (swapRequest.Status != "PENDING")
            {
                throw new UserFriendlyException("Swap request already processed.");
            }

            var currentUserId = _abpSession.UserId;
            var approverEmployee = await _employeeRepository.FirstOrDefaultAsync(e => e.UserId == (int)currentUserId.Value);

            swapRequest.Status = "REJECTED";
            swapRequest.ApproverId = approverEmployee?.Id;
            swapRequest.ApproverComments = input.Comments;
            swapRequest.ActionDate = DateTime.Now;
            swapRequest.LastModificationTime = DateTime.Now;
            swapRequest.LastModifierUserId = currentUserId;

            await _shiftSwapRequestRepository.UpdateAsync(swapRequest);

            // Load related entities for email
            var requester = await _employeeRepository.GetAsync(swapRequest.RequesterId);
            var targetEmployee = await _employeeRepository.GetAsync(swapRequest.TargetEmployeeId);
            var shift = await _shiftRepository.GetAsync(swapRequest.ShiftId);

            // Send email notification to requester
            await _backgroundJobManager.EnqueueAsync<ShiftSwapEmailJob, ShiftSwapEmailJobArgs>(
                new ShiftSwapEmailJobArgs
                {
                    EmployeeEmail = requester.Email,
                    EmployeeName = $"{requester.FirstName} {requester.LastName}",
                    ShiftName = shift.Name,
                    RosterDate = swapRequest.RosterDate,
                    TargetEmployeeName = $"{targetEmployee.FirstName} {targetEmployee.LastName}",
                    ApproverComments = input.Comments,
                    Type = EmailType.SwapRejected
                }
            );

            _logger.LogInformation($"Shift swap request {swapRequestId} rejected by user {currentUserId}");
        }
    }

}
