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
    public class Roster: AuditedAggregateRoot<int>, IMustHaveTenant
    {
        public int TenantId { get; set; }
        public DateTime RosterDate { get; set; }


        // Employee relationship
        public int EmployeeId { get; set; }

        [ForeignKey("EmployeeId")]
        public Employee Employee { get; set; }

        // Shift relationship
        public int ShiftId { get; set; }

        [ForeignKey("ShiftId")]
        public Shift Shift { get; set; }
    }
}
