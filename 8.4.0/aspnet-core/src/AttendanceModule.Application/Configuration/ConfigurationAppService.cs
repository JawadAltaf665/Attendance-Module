using System.Threading.Tasks;
using Abp.Authorization;
using Abp.Runtime.Session;
using AttendanceModule.Configuration.Dto;

namespace AttendanceModule.Configuration
{
    [AbpAuthorize]
    public class ConfigurationAppService : AttendanceModuleAppServiceBase, IConfigurationAppService
    {
        public async Task ChangeUiTheme(ChangeUiThemeInput input)
        {
            await SettingManager.ChangeSettingForUserAsync(AbpSession.ToUserIdentifier(), AppSettingNames.UiTheme, input.Theme);
        }
    }
}
