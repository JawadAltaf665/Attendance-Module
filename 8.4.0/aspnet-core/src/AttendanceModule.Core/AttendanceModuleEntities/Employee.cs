using Abp.Domain.Entities;
using Abp.Domain.Entities.Auditing;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AttendanceModule.AttendanceModuleEntities
{
    public class Employee: AuditedAggregateRoot<int>, IMustHaveTenant
    {
        public int TenantId { get; set; }
        public int? UserId { get; set; } 
        public string EmployeeNumber { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string Email { get; set; }
        public string Timezone { get; set; } = "UTC";
        public bool IsActive { get; set; } = true;


        public ICollection<Roster> Rosters { get; set; } = new List<Roster>();
        public ICollection<AttendanceEvent> AttendanceEvents { get; set; } = new List<AttendanceEvent>();
        public ICollection<LeaveRequest> LeaveRequests { get; set; } = new List<LeaveRequest>();
    }
}
