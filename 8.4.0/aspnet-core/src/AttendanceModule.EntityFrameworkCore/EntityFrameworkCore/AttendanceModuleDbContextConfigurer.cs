using System.Data.Common;
using Microsoft.EntityFrameworkCore;

namespace AttendanceModule.EntityFrameworkCore
{
    public static class AttendanceModuleDbContextConfigurer
    {
        public static void Configure(DbContextOptionsBuilder<AttendanceModuleDbContext> builder, string connectionString)
        {
            builder.UseSqlServer(connectionString);
        }

        public static void Configure(DbContextOptionsBuilder<AttendanceModuleDbContext> builder, DbConnection connection)
        {
            builder.UseSqlServer(connection);
        }
    }
}
