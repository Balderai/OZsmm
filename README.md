# Mukellef Portal

Mobile-first PWA client portal for an accounting firm.

The first build runs in local mock mode without Supabase credentials. Supabase Auth, Postgres, Storage, RLS, Web Push, and Vercel integration points are prepared for the real deployment pass.

## Local Mock Mode

1. Copy `.env.example` to `.env.local`
2. Set `MOCK_MODE=true`
3. Run `npm install`
4. Run `npm run dev`
5. Open `http://localhost:3000/client` or `http://localhost:3000/accountant`

Mock mode includes:

- one firm
- one accountant profile
- two client companies
- exactly three client folders
- declaration and accrual document rows
- client-uploaded photo/document rows
- open document requests
- in-app notifications

## Supabase Mode

1. Create a Supabase project
2. Run SQL migrations in `supabase/migrations` in order:
   - `0001_core_schema.sql`
   - `0002_rls_policies.sql`
   - `0003_storage_policies.sql`
   - `0004_seed_demo.sql`
3. Confirm the private Storage bucket `client-documents` exists
4. Create Supabase Auth users
5. Insert matching `profiles` and `client_memberships` rows using the Auth user ids
6. Set env vars in `.env.local`
7. Set `MOCK_MODE=false`

## Appwrite Mode

Appwrite can be used as an alternative backend integration point.

1. Create an Appwrite Cloud project
2. Add a Web platform for `localhost`
3. Create a server API key with database, table, row, bucket, file, user, and session scopes
4. Copy `.env.example` to `.env.local`
5. Set:

```env
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://fra.cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=<project_id>
APPWRITE_API_KEY=<server_api_key>
APPWRITE_DATABASE_ID=ozsmm
APPWRITE_BUCKET_ID=client-documents
APPWRITE_CLIENT_MEMBERSHIPS_TABLE_ID=client_memberships
APPWRITE_BOOTSTRAP_ACCOUNTANT_EMAIL=<accountant_email>
APPWRITE_BOOTSTRAP_ACCOUNTANT_PASSWORD=<temporary_password>
APPWRITE_BOOTSTRAP_ACCOUNTANT_NAME=<accountant_name>
```

6. Run:

```powershell
npm run appwrite:setup
```

The setup script creates the `ozsmm` database, core tables, indexes, the firm row, the bootstrap accountant user/profile, and the private `client-documents` bucket. It also removes old Smoke, Live Smoke, and Appwrite Canli demo rows. The API key and bootstrap password must stay server-side and must not be committed.

To clean demo rows again without recreating tables:

```powershell
npm run appwrite:cleanup-demo
```

Required local env:

```env
NEXT_PUBLIC_APP_NAME=Mukellef Portal
NEXT_PUBLIC_FIRM_NAME=Oz SMMM
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:admin@example.com
MOCK_MODE=true
```

`SUPABASE_SERVICE_ROLE_KEY` and `VAPID_PRIVATE_KEY` are server-only. Do not expose them through `NEXT_PUBLIC_*`.

## Vercel

Set all env vars in Vercel Project Settings:

```env
NEXT_PUBLIC_APP_NAME=Mukellef Portal
NEXT_PUBLIC_FIRM_NAME=<real firm name>
NEXT_PUBLIC_SUPABASE_URL=<supabase url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<publishable anon key>
SUPABASE_SERVICE_ROLE_KEY=<service role key>
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<public vapid key>
VAPID_PRIVATE_KEY=<private vapid key>
VAPID_SUBJECT=mailto:<firm email>
MOCK_MODE=false
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://fra.cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=<appwrite_project_id>
APPWRITE_API_KEY=<server_api_key>
APPWRITE_DATABASE_ID=ozsmm
APPWRITE_BUCKET_ID=client-documents
APPWRITE_CLIENT_MEMBERSHIPS_TABLE_ID=client_memberships
APPWRITE_BOOTSTRAP_ACCOUNTANT_EMAIL=<accountant_email>
APPWRITE_BOOTSTRAP_ACCOUNTANT_PASSWORD=<temporary_password>
APPWRITE_BOOTSTRAP_ACCOUNTANT_NAME=<accountant_name>
```

## PWA Push Notes

Push notifications require browser support and user permission. iOS requires the PWA to be added to the home screen. In-app notifications remain the reliable fallback.

The service worker is `public/sw.js`. Push send logic runs server-side through `POST /api/notifications/send` and uses `web-push`.

## Routes

- `/client` - client portal home
- `/client/folders/[folderType]` - one of `declarations`, `accruals`, `documents_photos`
- `/accountant` - accountant dashboard
- `/login` - Appwrite email/password login

## API Contracts

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `POST /api/clients`
- `POST /api/requests`
- `POST /api/documents/upload`
- `POST /api/documents/signed-url`
- `POST /api/notifications/subscribe`
- `POST /api/notifications/unsubscribe`
- `POST /api/notifications/send`

## Backend Notes

- Supabase migrations are kept under `supabase/migrations`.
- Appwrite setup is kept in `scripts/setup-appwrite.mjs`.
- Local demo UI still defaults to `MOCK_MODE=true`; real Appwrite auth is active with `MOCK_MODE=false`.

## Verification

```powershell
npm run lint
npm run build
npm test
```

Browser QA viewports:

- desktop `1440x900`
- mobile `390x844`
- mobile `430x932`

Check that the client sees exactly three folders:

- Beyannameler
- Tahakkuklar
- Evrak ve Fotograflar

## Known Limits In V1

- Real Supabase credentials are not included.
- Appwrite email/password auth is wired for server-rendered portal routes and mutation APIs.
- Push can be fully verified only after VAPID keys and HTTPS/local install context are available.
- No GIB, e-signature, payment, WhatsApp, OCR, native app, or accounting package integration is included.
