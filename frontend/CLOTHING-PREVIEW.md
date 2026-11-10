# Local clothing analysis preview

Open `/clothing-analysis` or use the **Analyze clothing** navigation link.
Log in using the page's login button and an existing verified account. Use the camera or upload an image, then select **Analyze clothing**. The page displays attributes and the complete JSON response, with a JSON download button. Images go to the existing authenticated clothing-analysis endpoint; this page does not save wardrobe records.

Use Node 22+ and the backend's configured `.env`. For the local setup below, ports 5001 and 5174 avoid other applications on 5000/5173.

Backend terminal:

```sh
cd backend
PORT=5001 node server.js
```

Frontend terminal:

```sh
cd frontend
VITE_API_BASE_URL=/api VITE_API_PROXY_TARGET=http://127.0.0.1:5001 npm run dev -- --host 127.0.0.1 --port 5174 --strictPort
```

Visit http://127.0.0.1:5174/clothing-analysis. These process-level settings leave the team's default proxy unchanged. Login tokens are specific to the backend that issued them; log in again if an old token is rejected.

Camera access works on localhost with browser permission. A phone accessing a computer's plain HTTP LAN address may require HTTPS for camera access; uploading a photo remains available. HEIC/HEIF previews depend on browser support; JPEG works most consistently.

New signups still depend on the team's verification-email configuration. This feature does not bypass authentication or email verification.

The separate analyzer component and its scoped CSS contain most of the change. The existing body scanner is unchanged. AuthModal accepts an optional redirect destination and still defaults to `/scanner` for existing callers.

The current repository tracks frontend/node_modules. A local dependency install can therefore show generated dependency changes in Git. Keep them out of the feature commit; dependency-tracking cleanup should be coordinated separately with the team.

Verification performed: production build, frontend HTTP response, proxied authentication health route, and rejection of an unauthenticated analysis request. Live camera capture and authenticated Gemini image analysis require manual verification.
