using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AttendanceModule.AttendanceEvents.Dtos
{
    public class ClockEventDto
    {
        public int EmployeeId { get; set; }

        public string EventType { get; set; }
        public DateTime EventTime { get; set; }
        public string Notes { get; set; }

        // Location info from frontend
        public double? Latitude { get; set; }
        public double? Longitude { get; set; }
    }
}
