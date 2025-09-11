using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AttendanceModule.AttendanceEvents.Dtos
{
    public class CreateAttendenceEventDto
    {
        public int EmployeeId { get; set; }

        public string EventType { get; set; }
        public DateTime EventTime { get; set; }
    }
}
