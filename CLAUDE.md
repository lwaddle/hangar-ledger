# CLAUDE.md

## Project Overview

Hangar Ledger is a private web application for tracking aircraft operation expenses, designed for small flight departments operating under Part 91. It tracks flight trips, expenses, fuel usage, and associated receipts.

## Tech Stack

- **Framework**: Next.js 16 (App Router) with React 19 and TypeScript 5
- **Database/Auth**: Supabase (PostgreSQL with Row-Level Security)
- **UI**: Tailwind CSS 4 + shadcn/ui components (Radix UI)
- **File Storage**: Cloudflare R2 for receipt images
- **Hosting**: Vercel

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/             # Authentication pages (login, register)
│   └── (dashboard)/        # Protected app pages (trips, expenses, aircraft, settings, reports)
├── components/             # React UI components
│   ├── ui/                 # shadcn/ui styled components
│   └── import/             # CSV import mappers
├── lib/                    # Utilities and server actions
│   ├── actions/            # Server actions
│   ├── supabase/           # Supabase client setup
│   └── r2/                 # Cloudflare R2 integration
└── types/                  # TypeScript type definitions
supabase/                   # Database migrations
```

## Common Commands

```bash
npm run dev       # Start development server (localhost:3000)
npm run build     # Build for production
npm run lint      # Run ESLint
```

## Key Conventions

- Commits should not include "Co-Authored-By" lines
- Uses Next.js App Router with server components by default
- Server actions in `src/lib/actions/` for database operations
- Soft deletes preferred over hard deletes for data safety
- Role-based access: Admin, Operator, Viewer (stored in auth metadata)
- Receipt images stored in Cloudflare R2 with signed URLs

## Environment Variables

Required in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`
