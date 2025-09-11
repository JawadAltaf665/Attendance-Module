using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AttendanceModule.Report.Dtos
{
    // Attendance row
    public class AttendanceReportRowDto
    {
        public int EmployeeId { get; set; }
        public string EmployeeName { get; set; }
        public DateTime EventTime { get; set; }
        public string EventType { get; set; } // CLOCK_IN/CLOCK_OUT
        public string Source { get; set; } // optional
        public string ShiftName { get; set; } // optional if roster joined
    }
}
