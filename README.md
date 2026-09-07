# Simple Tailor Shop

A tailored shop-management system for orders, customer measurements, fabric and product inventory, sales history, receipts, backups, and Dari/Pashto/English use.

## Local setup

1. Install Node.js 20+ and run `npm install`.
2. Copy `.env.example` to `.env` and set `DATABASE_URL` to the complete server-side PostgreSQL URI from your Supabase dashboard. Do not commit `.env`.
3. Run `npm run dev`, then open `http://localhost:3000`.

The server creates the required tables automatically when the database connection succeeds. Without `DATABASE_URL`, the app remains available in local browser-storage mode.

## Production

Set `DATABASE_URL` in your deployment provider's server environment variables, then run `npm run build` and `npm start`.
