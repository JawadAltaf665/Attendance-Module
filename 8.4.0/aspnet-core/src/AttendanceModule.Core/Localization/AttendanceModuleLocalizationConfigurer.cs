using Abp.Configuration.Startup;
using Abp.Localization.Dictionaries;
using Abp.Localization.Dictionaries.Xml;
using Abp.Reflection.Extensions;

namespace AttendanceModule.Localization
{
    public static class AttendanceModuleLocalizationConfigurer
    {
        public static void Configure(ILocalizationConfiguration localizationConfiguration)
        {
            localizationConfiguration.Sources.Add(
                new DictionaryBasedLocalizationSource(AttendanceModuleConsts.LocalizationSourceName,
                    new XmlEmbeddedFileLocalizationDictionaryProvider(
                        typeof(AttendanceModuleLocalizationConfigurer).GetAssembly(),
                        "AttendanceModule.Localization.SourceFiles"
                    )
                )
            );
        }
    }
}
