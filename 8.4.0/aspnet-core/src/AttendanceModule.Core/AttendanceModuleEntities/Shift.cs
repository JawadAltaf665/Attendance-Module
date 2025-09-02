using Abp.Domain.Entities.Auditing;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AttendanceModule.AttendanceModuleEntities
{
    public class Shift: AuditedAggregateRoot<int>
    {
        public int TenantId { get; set; }
        public string Name { get; set; }
        public TimeSpan StartTime { get; set; }
        public TimeSpan EndTime { get; set; }
        public int BreakMinutes { get; set; } = 0;
        public string RecurrenceRule { get; set; } 
        public int CreatedBy { get; set; }
    }
}
