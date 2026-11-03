const { Resend } = require('resend');

// Create a reusable email-sending function.
exports.sendEmail = async ({ to, subject, html, text }) => {

    // Make sure the API key exists in the secret .env file
    if (!process.env.RESEND_API_KEY) {
        throw new Error('RESEND_API_KEY is not configured');
    }

    // Initialize the Resend client.
    const resend = new Resend(process.env.RESEND_API_KEY);

    // Send the email through Resend.
    const { data, error } = await resend.emails.send({
        from: process.env.EMAIL_FROM,
        to,
        subject,
        html,
        text
    });

    // Handle errors returned by Resend.
    if (error) {
        console.error('Email delivery error:', error);
        throw new Error('Failed to send email');
    }

    // Return information about the successfully submitted email.
    return data;
};