# Laureate 2K26

Graduation-day operations console for the **College of Engineering Kidangoor**.
Eight stations, one Postgres database, 2,047 graduates moving through a single
day: registration, stage flow, photo booths, lunch, certificates, plus a public
queue board and a per-graduate hub reached by scanning a QR pass.

Next.js 15 (App Router) · TypeScript · Tailwind v4 · Supabase · Framer Motion

## Running locally

```bash
npm install
cp .env.example .env.local     # fill in your Supabase URL + publishable key
npm run dev
```

## Database

Schema, RLS policies and seed data are in [`supabase/migrations/`](supabase/migrations).
See [`supabase/README.md`](supabase/README.md) for what each migration does and
the design decisions behind them.

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

## Deploying to Vercel

1. Push to GitHub and import the repo at [vercel.com/new](https://vercel.com/new).
   The framework preset is detected automatically.
2. Add both variables under **Settings → Environment Variables**, for
   Production, Preview *and* Development:

   | Name | Value |
   | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://<ref>.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | your publishable (anon) key |

3. Deploy.

Both keys are `NEXT_PUBLIC_` and therefore reach the browser — that is expected.
Row-level security is what protects the data, not key secrecy. **Never** put the
`service_role` key in this project.

### After the first deploy

Add your Vercel URL to Supabase under **Authentication → URL Configuration**:

- **Site URL** — `https://your-app.vercel.app`
- **Redirect URLs** — `https://your-app.vercel.app/**`

Without this, sign-in links resolve back to `localhost`.

### Email confirmation

Confirmation is **on** by default, so a volunteer cannot sign in until they click
a link. For a one-day event where volunteers register at the desk, turn it off:
**Authentication → Providers → Email → Confirm email**.

## Roles

The **first account to sign up becomes `admin`**. Everyone after starts as
`viewer` until an admin promotes them. Roles are enforced by row-level security
in Postgres, so a volunteer without the right role cannot write even by calling
the API directly.

| Role | Can do |
| --- | --- |
| `admin` | Everything, including settings and departments |
| `registration` | Check-in, student records |
| `stage` | Stage flow, booth queue |
| `booth` | Photo booth, queue, gallery |
| `counter` | Lunch, certificates |
| `media` | Gallery uploads |
| `viewer` | Read-only |

## Routes

**Public** — `/` landing, `/login`, `/signup`, `/display` (TV queue board),
`/hub/[token]` (graduate hub, opened by scanning their QR pass).

**Console** (sign-in required) — `/dashboard`, `/registration`, `/stage`,
`/booth`, `/queue`, `/lunch`, `/certificates`, `/gallery`, `/students`,
`/volunteers`, `/reports`, `/settings`, `/qr-cards`, `/photos`.

## Ceremony workflow

See **[WORKFLOW.md](WORKFLOW.md)** for the full day-before / day-of / after
sequence: importing students, printing QR passes, running the stations, the
live stream, and bulk photo import into Google Drive.

## Not wired up

Honest list of what is interface-only in this build:

- **Camera scanning.** The QR reader resolves register numbers against the live
  database, but does not open a camera. "Next in queue" pulls a real eligible
  graduate; manual entry accepts any register number.
- **CSV exports** on the Reports screen are labelled placeholders.
