using Abp.Application.Services.Dto;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AttendanceModule.AttendanceEvents.Dtos
{
    public class GetAttendenceListInputDTO: PagedAndSortedResultRequestDto
    {
        public string Keyword { get; set; }
    }
}
