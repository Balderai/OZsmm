## What I built
- Mobile-first Next.js PWA scaffold for Mukellef Portal.
- Local mock mode for client and accountant routes.
- PWA manifest, service worker, and generated app icons.
- Supabase client setup, server/admin clients, route contracts, schema/RLS/storage/seed migrations.
- Focused tests for storage paths, folder labels, role redirects, and notification validation.

## Files changed
- `src/app`
- `src/components`
- `src/lib`
- `src/types`
- `public/sw.js`
- `public/icon-192.png`
- `public/icon-512.png`
- `supabase/migrations`
- `.env.example`
- `README.md`

## Verification results
- [x] npm run lint
- [x] npm run build
- [x] npm test
- [x] desktop browser QA at 1440x900
- [x] mobile browser QA at 390x844 and 430x932

Screenshots:
- `.codex-qa/client-390x844.png`
- `.codex-qa/folder-430x932.png`
- `.codex-qa/accountant-1440x900.png`

Browser QA notes:
- Client home shows the firm name in the first viewport.
- Client home shows exactly three folder links.
- Upload actions show `Fotograf Cek` and `Dosya Yukle`.
- Accountant dashboard shows client selection, KPI row, share/request/reminder forms, and folder buttons.
- DOM overflow check reported no horizontal overflow on tested viewports.
- Browser console error check returned no errors.
- Manifest served at `/manifest.webmanifest` with standalone display and two PNG icons.

## Supabase/Vercel notes
- Real credentials are still required.
- Storage bucket is private and created by `0003_storage_policies.sql`.
- Helper RLS functions live in `app_private` rather than public schema.

## What did not work
- Real Supabase credentials are not present, so RLS/storage/security QA against real users is not yet run.
- Full Web Push delivery is not verified because VAPID keys and HTTPS/install context are still required.

## Follow-up recommendations
- Add real Supabase Auth screens after project credentials are available.
- Run security QA against two real client users before production launch.
