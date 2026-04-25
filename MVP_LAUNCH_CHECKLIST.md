# Yalla MVP Launch Checklist (30 Minutes)

Target: get production live fast with minimal risk.

## 1. Preflight (5 min)

Run locally in project root:

```bash
npm run build
npx tsx scripts/check-db.ts
```

Pass criteria:
- Build succeeds with no errors.
- `check-db.ts` prints activity + menu items.

## 2. Deploy to Vercel (5 min)

```bash
npx vercel --prod
```

Keep the generated production domain for OAuth config in next step.

## 3. Set Required Env Vars (5 min)

In Vercel Project Settings -> Environment Variables, set:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_EMAIL`

Then redeploy if variables were added after first deployment.

## 4. Configure OAuth Redirects (5 min)

Add this redirect URL in Google OAuth client:

- `https://<your-domain>/auth/callback`

Add the same URL in Supabase Authentication URL Configuration:

- Site URL: `https://<your-domain>`
- Redirect URL: `https://<your-domain>/auth/callback`

## 5. Production Smoke Test (8 min)

Test with normal user:
- Open `/activity/<activity-id>` while logged out -> should redirect to `/login`.
- Google login succeeds and returns to activity page.
- Submit order + optional note successfully.

Test with admin user (`ADMIN_EMAIL`):
- Visit `/activity/<activity-id>/admin`.
- Confirm totals and per-person breakdown are visible.

## 6. Go/No-Go Gate (2 min)

Go live only if all are true:
- Login flow works from logged-out state.
- Order submission persists and reload shows same values.
- Admin page can read summaries.
- No server errors in Vercel logs.

## Fast Troubleshooting

If login fails:
- Check Google + Supabase redirect URLs exactly match production domain.

If admin page forbidden:
- Verify `ADMIN_EMAIL` in Vercel exactly equals logged-in account email.

If data not saved:
- Verify `SUPABASE_SERVICE_ROLE_KEY` and `NEXT_PUBLIC_SUPABASE_*` values are correct.
