using Abp.Domain.Entities.Auditing;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AttendanceModule.AttendanceModuleEntities
{
    public class Roster: AuditedAggregateRoot<int>
    {
        public int TenantId { get; set; }
        public int ShiftId { get; set; }
        public int EmployeeId { get; set; }
        public DateOnly RosterDate { get; set; }
    }
}
