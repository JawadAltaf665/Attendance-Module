using Abp.Application.Services;
using Abp.Application.Services.Dto;
using Abp.Authorization;
using Abp.Domain.Repositories;
using Abp.Timing;
using Abp.UI;
using AttendanceModule.AttendanceEvents.Dto;
using AttendanceModule.AttendanceEvents.Dtos;
using AttendanceModule.AttendanceModuleEntities;
using AttendanceModule.Employee.Dtos;
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using static AttendanceModule.Authorization.AttendanceModuleAuthorizationProvider;
using Abp.Runtime.Session;

namespace AttendanceModule.AttendanceEvents
{
    public class AttendanceAppService : ApplicationService, IAttendenceAppService
    {
        private readonly IRepository<AttendanceEvent, int> _attendenceRepository;
        private readonly IRepository<AttendanceModuleEntities.Employee, int> _employeeRepository;
        private readonly IMapper _mapper;


        public AttendanceAppService(
            IRepository<AttendanceEvent, int> attendenceRepository,
            IRepository<AttendanceModuleEntities.Employee, int> employeeRepository,
            IMapper mapper)
        {
            _attendenceRepository = attendenceRepository;
            _employeeRepository = employeeRepository;
            _mapper = mapper;
        }

        private async Task<int> GetCurrentEmployeeIdAsync()
        {
            var userId = AbpSession.UserId;
            if (!userId.HasValue)
            {
                throw new UserFriendlyException("User not logged in");
            }

            var employee = await _employeeRepository.FirstOrDefaultAsync(e => e.UserId == (int)userId.Value);
            if (employee == null)
            {
                throw new UserFriendlyException($"No employee record found for current user. Please contact administrator.");
            }

            return employee.Id;
        }

        [AbpAuthorize(AttendencePermissions.Pages_Attendance_ClockInOut)]
        public async Task ClockInAsync(ClockEventDto input)
        {
            var clockIn = new AttendanceEvent
            {
                EmployeeId = input.EmployeeId,
                EventType = "CLOCK_IN",
                EventTime = Clock.Now, // ABP ka helper (UTC save hota hai)
                TenantId = AbpSession.TenantId ?? 1,
                Latitude = input.Latitude,
                Longitude = input.Longitude,
                Notes = input.Notes,
                Source = "Web"
            };

            await _attendenceRepository.InsertAsync(clockIn);
        }

        [AbpAuthorize(AttendencePermissions.Pages_Attendance_ClockInOut)]
        public async Task ClockOutAsync(ClockEventDto input)
        {
            var clockOut = new AttendanceEvent
            {
                EmployeeId = input.EmployeeId,
                EventType = "CLOCK_OUT",
                EventTime = Clock.Now,
                TenantId = AbpSession.TenantId ?? 1,
                Latitude = input.Latitude,
                Longitude = input.Longitude,
                Notes = input.Notes,
                Source = "Web"
            };

            await _attendenceRepository.InsertAsync(clockOut);
        }

        //Get All Attendance Events
        [AbpAuthorize(AttendencePermissions.Pages_Attendance_View)]
        public async Task<List<AttendanceEventDto>> GetAllAttendenceEventsAsync()
        {
            var attendenceEvents = await _attendenceRepository.GetAllListAsync();

            if (!attendenceEvents.Any())
            {
                throw new UserFriendlyException("No attendance events found!");
            }

            return _mapper.Map<List<AttendanceEventDto>>(attendenceEvents);
        }

        [AbpAuthorize(AttendencePermissions.Pages_Attendance_View)]
        public async Task<PagedResultDto<AttendanceEventDto>> GetPagedAttendenceListAsync(GetAttendenceListInputDTO input)
        {
            var query = _attendenceRepository.GetAll();

            if (!string.IsNullOrWhiteSpace(input.Keyword))
            {
                query = query.Where(a => a.EventType.Contains(input.Keyword));
            }

            var totalCount = await query.CountAsync();

            var attendence = await query
                .OrderByDescending(e => e.EventTime)
                .Skip(input.SkipCount)
                .Take(input.MaxResultCount)
                .ToListAsync();

            var attendenceDto = _mapper.Map<List<AttendanceEventDto>>(attendence);

            return new PagedResultDto<AttendanceEventDto>(totalCount, attendenceDto);
        }


        [AbpAuthorize(AttendencePermissions.Pages_Attendance_View)]
        public async Task<List<AttendanceEventDto>> GetEmployeeAttendanceAsync(int employeeId, DateTime start, DateTime end)
        {
            var events = await _attendenceRepository
                .GetAll()
                .Where(e => e.EmployeeId == employeeId &&
                           e.EventTime >= start &&
                           e.EventTime <= end)
                .OrderByDescending(e => e.EventTime)
                .ToListAsync();

            return _mapper.Map<List<AttendanceEventDto>>(events);
        }

        [AbpAuthorize(AttendencePermissions.Pages_Attendance_View)]
        public async Task<List<AttendanceEventDto>> GetTodayAttendanceAsync(int employeeId)
        {
            var today = Clock.Now.Date;
            var tomorrow = today.AddDays(1);

            var events = await _attendenceRepository
                .GetAll()
                .Where(e => e.EmployeeId == employeeId &&
                           e.EventTime >= today &&
                           e.EventTime < tomorrow)
                .OrderBy(e => e.EventTime)
                .ToListAsync();

            return _mapper.Map<List<AttendanceEventDto>>(events);
        }

        [AbpAuthorize(AttendencePermissions.Pages_Attendance_ClockInOut)]
        public async Task ClockInForCurrentUserAsync()
        {
            var employeeId = await GetCurrentEmployeeIdAsync();

            var clockIn = new AttendanceEvent
            {
                EmployeeId = employeeId,
                EventType = "CLOCK_IN",
                EventTime = Clock.Now,
                TenantId = AbpSession.TenantId ?? 1,
                Source = "Web"
            };

            await _attendenceRepository.InsertAsync(clockIn);
        }

        [AbpAuthorize(AttendencePermissions.Pages_Attendance_ClockInOut)]
        public async Task ClockOutForCurrentUserAsync()
        {
            var employeeId = await GetCurrentEmployeeIdAsync();

            var clockOut = new AttendanceEvent
            {
                EmployeeId = employeeId,
                EventType = "CLOCK_OUT",
                EventTime = Clock.Now,
                TenantId = AbpSession.TenantId ?? 1,
                Source = "Web"
            };

            await _attendenceRepository.InsertAsync(clockOut);
        }

        [AbpAuthorize(AttendencePermissions.Pages_Attendance_View)]
        public async Task<List<AttendanceEventDto>> GetMyTodayAttendanceAsync()
        {
            var employeeId = await GetCurrentEmployeeIdAsync();
            var today = Clock.Now.Date;
            var tomorrow = today.AddDays(1);

            var events = await _attendenceRepository
                .GetAll()
                .Where(e => e.EmployeeId == employeeId &&
                           e.EventTime >= today &&
                           e.EventTime < tomorrow)
                .OrderBy(e => e.EventTime)
                .ToListAsync();

            return _mapper.Map<List<AttendanceEventDto>>(events);
        }

        /// <summary>
        /// Get attendance history for the current logged-in user
        /// </summary>
        [AbpAuthorize(AttendencePermissions.Pages_Attendance_View)]
        public async Task<List<AttendanceEventDto>> GetMyAttendanceHistoryAsync(DateTime start, DateTime end)
        {
            var employeeId = await GetCurrentEmployeeIdAsync();

            var events = await _attendenceRepository
                .GetAll()
                .Where(e => e.EmployeeId == employeeId &&
                           e.EventTime >= start &&
                           e.EventTime <= end)
                .OrderByDescending(e => e.EventTime)
                .ToListAsync();

            return _mapper.Map<List<AttendanceEventDto>>(events);
        }

        /// <summary>
        /// Get paged attendance history for the current logged-in user
        /// </summary>
        [AbpAuthorize(AttendencePermissions.Pages_Attendance_View)]
        public async Task<PagedResultDto<AttendanceEventDto>> GetMyPagedAttendanceHistoryAsync(GetAttendenceListInputDTO input)
        {
            var employeeId = await GetCurrentEmployeeIdAsync();

            var query = _attendenceRepository
                .GetAll()
                .Where(e => e.EmployeeId == employeeId);

            // Apply date range filter if provided
            if (input.StartDate.HasValue)
            {
                query = query.Where(e => e.EventTime >= input.StartDate.Value);
            }

            if (input.EndDate.HasValue)
            {
                // Set end date to end of day
                var endOfDay = input.EndDate.Value.Date.AddDays(1).AddTicks(-1);
                query = query.Where(e => e.EventTime <= endOfDay);
            }

            var totalCount = await query.CountAsync();

            var attendence = await query
                .OrderByDescending(e => e.EventTime)
                .Skip(input.SkipCount)
                .Take(input.MaxResultCount)
                .ToListAsync();

            var attendenceDto = _mapper.Map<List<AttendanceEventDto>>(attendence);

            return new PagedResultDto<AttendanceEventDto>(totalCount, attendenceDto);
        }

        /// <summary>
        /// Get today's session data for the current user
        /// </summary>
        [AbpAuthorize(AttendencePermissions.Pages_Attendance_View)]
        public async Task<TodaySessionDto> GetTodaySessionAsync()
        {
            var employeeId = await GetCurrentEmployeeIdAsync();
            var today = Clock.Now.Date;
            var tomorrow = today.AddDays(1);

            var events = await _attendenceRepository
                .GetAll()
                .Where(e => e.EmployeeId == employeeId &&
                           e.EventTime >= today &&
                           e.EventTime < tomorrow)
                .OrderBy(e => e.EventTime)
                .ToListAsync();

            var sessionDto = new TodaySessionDto
            {
                Date = today,
                EmployeeId = employeeId,
                Sessions = new List<SessionDetailDto>(),
                TotalHours = 0,
                IsCurrentlyClockedIn = false
            };

            if (events.Any())
            {
                // Check if currently clocked in
                var lastEvent = events.Last();
                sessionDto.IsCurrentlyClockedIn = lastEvent.EventType == "CLOCK_IN";

                // Build session pairs
                DateTime? clockInTime = null;
                foreach (var evt in events)
                {
                    if (evt.EventType == "CLOCK_IN")
                    {
                        clockInTime = evt.EventTime;
                    }
                    else if (evt.EventType == "CLOCK_OUT" && clockInTime.HasValue)
                    {
                        var duration = evt.EventTime - clockInTime.Value;
                        sessionDto.Sessions.Add(new SessionDetailDto
                        {
                            ClockInTime = clockInTime.Value,
                            ClockOutTime = evt.EventTime,
                            Duration = duration.TotalHours
                        });
                        clockInTime = null;
                    }
                }

                // If still clocked in, add current session
                if (clockInTime.HasValue)
                {
                    var duration = Clock.Now - clockInTime.Value;
                    sessionDto.Sessions.Add(new SessionDetailDto
                    {
                        ClockInTime = clockInTime.Value,
                        ClockOutTime = null,
                        Duration = duration.TotalHours,
                        IsActive = true
                    });
                    sessionDto.LastClockInTime = clockInTime.Value;
                }

                // Calculate total hours
                sessionDto.TotalHours = Math.Round(sessionDto.Sessions.Sum(s => s.Duration), 2);
            }

            return sessionDto;
        }

        /// <summary>
        /// Get today's summary for an employee
        /// </summary>
        public async Task<TodaySummaryDto> GetTodaySummaryAsync(int employeeId)
        {
            var today = Clock.Now.Date;
            var tomorrow = today.AddDays(1);

            var events = await _attendenceRepository
                .GetAll()
                .Where(e => e.EmployeeId == employeeId &&
                           e.EventTime >= today &&
                           e.EventTime < tomorrow)
                .OrderBy(e => e.EventTime)
                .ToListAsync();

            var summary = new TodaySummaryDto
            {
                TotalHours = 0,
                Overtime = 0,
                IsCurrentlyClockedIn = false
            };

            if (events.Any())
            {
                // Check if currently clocked in
                var lastEvent = events.Last();
                summary.IsCurrentlyClockedIn = lastEvent.EventType == "CLOCK_IN";

                if (summary.IsCurrentlyClockedIn)
                {
                    summary.LastClockInTime = lastEvent.EventTime;
                }

                // Calculate total hours
                decimal totalMinutes = 0;
                DateTime? clockInTime = null;

                foreach (var evt in events)
                {
                    if (evt.EventType == "CLOCK_IN")
                    {
                        clockInTime = evt.EventTime;
                    }
                    else if (evt.EventType == "CLOCK_OUT" && clockInTime.HasValue)
                    {
                        var duration = evt.EventTime - clockInTime.Value;
                        totalMinutes += (decimal)duration.TotalMinutes;
                        clockInTime = null;
                    }
                }

                // If still clocked in, add time until now
                if (clockInTime.HasValue)
                {
                    var duration = Clock.Now - clockInTime.Value;
                    totalMinutes += (decimal)duration.TotalMinutes;
                }

                summary.TotalHours = Math.Round(totalMinutes / 60, 2);

                // Calculate overtime (assuming 8 hours standard)
                if (summary.TotalHours > 8)
                {
                    summary.Overtime = summary.TotalHours - 8;
                }
            }

            return summary;
        }

        /// <summary>
        /// Get weekly summary for an employee
        /// </summary>
        public async Task<WeeklySummaryDto> GetWeeklySummaryAsync(int employeeId)
        {
            var startOfWeek = Clock.Now.Date.AddDays(-(int)Clock.Now.Date.DayOfWeek);
            var endOfWeek = startOfWeek.AddDays(7);

            var events = await _attendenceRepository
                .GetAll()
                .Where(e => e.EmployeeId == employeeId &&
                           e.EventTime >= startOfWeek &&
                           e.EventTime < endOfWeek)
                .OrderBy(e => e.EventTime)
                .ToListAsync();

            var summary = new WeeklySummaryDto
            {
                HoursWorked = 0,
                Target = 40, // Standard 40 hours per week
                Overtime = 0,
                DaysWorked = 0
            };

            if (events.Any())
            {
                // Group by day and calculate hours
                var dailyHours = new Dictionary<DateTime, decimal>();

                foreach (var dayGroup in events.GroupBy(e => e.EventTime.Date))
                {
                    decimal dayMinutes = 0;
                    DateTime? clockInTime = null;

                    foreach (var evt in dayGroup.OrderBy(e => e.EventTime))
                    {
                        if (evt.EventType == "CLOCK_IN")
                        {
                            clockInTime = evt.EventTime;
                        }
                        else if (evt.EventType == "CLOCK_OUT" && clockInTime.HasValue)
                        {
                            var duration = evt.EventTime - clockInTime.Value;
                            dayMinutes += (decimal)duration.TotalMinutes;
                            clockInTime = null;
                        }
                    }

                    // If still clocked in on current day, add time until now
                    if (clockInTime.HasValue && dayGroup.Key == Clock.Now.Date)
                    {
                        var duration = Clock.Now - clockInTime.Value;
                        dayMinutes += (decimal)duration.TotalMinutes;
                    }

                    if (dayMinutes > 0)
                    {
                        dailyHours[dayGroup.Key] = dayMinutes / 60;
                    }
                }

                summary.DaysWorked = dailyHours.Count;
                summary.HoursWorked = Math.Round(dailyHours.Values.Sum(), 2);

                // Calculate overtime
                if (summary.HoursWorked > summary.Target)
                {
                    summary.Overtime = summary.HoursWorked - summary.Target;
                }
            }

            return summary;
        }

        /// <summary>
        /// Get today's schedule for an employee
        /// </summary>
        public async Task<TodayScheduleDto> GetTodayScheduleAsync(int employeeId)
        {
            // Check if employee has any leave today
            var today = Clock.Now.Date;

            // For now, return a default shift
            // In a real implementation, this would check:
            // 1. Leave requests table for approved leaves
            // 2. Employee shift schedules
            // 3. Holiday calendar

            return await Task.FromResult(new TodayScheduleDto
            {
                ScheduleType = "shift",
                ShiftName = "Regular Shift",
                StartTime = "09:00",
                EndTime = "17:00",
                LeaveType = null
            });
        }
    }


}

