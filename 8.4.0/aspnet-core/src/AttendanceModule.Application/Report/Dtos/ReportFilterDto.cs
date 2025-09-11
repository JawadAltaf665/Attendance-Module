using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AttendanceModule.Report.Dtos
{
    // filter used by many reports
    public class ReportFilterDto
    {
        public int? EmployeeId { get; set; }
        public DateTime? StartDate { get; set; } // inclusive
        public DateTime? EndDate { get; set; }   // inclusive
        public string Keyword { get; set; }      // optional name/employee keyword
    }

}
