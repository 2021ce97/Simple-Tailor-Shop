# Simple Tailor Shop

A tailored shop-management system for orders, customer measurements, fabric and product inventory, sales history, receipts, backups, and Dari/Pashto/English use.

## Source structure

- `src/pages` — full application screens,
- `src/components` — reusable interface components
- `src/app` — top-level routing and application composition
- `src/hooks` — session, synchronization, and shared state hooks
- `src/services` — Supabase-backed shop data operations and printing
- `src/lib` — Supabase client and shared helpers
- `src/translations` — English, Dari, and Pashto copy
- `supabase/migrations` — database schema and security changes

## Local setup

1. Install Node.js 20+ and run `npm install`.
2. Run `supabase/migrations/20260922_direct_client.sql` in the Supabase SQL Editor.
3. Create the staff user in Supabase Authentication > Users.
4. Copy `.env.example` to `.env` and set the Supabase URL and publishable key. Do not commit `.env`.
5. Run `npm run dev`, then open the URL Vite displays.

The React app connects directly to Supabase. Retired application cache keys are removed from browser storage at startup; business records are loaded from Supabase.

## Production

Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in the deployment provider, then run `npm run build`.
