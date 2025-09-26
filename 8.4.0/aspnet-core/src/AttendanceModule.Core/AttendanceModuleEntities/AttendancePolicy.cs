using Abp.Domain.Entities;
using Abp.Domain.Entities.Auditing;
using System;
using System.ComponentModel.DataAnnotations;

namespace AttendanceModule.AttendanceModuleEntities
{
    public class AttendancePolicy : AuditedAggregateRoot<int>, IMustHaveTenant
    {
        public int TenantId { get; set; }

        [Required]
        [StringLength(100)]
        public string PolicyKey { get; set; }

        [Required]
        [StringLength(200)]
        public string PolicyName { get; set; }

        [StringLength(500)]
        public string Description { get; set; }

        public string PolicyValue { get; set; } // JSON string for complex configurations

        public bool IsEnabled { get; set; } = true;

        public string Category { get; set; } // "LEAVE", "OVERTIME", "GENERAL", etc.

        public DateTime? EffectiveFrom { get; set; }

        public DateTime? EffectiveTo { get; set; }

        // For audit trail
        public long? LastModifierUserId { get; set; }
        public string ModificationReason { get; set; }
    }
}