using Abp.Application.Services.Dto;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AttendanceModule.Employee.Dtos
{
    public class GetEmployeeListInputDTO: PagedAndSortedResultRequestDto
    {
        public string keyword { get; set; }
    }
}
