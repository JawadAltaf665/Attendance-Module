using Abp.Application.Services.Dto;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AttendanceModule.Shift.Dtos
{
    public class GetShiftListInputDTO: PagedAndSortedResultRequestDto
    {
        public string keyword { get; set; }
    }
}
