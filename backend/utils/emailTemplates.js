// These are temporary and can be altered by the Frontend team if necessary to conform to their stylistic choices

exports.verificationEmail = (verificationUrl) => {
    return {
        subject: 'Verify your email address',

        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
                <h2>Welcome to MERN Group 7!</h2>

                <p>Thank you for creating an account.</p>

                <p>Please verify your email address by clicking the button below:</p>

                <a
                    href="${verificationUrl}"
                    style="
                        display: inline-block;
                        padding: 12px 20px;
                        background-color: #2563eb;
                        color: white;
                        text-decoration: none;
                        border-radius: 6px;
                    "
                >
                    Verify Email
                </a>

                <p>This link expires in 24 hours.</p>

                <p>If you did not create this account, you can ignore this email.</p>
            </div>
        `,

        text: `
            Welcome to MERN Group 7!

            Thank you for creating an account.

            Verify your email address using this link:
            ${verificationUrl}

            This link expires in 24 hours.

            If you did not create this account, you can ignore this email.
        `
    };
};