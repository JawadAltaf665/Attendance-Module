using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AttendanceModule.Migrations
{
    /// <inheritdoc />
    public partial class RemoveEmployeeNumber : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "EmployeeNumber",
                table: "Employees");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "EmployeeNumber",
                table: "Employees",
                type: "nvarchar(max)",
                nullable: true,
                defaultValueSql: "FORMAT(NEXT VALUE FOR EmployeeNumberSeq, 'EMP0000')");
        }
    }
}
