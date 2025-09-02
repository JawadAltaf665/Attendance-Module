using Abp.Domain.Entities.Auditing;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AttendanceModule.AttendanceModuleEntities
{
    public class LeaveRequest: AuditedAggregateRoot<int>
    {
        public int TenantId { get; set; }
        public int EmployeeId { get; set; }
        public string LeaveType { get; set; } // VACATION, SICK, UNPAID
        public DateOnly StartDate { get; set; }
        public DateOnly EndDate { get; set; }
        public bool HalfDay { get; set; } = false;
        public string Status { get; set; } = "PENDING"; // PENDING, APPROVED, REJECTED
        public int? ApproverId { get; set; }
    }
}
