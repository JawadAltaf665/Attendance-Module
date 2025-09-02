using AttendanceModule.Debugging;

namespace AttendanceModule
{
    public class AttendanceModuleConsts
    {
        public const string LocalizationSourceName = "AttendanceModule";

        public const string ConnectionStringName = "Default";

        public const bool MultiTenancyEnabled = true;


        /// <summary>
        /// Default pass phrase for SimpleStringCipher decrypt/encrypt operations
        /// </summary>
        public static readonly string DefaultPassPhrase =
            DebugHelper.IsDebug ? "gsKxGZ012HLL3MI5" : "a4073bdf3c7d4c3db76b76be41815f28";
    }
}
