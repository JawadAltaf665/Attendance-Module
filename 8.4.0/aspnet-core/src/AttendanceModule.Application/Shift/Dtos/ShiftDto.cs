using Abp.Application.Services.Dto;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AttendanceModule.Shift.Dtos
{
    public class ShiftDto: AuditedEntityDto<int>
    {
        public string Name { get; set; }
        public TimeSpan StartTime { get; set; }
        public TimeSpan EndTime { get; set; }
        public int BreakMinutes { get; set; } = 0;
        public string RecurrenceRule { get; set; }
    }
}
