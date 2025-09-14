using Abp.Application.Services.Dto;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AttendanceModule.Leave.Dtos
{
    public class CreateLeaveDto
    {
        public int Id { get; set; }
        [Required]
        public string LeaveType { get; set; } // VACATION, SICK, PERSONAL, UNPAID
        [Required]
        public DateTime StartDate { get; set; }
        [Required]
        public DateTime EndDate { get; set; }
        public bool HalfDay { get; set; } = false;
        public string Status { get; set; } = "PENDING";
        [Required]
        public string Reason { get; set; }
        public string AttachmentUrl { get; set; }
        public int? ApproverId { get; set; } // Line manager ID
    }
}
