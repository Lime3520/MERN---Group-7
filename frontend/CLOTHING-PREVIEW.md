# Local wardrobe and outfit UI

The frontend branch's automatic-save camera flow replaces the old analysis preview.
Log in, open `/camera`, and take a photo. A successful analysis saves the photo and
its attributes. Return to `/scanner` (My Closet), choose a style, and generate outfits.
Old `/clothing-analysis` bookmarks open the camera page. Metadata-only records saved
before this merge still work for outfits but have no photo thumbnail.

Use Node 22+. From `backend`, run:

```sh
PORT=5001 npm start
```

From `frontend`, run:

```sh
VITE_API_BASE_URL=/api VITE_API_PROXY_TARGET=http://127.0.0.1:5001 npm run dev -- --host 127.0.0.1 --port 5174 --strictPort
```

Open http://127.0.0.1:5174. The explicit proxy target uses your local backend.
Camera access requires localhost or HTTPS and browser permission. Signups depend on
the backend's email configuration; an existing verified account can log in directly.
Restart the backend after changing its private `.env` configuration.

Environment copies, node_modules, and dist are ignored. Never commit real credentials.
Automated backend tests use mocked database/Gemini responses; a live camera, database,
and AI round trip still requires manual validation.
