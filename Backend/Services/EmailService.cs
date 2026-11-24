using System.Net;
using System.Net.Mail;
using Backend.Entities;
using Backend.Interfaces;
using Microsoft.Extensions.Logging;

namespace Backend.Services
{
    public class EmailService : IEmailService
    {
        private readonly IRepository<SiteSetting> _settingsRepository;
        private readonly ILogger<EmailService> _logger;

        public EmailService(IRepository<SiteSetting> settingsRepository, ILogger<EmailService> logger)
        {
            _settingsRepository = settingsRepository;
            _logger = logger;
        }

        private async Task<Dictionary<string, string>> GetSettingsDictionaryAsync()
        {
            var settings = await _settingsRepository.GetAllAsync();
            return settings.ToDictionary(s => s.Key.ToLowerInvariant(), s => s.Value, StringComparer.OrdinalIgnoreCase);
        }

        public async Task<bool> SendContactNotificationAsync(string senderName, string senderEmail, string subject, string message)
        {
            try
            {
                var settings = await GetSettingsDictionaryAsync();
                var provider = settings.GetValueOrDefault("email_provider", "disabled").ToLowerInvariant();

                if (provider == "disabled" || provider == "off")
                {
                    _logger.LogInformation("Email service is disabled. Skipping admin notification for contact message from {Email}.", senderEmail);
                    return false;
                }

                var notifyAdmin = settings.GetValueOrDefault("email_notify_admin", "true").ToLowerInvariant() == "true";
                if (!notifyAdmin)
                {
                    _logger.LogInformation("Admin email notification is disabled via settings.");
                    return false;
                }

                var receiverEmail = settings.GetValueOrDefault("email_receiver_email")
                    ?? settings.GetValueOrDefault("contact_email");

                if (string.IsNullOrWhiteSpace(receiverEmail))
                {
                    _logger.LogWarning("Cannot send contact notification: Receiver email is not configured in site settings.");
                    return false;
                }

                var prefix = settings.GetValueOrDefault("email_subject_prefix", "[Portfolio Contact]");
                var emailSubject = $"{prefix} New message from {senderName}: {subject}";

                var htmlBody = $@"
<div style=""font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #f8fafc; border-radius: 12px; overflow: hidden; border: 1px solid #334155;"">
  <div style=""background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 24px; text-align: center;"">
    <h1 style=""margin: 0; font-size: 20px; color: #ffffff;"">📬 New Contact Message Received</h1>
    <p style=""margin: 6px 0 0 0; font-size: 13px; color: #e0e7ff;"">Portfolio Inquiry Notification</p>
  </div>
  <div style=""padding: 24px;"">
    <table style=""width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;"">
      <tr>
        <td style=""padding: 8px 0; color: #94a3b8; width: 100px; font-weight: 600;"">From Name:</td>
        <td style=""padding: 8px 0; color: #f1f5f9; font-weight: bold;"">{WebUtility.HtmlEncode(senderName)}</td>
      </tr>
      <tr>
        <td style=""padding: 8px 0; color: #94a3b8; font-weight: 600;"">Sender Email:</td>
        <td style=""padding: 8px 0;""><a href=""mailto:{WebUtility.HtmlEncode(senderEmail)}"" style=""color: #818cf8; text-decoration: none;"">{WebUtility.HtmlEncode(senderEmail)}</a></td>
      </tr>
      <tr>
        <td style=""padding: 8px 0; color: #94a3b8; font-weight: 600;"">Subject:</td>
        <td style=""padding: 8px 0; color: #f1f5f9;"">{WebUtility.HtmlEncode(subject)}</td>
      </tr>
      <tr>
        <td style=""padding: 8px 0; color: #94a3b8; font-weight: 600;"">Date:</td>
        <td style=""padding: 8px 0; color: #94a3b8;"">{DateTime.UtcNow:yyyy-MM-dd HH:mm:ss} UTC</td>
      </tr>
    </table>
    <div style=""background: #1e293b; border-left: 4px solid #6366f1; border-radius: 6px; padding: 16px; margin-bottom: 20px;"">
      <p style=""margin: 0 0 8px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8; font-weight: 600;"">Message Content:</p>
      <div style=""white-space: pre-wrap; font-size: 14px; line-height: 1.6; color: #e2e8f0;"">{WebUtility.HtmlEncode(message)}</div>
    </div>
    <div style=""text-align: center; margin-top: 24px;"">
      <a href=""mailto:{WebUtility.HtmlEncode(senderEmail)}?subject=Re: {WebUtility.UrlEncode(subject)}"" style=""display: inline-block; background: #6366f1; color: #ffffff; text-decoration: none; padding: 10px 22px; border-radius: 8px; font-weight: 600; font-size: 14px;"">Reply to {WebUtility.HtmlEncode(senderName)}</a>
    </div>
  </div>
  <div style=""background: #0b1120; padding: 16px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #1e293b;"">
    This message was sent via your portfolio contact form. Manage your email preferences in Admin Site Settings.
  </div>
</div>";

                await SendEmailRawAsync(settings, receiverEmail, emailSubject, htmlBody, senderEmail);
                _logger.LogInformation("Contact notification email sent successfully to {Receiver}.", receiverEmail);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send contact notification email.");
                return false;
            }
        }

        public async Task<bool> SendAutoReplyAsync(string recipientEmail, string recipientName)
        {
            try
            {
                var settings = await GetSettingsDictionaryAsync();
                var provider = settings.GetValueOrDefault("email_provider", "disabled").ToLowerInvariant();

                if (provider == "disabled" || provider == "off")
                    return false;

                var autoReplyEnabled = settings.GetValueOrDefault("email_autoreply_enabled", "false").ToLowerInvariant() == "true";
                if (!autoReplyEnabled || string.IsNullOrWhiteSpace(recipientEmail))
                    return false;

                var siteName = settings.GetValueOrDefault("site_name", "Portfolio");
                var autoReplySubject = settings.GetValueOrDefault("email_autoreply_subject", $"Thank you for contacting {siteName}");
                var customMsg = settings.GetValueOrDefault("email_autoreply_message", "Thank you for reaching out! I have received your message and will get back to you as soon as possible.");

                var htmlBody = $@"
<div style=""font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #f8fafc; border-radius: 12px; overflow: hidden; border: 1px solid #334155;"">
  <div style=""background: linear-gradient(135deg, #10b981, #059669); padding: 24px; text-align: center;"">
    <h1 style=""margin: 0; font-size: 20px; color: #ffffff;"">Message Received</h1>
    <p style=""margin: 6px 0 0 0; font-size: 13px; color: #d1fae5;"">{WebUtility.HtmlEncode(siteName)}</p>
  </div>
  <div style=""padding: 24px;"">
    <p style=""font-size: 15px; color: #f1f5f9; margin-top: 0;"">Hi {WebUtility.HtmlEncode(recipientName)},</p>
    <p style=""font-size: 14px; line-height: 1.6; color: #cbd5e1;"">{WebUtility.HtmlEncode(customMsg)}</p>
    <div style=""margin-top: 24px; padding-top: 16px; border-top: 1px solid #334155; font-size: 13px; color: #94a3b8;"">
      <p style=""margin: 0;"">Best regards,</p>
      <p style=""margin: 4px 0 0 0; font-weight: 600; color: #f8fafc;"">{WebUtility.HtmlEncode(siteName)}</p>
    </div>
  </div>
</div>";

                await SendEmailRawAsync(settings, recipientEmail, autoReplySubject, htmlBody);
                _logger.LogInformation("Auto-reply sent successfully to {Recipient}.", recipientEmail);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send auto-reply email to {Recipient}.", recipientEmail);
                return false;
            }
        }

        public async Task<(bool Success, string Message)> SendTestEmailAsync(string targetEmail)
        {
            try
            {
                var settings = await GetSettingsDictionaryAsync();
                var provider = settings.GetValueOrDefault("email_provider", "disabled").ToLowerInvariant();

                if (provider == "disabled" || provider == "off")
                {
                    return (false, "Email configuration is currently set to 'Disabled'. Please select a provider (such as Gmail, Outlook, or Custom SMTP) and save your settings first.");
                }

                if (string.IsNullOrWhiteSpace(targetEmail))
                {
                    targetEmail = settings.GetValueOrDefault("email_receiver_email") 
                        ?? settings.GetValueOrDefault("contact_email") 
                        ?? string.Empty;
                }

                if (string.IsNullOrWhiteSpace(targetEmail))
                {
                    return (false, "No recipient email specified and no receiver email configured.");
                }

                var senderEmail = settings.GetValueOrDefault("email_sender_email") ?? "noreply@portfolio.com";
                var senderName = settings.GetValueOrDefault("email_sender_name") ?? "Portfolio System";
                var host = settings.GetValueOrDefault("email_smtp_host", string.Empty);
                var port = settings.GetValueOrDefault("email_smtp_port", "587");

                var htmlBody = $@"
<div style=""font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #f8fafc; border-radius: 12px; overflow: hidden; border: 1px solid #334155;"">
  <div style=""background: linear-gradient(135deg, #3b82f6, #6366f1); padding: 24px; text-align: center;"">
    <h1 style=""margin: 0; font-size: 20px; color: #ffffff;"">✅ SMTP Test Email Succeeded!</h1>
    <p style=""margin: 6px 0 0 0; font-size: 13px; color: #dbeafe;"">Portfolio Admin Email Configuration Verification</p>
  </div>
  <div style=""padding: 24px;"">
    <p style=""font-size: 14px; color: #e2e8f0; line-height: 1.6;"">
      Congratulations! Your email configuration is configured correctly and successfully connected to your SMTP host.
    </p>
    <div style=""background: #1e293b; border-radius: 8px; padding: 16px; margin: 16px 0; font-size: 13px;"">
      <div style=""margin-bottom: 6px;""><strong style=""color: #94a3b8;"">Provider:</strong> <span style=""color: #60a5fa;"">{WebUtility.HtmlEncode(provider.ToUpperInvariant())}</span></div>
      <div style=""margin-bottom: 6px;""><strong style=""color: #94a3b8;"">SMTP Server:</strong> <span style=""color: #f1f5f9;"">{WebUtility.HtmlEncode(host)}:{WebUtility.HtmlEncode(port)}</span></div>
      <div style=""margin-bottom: 6px;""><strong style=""color: #94a3b8;"">From Address:</strong> <span style=""color: #f1f5f9;"">{WebUtility.HtmlEncode(senderName)} &lt;{WebUtility.HtmlEncode(senderEmail)}&gt;</span></div>
      <div><strong style=""color: #94a3b8;"">Timestamp:</strong> <span style=""color: #94a3b8;"">{DateTime.UtcNow:yyyy-MM-dd HH:mm:ss} UTC</span></div>
    </div>
    <p style=""font-size: 13px; color: #94a3b8; margin: 0;"">
      You are all set to receive new visitor inquiries and send automated replies.
    </p>
  </div>
</div>";

                await SendEmailRawAsync(settings, targetEmail, "✅ Test Email: Portfolio SMTP Configuration", htmlBody);
                return (true, $"Test email sent successfully to {targetEmail} via {host}:{port}!");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send test email.");
                return (false, $"SMTP Error: {ex.Message}");
            }
        }

        private async Task SendEmailRawAsync(Dictionary<string, string> settings, string toEmail, string subject, string htmlBody, string? replyToEmail = null)
        {
            var host = settings.GetValueOrDefault("email_smtp_host", "smtp.gmail.com");
            var portStr = settings.GetValueOrDefault("email_smtp_port", "587");
            int.TryParse(portStr, out int port);
            if (port <= 0) port = 587;

            var username = settings.GetValueOrDefault("email_smtp_user", string.Empty);
            var password = settings.GetValueOrDefault("email_smtp_pass", string.Empty);
            
            var senderEmail = settings.GetValueOrDefault("email_sender_email");
            if (string.IsNullOrWhiteSpace(senderEmail))
            {
                senderEmail = !string.IsNullOrWhiteSpace(username) ? username : settings.GetValueOrDefault("contact_email", "noreply@portfolio.com");
            }

            var senderName = settings.GetValueOrDefault("email_sender_name");
            if (string.IsNullOrWhiteSpace(senderName))
            {
                senderName = settings.GetValueOrDefault("site_name", "Portfolio System");
            }
            var encryption = settings.GetValueOrDefault("email_smtp_encryption", "tls").ToLowerInvariant();
            var enableSsl = encryption != "none";

            using var smtpClient = new SmtpClient(host, port)
            {
                EnableSsl = enableSsl,
                DeliveryMethod = SmtpDeliveryMethod.Network,
                Timeout = 15000 // 15 seconds
            };

            if (!string.IsNullOrWhiteSpace(username))
            {
                smtpClient.UseDefaultCredentials = false;
                smtpClient.Credentials = new NetworkCredential(username, password);
            }

            using var mailMessage = new MailMessage
            {
                From = new MailAddress(senderEmail, senderName),
                Subject = subject,
                Body = htmlBody,
                IsBodyHtml = true
            };

            mailMessage.To.Add(new MailAddress(toEmail));

            if (!string.IsNullOrWhiteSpace(replyToEmail))
            {
                mailMessage.ReplyToList.Add(new MailAddress(replyToEmail));
            }

            await smtpClient.SendMailAsync(mailMessage);
        }
    }
}
