using Abp.Application.Services;
using AttendanceModule.Report.Dtos;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AttendanceModule.Report
{
    public interface IReportAppService : IApplicationService
    {
        // Attendance
        Task<TodayScheduleDto> GetTodayScheduleAsync(int employeeId);
        Task<WeeklySummaryDto> GetWeeklySummaryAsync(int employeeId);
        Task<TodaySummaryDto> GetTodaySummaryAsync(int employeeId);
        Task<List<AttendanceReportRowDto>> GetAttendanceReportAsync(ReportFilterDto filter);
        Task<FileResultDto> ExportAttendanceCsvAsync(ReportFilterDto filter);

        // Leave
        Task<List<LeaveReportRowDto>> GetLeaveReportAsync(ReportFilterDto filter);
        Task<FileResultDto> ExportLeaveCsvAsync(ReportFilterDto filter);

        // Overtime (basic)
        Task<List<OvertimeReportRowDto>> GetOvertimeReportAsync(ReportFilterDto filter, decimal standardHoursPerDay = 8m);
        Task<FileResultDto> ExportOvertimeCsvAsync(ReportFilterDto filter, decimal standardHoursPerDay = 8m);

    }

}
