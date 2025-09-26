using Abp.BackgroundJobs;
using Abp.Dependency;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System;
using System.Net;
using System.Net.Mail;
using System.Threading.Tasks;

namespace AttendanceModule.Shift.BackgroundJobs
{
    public class ShiftSwapEmailJobArgs
    {
        public string EmployeeEmail { get; set; }
        public string EmployeeName { get; set; }
        public string ShiftName { get; set; }
        public DateTime RosterDate { get; set; }
        public string Status { get; set; }
        public string Reason { get; set; }
        public string ApproverComments { get; set; }
        public string TargetEmployeeName { get; set; }
        public EmailType Type { get; set; }
    }

    public enum EmailType
    {
        SwapRequest,
        SwapApproved,
        SwapRejected
    }

    public class ShiftSwapEmailJob : BackgroundJob<ShiftSwapEmailJobArgs>, ITransientDependency
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<ShiftSwapEmailJob> _logger;

        public ShiftSwapEmailJob(IConfiguration configuration, ILogger<ShiftSwapEmailJob> logger)
        {
            _configuration = configuration;
            _logger = logger;
        }

        public override async void Execute(ShiftSwapEmailJobArgs args)
        {
            string subject;
            string body;

            switch (args.Type)
            {
                case EmailType.SwapRequest:
                    subject = $"🔄 New Shift Swap Request - {args.ShiftName} on {args.RosterDate:dd MMM yyyy}";
                    body = $@"
                        <p>Dear {args.EmployeeName},</p>
                        <p>You have received a new shift swap request:</p>
                        <ul>
                            <li><b>Shift:</b> {args.ShiftName}</li>
                            <li><b>Date:</b> {args.RosterDate:dd MMM yyyy}</li>
                            <li><b>Requested by:</b> {args.TargetEmployeeName}</li>
                            <li><b>Reason:</b> {args.Reason}</li>
                        </ul>
                        <p>Please log in to the system to review and respond to this request.</p>
                        <br/><p>Best regards,<br/><b>Attendance System</b></p>";
                    break;

                case EmailType.SwapApproved:
                    subject = $"✅ Shift Swap Request Approved - {args.ShiftName} on {args.RosterDate:dd MMM yyyy}";
                    body = $@"
                        <p>Dear {args.EmployeeName},</p>
                        <p>Your shift swap request has been <span style='color:green'><b>APPROVED</b></span>:</p>
                        <ul>
                            <li><b>Shift:</b> {args.ShiftName}</li>
                            <li><b>Date:</b> {args.RosterDate:dd MMM yyyy}</li>
                            <li><b>Swap with:</b> {args.TargetEmployeeName}</li>
                        </ul>
                        {(!string.IsNullOrEmpty(args.ApproverComments) ? $"<p><b>Manager's Comments:</b> {args.ApproverComments}</p>" : "")}
                        <p>The roster has been updated accordingly. Please ensure a smooth handover with your colleague.</p>
                        <br/><p>Best regards,<br/><b>Attendance System</b></p>";
                    break;

                case EmailType.SwapRejected:
                    subject = $"❌ Shift Swap Request Rejected - {args.ShiftName} on {args.RosterDate:dd MMM yyyy}";
                    body = $@"
                        <p>Dear {args.EmployeeName},</p>
                        <p>Your shift swap request has been <span style='color:red'><b>REJECTED</b></span>:</p>
                        <ul>
                            <li><b>Shift:</b> {args.ShiftName}</li>
                            <li><b>Date:</b> {args.RosterDate:dd MMM yyyy}</li>
                            <li><b>Requested swap with:</b> {args.TargetEmployeeName}</li>
                        </ul>
                        {(!string.IsNullOrEmpty(args.ApproverComments) ? $"<p><b>Manager's Comments:</b> {args.ApproverComments}</p>" : "")}
                        <p>Please continue with your original schedule or contact your manager for alternatives.</p>
                        <br/><p>Best regards,<br/><b>Attendance System</b></p>";
                    break;

                default:
                    return;
            }

            await SendEmailAsync(args.EmployeeEmail, subject, body);
            _logger.LogInformation($"📧 Shift swap email sent to {args.EmployeeEmail} [Type: {args.Type}]");
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