using Abp.Domain.Entities.Auditing;
using Abp.Domain.Entities;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AttendanceModule.AttendanceModuleEntities
{
    public class ShiftSwapRequest : AuditedAggregateRoot<int>, IMustHaveTenant
    {
        public int TenantId { get; set; }

        public int RequesterId { get; set; }           //who wants to swap
        public int TargetEmployeeId { get; set; }      //who is asked to swap with
        public int ShiftId { get; set; }
        public DateTime RosterDate { get; set; }
        public string Reason { get; set; }             //reason for swap request
        public DateTime? ProposedDate { get; set; }    //proposed alternative date

        public string Status { get; set; } = "PENDING"; // PENDING, APPROVED, REJECTED
        public int? ApproverId { get; set; }           //manager who approved/rejected
        public string ApproverComments { get; set; }   //manager's comments
        public DateTime? ActionDate { get; set; }      //when approved/rejected

        // Navigation properties
        [ForeignKey("RequesterId")]
        public virtual Employee Requester { get; set; }

        [ForeignKey("TargetEmployeeId")]
        public virtual Employee TargetEmployee { get; set; }

        [ForeignKey("ShiftId")]
        public virtual Shift Shift { get; set; }

        [ForeignKey("ApproverId")]
        public virtual Employee Approver { get; set; }
    }
}
