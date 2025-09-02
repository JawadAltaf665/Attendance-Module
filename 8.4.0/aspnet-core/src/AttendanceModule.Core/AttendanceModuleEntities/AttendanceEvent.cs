using Abp.Domain.Entities.Auditing;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AttendanceModule.AttendanceModuleEntities
{
    public class AttendanceEvent: AuditedAggregateRoot<int>
    {
        public int TenantId { get; set; }
        public int EmployeeId { get; set; }
        public string EventType { get; set; } // CLOCK_IN, CLOCK_OUT, BREAK_START, BREAK_END
        public DateTime EventTime { get; set; } // stored in UTC
        public string? Timezone { get; set; }
        public string? Source { get; set; } // web, mobile, biometric
        public double? Latitude { get; set; }
        public double? Longitude { get; set; }
        public string? IpAddress { get; set; }
        public string? PhotoUrl { get; set; }
        public string? DeviceId { get; set; }
        public int CreatedBy { get; set; }
    }
}
