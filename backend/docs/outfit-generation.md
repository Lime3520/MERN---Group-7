# Clothing upload and outfit generation

## Upload and persistence

`POST /api/clothing/analyze` accepts one multipart image under `image`, analyzes it with Gemini, validates the response, and saves the original image and analysis to MongoDB. It returns `201` with the analysis and the new clothing record ID. A failed analysis is not saved.

The authenticated user's records are stored in the `clothingitems` collection:

```js
{
  _id: ObjectId('...'),
  userId: ObjectId('...'), // Matches the authenticated User._id; not a string.
  image: Buffer, // Original upload; maximum size is 10 MB.
  mimeType: 'image/jpeg',
  analysis: { /* Validated JSON from Gemini */ },
  createdAt: Date
}
```

Ownership always comes from the verified JWT, not a request parameter. `GET /api/clothing` lists the authenticated user's analyses and metadata. `GET /api/clothing/:id/image` returns an image only when that record belongs to the authenticated user. `services/wardrobeService.js` reads the same collection for outfit generation. An index on `userId` is recommended for production scale.

The initial limit is 200 stored items per wardrobe; larger wardrobes receive 422 rather than silently truncating. Photos are sent to Gemini for clothing analysis; outfit generation uses saved metadata and does not send images again.

## Outfit suggestions

`POST /api/outfits/generate` uses Bearer-token authentication. It reads the caller's saved wardrobe, calls Gemini with one fallback on transient failures, and returns recommendations without saving them.

Random everyday suggestions:

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
  "style": "professional",
  "count": 3
}
```

`mode` defaults to `random`. `count` defaults to 3 and accepts integers 3–5. `prompt` is required for `specific` and is limited to 1000 characters. `occasion` and `weather` are optional strings, each limited to 200 characters. `style` is optional and must be one of `professional`, `casual`, `2000s`, `streetwear`, `formal`, `minimalist`, `vintage`, or `sporty`. Presets are validated on the server for both random and specific requests. Preferences are also honored in random mode. Weather is user-supplied; this endpoint does not fetch forecasts. Unknown fields, including `userId` or caller-provided clothing IDs, are rejected.

```sh
curl -X POST http://localhost:5000/api/outfits/generate \
  -H 'Authorization: Bearer <login-token>' \
  -H 'Content-Type: application/json' \
  -d '{"mode":"random","style":"casual","count":3}'
```

## Response and validation

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

IDs reference existing database clothing records; names/explanations are AI-generated. Clients match IDs against wardrobe data to display saved photos. The server validates structure, result count, IDs belonging to the supplied wardrobe, repeated IDs within an outfit, and duplicate outfit combinations.

Fewer than the requested number is valid when accompanied by a message. If no suitable combinations exist, `outfits: []` plus a message is a successful 200 response. Errors: 400 invalid request, 401 missing/invalid authentication, 422 empty/unusable or oversized wardrobe, 502 Gemini failure or invalid AI output, 503 both configured models temporarily unavailable.

## Validation

Run from `backend`:

```sh
node --test tests/*.test.js
```

Tests use mocked Gemini and database access; no keys, database, or paid calls are needed. A live test requires MongoDB, a verified account/login JWT, and the configured Gemini key/model.

## Compatibility after the frontend merge

The new `/camera` page saves each successfully analyzed photo automatically; `/scanner` lists the wardrobe and generates outfits. `/clothing-analysis` opens the new camera page for old bookmarks.

`POST /api/clothing` still accepts `{ analysis }` for older metadata-only clients. These existing records remain usable for outfit generation, but the UI shows “Photo unavailable” because no photo was saved. `GET /api/clothing` now uses the frontend branch's `{ items: [{ id, analysis, mimeType, createdAt }] }` format.

The model defaults remain `gemini-3.5-flash-lite` with `gemini-3.1-flash-lite` fallback. Local environment overrides still apply. Each model has a 30-second timeout. Saving is not idempotent; a retry after a lost response may create another record.
