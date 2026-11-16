# Outfit generation

`POST /api/outfits/generate` uses the existing Bearer JWT authentication.
It reads the caller's wardrobe, makes one Gemini generation request, and returns recommendations without saving anything.
No new packages or changes to authentication/clothing analysis are required.

## Database handoff

`POST /api/clothing` saves an analyzed item; `GET /api/clothing` lists the authenticated user's items. Both require a Bearer JWT. Send `{ "analysis": ... }` using the full `analysis` object returned by `POST /api/clothing/analyze`. The save endpoint validates the analysis, rejects unknown fields and client-supplied ownership, and limits analysis data to 16 KB. It returns HTTP 201 with `{ item: { _id, analysis, createdAt } }`. Listing returns `{ items: [{ _id, analysis }] }`.

`services/wardrobeService.js` reads and writes collection **clothingitems** directly:

```js
{
  _id: ObjectId('...'),
  userId: ObjectId('...'), // From the verified JWT; never the request body.
  analysis: { /* Full validated clothing attributes */ },
  createdAt: Date
}
```

Analysis remains a preview until the user selects **Save to wardrobe** on `/clothing-analysis`. Photos are not persisted. Each successful POST creates a new item; retries are not idempotent. The UI disables repeat saves after confirmation. If a response is lost, check `GET /api/clothing` before retrying.

Outfit generation automatically reads these saved records. An empty wardrobe returns 422. Items whose analysis fails validation are excluded. The existing generation/list limit is 200 stored items; larger wardrobes return 422 rather than silently truncating. Saving does not impose this limit. An index on `userId` is recommended for larger deployments. No migration or index creation is performed by this change.

## Requests

Random everyday suggestions (an empty JSON object also uses these defaults):

```json
{ "mode": "random", "count": 3 }
```

Specific suggestions:

```json
{
  "mode": "specific",
  "prompt": "Outfits for an outdoor dinner date; avoid graphic shirts",
  "occasion": "date",
  "weather": "About 65 F and breezy",
  "style": "smart casual",
  "count": 3
}
```

`mode` defaults to `random`. `count` defaults to 3 and accepts integers 3–5.
`prompt` is required for `specific` and is limited to 1000 characters.
`occasion`, `weather`, and `style` are optional strings, each limited to 200 characters.
Preferences are also honored in random mode. Weather is user-supplied; this endpoint does not fetch forecasts.
Unknown fields, including `userId` or caller-provided clothing IDs, are rejected.

```sh
curl -X POST http://localhost:5000/api/outfits/generate \
  -H 'Authorization: Bearer YOUR_LOGIN_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{"mode":"random","count":3}'
```

## Response

Illustrative response when only one suitable combination exists:

```json
{
  "outfits": [
    {
      "name": "Relaxed evening",
      "clothingIds": ["000000000000000000000001", "000000000000000000000002"],
      "explanation": "A simple shirt and jeans combination for a casual evening."
    }
  ],
  "message": "Only one distinct suitable combination is available."
}
```

IDs reference existing database clothing records; names/explanations are AI-generated. Clients can match IDs against their wardrobe data. Images are not sent to Gemini again. Compact metadata is used for styling and weather matching; the initial implementation lets Gemini evaluate those preferences rather than applying brittle hard filters.

The server validates structure, result count, IDs belonging to the supplied wardrobe, repeated IDs within an outfit, and duplicate outfit combinations. Items may appear in different outfits. Styling quality and fulfillment of natural-language preferences are AI judgments, not mechanically guaranteed.

Fewer than the requested number is valid when accompanied by a message. If no suitable combinations exist, `outfits: []` plus a message is a successful 200 response. This avoids inventing clothing to fill the requested count. Random mode requests variety but does not guarantee different results on every call.

Errors: 400 invalid request, 401 missing/invalid authentication, 422 empty/unusable or oversized wardrobe, 502 Gemini failure or invalid AI output. Existing server/database configuration errors retain the normal error-handler behavior.

## Validation

Run from `backend`:

```sh
node --test tests/*.test.js
```

Tests use mocked Gemini and database access; no keys, database, or paid calls are needed. A live test requires MongoDB records matching the above contract, a verified account/login JWT, and the configured Gemini key/model. Review the live output against actual clothing before using it in a demo.
