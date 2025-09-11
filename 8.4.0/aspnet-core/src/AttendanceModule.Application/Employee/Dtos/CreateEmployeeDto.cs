using Abp.Application.Services.Dto;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AttendanceModule.Employee.Dtos
{
    public class CreateEmployeeDto: AuditedEntityDto<int>
    {
        [Required]
        public string EmployeeNumber { get; set; }
        [Required, MaxLength(50), MinLength(3)]
        public string FirstName { get; set; }
        public string? LastName { get; set; }

        [EmailAddress, Required]
        public string? Email { get; set; }
        public string Timezone { get; set; } = "UTC";
        public bool IsActive { get; set; } = true;

    }
}
