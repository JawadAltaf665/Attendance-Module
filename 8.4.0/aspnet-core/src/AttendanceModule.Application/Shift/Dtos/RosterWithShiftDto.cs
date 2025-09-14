using Abp.Application.Services.Dto;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AttendanceModule.Shift.Dtos
{
    public class RosterWithShiftDto : EntityDto<int>
    {
        public DateTime RosterDate { get; set; }
        public int EmployeeId { get; set; }
        public string EmployeeName { get; set; }
        public ShiftDetailsDto Shift { get; set; }
    }

    public class ShiftDetailsDto
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public TimeSpan StartTime { get; set; }
        public TimeSpan EndTime { get; set; }
        public int BreakMinutes { get; set; }
    }
}