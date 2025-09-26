using Abp.Domain.Entities;
using Abp.Domain.Entities.Auditing;
using AttendanceModule.Authorization.Users;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AttendanceModule.AttendanceModuleEntities
{
    public class Employee : AuditedAggregateRoot<int>, IMustHaveTenant
    {
        public int TenantId { get; set; }
        public long UserId { get; set; } // IMPORTANT: Changed from long? to long (required)
        //public string EmployeeNumber { get; set; }

        // IMPORTANT: Keep these for backward compatibility but get data from User
        public string FirstName { get; set; } = "Unknown";
        public string LastName { get; set; } = string.Empty;
        public string Email { get; set; } = "noemail@domain.com";


        public string Timezone { get; set; } = "UTC";
        public bool IsActive { get; set; } = true;

        [ForeignKey("UserId")]
        public User User { get; set; }

        public ICollection<Roster> Rosters { get; set; } = new List<Roster>();
        public ICollection<AttendanceEvent> AttendanceEvents { get; set; } = new List<AttendanceEvent>();
        public ICollection<LeaveRequest> LeaveRequests { get; set; } = new List<LeaveRequest>();
    }
}
