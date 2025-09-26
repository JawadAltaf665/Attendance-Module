using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using Abp.AspNetCore.Mvc.Controllers;
using System;

namespace AttendanceModule.Web.Core.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TestController : AbpController
    {
        [HttpGet("ping")]
        public IActionResult Ping()
        {
            return Ok(new { message = "API is working", timestamp = DateTime.Now });
        }

        [HttpGet("health")]
        public IActionResult Health()
        {
            return Ok(new { 
                status = "healthy", 
                server = "AttendanceModule API",
                timestamp = DateTime.Now 
            });
        }
    }
}
