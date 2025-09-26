using Abp.Application.Services.Dto;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AttendanceModule.Employee.Dtos
{
    public class EmployeeDto: AuditedEntityDto<int>
    {
        //public string EmployeeNumber { get; set; }
        public long UserId { get; set; }
        public string UserName { get; set; }  // From ABP User
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string Email { get; set; }
        public string Timezone { get; set; }
        public bool IsActive { get; set; }

        // Computed property
        public string FullName => $"{FirstName} {LastName}".Trim();
    }

    public class UserDto : EntityDto<long>
    {
        public string Name { get; set; }
        public string Surname { get; set; }
        public string UserName { get; set; }
        public string EmailAddress { get; set; }
        public string FullName { get; set; }
        public bool IsActive { get; set; }
    }
}
