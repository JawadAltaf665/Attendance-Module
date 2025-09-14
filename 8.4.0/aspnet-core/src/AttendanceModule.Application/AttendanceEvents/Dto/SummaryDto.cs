using System;

namespace AttendanceModule.AttendanceEvents.Dto
{
    public class TodaySummaryDto
    {
        public decimal TotalHours { get; set; }
        public decimal Overtime { get; set; }
        public bool IsCurrentlyClockedIn { get; set; }
        public DateTime? LastClockInTime { get; set; }
    }

    public class WeeklySummaryDto
    {
        public decimal HoursWorked { get; set; }
        public decimal Target { get; set; }
        public decimal Overtime { get; set; }
        public int DaysWorked { get; set; }
    }

    public class TodayScheduleDto
    {
        public string ScheduleType { get; set; } // "shift", "leave", "none"
        public string ShiftName { get; set; }
        public string StartTime { get; set; }
        public string EndTime { get; set; }
        public string LeaveType { get; set; }
    }
}