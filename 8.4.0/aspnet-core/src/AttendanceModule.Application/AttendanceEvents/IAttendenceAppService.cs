using Abp.Application.Services;
using Abp.Application.Services.Dto;
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
        Task ClockInAsync(int employeeId);
        Task ClockOutAsync(int employeeId);
        Task<List<Dtos.AttendanceEventDto>> GetAllAttendenceEventsAsync();
        Task<List<AttendanceEventDto>> GetEmployeeAttendanceAsync(int employeeId, DateTime start, DateTime end);
        Task<List<AttendanceEventDto>> GetTodayAttendanceAsync(int employeeId);
        Task<PagedResultDto<AttendanceEventDto>> GetPagedAttendenceListAsync(GetAttendenceListInputDTO input);
    }
}
