using Abp.Application.Services.Dto;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AttendanceModule.Shift.Dtos
{
    public class CreateShiftSwapRequestDto
    {
        [Required] 
        public int RequesterId { get; set; }
        [Required] 
        public int TargetEmployeeId { get; set; }
        [Required] 
        public int ShiftId { get; set; }
        [Required] 
        public DateTime RosterDate { get; set; }
    }

}
