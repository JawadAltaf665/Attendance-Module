using Abp.Application.Services.Dto;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AttendanceModule.Shift.Dtos
{
    public class ShiftSwapRequestDto : EntityDto<int>
    {
        public int RequesterId { get; set; }
        public int TargetEmployeeId { get; set; }
        public int ShiftId { get; set; }
        public DateTime RosterDate { get; set; }
        public string Status { get; set; }
    }
}
