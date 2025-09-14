using System;
using System.Collections.Generic;

namespace AttendanceModule.AttendanceEvents.Dto
{
    public class TodaySessionDto
    {
        public DateTime Date { get; set; }
        public int EmployeeId { get; set; }
        public List<SessionDetailDto> Sessions { get; set; }
        public double TotalHours { get; set; }
        public bool IsCurrentlyClockedIn { get; set; }
        public DateTime? LastClockInTime { get; set; }

        public TodaySessionDto()
        {
            Sessions = new List<SessionDetailDto>();
        }
    }

    public class SessionDetailDto
    {
        public DateTime ClockInTime { get; set; }
        public DateTime? ClockOutTime { get; set; }
        public double Duration { get; set; }
        public bool IsActive { get; set; }
    }
}