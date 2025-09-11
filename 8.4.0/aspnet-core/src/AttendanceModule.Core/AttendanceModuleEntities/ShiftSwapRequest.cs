using Abp.Domain.Entities.Auditing;
using Abp.Domain.Entities;
using System;
using System.Collections.Generic;
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

        public string Status { get; set; } = "PENDING"; // PENDING, APPROVED, REJECTED
    }
}
