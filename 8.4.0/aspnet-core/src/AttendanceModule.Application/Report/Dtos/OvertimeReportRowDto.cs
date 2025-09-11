using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AttendanceModule.Report.Dtos
{
    // Overtime row (basic)
    public class OvertimeReportRowDto
    {
        public int EmployeeId { get; set; }
        public string EmployeeName { get; set; }
        public decimal TotalWorkedHours { get; set; }
        public decimal StandardHours { get; set; }
        public decimal OvertimeHours { get; set; }
    }
}
