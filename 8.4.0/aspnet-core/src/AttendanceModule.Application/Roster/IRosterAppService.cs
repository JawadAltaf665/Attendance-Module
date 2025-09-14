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
        Task<ShiftSwapRequestDto> RequestShiftSwapAsync(CreateShiftSwapRequestDto input);
        Task<PagedResultDto<ShiftSwapRequestDto>> GetPendingSwapRequestsAsync(GetSwapRequestsInputDto input);
        Task<PagedResultDto<ShiftSwapRequestDto>> GetMySwapRequestsAsync(GetSwapRequestsInputDto input);
        Task ApproveShiftSwapAsync(int swapRequestId, ApproveRejectSwapRequestDto input);
        Task RejectShiftSwapAsync(int swapRequestId, ApproveRejectSwapRequestDto input);
    }
}
