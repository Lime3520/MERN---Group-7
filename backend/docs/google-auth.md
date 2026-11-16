# Google sign-in

Configure `GOOGLE_CLIENT_ID` in the backend environment with the OAuth client ID used by the frontend. The backend verifies the ID token signature, audience, issuer, and expiry with Google's auth library; the client ID must match the token audience.

`POST /api/auth/google` accepts the Google Identity Services `credential` field. The `idToken` field is also accepted for compatibility:

```json
{ "credential": "<Google ID token>" }
```

On success, the endpoint creates a verified account when needed and returns the same `{ message, token, user }` response shape as password login. It does not silently link a Google identity to an existing password account; an email collision returns 409. Concurrent account creation is handled by looking up the account that won the unique-index race. Invalid or unverified Google identities return 401, and a missing `GOOGLE_CLIENT_ID` returns 500.

The Google identity is stored by its stable subject ID (`googleId`). The raw Google ID token is not stored.
