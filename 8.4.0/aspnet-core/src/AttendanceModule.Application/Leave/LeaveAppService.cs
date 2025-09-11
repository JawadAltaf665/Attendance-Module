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

namespace AttendanceModule.Leave
{
    public class LeaveAppService : ApplicationService, ILeaveAppService
    {
        private readonly IRepository<AttendanceModuleEntities.LeaveRequest, int> _leaveRequestsRepository;
        private readonly IBackgroundJobManager _backgroundJobManager;
        private readonly IMapper _mapper;

        public LeaveAppService(
            IRepository<AttendanceModuleEntities.LeaveRequest, int> leaveRequestsRepository,
            IBackgroundJobManager backgroundJobManager,
            IMapper mapper)
        {
            _leaveRequestsRepository = leaveRequestsRepository;
            _backgroundJobManager = backgroundJobManager;
            _mapper = mapper;
        }

        [AbpAuthorize(LeavePermissions.Pages_Leaves_Request)]
        public async Task CreateLeaveAsync(CreateLeaveDto input)
        {
            var leaveRequest = _mapper.Map<AttendanceModuleEntities.LeaveRequest>(input);
            leaveRequest.Status = "PENDING";

            await _leaveRequestsRepository.InsertAsync(leaveRequest);
        }

        [AbpAuthorize(LeavePermissions.Pages_Leaves_View)]
        public async Task<List<LeaveDto>> GetLeavesByEmployeeIdAsync(int employeeId)
        {
            var leaves = await _leaveRequestsRepository
                .GetAll()
                .Where(l => l.EmployeeId == employeeId)
                .ToListAsync();

            return _mapper.Map<List<LeaveDto>>(leaves);
        }

        [AbpAuthorize(LeavePermissions.Pages_Leaves_View)]
        public async Task<List<LeaveDto>> GetPendingLeavesAsync()
        {
            var pendingLeaves = await _leaveRequestsRepository
                .GetAll()
                .Where(l => l.Status == "PENDING")
                .ToListAsync();

            return _mapper.Map<List<LeaveDto>>(pendingLeaves);
        }


        [AbpAuthorize(LeavePermissions.Pages_Leaves_Approve)]
        public async Task<bool> ApproveLeaveAsync(int id)
        {
            var leave = await _leaveRequestsRepository
                .GetAllIncluding(l => l.Employee)
                .FirstOrDefaultAsync(l => l.Id == id);

            if (leave == null)
                throw new UserFriendlyException("Leave request not found.");

            if (leave.Status != "PENDING")
            {
                throw new UserFriendlyException("Only pending leave requests can be approved.");
            }
            leave.Status = "APPROVED";
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
        public async Task<bool> RejectLeaveAsync(int id)
        {
            var leave = await _leaveRequestsRepository
                .GetAllIncluding(l => l.Employee)
                .FirstOrDefaultAsync(l => l.Id == id);

            if (leave == null)
                throw new UserFriendlyException("Leave request not found.");

            if (leave.Status != "PENDING")
            {
                throw new UserFriendlyException("Only pending leave requests can be rejected.");
            }
            leave.Status = "REJECTED";
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
    }
}
