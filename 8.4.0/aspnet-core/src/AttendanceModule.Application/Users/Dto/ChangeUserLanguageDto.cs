using System.ComponentModel.DataAnnotations;

namespace AttendanceModule.Users.Dto
{
    public class ChangeUserLanguageDto
    {
        [Required]
        public string LanguageName { get; set; }
    }
}