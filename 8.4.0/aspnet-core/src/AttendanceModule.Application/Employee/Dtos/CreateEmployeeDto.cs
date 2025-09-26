using Abp.Application.Services.Dto;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AttendanceModule.Employee.Dtos
{
    public class CreateEmployeeDto : AuditedEntityDto<int>
    {
        //public string EmployeeNumber { get; set; } // Made optional as it can be auto-generated

        [Required]
        public long UserId { get; set; }  // Select from existing ABP Users

        [MaxLength(50)]
        public string FirstName { get; set; }  // Optional - can get from User

        [MaxLength(50)]
        public string LastName { get; set; }   // Optional - can get from User

        [EmailAddress, MaxLength(256)]
        public string Email { get; set; }      // Optional - can get from User

        [MaxLength(50)]
        public string Timezone { get; set; } = "UTC";

        public bool IsActive { get; set; } = true;

    }

    public class UpdateEmployeeDto : EntityDto<int>
    {
        [Required]
        public long UserId { get; set; }

        [MaxLength(50)]
        public string FirstName { get; set; }

        [MaxLength(50)]
        public string LastName { get; set; }

        [EmailAddress, MaxLength(256)]
        public string Email { get; set; }

        [MaxLength(50)]
        public string Timezone { get; set; }

        public bool IsActive { get; set; }
    }

}
