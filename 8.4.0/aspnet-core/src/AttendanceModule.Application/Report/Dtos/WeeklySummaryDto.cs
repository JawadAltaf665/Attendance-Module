using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AttendanceModule.Report.Dtos
{
    public class WeeklySummaryDto
    {
        public double HoursWorked { get; set; }
        public double Overtime { get; set; }
        public double Target { get; set; } = 40; // default weekly target
    }

}
