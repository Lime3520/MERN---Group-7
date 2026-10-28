// Validates input, handles login/registration logic, and returns HTTP responses


// Need the User.js schema, in order to know how to create one (Registration) and query for thier information (login)
const User = require('../mongoosemodels/User');

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

        // Create the user!
        const user = await User.create({username: username.trim(), email: email.trim, password});

        // Return a successful creation response (HTTP 201 Resource Created)
        return res.status(201).json({
            message: "Account registration successful!"
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