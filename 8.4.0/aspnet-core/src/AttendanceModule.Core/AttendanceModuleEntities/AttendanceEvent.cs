using Abp.Domain.Entities;
using Abp.Domain.Entities.Auditing;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AttendanceModule.AttendanceModuleEntities
{
    public class AttendanceEvent: AuditedAggregateRoot<int>, IMustHaveTenant
    {
        public int TenantId { get; set; }
        public string EventType { get; set; }
        public DateTime EventTime { get; set; } 

        // Optional extra fields
        public string? Timezone { get; set; }
        public string? Source { get; set; }
        public double? Latitude { get; set; }
        public double? Longitude { get; set; }
        public string? IpAddress { get; set; }
        public string? PhotoUrl { get; set; }
        public string? DeviceId { get; set; }
        public int CreatedBy { get; set; }

        // emplyoyee relationship
        public int EmployeeId { get; set; }

        [ForeignKey("EmployeeId")]
        public Employee Employee { get; set; }
    }
}
