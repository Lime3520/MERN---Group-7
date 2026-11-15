// COPY of Professor's MERN demo.
// Standardizes responses for unmatched routes and errors.


// 404 for any request that didn't match a route
exports.notFound = (req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
};

// Central error handler. Controllers call next(err) and this decides the
// status code, so error responses look the same everywhere.
// Express recognizes error handlers by their four parameters, so `next`
// must stay in the signature even though it's unused.
// eslint-disable-next-line no-unused-vars
exports.errorHandler = (err, req, res, next) => {
  // Malformed JSON body from express.json()
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Request body is not valid JSON' });
  }

  // Mongoose schema validation or type casting failures
  if (err.name === 'ValidationError' || err.name === 'CastError') {
    return res.status(400).json({ error: err.message });
  }

  // Unique index violation (e.g. two simultaneous registrations)
  if (err.code === 11000) {
    return res.status(409).json({ error: 'Resource already exists' });
  }

  // File upload errors, including the 10 MB clothing image limit
  if (err.name === 'MulterError') {
    const message = err.code === 'LIMIT_FILE_SIZE'
      ? 'Image must be 10 MB or smaller'
      : err.message;
    return res.status(400).json({ error: message });
  }

  // Errors with an intentional HTTP status (for example unsupported media)
  if (Number.isInteger(err.statusCode) && err.statusCode >= 400 && err.statusCode < 600) {
    if (err.statusCode >= 500) console.error(err);
    return res.status(err.statusCode).json({ error: err.message });
  }

  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
};
