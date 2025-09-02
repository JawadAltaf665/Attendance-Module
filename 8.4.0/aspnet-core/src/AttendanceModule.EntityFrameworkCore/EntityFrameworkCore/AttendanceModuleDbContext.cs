using Microsoft.EntityFrameworkCore;
using Abp.Zero.EntityFrameworkCore;
using AttendanceModule.Authorization.Roles;
using AttendanceModule.Authorization.Users;
using AttendanceModule.MultiTenancy;
using AttendanceModule.AttendanceModuleEntities;

namespace AttendanceModule.EntityFrameworkCore
{
    public class AttendanceModuleDbContext : AbpZeroDbContext<Tenant, Role, User, AttendanceModuleDbContext>
    {
        /* Define a DbSet for each entity of the application */
        
        public AttendanceModuleDbContext(DbContextOptions<AttendanceModuleDbContext> options)
            : base(options)
        {
        }

        public DbSet<Employee> Employees { get; set; }
        public DbSet<Shift> Shifts { get; set; }
    }
}
