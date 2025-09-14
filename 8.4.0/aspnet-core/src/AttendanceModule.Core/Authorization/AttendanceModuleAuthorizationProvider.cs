using Abp.Authorization;
using Abp.Localization;
using Abp.MultiTenancy;

namespace AttendanceModule.Authorization
{
    public class AttendanceModuleAuthorizationProvider : AuthorizationProvider
    {
        public override void SetPermissions(IPermissionDefinitionContext context)
        {
            // Employees
            context.CreatePermission(EmployeePermissions.Pages_Employees, L("Employees"));

            // Attendance
            var attendance = context.CreatePermission(AttendencePermissions.Pages_Attendance, L("Attendance"));
            attendance.CreateChildPermission(AttendencePermissions.Pages_Attendance_ClockInOut, L("ClockInOut"));
            attendance.CreateChildPermission(AttendencePermissions.Pages_Attendance_View, L("ViewAttendance"));


            // Shifts
            var shifts = context.CreatePermission(ShiftPermissions.Pages_Shifts, L("Shifts"));
            shifts.CreateChildPermission(ShiftPermissions.Pages_Shifts_Create, L("CreateShift"));
            shifts.CreateChildPermission(ShiftPermissions.Pages_Shifts_View, L("ViewShift"));
            shifts.CreateChildPermission(ShiftPermissions.Pages_Shifts_Edit, L("EditShift"));
            shifts.CreateChildPermission(ShiftPermissions.Pages_Shifts_Delete, L("DeleteShift"));


            // Roster
            var rosters = context.CreatePermission(RosterPermissions.Pages_Rosters, L("Rosters"));
            rosters.CreateChildPermission(RosterPermissions.Pages_Rosters_Assign, L("AssignRoster"));
            rosters.CreateChildPermission(RosterPermissions.Pages_Rosters_View, L("ViewRoster"));
            rosters.CreateChildPermission(RosterPermissions.Pages_Rosters_Swap, L("SwapRoster"));


            // Leaves
            var leaves = context.CreatePermission(LeavePermissions.Pages_Leaves, L("Leaves"));
            leaves.CreateChildPermission(LeavePermissions.Pages_Leaves_Request, L("RequestLeave"));
            leaves.CreateChildPermission(LeavePermissions.Pages_Leaves_Approve, L("ApproveLeave"));
            leaves.CreateChildPermission(LeavePermissions.Pages_Leaves_Reject, L("RejectLeave"));
            leaves.CreateChildPermission(LeavePermissions.Pages_Leaves_View, L("ViewLeave"));

            // Reports
            var reports = context.CreatePermission(ReportPermissions.Pages_Reports, L("Reports"));
            reports.CreateChildPermission(ReportPermissions.Pages_Reports_Attendance, L("AttendanceReport"));
            reports.CreateChildPermission(ReportPermissions.Pages_Reports_Leaves, L("LeaveReport"));
            reports.CreateChildPermission(ReportPermissions.Pages_Reports_Overtime, L("OvertimeReport"));


            // System
            context.CreatePermission(SystemPermissions.Pages_Users, L("Users"));
            context.CreatePermission(SystemPermissions.Pages_Users_Activation, L("UsersActivation"));
            context.CreatePermission(SystemPermissions.Pages_Roles, L("Roles"));
            context.CreatePermission(SystemPermissions.Pages_Tenants, L("Tenants"), multiTenancySides: MultiTenancySides.Host);
        }

        private static ILocalizableString L(string name)
        {
            return new LocalizableString(name, AttendanceModuleConsts.LocalizationSourceName);
        }

        public static class EmployeePermissions
        {
            // Employees
            public const string Pages_Employees = "Pages.Employees";
            public const string Pages_Employees_Create = "Pages.Employees.Create";
            public const string Pages_Employees_Edit = "Pages.Employees.Edit";
            public const string Pages_Employees_Delete = "Pages.Employees.Delete";
            public const string Pages_Employees_View = "Pages.Employees.View";
        }
            
        public static class AttendencePermissions
        {
            // Attendance
            public const string Pages_Attendance = "Pages.Attendance";
            public const string Pages_Attendance_ClockInOut = "Pages.Attendance.ClockInOut";
            public const string Pages_Attendance_View = "Pages.Attendance.View";
        }

        public static class ShiftPermissions
        {
            // Shifts
            public const string Pages_Shifts = "Pages.Shifts";
            public const string Pages_Shifts_Create = "Pages.Shifts.Create";
            public const string Pages_Shifts_View = "Pages.Shifts.View";
            public const string Pages_Shifts_Edit = "Pages.Shifts.Edit";
            public const string Pages_Shifts_Delete = "Pages.Shifts.Delete";
        }

        public static class RosterPermissions
        {
            // Roster
            public const string Pages_Rosters = "Pages.Rosters";
            public const string Pages_Rosters_Assign = "Pages.Rosters.Assign";
            public const string Pages_Rosters_View = "Pages.Rosters.View";
            public const string Pages_Rosters_Swap = "Pages.Rosters.Swap";
        }
        
        public static class LeavePermissions
        {
            // Leaves
            public const string Pages_Leaves = "Pages.Leaves";
            public const string Pages_Leaves_Request = "Pages.Leaves.Request";
            public const string Pages_Leaves_Approve = "Pages.Leaves.Approve";
            public const string Pages_Leaves_Reject = "Pages.Leaves.Reject";
            public const string Pages_Leaves_View = "Pages.Leaves.View";

        }

        public static class ReportPermissions
        {
            // Reports
            public const string Pages_Reports = "Pages.Reports";
            public const string Pages_Reports_Attendance = "Pages.Reports.Attendance";
            public const string Pages_Reports_Leaves = "Pages.Reports.Leaves";
            public const string Pages_Reports_Overtime = "Pages.Reports.Overtime";
        }

        public static class SystemPermissions
        {
            // System (already in template)
            public const string Pages_Users = "Pages.Users";
            public const string Pages_Users_Activation = "Pages.Users.Activation";
            public const string Pages_Roles = "Pages.Roles";
            public const string Pages_Tenants = "Pages.Tenants";
        }
    }
}
