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
    public class LeaveRequest: AuditedAggregateRoot<int>, IMustHaveTenant
    {
        public int TenantId { get; set; }
        public string LeaveType { get; set; } // VACATION, SICK, UNPAID
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public bool HalfDay { get; set; } = false;
        public string Status { get; set; } = "PENDING"; // PENDING, APPROVED, REJECTED

        // emplyoyee relationship
        public int EmployeeId { get; set; }

        [ForeignKey("EmployeeId")]
        public Employee Employee { get; set; }

        // Approver relationship
        public int? ApproverId { get; set; }

        [ForeignKey("ApproverId")]
        public Employee? Approver { get; set; }
    }
}
