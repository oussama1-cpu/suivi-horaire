<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Project notes

## Verification
- Typecheck: `npx tsc --noEmit`
- Lint: `npx eslint src`
- Build: `npm run build`

## Environment variables
- Postgres (Neon), see `src/lib/pg.ts` and `src/lib/queries.ts`:
  - `DATABASE_URL` or `POSTGRES_URL` (pooled connection string, e.g. `postgresql://…@…-pooler.…neon.tech/…`).
  - File contents (documents, meeting attachments) are stored in the DB itself (`bytea` columns).
  - `SEED_DEMO=true` to force-seed demo accounts (admin@demo.com / employe@demo.com) outside development.
- Legacy: `src/lib/firebase.ts` keeps the old Firestore/Storage init (not used by the app anymore; only useful for one-off data syncs).
- Email notifications (`src/lib/mail.ts`, nodemailer over SMTP). If `SMTP_HOST` is missing, emails are only logged to the console:
  - `SMTP_HOST`, `SMTP_PORT` (default 587, 465 = TLS implicit), `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` (e.g. `"Suivi Horaire <no-reply@example.com>"`).

## Business rules
- `computeDayHours` (`src/lib/hours.ts`): congé/maladie = standard weekday hours; férié payé = standard hours unless the employee punched in/out, then worked hours; férié non payé/repos = 0 unless punched, then worked hours.
- Punching on a férié/repos day keeps the day type (`punchIn` in `src/lib/queries.ts`); marking a day as férié/repos keeps existing punch times (`bulkSetDayType`).
- Emails are sent with `after()` from server actions: new non-working day (to all employees), leave request decision (to the employee), new leave request (to admins).
