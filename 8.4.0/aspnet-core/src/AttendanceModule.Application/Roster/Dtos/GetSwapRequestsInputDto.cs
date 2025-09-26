using Abp.Application.Services.Dto;
using System;

namespace AttendanceModule.Roster.Dtos
{
    public class GetSwapRequestsInputDto : PagedAndSortedResultRequestDto
    {
        public string Status { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
    }
}