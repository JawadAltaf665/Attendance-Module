using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Abp.Modules;
using Abp.Reflection.Extensions;
using AttendanceModule.Configuration;

namespace AttendanceModule.Web.Host.Startup
{
    [DependsOn(
       typeof(AttendanceModuleWebCoreModule))]
    public class AttendanceModuleWebHostModule: AbpModule
    {
        private readonly IWebHostEnvironment _env;
        private readonly IConfigurationRoot _appConfiguration;

        public AttendanceModuleWebHostModule(IWebHostEnvironment env)
        {
            _env = env;
            _appConfiguration = env.GetAppConfiguration();
        }

        public override void Initialize()
        {
            IocManager.RegisterAssemblyByConvention(typeof(AttendanceModuleWebHostModule).GetAssembly());
        }
    }
}
