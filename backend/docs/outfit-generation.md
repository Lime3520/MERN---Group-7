# Outfit generation

`POST /api/outfits/generate` uses the existing Bearer JWT authentication.
It reads the caller's wardrobe, makes one Gemini generation request, and returns recommendations without saving anything.
No new packages or changes to authentication/clothing analysis are required.

## Database handoff

There is no clothing model in this repository yet. The only database-specific code is in `services/wardrobeService.js`.
Its temporary contract is collection **clothingitems**, with documents shaped as:

```js
{
  _id: ObjectId('...'),
  userId: ObjectId('...'), // Matches the authenticated User._id; not a string.
  analysis: { /* Full JSON from POST /api/clothing/analyze */ }
}
```

The database developer should adapt the collection name/query and map records to `{ _id, analysis }` if the final model differs. Preserve the user ownership filter. An index on `userId` is recommended when the collection is created. This endpoint does not create a model, collection, index, or seed records.

Clothing analysis alone does not save records, so analyzing an image is not enough to populate this endpoint's wardrobe. Until persistence is connected, an empty wardrobe returns 422. Items whose analysis fails the existing clothing validator are excluded. The initial limit is 200 stored items per wardrobe; larger wardrobes receive 422 rather than silently truncating. No database writes occur.

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
node --test tests/outfitGeneration.test.js
```

Tests use mocked Gemini and database access; no keys, database, or paid calls are needed. A live test requires MongoDB records matching the above contract, a verified account/login JWT, and the configured Gemini key/model. Review the live output against actual clothing before using it in a demo.
