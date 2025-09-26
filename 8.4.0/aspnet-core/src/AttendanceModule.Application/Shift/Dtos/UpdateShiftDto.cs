using System;
using System.ComponentModel.DataAnnotations;

namespace AttendanceModule.Shift.Dtos
{
    public class UpdateShiftDto
    {
        [Required]
        [StringLength(100)]
        public string Name { get; set; }

        [Required]
        public TimeSpan StartTime { get; set; }

        [Required]
        public TimeSpan EndTime { get; set; }

        public int BreakMinutes { get; set; } = 0;

        [StringLength(500)]
        public string RecurrenceRule { get; set; }
    }
}