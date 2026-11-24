namespace Backend.Interfaces
{
    public interface IEmailService
    {
        /// <summary>
        /// Sends an email notification to the administrator when a new contact message is received.
        /// </summary>
        Task<bool> SendContactNotificationAsync(string senderName, string senderEmail, string subject, string message);

        /// <summary>
        /// Sends an auto-reply acknowledgment email to the visitor who submitted the contact form.
        /// </summary>
        Task<bool> SendAutoReplyAsync(string recipientEmail, string recipientName);

        /// <summary>
        /// Sends a test email to verify SMTP and email configuration.
        /// </summary>
        Task<(bool Success, string Message)> SendTestEmailAsync(string targetEmail);
    }
}
