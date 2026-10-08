# Bloom & Blossom — Flower Business Platform

A full-stack Flower Business web application built with **Next.js 16 (App Router)** and a **Supabase** backend (PostgreSQL, SSR authentication, and Row Level Security).

---

## Features

- **Next.js 16 App Router**: Server Components, streaming, and modern routing.
- **Supabase SSR**: Secure cookie-based authentication and database queries using `@supabase/ssr`.
- **Next.js 16 Proxy Convention**: Automatic session refreshing via `src/proxy.ts`.
- **Database Schema**: Pre-built SQL schema in `supabase/schema.sql` for:
  - Categories (`categories`)
  - Flower Products & Bouquets (`products`)
  - Customer Orders (`orders`)
  - Order Items (`order_items`)
  - Row Level Security (RLS) policies
- **Tailwind CSS v4 & Lucide Icons**: Modern, responsive UI with dark mode support.
- **TypeScript**: Fully typed database models (`src/types/database.types.ts`).

---

## Getting Started

### 1. Configure Supabase Credentials

1. Go to [supabase.com](https://supabase.com) and create a project (or open an existing one).
2. Go to **Project Settings > API**.
3. Open `.env.local` in this project and fill in your keys:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 2. Set Up the Database

1. In your Supabase project dashboard, navigate to the **SQL Editor**.
2. Open the file `supabase/schema.sql` in this repo, copy its contents, paste it into the Supabase SQL Editor, and click **Run**.
3. This creates the tables, enables Row Level Security policies, and inserts starter bouquet data.

### 3. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Project Structure

```
├── src/
│   ├── app/
│   │   ├── layout.tsx         # Root layout with styling & fonts
│   │   ├── page.tsx           # Home page with Supabase connection detector
│   │   └── globals.css        # Tailwind CSS styles
│   ├── lib/
│   │   └── supabase/
│   │       ├── client.ts      # Browser Supabase client (Client Components)
│   │       ├── server.ts      # Server Supabase client (Server Components & Actions)
│   │       └── middleware.ts  # Token refresh handler
│   ├── types/
│   │   └── database.types.ts  # TypeScript types for Supabase schema
│   └── proxy.ts               # Next.js 16 Proxy (replaces middleware.ts)
├── supabase/
│   └── schema.sql             # SQL table definitions, RLS, and seed data
├── .env.local                 # Local environment variables
└── package.json
```

---

## Useful Commands

- `npm run dev`: Start local development server
- `npm run build`: Build production bundle
- `npm run lint`: Run ESLint checks
