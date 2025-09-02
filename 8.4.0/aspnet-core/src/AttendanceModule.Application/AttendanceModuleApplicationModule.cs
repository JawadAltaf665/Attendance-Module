using Abp.AutoMapper;
using Abp.Modules;
using Abp.Reflection.Extensions;
using AttendanceModule.Authorization;

namespace AttendanceModule
{
    [DependsOn(
        typeof(AttendanceModuleCoreModule), 
        typeof(AbpAutoMapperModule))]
    public class AttendanceModuleApplicationModule : AbpModule
    {
        public override void PreInitialize()
        {
            Configuration.Authorization.Providers.Add<AttendanceModuleAuthorizationProvider>();
        }

        public override void Initialize()
        {
            var thisAssembly = typeof(AttendanceModuleApplicationModule).GetAssembly();

            IocManager.RegisterAssemblyByConvention(thisAssembly);

            Configuration.Modules.AbpAutoMapper().Configurators.Add(
                // Scan the assembly for classes which inherit from AutoMapper.Profile
                cfg => cfg.AddMaps(thisAssembly)
            );
        }
    }
}
