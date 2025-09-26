using Abp.Application.Services.Dto;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AttendanceModule.Shift.Dtos
{
    public class ShiftSwapRequestDto : AuditedEntityDto<int>
    {
        public int RequesterId { get; set; }
        public string RequesterName { get; set; }
        public int TargetEmployeeId { get; set; }
        public string TargetEmployeeName { get; set; }
        public int ShiftId { get; set; }
        public string ShiftName { get; set; }
        public DateTime RosterDate { get; set; }
        public string Reason { get; set; }
        public DateTime? ProposedDate { get; set; }
        public string Status { get; set; }
        public int? ApproverId { get; set; }
        public string ApproverName { get; set; }
        public string ApproverComments { get; set; }
        public DateTime? ActionDate { get; set; }
    }
}
