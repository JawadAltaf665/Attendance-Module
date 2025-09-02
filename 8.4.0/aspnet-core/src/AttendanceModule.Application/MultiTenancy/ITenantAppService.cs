using Abp.Application.Services;
using AttendanceModule.MultiTenancy.Dto;

namespace AttendanceModule.MultiTenancy
{
    public interface ITenantAppService : IAsyncCrudAppService<TenantDto, int, PagedTenantResultRequestDto, CreateTenantDto, TenantDto>
    {
    }
}

