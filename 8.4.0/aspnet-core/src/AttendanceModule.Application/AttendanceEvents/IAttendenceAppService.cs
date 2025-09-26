using Abp.Application.Services;
using Abp.Application.Services.Dto;
using AttendanceModule.AttendanceEvents.Dto;
using AttendanceModule.AttendanceEvents.Dtos;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AttendanceModule.AttendanceEvents
{
    public interface IAttendenceAppService: IApplicationService
    {
        Task ClockInAsync(ClockEventDto input);
        Task ClockOutAsync(ClockEventDto input);
        Task ClockInForCurrentUserAsync(); // New method for current user
        Task ClockOutForCurrentUserAsync(); // New method for current user
        Task<List<Dtos.AttendanceEventDto>> GetAllAttendenceEventsAsync();
        Task<List<AttendanceEventDto>> GetEmployeeAttendanceAsync(int employeeId, DateTime start, DateTime end);
        Task<List<AttendanceEventDto>> GetTodayAttendanceAsync(int employeeId);
        Task<List<AttendanceEventDto>> GetMyTodayAttendanceAsync(); // New method for current user
        Task<List<AttendanceEventDto>> GetMyAttendanceHistoryAsync(DateTime start, DateTime end); // Get current user's attendance history
        Task<PagedResultDto<AttendanceEventDto>> GetMyPagedAttendanceHistoryAsync(GetAttendenceListInputDTO input); // Get paged attendance history for current user
        Task<TodaySessionDto> GetTodaySessionAsync(); // New method for today's session data
        Task<TodaySummaryDto> GetTodaySummaryAsync(int employeeId);
        Task<WeeklySummaryDto> GetWeeklySummaryAsync(int employeeId);
        Task<TodayScheduleDto> GetTodayScheduleAsync(int employeeId);
        Task<PagedResultDto<AttendanceEventDto>> GetPagedAttendenceListAsync(GetAttendenceListInputDTO input);
    }
}
