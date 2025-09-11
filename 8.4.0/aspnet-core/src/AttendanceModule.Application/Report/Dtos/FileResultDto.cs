using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AttendanceModule.Report.Dtos
{
    public class FileResultDto
    {
        public string FileName { get; set; }
        public string ContentType { get; set; }
        public byte[] File { get; set; }
    }
}
