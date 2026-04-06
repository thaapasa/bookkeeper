# Response Schema TODO

Tracking issue: https://github.com/thaapasa/bookkeeper/issues/88

API endpoints should specify `response:` Zod schemas in their `ValidatorSpec` for runtime
response validation. Many endpoints already have this, but the ones listed below still
don't. Each section explains what's blocking the addition.

## Handlers returning `void` (need to return ApiMessage or actual data)

These endpoints' DB/service functions return `void`. They need to be updated to return
meaningful response objects before response schemas can be added.

### GroupingApi.ts

- `POST /` — `createExpenseGrouping` returns void (should return `ExpenseGrouping`)
- `PUT /:id` — `updateExpenseGrouping` returns void (should return `ExpenseGrouping`)
- `DELETE /:id` — `deleteExpenseGrouping` returns void (should return `ApiMessage`)
- `DELETE /:id/image` — returns void

### TrackingApi.ts

- `POST /` — `createTrackingSubject` returns void
- `PUT /:id` — `updateTrackingSubject` returns void
- `DELETE /:id` — `deleteTrackingSubject` returns void
- `POST /:id/color` — `changeTrackingSubjectColor` returns void
- `DELETE /:id/image` — returns void

### ShortcutApi.ts

- `POST /` — returns void
- `PUT /:id` — returns void
- `DELETE /:id` — returns void
- `POST /:id/sort/up` — returns void
- `POST /:id/sort/down` — returns void
- `DELETE /:id/icon` — returns void

### ProfileApi.ts

- `PUT /userData` — returns void
- `PUT /password` — returns void
- `POST /image` — returns void (file upload)
- `DELETE /image` — returns void

## Types needing Zod schema conversion

These endpoints return data, but their TypeScript types are plain interfaces without
corresponding Zod schemas.

### CategoryApi.ts

- `GET /list` — returns `Category[]` (interface, no Zod schema)
- `GET /:categoryId` — returns `Category`
- `PUT /:categoryId` — returns `Category`

### SessionApi.ts

- `GET /` — returns `Session` (interface, no Zod schema)
- `DELETE /` — returns `UserIdResponse` (has Zod, but endpoint has no response spec)
- `GET /groups` — returns `Group[]` (interface, no Zod schema)

### ShortcutApi.ts

- `GET /:id` — returns `ExpenseShortcut` (interface, no Zod schema)
- `POST /:id/icon` — returns `ExpenseShortcut` (file upload + return)

### TrackingApi.ts

- `GET /list` — returns `TrackingSubjectWithData[]` (interface, no Zod schema)
- `GET /:id` — returns `TrackingSubject` (has Zod schema, can be wired up)
- `POST /:id/image` — returns `TrackingSubject` (file upload + return)

### Api.ts (main)

- `GET /user/list` — returns `User[]` (interface, no Zod schema)
- `GET /user/:id` — returns `User`
- `GET /admin/status` — returns `DbStatus`

## Out of scope

These endpoints use raw Express router patterns and are not covered by the validating
router's response validation.

- `SessionApi.ts POST /` (login) — uses `Requests.unauthorizedTxRequest()`
- `SessionApi.ts PUT /refresh` — uses `Requests.unauthorizedTxRequest()`
- `SessionApi.ts GET /bare` — uses raw `api.get()`
- File upload endpoints using `processFileUpload` without return values
