using Abp.Application.Services.Dto;

namespace AttendanceModule.Roles.Dto
{
    public class PagedRoleResultRequestDto : PagedResultRequestDto
    {
        public string Keyword { get; set; }
    }
}

