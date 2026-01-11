# Hangar Ledger - Tech Stack

## Overview

This document captures the technology decisions for Hangar Ledger, a private web app for tracking flight department expenses, fuel usage, and trip costs.

**Key constraints:**
- 1-5 trusted users
- Desktop-first, mobile-friendly
- Speed to launch prioritized
- Low operational overhead
- $0/month target (free tiers)

---

## Stack Summary

| Layer | Technology |
|-------|------------|
| **Framework** | Next.js 15 (App Router) |
| **Backend** | Supabase (Postgres + Auth + Storage) |
| **Database** | Supabase Postgres |
| **Auth** | Supabase Auth |
| **File Storage** | Supabase Storage |
| **UI** | Tailwind CSS + shadcn/ui |
| **Hosting** | Cloudflare Pages |

---

## Why These Choices

| Technology | Rationale |
|------------|-----------|
| **Supabase** | All-in-one backend (database, auth, storage) with generous free tier. Already familiar with it. |
| **Next.js 15** | Full-stack TypeScript, App Router, excellent developer experience. |
| **Cloudflare Pages** | Already in use for other projects, generous free tier, fast edge deployment. |
| **shadcn/ui** | Pre-built accessible components, matches "clean, low-friction UI" goal. |
| **Tailwind CSS** | Rapid UI development, consistent styling. |

---

## Free Tier Limits

### Supabase

| Resource | Limit | Notes |
|----------|-------|-------|
| Database | 500MB | Plenty for expense records |
| Storage | 1GB | ~100-200 receipt images |
| Auth | 50K MAUs | Far exceeds 1-5 users |
| Inactivity pause | 1 week | Acceptable for internal tool |

Upgrade path: Pro plan ($25/mo) for 100GB storage if needed.

### Cloudflare Pages

| Resource | Limit |
|----------|-------|
| Builds | 500/month |
| Bandwidth | Unlimited |
| Sites | Unlimited |

---

## User Roles

Simple role model via Supabase Auth metadata:

| Role | Permissions |
|------|-------------|
| `admin` | Full access (create/edit/delete everything) |
| `operator` | Create/edit expenses and trips |
| `viewer` | Read-only access |

Implementation: Store role in user metadata, enforce via Next.js middleware and Supabase RLS policies.

---

## Architecture Decisions

### Database Access
- Supabase client library (`@supabase/supabase-js`)
- Row-Level Security (RLS) for access control
- Server-side data fetching in Next.js Server Components

### File Uploads (Receipts)
- Private Supabase Storage bucket
- Signed URLs for secure viewing
- Client-side and policy-based file size limits

### Soft Deletes
- `deleted_at` timestamp column on trips and expenses
- RLS policies filter deleted records by default
- Admins can view/restore deleted items

---

## Project Structure

```
hangar-ledger/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth pages (login, etc.)
│   ├── (dashboard)/       # Protected app pages
│   │   ├── trips/
│   │   ├── expenses/
│   │   ├── fuel/
│   │   └── reports/
│   ├── api/               # API routes if needed
│   └── layout.tsx
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   └── ...
├── lib/
│   ├── supabase/         # Supabase client setup
│   └── utils.ts
├── types/                 # TypeScript types
├── docs/                  # Documentation
│   └── tech-stack.md     # This file
└── supabase/
    ├── migrations/       # Database migrations
    └── seed.sql          # Optional seed data
```

---

## Database Schema

### trips
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| name | text | Required |
| start_date | date | Required |
| end_date | date | Optional |
| notes | text | Optional |
| created_at | timestamptz | Auto |
| updated_at | timestamptz | Auto |
| deleted_at | timestamptz | Soft delete |

### expenses
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| trip_id | uuid | FK to trips (optional) |
| date | date | Required |
| vendor | text | Required |
| amount | decimal(10,2) | Required |
| category | text | Required |
| payment_method | text | Optional |
| notes | text | Optional |
| created_at | timestamptz | Auto |
| updated_at | timestamptz | Auto |
| deleted_at | timestamptz | Soft delete |

### fuel_entries
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| expense_id | uuid | FK to expenses |
| gallons | decimal(10,2) | Required |
| cost_per_gallon | decimal(10,4) | Generated (amount/gallons) |
| location | text | Optional |
| created_at | timestamptz | Auto |

### receipts
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| expense_id | uuid | FK to expenses |
| storage_path | text | Supabase Storage path |
| original_filename | text | For display |
| uploaded_by | uuid | FK to auth.users |
| uploaded_at | timestamptz | Auto |

---

## Development Workflow

1. **Local development**: `npx supabase start` + `npm run dev`
2. **Database changes**: Supabase CLI migrations
3. **Deployment**: Push to main → Cloudflare Pages auto-deploys
4. **Environment variables**: Supabase keys in Cloudflare Pages settings

### Cloudflare Pages Setup
- Use `@cloudflare/next-on-pages` adapter
- Build command: `npx @cloudflare/next-on-pages`
- Output directory: `.vercel/output/static`

---

## Implementation Phases

1. Initialize Next.js project with TypeScript + Tailwind
2. Set up Supabase project and link locally
3. Create database schema with migrations
4. Configure Supabase Auth
5. Build core CRUD for trips and expenses
6. Add file upload for receipts
7. Implement basic reports
8. Deploy to Cloudflare Pages

---

## Verification Checklist

- [ ] Create a trip, add expenses (including fuel), upload receipts
- [ ] View trip total cost and fuel summary reports
- [ ] Export a report as CSV
- [ ] Test role-based access (viewer can't edit)
- [ ] Confirm receipts are not publicly accessible
