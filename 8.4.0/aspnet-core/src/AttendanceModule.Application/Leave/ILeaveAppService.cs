using Abp.Application.Services;
using Abp.Application.Services.Dto;
using AttendanceModule.Leave.Dtos;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AttendanceModule.Leave
{
    public interface ILeaveAppService : IApplicationService
    {
        // Employee
        Task<LeaveDto> CreateLeaveAsync(CreateLeaveDto input);
        Task<List<LeaveDto>> GetMyLeavesAsync();
        Task<EmployeeLeaveBalanceDto> GetLeaveBalanceAsync();

        // Manager
        Task<List<LeaveDetailDto>> GetPendingLeavesForManagerAsync(GetPendingLeavesInputDto input);
        Task<bool> BulkApproveLeaveAsync(BulkApprovalRequestDto input);
        Task<bool> ApproveLeaveAsync(int id, ApprovalRequestDto input);
        Task<bool> RejectLeaveAsync(int id, ApprovalRequestDto input);

        // Admin/HR
        Task<List<LeaveDto>> GetAllLeavesAsync();
        Task<LeaveDto> GetLeaveByIdAsync(int id);
        Task DeleteLeaveAsync(int id);
    }

}
