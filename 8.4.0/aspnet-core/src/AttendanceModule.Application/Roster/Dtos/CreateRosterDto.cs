using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AttendanceModule.Roster.Dtos
{
    public class CreateRosterDto
    {
        [Required]
        public int EmployeeId { get; set; }

        [Required]
        public int ShiftId { get; set; }

        [Required]
        [DataType(DataType.Date)]
        public DateTime RosterDate { get; set; }
    }
}
