// Reuseable functions to generate secure SHA-256 hashed tokens for Email verification and Password resets, and ect

const crypto = require('crypto'); 

// Generates a secure random token and its SHA-256 hash.
exports.generateToken = () => {

    // Generate 32 cryptographically secure random bytes. (256 bit token)
    const rawToken = crypto.randomBytes(32).toString('hex'); // and convert it's binary to hex

    // Hash the raw token using SHA-256.
    const hashedToken = crypto
        .createHash('sha256')
        .update(rawToken)
        .digest('hex'); // Final hashedToken is stored as hexadecimal 

    // Return both versions.
    // hashedToken ==> stored in DB
    // rawToken ==> ex. use in the email verification/password reset links
    return { rawToken, hashedToken };
};


// Hashes an existing token using SHA-256.
// Used to hash the token that gets sent back to us when a User clicks on the verification link
exports.hashToken = (rawToken) => {

    return crypto
        .createHash('sha256')
        .update(rawToken)
        .digest('hex');
};


