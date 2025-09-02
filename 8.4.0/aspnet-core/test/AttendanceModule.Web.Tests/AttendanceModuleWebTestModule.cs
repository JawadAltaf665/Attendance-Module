using Abp.AspNetCore;
using Abp.AspNetCore.TestBase;
using Abp.Modules;
using Abp.Reflection.Extensions;
using AttendanceModule.EntityFrameworkCore;
using AttendanceModule.Web.Startup;
using Microsoft.AspNetCore.Mvc.ApplicationParts;

namespace AttendanceModule.Web.Tests
{
    [DependsOn(
        typeof(AttendanceModuleWebMvcModule),
        typeof(AbpAspNetCoreTestBaseModule)
    )]
    public class AttendanceModuleWebTestModule : AbpModule
    {
        public AttendanceModuleWebTestModule(AttendanceModuleEntityFrameworkModule abpProjectNameEntityFrameworkModule)
        {
            abpProjectNameEntityFrameworkModule.SkipDbContextRegistration = true;
        } 
        
        public override void PreInitialize()
        {
            Configuration.UnitOfWork.IsTransactional = false; //EF Core InMemory DB does not support transactions.
        }

        public override void Initialize()
        {
            IocManager.RegisterAssemblyByConvention(typeof(AttendanceModuleWebTestModule).GetAssembly());
        }
        
        public override void PostInitialize()
        {
            IocManager.Resolve<ApplicationPartManager>()
                .AddApplicationPartsIfNotAddedBefore(typeof(AttendanceModuleWebMvcModule).Assembly);
        }
    }
}