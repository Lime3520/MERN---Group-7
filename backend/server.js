// Configures Express, connects to MongoDB, registers middleware and routes, and starts the server.


const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

// Loads the variables from our backend's .env file into process.env
require('dotenv').config(); // TO BE IMPLEMENTED

// Import the ./routes file containing the different API endpoint actions (EX: Login/Registration)
const apiRouter = require('./routes'); 

// Import...
// notFound ==> handles requests that don't match any registered route.
// errorHandler ==> handles errors passed to Express's error-handling mechanism.
const { notFound, errorHandler } = require('./middleware/errorHandler'); 

// Grab the Database URL from the .env file or default to localhost
const url = process.env.MONGODB_URI || 'mongodb://localhost:27017/REPLACEwithDBname'; // TO BE IMPLEMENTED

// ==================== Express Application ====================
const app = express();
app.use(cors()); // // Allow the React frontend, which runs at a different address, to call this API
app.use(express.json()); // JSON body accessible by req.body
app.use('/api', apiRouter); // Tells Express to pass requests beginning with /api (EX: POST /api/auth/login)

// Must come after all routes: unknown routes, then the central error handler
app.use(notFound);
app.use(errorHandler);

async function startServer() { // Starts the server, ONLY after MongoDB connects successfully
  try {
    // ====== MongoDB Connection  ======
    await mongoose.connect(url);
    console.log('MongoDB connected successfully via Mongoose');

    // Get the port from the .env file or default to port 5000
    const PORT = process.env.PORT || 5000;

    // Starts the HTTP server listening on the selected port
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) { // If DB connection failed, then exit with a error message
    console.error('Failed to start backend:', err.message);
    process.exit(1);
  }
}

// Start listening only when run directly (node server.js), not when a test.
if (require.main === module) {
  startServer(); // Call the function above.
}

// Exports the Express application so other files, including automated tests, can import it.
module.exports = app;