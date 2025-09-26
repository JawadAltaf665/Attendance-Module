using Abp.Application.Services;
using Abp.Application.Services.Dto;
using Abp.Authorization;
using Abp.BackgroundJobs;
using Abp.Domain.Repositories;
using Abp.UI;
using AttendanceModule.Authorization;
using AttendanceModule.Leave.BackgroundJobs;
using AttendanceModule.Leave.Dtos;
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using AttendanceModule.Authorization.Users;
using static AttendanceModule.Authorization.AttendanceModuleAuthorizationProvider;
using Abp.Runtime.Session;

namespace AttendanceModule.Leave
{
    public class LeaveAppService : ApplicationService, ILeaveAppService
    {
        private readonly IRepository<AttendanceModuleEntities.LeaveRequest, int> _leaveRequestsRepository;
        private readonly IRepository<AttendanceModuleEntities.Employee, int> _employeeRepository;
        private readonly IBackgroundJobManager _backgroundJobManager;
        private readonly IMapper _mapper;
        private readonly IAbpSession _abpSession;

        public LeaveAppService(
            IRepository<AttendanceModuleEntities.LeaveRequest, int> leaveRequestsRepository,
            IRepository<AttendanceModuleEntities.Employee, int> employeeRepository,
            IBackgroundJobManager backgroundJobManager,IAbpSession abpSession,
            IMapper mapper)
        {
            _leaveRequestsRepository = leaveRequestsRepository;
            _employeeRepository = employeeRepository;
            _backgroundJobManager = backgroundJobManager;
            _mapper = mapper;
            _abpSession = abpSession;
        }

        private async Task<int> GetCurrentEmployeeIdAsync()
        {
            var userId = AbpSession.UserId;
            if (!userId.HasValue)
            {
                throw new UserFriendlyException("User not logged in");
            }

            var employee = await _employeeRepository.FirstOrDefaultAsync(e => e.UserId == (int)userId.Value);
            if (employee == null)
            {
                throw new UserFriendlyException($"No employee record found for current user. Please contact administrator.");
            }

            return employee.Id;
        }

        [AbpAuthorize(LeavePermissions.Pages_Leaves_Request)]
        public async Task<LeaveDto> CreateLeaveAsync(CreateLeaveDto input)
        {
            var employeeId = await GetCurrentEmployeeIdAsync();
            var tenantId = _abpSession.TenantId;

            var leaveRequest = new AttendanceModuleEntities.LeaveRequest
            {
                TenantId = tenantId ?? 1,
                LeaveType = input.LeaveType,
                StartDate = input.StartDate,
                EndDate = input.EndDate,
                HalfDay = input.HalfDay,
                Status = "PENDING",
                EmployeeId = employeeId,
                Reason = input.Reason,
                AttachmentUrl = input.AttachmentUrl,
                ApproverId = input.ApproverId
            };
            await _leaveRequestsRepository.InsertAsync(leaveRequest);

            return  new LeaveDto
            {
                Id = leaveRequest.Id,
                TenantId = leaveRequest.TenantId,
                LeaveType = leaveRequest.LeaveType,
                StartDate = leaveRequest.StartDate,
                EndDate = leaveRequest.EndDate,
                HalfDay = leaveRequest.HalfDay,
                Status = leaveRequest.Status,
                EmployeeId = leaveRequest.EmployeeId,
                Reason = leaveRequest.Reason,
                AttachmentUrl = leaveRequest.AttachmentUrl,
                ApproverId = leaveRequest.ApproverId
            };

        }

        [AbpAuthorize(LeavePermissions.Pages_Leaves_View)]
        public async Task<List<LeaveDto>> GetMyLeavesAsync()
        {
            var employeeId = await GetCurrentEmployeeIdAsync();

            var leaves = await _leaveRequestsRepository
                .GetAll()
                .Where(l => l.EmployeeId == employeeId)
                .OrderByDescending(l => l.CreationTime)
                .ToListAsync();

            return _mapper.Map<List<LeaveDto>>(leaves);
        }




        [AbpAuthorize(LeavePermissions.Pages_Leaves_Approve)]
        public async Task<bool> ApproveLeaveAsync(int id, ApprovalRequestDto input)
        {
            var leave = await _leaveRequestsRepository
                .GetAllIncluding(l => l.Employee)
                .FirstOrDefaultAsync(l => l.Id == id);

            if (leave == null)
                throw new UserFriendlyException("Leave request not found.");

            if (leave.Status != "PENDING")
                throw new UserFriendlyException("Only pending leave requests can be approved.");

            var currentUserId = AbpSession.UserId;
            var approverEmployee = await _employeeRepository.FirstOrDefaultAsync(e => e.UserId == (int)currentUserId.Value);

            leave.Status = "APPROVED";
            leave.ApproverId = approverEmployee?.Id ?? input.ApproverId;
            leave.LastModificationTime = DateTime.Now;
            leave.LastModifierUserId = currentUserId;

            await _leaveRequestsRepository.UpdateAsync(leave);

            //Trigger background email job
            await _backgroundJobManager.EnqueueAsync<LeaveStatusEmailJob, LeaveStatusEmailJobArgs>(
            new LeaveStatusEmailJobArgs
                {
                    EmployeeEmail = leave.Employee.Email,
                    EmployeeName = $"{leave.Employee.FirstName} {leave.Employee.LastName}",
                    LeaveType = leave.LeaveType,
                    Status = leave.Status,
                    StartDate = leave.StartDate,
                    EndDate = leave.EndDate
                }
            );

            return true;
        }

        // Manager rejects leave
        [AbpAuthorize(LeavePermissions.Pages_Leaves_Reject)]
        public async Task<bool> RejectLeaveAsync(int id, ApprovalRequestDto input)
        {
            var leave = await _leaveRequestsRepository
                .GetAllIncluding(l => l.Employee)
                .FirstOrDefaultAsync(l => l.Id == id);

            if (leave == null)
                throw new UserFriendlyException("Leave request not found.");

            if (leave.Status != "PENDING")
                throw new UserFriendlyException("Only pending leave requests can be rejected.");

            var currentUserId = AbpSession.UserId;
            var approverEmployee = await _employeeRepository.FirstOrDefaultAsync(e => e.UserId == (int)currentUserId.Value);

            leave.Status = "REJECTED";
            leave.ApproverId = approverEmployee?.Id ?? input.ApproverId;
            leave.LastModificationTime = DateTime.Now;
            leave.LastModifierUserId = currentUserId;

            await _leaveRequestsRepository.UpdateAsync(leave);

            //Trigger background email job
            await _backgroundJobManager.EnqueueAsync<LeaveStatusEmailJob, LeaveStatusEmailJobArgs>(
                new LeaveStatusEmailJobArgs
                {
                    EmployeeEmail = leave.Employee.Email,
                    EmployeeName = $"{leave.Employee.FirstName} {leave.Employee.LastName}",
                    LeaveType = leave.LeaveType,
                    Status = leave.Status,
                    StartDate = leave.StartDate,
                    EndDate = leave.EndDate
                }
            );

            return true;
        }

        //Admin views all leaves
        [AbpAuthorize(LeavePermissions.Pages_Leaves_View)]
        public async Task<List<LeaveDto>> GetAllLeavesAsync()
        {
            var leaves = await _leaveRequestsRepository.GetAllListAsync();
            return _mapper.Map<List<LeaveDto>>(leaves);
        }

        //Admin view leave by Id
        [AbpAuthorize(LeavePermissions.Pages_Leaves_View)]
        public async Task<LeaveDto> GetLeaveByIdAsync(int id)
        {
            var leave = await _leaveRequestsRepository.FirstOrDefaultAsync(id);
            if (leave == null)
                throw new UserFriendlyException("Leave request not found.");

            return _mapper.Map<LeaveDto>(leave);
        }

        //Admin delete leave
        public async Task DeleteLeaveAsync(int id)
        {
            var leave = await _leaveRequestsRepository.FirstOrDefaultAsync(id);
            if (leave == null)
                throw new UserFriendlyException("Leave request not found.");

            await _leaveRequestsRepository.DeleteAsync(leave);
        }

        [AbpAuthorize(LeavePermissions.Pages_Leaves_View)]
        public async Task<EmployeeLeaveBalanceDto> GetLeaveBalanceAsync()
        {
            var employeeId = await GetCurrentEmployeeIdAsync();
            var currentYear = DateTime.Now.Year;

            // Get all leave requests for current employee in current year
            var leaveRequests = await _leaveRequestsRepository
                .GetAll()
                .Where(l => l.EmployeeId == employeeId &&
                           l.StartDate.Year == currentYear &&
                           l.Status == "APPROVED")
                .ToListAsync();

            // Calculate used days per leave type
            var vacationUsed = CalculateUsedDays(leaveRequests, "VACATION");
            var sickUsed = CalculateUsedDays(leaveRequests, "SICK");
            var personalUsed = CalculateUsedDays(leaveRequests, "PERSONAL");
            var unpaidUsed = CalculateUsedDays(leaveRequests, "UNPAID");

            // Default allocations (should come from configuration or employee settings)
            var balances = new[]
            {
                new LeaveBalanceDto
                {
                    EmployeeId = employeeId,
                    LeaveType = "VACATION",
                    TotalAllocation = 15,
                    UsedDays = vacationUsed,
                    AvailableDays = 15 - vacationUsed,
                    AsOfDate = DateTime.Now
                },
                new LeaveBalanceDto
                {
                    EmployeeId = employeeId,
                    LeaveType = "SICK",
                    TotalAllocation = 10,
                    UsedDays = sickUsed,
                    AvailableDays = 10 - sickUsed,
                    AsOfDate = DateTime.Now
                },
                new LeaveBalanceDto
                {
                    EmployeeId = employeeId,
                    LeaveType = "PERSONAL",
                    TotalAllocation = 5,
                    UsedDays = personalUsed,
                    AvailableDays = 5 - personalUsed,
                    AsOfDate = DateTime.Now
                },
                new LeaveBalanceDto
                {
                    EmployeeId = employeeId,
                    LeaveType = "UNPAID",
                    TotalAllocation = 0,
                    UsedDays = unpaidUsed,
                    AvailableDays = 0, // Unpaid leave has no limit
                    AsOfDate = DateTime.Now
                }
            };

            return new EmployeeLeaveBalanceDto
            {
                EmployeeId = employeeId,
                Balances = balances
            };
        }

        private decimal CalculateUsedDays(List<AttendanceModuleEntities.LeaveRequest> requests, string leaveType)
        {
            var typeRequests = requests.Where(r => r.LeaveType == leaveType);
            decimal totalDays = 0;

            foreach (var request in typeRequests)
            {
                var days = (request.EndDate - request.StartDate).Days + 1;
                if (request.HalfDay)
                    totalDays += 0.5m;
                else
                    totalDays += (decimal)days;
            }

            return totalDays;
        }

        // Enhanced method for manager to get pending leaves with filters
        [AbpAuthorize(LeavePermissions.Pages_Leaves_View)]
        public async Task<List<LeaveDetailDto>> GetPendingLeavesForManagerAsync(GetPendingLeavesInputDto input)
        {
            var query = _leaveRequestsRepository
                .GetAllIncluding(l => l.Employee, l => l.Approver)
                .Where(l => l.Status == "PENDING");

            // Apply filters
            if (input.StartDate.HasValue)
                query = query.Where(l => l.StartDate >= input.StartDate.Value);

            if (input.EndDate.HasValue)
                query = query.Where(l => l.EndDate <= input.EndDate.Value);

            if (!string.IsNullOrEmpty(input.Status))
                query = query.Where(l => l.Status == input.Status);

            if (!string.IsNullOrEmpty(input.LeaveType))
                query = query.Where(l => l.LeaveType == input.LeaveType);

            var leaves = await query.OrderBy(l => l.StartDate).ToListAsync();

            var result = new List<LeaveDetailDto>();
            foreach (var leave in leaves)
            {
                var dto = new LeaveDetailDto
                {
                    Id = leave.Id,
                    TenantId = leave.TenantId,
                    LeaveType = leave.LeaveType,
                    StartDate = leave.StartDate,
                    EndDate = leave.EndDate,
                    HalfDay = leave.HalfDay,
                    Status = leave.Status,
                    EmployeeId = leave.EmployeeId,
                    EmployeeName = leave.Employee != null ? $"{leave.Employee.FirstName} {leave.Employee.LastName}" : "",
                    ApproverId = leave.ApproverId,
                    ApproverName = leave.Approver != null ? $"{leave.Approver.FirstName} {leave.Approver.LastName}" : "",
                    Reason = leave.Reason,
                    AttachmentUrl = leave.AttachmentUrl,
                    TotalDays = CalculateLeaveDays(leave),
                    CreationTime = leave.CreationTime
                };
                result.Add(dto);
            }

            return result;
        }

        // Bulk approval method
        [AbpAuthorize(LeavePermissions.Pages_Leaves_Approve)]
        public async Task<bool> BulkApproveLeaveAsync(BulkApprovalRequestDto input)
        {
            var leaves = await _leaveRequestsRepository
                .GetAllIncluding(l => l.Employee)
                .Where(l => input.Ids.Contains(l.Id) && l.Status == "PENDING")
                .ToListAsync();

            if (!leaves.Any())
                throw new UserFriendlyException("No valid pending leave requests found.");

            var currentUserId = AbpSession.UserId;
            var approverEmployee = await _employeeRepository.FirstOrDefaultAsync(e => e.UserId == (int)currentUserId.Value);

            foreach (var leave in leaves)
            {
                leave.Status = input.IsApproved ? "APPROVED" : "REJECTED";
                leave.ApproverId = approverEmployee?.Id;
                leave.LastModificationTime = DateTime.Now;
                leave.LastModifierUserId = currentUserId;

                // Send notification email
                await _backgroundJobManager.EnqueueAsync<LeaveStatusEmailJob, LeaveStatusEmailJobArgs>(
                    new LeaveStatusEmailJobArgs
                    {
                        EmployeeEmail = leave.Employee.Email,
                        EmployeeName = $"{leave.Employee.FirstName} {leave.Employee.LastName}",
                        LeaveType = leave.LeaveType,
                        Status = leave.Status,
                        StartDate = leave.StartDate,
                        EndDate = leave.EndDate
                    }
                );
            }

            await CurrentUnitOfWork.SaveChangesAsync();
            return true;
        }

        private decimal CalculateLeaveDays(AttendanceModuleEntities.LeaveRequest leave)
        {
            if (leave.HalfDay)
                return 0.5m;

            var days = (leave.EndDate - leave.StartDate).Days + 1;
            return days;
        }
    }
}
