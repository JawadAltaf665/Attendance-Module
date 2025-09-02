using Microsoft.Extensions.Configuration;
using Castle.MicroKernel.Registration;
using Abp.Events.Bus;
using Abp.Modules;
using Abp.Reflection.Extensions;
using AttendanceModule.Configuration;
using AttendanceModule.EntityFrameworkCore;
using AttendanceModule.Migrator.DependencyInjection;

namespace AttendanceModule.Migrator
{
    [DependsOn(typeof(AttendanceModuleEntityFrameworkModule))]
    public class AttendanceModuleMigratorModule : AbpModule
    {
        private readonly IConfigurationRoot _appConfiguration;

        public AttendanceModuleMigratorModule(AttendanceModuleEntityFrameworkModule abpProjectNameEntityFrameworkModule)
        {
            abpProjectNameEntityFrameworkModule.SkipDbSeed = true;

            _appConfiguration = AppConfigurations.Get(
                typeof(AttendanceModuleMigratorModule).GetAssembly().GetDirectoryPathOrNull()
            );
        }

        public override void PreInitialize()
        {
            Configuration.DefaultNameOrConnectionString = _appConfiguration.GetConnectionString(
                AttendanceModuleConsts.ConnectionStringName
            );

            Configuration.BackgroundJobs.IsJobExecutionEnabled = false;
            Configuration.ReplaceService(
                typeof(IEventBus), 
                () => IocManager.IocContainer.Register(
                    Component.For<IEventBus>().Instance(NullEventBus.Instance)
                )
            );
        }

        public override void Initialize()
        {
            IocManager.RegisterAssemblyByConvention(typeof(AttendanceModuleMigratorModule).GetAssembly());
            ServiceCollectionRegistrar.Register(IocManager);
        }
    }
}
