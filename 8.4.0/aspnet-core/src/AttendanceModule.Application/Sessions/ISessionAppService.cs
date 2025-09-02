using System.Threading.Tasks;
using Abp.Application.Services;
using AttendanceModule.Sessions.Dto;

namespace AttendanceModule.Sessions
{
    public interface ISessionAppService : IApplicationService
    {
        Task<GetCurrentLoginInformationsOutput> GetCurrentLoginInformations();
    }
}
