using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AttendanceModule.Report.Dtos
{
    public class TodayScheduleDto
    {
        public string ScheduleType { get; set; } // e.g. "Flexible schedule"
        public string StartTime { get; set; }
        public string EndTime { get; set; }
    }
}
