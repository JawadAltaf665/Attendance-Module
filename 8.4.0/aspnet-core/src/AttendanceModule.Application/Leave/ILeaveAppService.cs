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
        Task CreateLeaveAsync(CreateLeaveDto input);
        Task<List<LeaveDto>> GetLeavesByEmployeeIdAsync(int employeeId);

        // Manager
        Task<List<LeaveDto>> GetPendingLeavesAsync();
        Task<bool> ApproveLeaveAsync(int id);
        Task<bool> RejectLeaveAsync(int id);

        // Admin/HR
        Task<List<LeaveDto>> GetAllLeavesAsync();
        Task<LeaveDto> GetLeaveByIdAsync(int id);
        Task DeleteLeaveAsync(int id);
    }

}
