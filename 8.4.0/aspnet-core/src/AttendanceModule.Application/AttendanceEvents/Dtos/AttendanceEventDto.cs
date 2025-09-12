using Abp.Application.Services.Dto;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AttendanceModule.AttendanceEvents.Dtos
{
    public class AttendanceEventDto: AuditedEntityDto<int>
    {
        public int EmployeeId { get; set; }
        public string EventType { get; set; }
        public DateTime EventTime { get; set; }
        public double? Latitude { get; set; }
        public double? Longitude { get; set; }
        public string Notes { get; set; }
    }
}
