# YAAS Sparks — Product Requirements Document

## Overview
YAAS Sparks is an internal employee recognition platform for YAAS (300+ people). It turns peer appreciation into structured, trackable, behavior-reinforcing culture. Employees give each other "Sparks" tied to specific company behaviors, which accumulate on leaderboards and unlock milestone rewards.

**Core philosophy:** Recognition should be intentional, not unlimited. Structured appreciation is culture.

---

## Tech Stack
- **Framework:** Next.js 16 (App Router) — already scaffolded with `pnpm create next-app@latest`
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4 + shadcn/ui
- **Database + Auth:** Supabase (PostgreSQL + Row Level Security + Google OAuth)
- **Real-time:** Supabase Realtime (leaderboard live updates)
- **Notifications:** Slack Webhooks (fire on every Spark given)
- **Package manager:** pnpm
- **Deployment:** Vercel-ready

### Setup steps (in order):
1. Install shadcn/ui: `pnpm dlx shadcn@latest init`
2. Install Supabase client: `pnpm add @supabase/supabase-js @supabase/ssr`
3. Install additional deps: `pnpm add lucide-react clsx tailwind-merge date-fns`

---

## SPARK Categories
Each Spark must be tagged with one category:

| Code | Behavior | Description | Emoji |
|------|----------|-------------|-------|
| S | Support | Helped someone through a challenge | 🤝 |
| P | Proactivity | Acted without being asked | ⚡ |
| A | Artistry | Delivered high-quality creative work | 🎨 |
| R | Reliability | Consistently delivers, never drops the ball | 🎯 |
| K | Knowledge Sharing | Taught, documented, or upskilled others | 📚 |
| S2 | Spirit | Brought energy, positivity, or morale | 🔥 |

---

## Database Schema (Supabase PostgreSQL)

Create a file `supabase/schema.sql` with:

```sql
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Employees table (auto-populated on first login)
create table if not exists public.employees (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null unique,
  team text default 'General',
  avatar_url text,
  role text not null default 'employee' check (role in ('employee', 'admin')),
  sparks_earned_total integer not null default 0,
  sparks_given_this_month integer not null default 0,
  current_cycle_sparks integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Sparks table
create table if not exists public.sparks (
  id uuid primary key default gen_random_uuid(),
  giver_id uuid not null references public.employees(id) on delete cascade,
  receiver_id uuid not null references public.employees(id) on delete cascade,
  category text not null check (category in ('Support','Proactivity','Artistry','Reliability','Knowledge Sharing','Spirit')),
  reason text not null check (char_length(reason) >= 10 and char_length(reason) <= 280),
  month_key text not null, -- format: '2026-03'
  created_at timestamptz not null default now(),
  constraint no_self_award check (giver_id != receiver_id),
  constraint unique_giver_receiver_month unique (giver_id, receiver_id, month_key)
);

-- Milestone claims
create table if not exists public.milestone_claims (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  milestone integer not null check (milestone in (25, 50, 100)),
  claimed_at timestamptz not null default now()
);

-- RLS Policies
alter table public.employees enable row level security;
alter table public.sparks enable row level security;
alter table public.milestone_claims enable row level security;

-- Employees: everyone can read, users can update their own
create policy "Employees are viewable by authenticated users" on public.employees
  for select using (auth.role() = 'authenticated');
create policy "Users can update own profile" on public.employees
  for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.employees
  for insert with check (auth.uid() = id);

-- Sparks: everyone can read, authenticated can insert
create policy "Sparks are viewable by authenticated users" on public.sparks
  for select using (auth.role() = 'authenticated');
create policy "Authenticated users can give sparks" on public.sparks
  for insert with check (auth.uid() = giver_id);

-- Milestone claims: users can read own, insert own
create policy "Users can view own milestones" on public.milestone_claims
  for select using (auth.uid() = employee_id);
create policy "Users can claim own milestones" on public.milestone_claims
  for insert with check (auth.uid() = employee_id);

-- Function to auto-create employee profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.employees (id, name, email, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

---

## Environment Variables

Create `.env.local` (and `.env.example` without values):
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SLACK_WEBHOOK_URL=your_slack_incoming_webhook_url
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Pages & Routes

```
/                    → Redirect to /dashboard if authed, else /login
/login               → Google OAuth sign-in (clean centered card)
/dashboard           → Main home after login
/give                → Give a Spark (modal or full page)
/leaderboard         → Full leaderboard
/feed                → Activity feed
/profile             → Own profile
/profile/[id]        → Other employee profile
/milestones          → Milestone progress + claim
/admin               → Admin panel (role = 'admin' only)
```

---

## Feature Specs

### Login Page (`/login`)
- Clean centered card with YAAS Sparks logo/wordmark
- "Sign in with Google" button (Supabase OAuth)
- Tagline: "Appreciation is good. Structured appreciation is culture."
- After auth, redirect to /dashboard

### Dashboard (`/dashboard`)
4 stat cards at top:
- **Sparks to Give:** `5 - sparks_given_this_month` remaining (with progress bar)
- **Sparks Earned:** `sparks_earned_total` all-time
- **This Month:** sparks earned in current month_key
- **Milestone:** current_cycle_sparks / next milestone (25, 50, or 100)

Below stats:
- **"Give a Spark" button** — large, primary orange `#E05C33`, opens give flow
- **Mini leaderboard** — top 5 this month
- **Recent activity** — last 5 sparks in company

### Give a Spark (`/give`)
3-step flow (can be a single page with step indicators):

**Step 1 — Who:**
- Search input with autocomplete (search employees by name)
- Exclude self from results
- Show avatar + name + team

**Step 2 — Category:**
- 6 large clickable cards, one per SPARK category
- Each shows: emoji, letter, behavior name, description
- Selected state: orange border + filled background

**Step 3 — Why:**
- Textarea for reason (10-280 chars)
- Live character counter
- Preview card showing the full spark before submitting
- Submit button

On submit:
- POST to `/api/sparks` (server action or API route)
- Server validates: not self, not duplicate this month, has sparks remaining
- Insert to DB, update giver's `sparks_given_this_month`, increment receiver's counts
- Fire Slack webhook
- Show success animation (confetti or spark effect)
- Redirect to /dashboard

### Leaderboard (`/leaderboard`)
- Toggle: "All Time" / "This Month"
- List of employees ranked by sparks earned
- Top 3: gold 🥇 silver 🥈 bronze 🥉 medal icons
- Each row: rank, avatar (initials if no photo), name, team, spark count, category breakdown (small colored dots)
- Real-time updates via Supabase Realtime

### Feed (`/feed`)
- Reverse-chronological list of all sparks
- Each card:
  - "[Giver] gave a Spark to [Receiver]"
  - Category badge (colored pill)
  - Reason text
  - Time ago (e.g. "2 hours ago")
- Filter buttons by category (top)

### Profile (`/profile` and `/profile/[id]`)
- Avatar, name, team, join date
- Stats: total earned, given, milestones hit
- Tabs: "Received" / "Given"
- Each spark shown as a card with category + reason

### Milestones (`/milestones`)
- Large progress bar: 0 → 100 sparks in current cycle
- Milestone markers at 25, 50, 100
- Cards for each milestone:
  - 🎁 25 Sparks → Gift Card
  - ⭐ 50 Sparks → [TBD Reward]
  - 🏆 100 Sparks → [TBD Reward] — mandatory claim, resets cycle
- "Claim Reward" button appears when milestone reached (not yet claimed)
- History of past claims

### Admin Panel (`/admin`)
- Protected: redirect if role != 'admin'
- Employee list table (name, email, team, earned, given this month)
- "Reset Monthly Counts" button → sets all `sparks_given_this_month` = 0
- Milestone rewards config (edit reward descriptions)
- Spark management: view all sparks, ability to delete inappropriate ones
- Simple CSV export of sparks data

---

## API Routes

### `POST /api/sparks`
Body: `{ receiver_id, category, reason }`
- Auth check (must be logged in)
- Validate all rules server-side
- Insert spark
- Update employee counts
- Fire Slack webhook
- Return success or error with message

### `POST /api/milestones/claim`
Body: `{ milestone: 25 | 50 | 100 }`
- Verify employee has reached that milestone
- Insert milestone_claim
- If milestone === 100: reset current_cycle_sparks to 0
- Return success

### `POST /api/admin/reset-monthly`
- Admin only (check role)
- Update all employees: `sparks_given_this_month = 0`

---

## Slack Webhook Message Format

```javascript
// On spark given
{
  blocks: [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `🌟 *${giverName}* just sparked *${receiverName}*!`
      }
    },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*Category:*\n${emoji} ${category}` },
        { type: "mrkdwn", text: `*Reason:*\n_${reason}_` }
      ]
    }
  ]
}
```

---

## Design Tokens
```
Primary: #E05C33 (orange)
Primary hover: #C44D28
Background: #FFFFFF
Surface: #F8F8F8
Border: #E5E5E5
Text primary: #111111
Text muted: #6B7280
Success: #4CAF50
Gold: #F59E0B
Silver: #9CA3AF
Bronze: #B45309

Category colors:
  Support: #3B82F6 (blue)
  Proactivity: #F59E0B (amber)
  Artistry: #8B5CF6 (purple)
  Reliability: #10B981 (green)
  Knowledge Sharing: #06B6D4 (cyan)
  Spirit: #EF4444 (red)
```

---

## Validation Rules (enforce server-side, not just client)
1. Cannot give a Spark to yourself
2. Cannot give more than 1 Spark to the same person in the same calendar month
3. Cannot give more than 5 Sparks per month total
4. Unused Sparks do NOT roll over (expire on month reset)
5. Category must be one of the 6 valid values
6. Reason must be 10–280 characters
7. Cannot claim a milestone reward twice (check milestone_claims table)
8. 100-spark milestone must be claimed before earning more in the cycle

---

## What NOT to build (v1 scope)
- Email notifications (Slack only)
- Manager approval flows
- Spark reactions/comments
- Native mobile app
- Public-facing profiles
