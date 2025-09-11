using Abp.Application.Services;
using Abp.Application.Services.Dto;
using Abp.Authorization;
using Abp.Domain.Repositories;
using Abp.UI;
using AttendanceModule.AttendanceModuleEntities;
using AttendanceModule.Roster.Dtos;
using AttendanceModule.Shift.Dtos;
using AutoMapper;
using Microsoft.EntityFrameworkCore;
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
        private readonly IMapper _mapper;

        public RosterAppService(
            IRepository<AttendanceModuleEntities.Roster, int> rosterRepository,
            IRepository<AttendanceModuleEntities.ShiftSwapRequest, int> shiftSwapRequestRepository,
            IMapper mapper)
        {
            _rosterRepository = rosterRepository;
            _shiftSwapRequestRepository = shiftSwapRequestRepository;
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
                Status = "PENDING",
                TenantId = 1
            };


            await _shiftSwapRequestRepository.InsertAsync(requestToSwapShift);

            return _mapper.Map<ShiftSwapRequestDto>(requestToSwapShift);

        }

        [AbpAuthorize(RosterPermissions.Pages_Rosters_Swap)]
        public async Task ApproveShiftSwapAsync(int swapRequestId)
        {
            var swapRequest = await _shiftSwapRequestRepository.FirstOrDefaultAsync(swapRequestId);

            if (swapRequest == null)
            {
                throw new UserFriendlyException("Swap request not found.");
            }

            if (swapRequest.Status != "PENDING")
            {
                throw new UserFriendlyException("Swap request already processed.");
            }

            swapRequest.Status = "APPROVED";
            await _shiftSwapRequestRepository.UpdateAsync(swapRequest);

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
        }
    }

}
