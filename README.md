# Mukellef Portal

Mobile-first PWA client portal for an accounting firm.

The production backend is Supabase Auth, Postgres, Storage, RLS, and Web Push. Local mock mode is still available for UI work without credentials.

## Local Mock Mode

1. Copy `.env.example` to `.env.local`
2. Set `MOCK_MODE=true`
3. Run `npm install`
4. Run `npm run dev`
5. Open `http://localhost:3000/client` or `http://localhost:3000/accountant`

## Supabase Setup

1. Create or select a Supabase project.
2. Run SQL migrations in `supabase/migrations` in order.
3. Confirm the private Storage bucket `client-documents` exists.
4. Create Supabase Auth users.
5. Insert matching `profiles` and `client_memberships` rows using the Supabase Auth user ids.
6. Set env vars locally and in Vercel.
7. Set `MOCK_MODE=false`.

Required env:

```env
NEXT_PUBLIC_APP_NAME=Mukellef Portal
NEXT_PUBLIC_FIRM_NAME=SMMM Ali OZ
NEXT_PUBLIC_SUPABASE_URL=<supabase url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<publishable key>
SUPABASE_SERVICE_ROLE_KEY=<service role key>
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<public vapid key>
VAPID_PRIVATE_KEY=<private vapid key>
VAPID_SUBJECT=mailto:<firm email>
MOCK_MODE=false
```

`SUPABASE_SERVICE_ROLE_KEY` and `VAPID_PRIVATE_KEY` are server-only. Do not expose them through `NEXT_PUBLIC_*`.

## Legacy Appwrite Fallback

The old Appwrite integration remains only as a fallback. It is disabled unless `APP_BACKEND_PROVIDER=appwrite` is set.

## Routes

- `/client` - client portal home
- `/client/folders/[folderType]` - one of `declarations`, `accruals`, `documents_photos`
- `/accountant` - accountant dashboard
- `/login` - Supabase email/password login

## API Contracts

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `POST /api/clients`
- `POST /api/requests`
- `POST /api/documents/upload`
- `POST /api/documents/signed-url`
- `GET /api/documents/download`
- `POST /api/notifications/subscribe`
- `POST /api/notifications/unsubscribe`
- `POST /api/notifications/send`

## Verification

```powershell
npm run lint
npm run build
npm test
```
