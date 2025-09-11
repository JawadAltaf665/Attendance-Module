using Abp.Application.Services.Dto;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AttendanceModule.Leave.Dtos
{
    public class GetLeaveListInput: PagedAndSortedResultRequestDto
    {
        public string keyword { get; set; }
    }
}
