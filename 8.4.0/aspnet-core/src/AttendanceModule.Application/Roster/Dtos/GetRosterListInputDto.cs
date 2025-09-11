using Abp.Application.Services.Dto;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AttendanceModule.Roster.Dtos
{
    public class GetRosterListInputDto: PagedAndSortedResultRequestDto
    {
        public string Keyword { get; set; }
    }
}
