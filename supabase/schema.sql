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
