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
        public DbSet<ShiftSwapRequest> ShiftSwapRequests { get; set; }
        public DbSet<Roster> Rosters { get; set; }
        public DbSet<AttendanceEvent> AttendanceEvents { get; set; }
        public DbSet<LeaveRequest> LeaveRequests { get; set; }


        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<LeaveRequest>(b =>
            {
                b.ToTable("LeaveRequests");
                b.HasKey(x => x.Id);

                // Employee (who requested leave)
                b.HasOne(l => l.Employee)
                 .WithMany(e => e.LeaveRequests)
                 .HasForeignKey(l => l.EmployeeId)
                 .OnDelete(DeleteBehavior.Restrict);

                // Approver (manager/HR who approves)
                b.HasOne(l => l.Approver)
                 .WithMany()
                 .HasForeignKey(l => l.ApproverId)
                 .OnDelete(DeleteBehavior.Restrict);
            });
        }

    }
}
