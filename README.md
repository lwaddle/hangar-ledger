# Hangar Ledger

A private web application for tracking flight department expenses, fuel usage, and trip-level costs. Designed for small flight departments operating under Part 91.

## Tech Stack

- **Framework**: Next.js (App Router)
- **Backend**: Supabase (Postgres, Auth, Storage)
- **UI**: Tailwind CSS + shadcn/ui
- **Hosting**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- [Supabase CLI](https://supabase.com/docs/guides/cli) (for local development)

### Setup

1. Clone the repository and install dependencies:

```bash
npm install
```

2. Copy the environment template and add your Supabase credentials:

```bash
cp .env.local.example .env.local
```

Get your credentials from [Supabase Dashboard](https://supabase.com/dashboard/project/_/settings/api).

3. Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

### Local Supabase (Optional)

For local development with a local Supabase instance:

```bash
npx supabase start
npm run dev
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

## Deployment

Deploy to Vercel with zero configuration:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

### Environment Variables

Set these in Vercel dashboard:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `R2_ACCOUNT_ID` - Cloudflare account ID
- `R2_ACCESS_KEY_ID` - R2 API token access key
- `R2_SECRET_ACCESS_KEY` - R2 API token secret
- `R2_BUCKET_NAME` - R2 bucket name for receipt storage

## Documentation

- [App Specification](./app-spec.md) - Requirements and features
- [Tech Stack](./docs/tech-stack.md) - Architecture decisions

## License

MIT - See [LICENSE](./LICENSE) for details.
