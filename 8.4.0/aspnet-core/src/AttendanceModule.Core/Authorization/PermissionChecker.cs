using Abp.Authorization;
using AttendanceModule.Authorization.Roles;
using AttendanceModule.Authorization.Users;

namespace AttendanceModule.Authorization
{
    public class PermissionChecker : PermissionChecker<Role, User>
    {
        public PermissionChecker(UserManager userManager)
            : base(userManager)
        {
        }
    }
}
