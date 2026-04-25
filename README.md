# Yalla

Yalla is a group ordering tool: participants submit their own quantities, organizer sees totals and per-person details.

## Tech Stack

- Next.js 16 (App Router) + TypeScript
- Supabase (Postgres + Google OAuth)
- Tailwind + shadcn/ui (`@base-ui/react`)

## Local Development

Install dependencies:

```bash
npm install
```

Set environment variables in `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_EMAIL`

Run dev server:

```bash
npm run dev
```

Build check:

```bash
npm run build
```

Database sanity check:

```bash
npx tsx scripts/check-db.ts
```

## Useful Scripts

- `npm run dev` - start local development
- `npm run build` - production build
- `npm run start` - run built app
- `npm run seed` - parse `menu.md` and seed activity/menu data

## Important Routes

- `/login` - Google OAuth login
- `/activity/[id]` - participant order page
- `/activity/[id]/admin` - organizer summary page (restricted by `ADMIN_EMAIL`)

## MVP Launch

Follow the fast launch runbook in [MVP_LAUNCH_CHECKLIST.md](MVP_LAUNCH_CHECKLIST.md).
