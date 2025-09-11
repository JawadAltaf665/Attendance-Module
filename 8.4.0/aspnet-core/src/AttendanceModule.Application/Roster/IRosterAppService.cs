using Abp.Application.Services;
using Abp.Application.Services.Dto;
using AttendanceModule.Roster.Dtos;
using AttendanceModule.Shift.Dtos;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AttendanceModule.Roster
{
    public interface IRosterAppService : IApplicationService
    {
        Task<RosterDto> AssignRosterAsync(CreateRosterDto input);
        Task<List<RosterDto>> GetEmployeeRosterAsync(int employeeId, DateTime startDate, DateTime endDate);
        Task<PagedResultDto<RosterDto>> GetPagedRosterAsync(GetRosterListInputDto input);
        Task<ShiftSwapRequestDto> RequestShiftSwapAsync(CreateShiftSwapRequestDto input);
        Task ApproveShiftSwapAsync(int swapRequestId);
        // Task RejectShiftSwapAsync(int swapRequestId);
    }
}
