using Abp.Application.Services.Dto;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AttendanceModule.Leave.Dtos
{
    public class LeaveDto: AuditedEntityDto<int>
    {
        public int TenantId { get; set; }
        public string LeaveType { get; set; } // VACATION, SICK, PERSONAL, UNPAID
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public bool HalfDay { get; set; } = false;
        public string Status { get; set; } = "PENDING";
        public int EmployeeId { get; set; }
        public int? ApproverId { get; set; }
        public string Reason { get; set; }
        public string AttachmentUrl { get; set; }
    }
}
