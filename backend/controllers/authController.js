// Validates input, handles login/registration logic, and returns HTTP responses

// Need the User.js schema, in order to know how to create one (Registration) and query for thier information (login)
const User = require('../mongoosemodels/User');
const validator = require('validator'); // Used to validate the REGEX format of emails
const { createToken } = require('../middleware/tokenAuth'); // Used to create and validate authenticated session tokens after successful login (Stay logged in)
const { generateToken, hashToken } = require('../utils/tokenUtils'); // Used to generate tokens and hashed tokens for general usage (Email verification/Password Resets)
const { sendEmail } = require('../config/email'); // Used to send emails to the user through the Resend Service
const { verificationEmail } = require('../utils/emailTemplates'); // Import the email template for verification email

// POST /api/auth/register
exports.register = async (req, res, next) => {
    try {
        // Get username, email, password from JSON request body, or if missing then provide an empty object fallback
        const { username, email, password } = req.body || {};

        // CHECK: Reject requests that omit a required field
        if (
            typeof username !== 'string' || // Reject empty or wrong type
            typeof email !== 'string' ||    // Reject empty or wrong type
            typeof password !== 'string' || // Reject empty or wrong type
            !username.trim() || // Reject string consisting of only spaces
            !email.trim() ||    // Reject string consisting of only spaces
            !password   // Reject an empty password (do not trim passwords!)
        ) {
        // ELSE, respond with HTTP 400 Bad Request.
            return res.status(400).json({error: 'Username, email, and password are required'}); // Bad Request
        }

        // CHECK: Username must be between 2 and 30 characters after a trim
        // API level protection, and the MongoDB User.js schema also checks this during resource creation
        if (username.trim().length < 2 || username.trim().length > 30) {
            return res.status(400).json({error: 'Username must be between 2 and 30 characters'}); // Bad Request
        }

        // CHECK: Password must be at least 8 characters, ... (can add more rules later)
        if (password.length < 8) {
            return res.status(400).json({error: 'Password must be at least 8 characters long'}); // Bad Request
        }

        // CHECK: Email must be in the format of an email address
        // This does not check whether an email address is valid/real, it only checks the format
        // ***Verification of the email happens after User creation, and blocks them from logging in until completed***
        const normalizedEmail = email.trim().toLowerCase();

        // Validate email format using the validator package and to be a maximum length of 254 characters total
        if (normalizedEmail.length > 254 || !validator.isEmail(normalizedEmail)) {
            return res.status(400).json({error: 'Please provide a valid email address'}); // Bad Request
        }

        // CHECK: Does the email already exist in the databse?
        const existingUser = await User.findOne({email: normalizedEmail}); 
        if (existingUser) {
            return res.status(409).json({error: 'An account with this email already exists'}); // Resource Conflict
        }

        // Generate a secure verification token.
        const { rawToken, hashedToken } = generateToken();

        // Set verification token expiration to 24 hours from now.
        const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

        // If the request passes all of those conditions...
        // !!! CREATE THE USER !!!
        const user = await User.create({
            // Standard User info
            username: username.trim(), 
            email: email.trim(), 
            password,

            // Email Verification Token Info
            emailVerified: false,
            emailVerificationToken: hashedToken,
            emailVerificationExpires: verificationExpires
        });

        //Send verification email using rawToken.
        // Build the verification URL.
        const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${encodeURIComponent(rawToken)}`;

        // Generate the email subject and content.
        const email = verificationEmail(verificationUrl);

        // Send the verification email.
        await sendEmail({
            to: user.email,
            subject: email.subject,
            html: email.html,
            text: email.text
        });

        
        // Return a successful creation response
        return res.status(201).json({ // Resource Created
            message: "Account registration successful!",
            user: { // Return user info (NEVER the password)
                id: user._id,
                username: user.username,
                email: user.email,
                createdAt: user.createdAt
            }
        });
    }
    catch (err){
        next(err); // Pass unexpected errors to the middleware/errorHandler
    }
};


// POST /api/auth/verify-email
// This is the endpoint that gets called when someone clicks the verification link in thier email.
exports.verifyEmail = async (req, res, next) => {
    try {
        const { token } = req.body || {};

        // Validate the token.
        if (!token || typeof token !== 'string') {
            return res.status(400).json({
                error: 'Verification token is required'
            });
        }

        // Hash the incoming token.
        const hashedToken = hashToken(token);

        // Find a user with a matching, unexpired verification token.
        const user = await User.findOne({
            emailVerificationToken: hashedToken,
            emailVerificationExpires: { $gt: new Date() }
        }).select('+emailVerificationToken +emailVerificationExpires');

        // Reject invalid or expired tokens.
        if (!user) {
            return res.status(400).json({
                error: 'Invalid or expired verification token'
            });
        }

        // Mark the account as verified ==> Allowed to Login now.
        user.emailVerified = true;

        // Remove/invalidate the token so it cannot be reused.
        user.emailVerificationToken = undefined;
        user.emailVerificationExpires = undefined;

        await user.save(); // Update the user

        return res.status(200).json({
            message: 'Email successfully verified'
        });

    } catch (err) {
        next(err);
    }
};








// POST /api/auth/login
exports.login = async (req, res, next) => {
    try {
        // Get username, email, password from JSON request body, or if missing then provide an empty object fallback
        const { email, password } = req.body || {};

        // CHECK: Reject requests that omit a required field
        if (
            typeof email !== 'string' ||    // Reject empty or wrong type
            typeof password !== 'string' || // Reject empty or wrong type
            !email.trim() ||    // Reject string consisting of only spaces
            !password           // Reject an empty password (do not trim passwords!)
        ) { // ELSE, respond with HTTP 400 Bad Request.
            return res.status(400).json({error: 'Email and password are required'}); // Bad Request
        }

        // Normalize and validate the email.
        const normalizedEmail = email.trim().toLowerCase();

        if (!validator.isEmail(normalizedEmail)) {
            return res.status(400).json({error: 'Please provide a valid email address'}); // Bad Request
        }

        //Find the user and retrieve their password hash so we can compare it to the password entered
        const user = await User.findOne({email: normalizedEmail}).select('+password'); // Retrieve 'hidden' password from DB

        // Compare entered password to stored hash
        if (!user || !(await user.checkPassword(password))) {
            return res.status(401).json({error: 'Invalid email or password'}); // Unauthorized
        }

        // Create an authenticated session token for the successfully logged in user.
        const token = createToken(user);

        // Return safe user information when successful login (everything but password)
        return res.status(200).json({ // Success
            message: 'Login successful',
            token, // Pass the authenticated session token
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                createdAt: user.createdAt
            }
        });
    }
    catch (err){
        next(err); // Pass unexpected errors to the middleware/errorHandler
    }
}