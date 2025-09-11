using Abp.Application.Services;
using Abp.Authorization;
using Abp.Domain.Repositories;
using Abp.UI;
using AttendanceModule.AttendanceModuleEntities;
using AttendanceModule.Report;
using AttendanceModule.Report.Dtos;
using AutoMapper;
using global::AutoMapper;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using static AttendanceModule.Authorization.AttendanceModuleAuthorizationProvider;

public class ReportAppService : ApplicationService, IReportAppService
{
    private readonly IRepository<AttendanceModule.AttendanceModuleEntities.AttendanceEvent, int> _attendanceRepo;
    private readonly IRepository<AttendanceModule.AttendanceModuleEntities.LeaveRequest, int> _leaveRepo;
    private readonly IRepository<AttendanceModule.AttendanceModuleEntities.Employee, int> _employeeRepo;
    private readonly IRepository<AttendanceModule.AttendanceModuleEntities.Roster, int> _rosterRepo;
    private readonly IRepository<AttendanceModule.AttendanceModuleEntities.Shift, int> _shiftRepo;
    private readonly IMapper _mapper;

    public ReportAppService(
        IRepository<AttendanceModule.AttendanceModuleEntities.AttendanceEvent, int> attendanceRepo,
        IRepository<AttendanceModule.AttendanceModuleEntities.LeaveRequest, int> leaveRepo,
        IRepository<AttendanceModule.AttendanceModuleEntities.Employee, int> employeeRepo,
        IRepository<AttendanceModule.AttendanceModuleEntities.Roster, int> rosterRepo,
        IRepository<AttendanceModule.AttendanceModuleEntities.Shift, int> shiftRepo,
        IMapper mapper)
    {
        _attendanceRepo = attendanceRepo;
        _leaveRepo = leaveRepo;
        _employeeRepo = employeeRepo;
        _rosterRepo = rosterRepo;
        _shiftRepo = shiftRepo;
        _mapper = mapper;
    }

    // Get Today's Schedule
    public async Task<TodayScheduleDto> GetTodayScheduleAsync(int employeeId)
    {
        var today = DateTime.Today;

        var roster = await _rosterRepo
            .GetAll()
            .Where(r => r.EmployeeId == employeeId && r.RosterDate == today)
            .FirstOrDefaultAsync();

        if (roster == null)
        {
            return new TodayScheduleDto
            {
                ScheduleType = "Flexible schedule"
            };
        }

        return new TodayScheduleDto
        {
            ScheduleType = "Fixed schedule",
            StartTime = roster.Shift?.StartTime.ToString(@"hh\:mm"),
            EndTime = roster.Shift?.EndTime.ToString(@"hh\:mm")
        };
    }

    public async Task<TodaySummaryDto> GetTodaySummaryAsync(int employeeId)
    {
        var startUtc = DateTime.UtcNow.Date;
        var endUtc = startUtc.AddDays(1);

        var events = await _attendanceRepo
            .GetAll()
            .Where(x => x.EmployeeId == employeeId &&
                        x.EventTime >= startUtc &&
                        x.EventTime < endUtc)
            .OrderBy(x => x.EventTime)
            .ToListAsync();

        double totalHours = 0;
        for (int i = 0; i < events.Count; i += 2)
        {
            if (i + 1 < events.Count)
            {
                var clockIn = events[i].EventTime;
                var clockOut = events[i + 1].EventTime;
                totalHours += (clockOut - clockIn).TotalHours;
            }
        }

        double overtime = totalHours > 8 ? totalHours - 8 : 0;

        return new TodaySummaryDto
        {
            TotalHours = Math.Round(totalHours, 1),
            Overtime = Math.Round(overtime, 1)
        };
    }


    //Get Weekly Summary
    public async Task<WeeklySummaryDto> GetWeeklySummaryAsync(int employeeId)
    {
        var today = DateTime.Today;
        var startOfWeek = today.AddDays(-(int)today.DayOfWeek + (int)DayOfWeek.Monday);
        var endOfWeek = startOfWeek.AddDays(6);

        var events = await _attendanceRepo
            .GetAll()
            .Where(e => e.EmployeeId == employeeId &&
                        e.EventTime >= startOfWeek &&
                        e.EventTime <= endOfWeek)
            .OrderBy(e => e.EventTime)
            .ToListAsync();

        double totalHours = 0;
        for (int i = 0; i < events.Count; i++)
        {
            if (events[i].EventType == "CLOCK_IN" && i + 1 < events.Count && events[i + 1].EventType == "CLOCK_OUT")
            {
                totalHours += (events[i + 1].EventTime - events[i].EventTime).TotalHours;
            }
        }

        double target = 40; // Weekly target
        double overtime = totalHours > target ? totalHours - target : 0;

        return new WeeklySummaryDto
        {
            HoursWorked = Math.Round(totalHours, 1),
            Overtime = Math.Round(overtime, 1),
            Target = target
        };
    }

    [AbpAuthorize(ReportPermissions.Pages_Reports_Attendance)]
    public async Task<List<AttendanceReportRowDto>> GetAttendanceReportAsync(ReportFilterDto filter)
    {
        IQueryable<AttendanceModule.AttendanceModuleEntities.AttendanceEvent> 
            q = _attendanceRepo.GetAll()
                .Include(a => a.Employee);

        if (filter.EmployeeId.HasValue)
            q = q.Where(a => a.EmployeeId == filter.EmployeeId.Value);

        if (filter.StartDate.HasValue)
            q = q.Where(a => a.EventTime >= filter.StartDate.Value.Date);

        if (filter.EndDate.HasValue)
            q = q.Where(a => a.EventTime <= filter.EndDate.Value.Date.AddDays(1).AddTicks(-1));

        if (!string.IsNullOrWhiteSpace(filter.Keyword))
        {
            q = q.Where(a => a.EventType.Contains(filter.Keyword) ||
                             (a.Employee != null &&
                              (a.Employee.FirstName + " " + a.Employee.LastName).Contains(filter.Keyword)));
        }

        var events = await q.OrderBy(a => a.EventTime).ToListAsync();

        var rows = events.Select(ev => new AttendanceReportRowDto
        {
            EmployeeId = ev.EmployeeId,
            EmployeeName = ev.Employee != null ? $"{ev.Employee.FirstName} {ev.Employee.LastName}" : string.Empty,
            EventTime = ev.EventTime,
            EventType = ev.EventType,
            Source = ev.Source,
            ShiftName = string.Empty 
        }).ToList();

        return rows;
    }

    [AbpAuthorize(ReportPermissions.Pages_Reports_Attendance)]
    public async Task<FileResultDto> ExportAttendanceCsvAsync(ReportFilterDto filter)
    {
        var rows = await GetAttendanceReportAsync(filter);

        var sb = new StringBuilder();
        sb.AppendLine("EmployeeId,EmployeeName,EventTime,EventType,Source,ShiftName");

        foreach (var r in rows)
        {
            string esc(string s) => string.IsNullOrEmpty(s) ? "" : $"\"{s.Replace("\"", "\"\"")}\"";
            sb.AppendLine($"{r.EmployeeId},{esc(r.EmployeeName)},{r.EventTime:yyyy-MM-dd HH:mm:ss},{esc(r.EventType)},{esc(r.Source)},{esc(r.ShiftName)}");
        }

        var bytes = Encoding.UTF8.GetBytes(sb.ToString());
        return new FileResultDto
        {
            FileName = $"AttendanceReport_{DateTime.UtcNow:yyyyMMddHHmmss}.csv",
            ContentType = "text/csv",
            File = bytes
        };
    }

    [AbpAuthorize(ReportPermissions.Pages_Reports_Leaves)]
    public async Task<List<LeaveReportRowDto>> GetLeaveReportAsync(ReportFilterDto filter)
    {
        IQueryable<AttendanceModule.AttendanceModuleEntities.LeaveRequest>
        q = _leaveRepo.GetAll()
            .Include(l => l.Employee);

        if (filter.EmployeeId.HasValue)
            q = q.Where(l => l.EmployeeId == filter.EmployeeId.Value);

        if (filter.StartDate.HasValue)
            q = q.Where(l => l.StartDate >= filter.StartDate.Value.Date);

        if (filter.EndDate.HasValue)
            q = q.Where(l => l.EndDate <= filter.EndDate.Value.Date);

        if (!string.IsNullOrWhiteSpace(filter.Keyword))
            q = q.Where(l => (l.Employee != null && (l.Employee.FirstName + " " + l.Employee.LastName).Contains(filter.Keyword)) ||
                             l.LeaveType.Contains(filter.Keyword));

        var leaves = await q.OrderByDescending(l => l.CreationTime).ToListAsync();

        return leaves.Select(l => new LeaveReportRowDto
        {
            LeaveId = l.Id,
            EmployeeId = l.EmployeeId,
            EmployeeName = l.Employee != null ? $"{l.Employee.FirstName} {l.Employee.LastName}" : string.Empty,
            LeaveType = l.LeaveType,
            StartDate = l.StartDate,
            EndDate = l.EndDate,
            HalfDay = l.HalfDay,
            Status = l.Status,
            CreationTime = l.CreationTime
        }).ToList();
    }

    [AbpAuthorize(ReportPermissions.Pages_Reports_Leaves)]
    public async Task<FileResultDto> ExportLeaveCsvAsync(ReportFilterDto filter)
    {
        var rows = await GetLeaveReportAsync(filter);

        var sb = new StringBuilder();
        sb.AppendLine("LeaveId,EmployeeId,EmployeeName,LeaveType,StartDate,EndDate,HalfDay,Status,CreationTime");

        foreach (var r in rows)
        {
            string esc(string s) => string.IsNullOrEmpty(s) ? "" : $"\"{s.Replace("\"", "\"\"")}\"";
            sb.AppendLine($"{r.LeaveId},{r.EmployeeId},{esc(r.EmployeeName)},{esc(r.LeaveType)},{r.StartDate:yyyy-MM-dd},{r.EndDate:yyyy-MM-dd},{r.HalfDay},{esc(r.Status)},{r.CreationTime:yyyy-MM-dd HH:mm:ss}");
        }

        var bytes = Encoding.UTF8.GetBytes(sb.ToString());
        return new FileResultDto
        {
            FileName = $"LeaveReport_{DateTime.UtcNow:yyyyMMddHHmmss}.csv",
            ContentType = "text/csv",
            File = bytes
        };
    }

    [AbpAuthorize(ReportPermissions.Pages_Reports_Overtime)]
    public async Task<List<OvertimeReportRowDto>> GetOvertimeReportAsync(ReportFilterDto filter, decimal standardHoursPerDay = 8m)
    {
        var start = filter.StartDate?.Date ?? DateTime.UtcNow.Date.AddDays(-7);
        var end = (filter.EndDate?.Date ?? DateTime.UtcNow.Date).AddDays(1).AddTicks(-1);

        IQueryable<AttendanceModule.AttendanceModuleEntities.AttendanceEvent>
        eventsQuery = _attendanceRepo.GetAll()
            .Where(a => a.EventTime >= start && a.EventTime <= end);

        if (filter.EmployeeId.HasValue)
            eventsQuery = eventsQuery.Where(a => a.EmployeeId == filter.EmployeeId.Value);

        var events = await eventsQuery.OrderBy(a => a.EmployeeId).ThenBy(a => a.EventTime).ToListAsync();

        var employees = (await _employeeRepo.GetAllListAsync()).ToDictionary(e => e.Id, e => $"{e.FirstName} {e.LastName}");

        var result = new List<OvertimeReportRowDto>();

        foreach (var g in events.GroupBy(e => e.EmployeeId))
        {
            var empId = g.Key;
            var evList = g.ToList();

            decimal totalHours = 0m;

            for (int i = 0; i < evList.Count - 1; i++)
            {
                var cur = evList[i];
                var next = evList[i + 1];

                if (cur.EventType == "CLOCK_IN" && next.EventType == "CLOCK_OUT")
                {
                    var duration = next.EventTime - cur.EventTime;
                    totalHours += (decimal)duration.TotalHours;
                    i++; // skip paired event
                }
            }

            var days = evList.Select(x => x.EventTime.Date).Distinct().Count();
            var standard = (decimal)days * standardHoursPerDay;
            var overtime = Math.Max(0m, totalHours - standard);

            result.Add(new OvertimeReportRowDto
            {
                EmployeeId = empId,
                EmployeeName = employees.TryGetValue(empId, out var n) ? n : string.Empty,
                TotalWorkedHours = Math.Round(totalHours, 2),
                StandardHours = Math.Round(standard, 2),
                OvertimeHours = Math.Round(overtime, 2)
            });
        }

        return result;
    }

    [AbpAuthorize(ReportPermissions.Pages_Reports_Overtime)]
    public async Task<FileResultDto> ExportOvertimeCsvAsync(ReportFilterDto filter, decimal standardHoursPerDay = 8m)
    {
        var rows = await GetOvertimeReportAsync(filter, standardHoursPerDay);

        var sb = new StringBuilder();
        sb.AppendLine("EmployeeId,EmployeeName,TotalWorkedHours,StandardHours,OvertimeHours");

        foreach (var r in rows)
        {
            string esc(string s) => string.IsNullOrEmpty(s) ? "" : $"\"{s.Replace("\"", "\"\"")}\"";
            sb.AppendLine($"{r.EmployeeId},{esc(r.EmployeeName)},{r.TotalWorkedHours},{r.StandardHours},{r.OvertimeHours}");
        }

        var bytes = Encoding.UTF8.GetBytes(sb.ToString());
        return new FileResultDto
        {
            FileName = $"OvertimeReport_{DateTime.UtcNow:yyyyMMddHHmmss}.csv",
            ContentType = "text/csv",
            File = bytes
        };
    }
}


