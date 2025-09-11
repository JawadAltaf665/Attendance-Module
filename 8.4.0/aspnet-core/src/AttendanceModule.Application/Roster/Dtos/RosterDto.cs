using Abp.Application.Services.Dto;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AttendanceModule.Roster.Dtos
{
    public class RosterDto : EntityDto<int>
    {
        public DateTime RosterDate { get; set; }
        public int EmployeeId { get; set; }
        public string EmployeeName { get; set; }   // optional convenience field
        public int ShiftId { get; set; }
        public string ShiftName { get; set; }      // optional convenience field
    }

}
