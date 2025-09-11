using Abp.Application.Services.Dto;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AttendanceModule.Shift.Dtos
{
    public class CreateShiftDto: AuditedEntityDto<int>
    {
        [Required, MaxLength(128), MinLength(3)]
        public string Name { get; set; }
        [Required]
        public TimeSpan StartTime { get; set; }
        [Required]
        public TimeSpan EndTime { get; set; }
        public int BreakMinutes { get; set; } = 0;
        public string RecurrenceRule { get; set; }

    }
}
