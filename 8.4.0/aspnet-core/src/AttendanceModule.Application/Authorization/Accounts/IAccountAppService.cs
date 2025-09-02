using System.Threading.Tasks;
using Abp.Application.Services;
using AttendanceModule.Authorization.Accounts.Dto;

namespace AttendanceModule.Authorization.Accounts
{
    public interface IAccountAppService : IApplicationService
    {
        Task<IsTenantAvailableOutput> IsTenantAvailable(IsTenantAvailableInput input);

        Task<RegisterOutput> Register(RegisterInput input);
    }
}
