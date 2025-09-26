using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AttendanceModule.Migrations
{
    /// <inheritdoc />
    public partial class FixEmployeeUserRelation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "ActionDate",
                table: "ShiftSwapRequests",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ApproverComments",
                table: "ShiftSwapRequests",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ApproverId",
                table: "ShiftSwapRequests",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ProposedDate",
                table: "ShiftSwapRequests",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Reason",
                table: "ShiftSwapRequests",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AlterColumn<long>(
                name: "UserId",
                table: "Employees",
                type: "bigint",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_ShiftSwapRequests_ApproverId",
                table: "ShiftSwapRequests",
                column: "ApproverId");

            migrationBuilder.CreateIndex(
                name: "IX_ShiftSwapRequests_RequesterId",
                table: "ShiftSwapRequests",
                column: "RequesterId");

            migrationBuilder.CreateIndex(
                name: "IX_ShiftSwapRequests_ShiftId",
                table: "ShiftSwapRequests",
                column: "ShiftId");

            migrationBuilder.CreateIndex(
                name: "IX_ShiftSwapRequests_TargetEmployeeId",
                table: "ShiftSwapRequests",
                column: "TargetEmployeeId");

            migrationBuilder.CreateIndex(
                name: "IX_Employees_UserId",
                table: "Employees",
                column: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Employees_AbpUsers_UserId",
                table: "Employees",
                column: "UserId",
                principalTable: "AbpUsers",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_ShiftSwapRequests_Employees_ApproverId",
                table: "ShiftSwapRequests",
                column: "ApproverId",
                principalTable: "Employees",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_ShiftSwapRequests_Employees_RequesterId",
                table: "ShiftSwapRequests",
                column: "RequesterId",
                principalTable: "Employees",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_ShiftSwapRequests_Employees_TargetEmployeeId",
                table: "ShiftSwapRequests",
                column: "TargetEmployeeId",
                principalTable: "Employees",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_ShiftSwapRequests_Shifts_ShiftId",
                table: "ShiftSwapRequests",
                column: "ShiftId",
                principalTable: "Shifts",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Employees_AbpUsers_UserId",
                table: "Employees");

            migrationBuilder.DropForeignKey(
                name: "FK_ShiftSwapRequests_Employees_ApproverId",
                table: "ShiftSwapRequests");

            migrationBuilder.DropForeignKey(
                name: "FK_ShiftSwapRequests_Employees_RequesterId",
                table: "ShiftSwapRequests");

            migrationBuilder.DropForeignKey(
                name: "FK_ShiftSwapRequests_Employees_TargetEmployeeId",
                table: "ShiftSwapRequests");

            migrationBuilder.DropForeignKey(
                name: "FK_ShiftSwapRequests_Shifts_ShiftId",
                table: "ShiftSwapRequests");

            migrationBuilder.DropIndex(
                name: "IX_ShiftSwapRequests_ApproverId",
                table: "ShiftSwapRequests");

            migrationBuilder.DropIndex(
                name: "IX_ShiftSwapRequests_RequesterId",
                table: "ShiftSwapRequests");

            migrationBuilder.DropIndex(
                name: "IX_ShiftSwapRequests_ShiftId",
                table: "ShiftSwapRequests");

            migrationBuilder.DropIndex(
                name: "IX_ShiftSwapRequests_TargetEmployeeId",
                table: "ShiftSwapRequests");

            migrationBuilder.DropIndex(
                name: "IX_Employees_UserId",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "ActionDate",
                table: "ShiftSwapRequests");

            migrationBuilder.DropColumn(
                name: "ApproverComments",
                table: "ShiftSwapRequests");

            migrationBuilder.DropColumn(
                name: "ApproverId",
                table: "ShiftSwapRequests");

            migrationBuilder.DropColumn(
                name: "ProposedDate",
                table: "ShiftSwapRequests");

            migrationBuilder.DropColumn(
                name: "Reason",
                table: "ShiftSwapRequests");

            migrationBuilder.AlterColumn<int>(
                name: "UserId",
                table: "Employees",
                type: "int",
                nullable: true,
                oldClrType: typeof(long),
                oldType: "bigint",
                oldNullable: true);
        }
    }
}
