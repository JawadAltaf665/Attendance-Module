using Abp.Application.Services.Dto;
using System;

namespace AttendanceModule.Policy.Dtos
{
    public class PolicyDto : EntityDto<int>
    {
        public string PolicyKey { get; set; }
        public string PolicyName { get; set; }
        public string Description { get; set; }
        public string PolicyValue { get; set; }
        public bool IsEnabled { get; set; }
        public string Category { get; set; }
        public DateTime? EffectiveFrom { get; set; }
        public DateTime? EffectiveTo { get; set; }
        public DateTime CreationTime { get; set; }
        public DateTime? LastModificationTime { get; set; }
        public string ModificationReason { get; set; }
    }

    public class CreatePolicyDto
    {
        public string PolicyKey { get; set; }
        public string PolicyName { get; set; }
        public string Description { get; set; }
        public string PolicyValue { get; set; }
        public bool IsEnabled { get; set; } = true;
        public string Category { get; set; }
        public DateTime? EffectiveFrom { get; set; }
        public DateTime? EffectiveTo { get; set; }
    }

    public class UpdatePolicyDto
    {
        public string PolicyName { get; set; }
        public string Description { get; set; }
        public string PolicyValue { get; set; }
        public bool IsEnabled { get; set; }
        public string Category { get; set; }
        public DateTime? EffectiveFrom { get; set; }
        public DateTime? EffectiveTo { get; set; }
        public string ModificationReason { get; set; }
    }

    public class GetPolicyListInputDto : PagedResultRequestDto
    {
        public string Keyword { get; set; }
        public string Category { get; set; }
        public bool? IsEnabled { get; set; }
    }

    public class PolicyAuditLogDto : EntityDto<int>
    {
        public int PolicyId { get; set; }
        public string PolicyKey { get; set; }
        public string PolicyName { get; set; }
        public string OldValue { get; set; }
        public string NewValue { get; set; }
        public string ModificationReason { get; set; }
        public string ModifierUserName { get; set; }
        public DateTime ModificationTime { get; set; }
        public string Action { get; set; } // "Created", "Updated", "Deleted", "Enabled", "Disabled"
    }
}