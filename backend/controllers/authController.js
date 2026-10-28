// Validates input, handles login/registration logic, and returns HTTP responses


// Need the User.js schema, in order to know how to create one (Registration) and query for thier information (login)
const User = require('../mongoosemodels/User');
const validator = require('validator'); // Used to validate the REGEX format of emails

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
            return res.status(400).json({error: 'Username, email, and password are required'});
        }

        // CHECK: Username must be between 2 and 30 characters after a trim
        // API level protection, and the MongoDB User.js schema also checks this during resource creation
        if (username.trim().length < 2 || username.trim().length > 30) {
            return res.status(400).json({error: 'Username must be between 2 and 30 characters'});
        }

        // CHECK: Password must be at least 8 characters, ... (can add more rules later)
        if (password.length < 8) {
            return res.status(400).json({error: 'Password must be at least 8 characters long'});
        }

        // CHECK: Email must be in the format of an email address
        // This does not check whether an email address is valid/real, it only checks the format
        // ***Verification of the email happens after User creation, and blocks them from logging in until completed***
        const normalizedEmail = email.trim().toLowerCase();

        // Validate email format using the validator package and to be a maximum length of 254 characters total
        if (normalizedEmail.length > 254 || !validator.isEmail(normalizedEmail)) {
            return res.status(400).json({error: 'Please provide a valid email address'});
        }

        // CHECK: Does the email already exist in the databse?
        const existingUser = await User.findOne({email: normalizedEmail}); 
        if (existingUser) {
            return res.status(409).json({error: 'An account with this email already exists'});
        }


        // If the request passes all of those conditions...
        // !!! CREATE THE USER !!!
        const user = await User.create({username: username.trim(), email: email.trim(), password});

        // Return a successful creation response (HTTP 201 Resource Created)
        return res.status(201).json({
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