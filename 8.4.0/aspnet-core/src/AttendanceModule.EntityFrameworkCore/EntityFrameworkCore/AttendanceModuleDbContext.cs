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

            modelBuilder.Entity<ShiftSwapRequest>(entity =>
            {
                // Requester
                entity.HasOne(ssr => ssr.Requester)
                      .WithMany()
                      .HasForeignKey(ssr => ssr.RequesterId)
                      .OnDelete(DeleteBehavior.Restrict);

                // Target Employee
                entity.HasOne(ssr => ssr.TargetEmployee)
                      .WithMany()
                      .HasForeignKey(ssr => ssr.TargetEmployeeId)
                      .OnDelete(DeleteBehavior.Restrict);

                // Approver
                entity.HasOne(ssr => ssr.Approver)
                      .WithMany()
                      .HasForeignKey(ssr => ssr.ApproverId)
                      .OnDelete(DeleteBehavior.Restrict);

                // Shift
                entity.HasOne(ssr => ssr.Shift)
                      .WithMany()
                      .HasForeignKey(ssr => ssr.ShiftId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<Employee>()
                      .HasOne(e => e.User)
                      .WithMany()
                      .HasForeignKey(e => e.UserId)
                      .OnDelete(DeleteBehavior.Restrict);

            //modelBuilder.HasSequence<int>("EmployeeNumberSeq")
            //            .StartsAt(1)
            //            .IncrementsBy(1);

            //modelBuilder.Entity<Employee>()
            //         .Property(e => e.EmployeeNumber)
            //         .HasDefaultValueSql("FORMAT(NEXT VALUE FOR EmployeeNumberSeq, 'EMP0000')");

        }

    }
}
