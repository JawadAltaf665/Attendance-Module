using Abp.BackgroundJobs;
using Abp.Dependency;
using Abp.Net.Mail;
using Abp.UI;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System;
using System.Net;
using System.Net.Mail;
using System.Threading.Tasks;

namespace AttendanceModule.Leave.BackgroundJobs
{
    // Arguments for bg job
    public class LeaveStatusEmailJobArgs
    {
        public string EmployeeEmail { get; set; }
        public string EmployeeName { get; set; }
        public string LeaveType { get; set; }  
        public string Status { get; set; }      
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
    }

    // Background job for sending leave status email
    public class LeaveStatusEmailJob : BackgroundJob<LeaveStatusEmailJobArgs>, ITransientDependency
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<LeaveStatusEmailJob> _logger;

        public LeaveStatusEmailJob(IConfiguration configuration, ILogger<LeaveStatusEmailJob> logger)
        {
            _configuration = configuration;
            _logger = logger;
        }

        public override async void Execute(LeaveStatusEmailJobArgs args)
        {
            string subject;
            string body;

            if (args.Status == "APPROVED")
            {
                subject = $"✅ Your {args.LeaveType} leave has been approved";
                body = $@"
                    <p>Dear {args.EmployeeName},</p>
                    <p>We are pleased to inform you that your <b>{args.LeaveType}</b> leave request 
                    from <b>{args.StartDate:dd MMM yyyy}</b> to <b>{args.EndDate:dd MMM yyyy}</b> 
                    has been <span style='color:green'><b>APPROVED</b></span>.</p>
                    <p>Enjoy your time off and kindly ensure a smooth handover before your leave.</p>
                    <br/><p>Best regards,<br/><b>HR Team</b></p>";
            }
            else
            {
                subject = $"❌ Your {args.LeaveType} leave has been rejected";
                body = $@"
                    <p>Dear {args.EmployeeName},</p>
                    <p>We regret to inform you that your <b>{args.LeaveType}</b> leave request 
                    from <b>{args.StartDate:dd MMM yyyy}</b> to <b>{args.EndDate:dd MMM yyyy}</b> 
                    has been <span style='color:red'><b>REJECTED</b></span>.</p>
                    <p>If you have questions, please contact your manager or HR.</p>
                    <br/><p>Best regards,<br/><b>HR Team</b></p>";
            }

            await SendEmailAsync(args.EmployeeEmail, subject, body);

            _logger.LogInformation($"📧 Leave status email sent to {args.EmployeeEmail} [{args.Status}]");
        }

        private async Task SendEmailAsync(string toEmail, string subject, string message)
        {
            var fromAddress = _configuration["Settings:Abp.Mailing.DefaultFromAddress"];
            var displayName = _configuration["Settings:Abp.Mailing.DefaultFromDisplayName"];
            var host = _configuration["Settings:Abp.Mailing.Smtp.Host"];
            var port = int.Parse(_configuration["Settings:Abp.Mailing.Smtp.Port"]);
            var userName = _configuration["Settings:Abp.Mailing.Smtp.UserName"];
            var password = _configuration["Settings:Abp.Mailing.Smtp.Password"];
            var enableSsl = bool.Parse(_configuration["Settings:Abp.Mailing.Smtp.EnableSsl"]);

            using (var client = new SmtpClient())
            {
                client.Host = host;
                client.Port = port;
                client.EnableSsl = enableSsl;
                client.UseDefaultCredentials = false;
                client.Credentials = new NetworkCredential(userName, password);

                using (var emailMessage = new MailMessage())
                {
                    emailMessage.To.Add(new MailAddress(toEmail));
                    emailMessage.Subject = subject;
                    emailMessage.IsBodyHtml = true;
                    emailMessage.Body = message;
                    emailMessage.From = new MailAddress(fromAddress, displayName);

                    await client.SendMailAsync(emailMessage);
                }
            }
        }
    }
}
