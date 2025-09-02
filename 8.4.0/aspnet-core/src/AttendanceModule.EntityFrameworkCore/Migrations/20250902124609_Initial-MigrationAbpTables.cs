using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AttendanceModule.Migrations
{
    /// <inheritdoc />
    public partial class InitialMigrationAbpTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "TargetNotifiers",
                table: "AbpNotificationSubscriptions",
                type: "nvarchar(1024)",
                maxLength: 1024,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "TargetNotifiers",
                table: "AbpNotificationSubscriptions");
        }
    }
}
