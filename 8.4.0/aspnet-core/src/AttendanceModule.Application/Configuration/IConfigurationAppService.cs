using System.Threading.Tasks;
using AttendanceModule.Configuration.Dto;

namespace AttendanceModule.Configuration
{
    public interface IConfigurationAppService
    {
        Task ChangeUiTheme(ChangeUiThemeInput input);
    }
}
