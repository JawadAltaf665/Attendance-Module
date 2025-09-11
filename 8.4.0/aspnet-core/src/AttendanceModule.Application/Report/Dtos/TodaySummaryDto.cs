using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AttendanceModule.Report.Dtos
{
    public class TodaySummaryDto
    {
        public double TotalHours { get; set; }
        public double Overtime { get; set; }
    }

}
