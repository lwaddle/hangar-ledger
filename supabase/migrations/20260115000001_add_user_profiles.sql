-- User profiles table with role management
-- Roles: admin (full access), operator (CRUD), viewer (read-only)

-- Create role enum type
create type user_role as enum ('admin', 'operator', 'viewer');

-- User profiles table
create table user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  role user_role not null default 'viewer',
  invited_by uuid references auth.users(id),
  invited_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes
create index user_profiles_role_idx on user_profiles(role);
create index user_profiles_email_idx on user_profiles(email);

-- Apply updated_at trigger
create trigger user_profiles_updated_at before update on user_profiles
  for each row execute function update_updated_at();

-- Enable RLS
alter table user_profiles enable row level security;

-- RLS Policies
-- All authenticated users can view profiles (needed for collaboration features)
create policy "Users can view all profiles"
  on user_profiles for select using (auth.role() = 'authenticated');

-- Users can update their own display_name
create policy "Users can update own profile"
  on user_profiles for update using (id = auth.uid())
  with check (
    id = auth.uid()
    -- Can only change display_name, not role
    and role = (select role from user_profiles where id = auth.uid())
  );

-- Only admins can change other users' roles
create policy "Admins can update any profile"
  on user_profiles for update using (
    exists (
      select 1 from user_profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- System can insert profiles (via trigger)
create policy "System can insert profiles"
  on user_profiles for insert with check (true);

-- Function to auto-create profile on user signup
-- First user becomes admin, subsequent users are viewers
create or replace function handle_new_user()
returns trigger
security definer
set search_path = public
as $$
declare
  user_count integer;
  new_role user_role;
begin
  -- Count existing profiles
  select count(*) into user_count from user_profiles;

  -- First user becomes admin, others are viewers
  if user_count = 0 then
    new_role := 'admin';
  else
    new_role := 'viewer';
  end if;

  -- Insert the profile
  insert into user_profiles (id, email, role)
  values (new.id, new.email, new_role);

  return new;
end;
$$ language plpgsql;

-- Trigger to auto-create profile when user signs up
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Helper function to check if current user has a specific role or higher
-- Role hierarchy: admin > operator > viewer
create or replace function user_has_role(required_role user_role)
returns boolean
security definer
set search_path = public
as $$
begin
  return exists (
    select 1 from user_profiles
    where id = auth.uid()
    and (
      role = 'admin'
      or (required_role = 'operator' and role in ('admin', 'operator'))
      or required_role = 'viewer'
    )
  );
end;
$$ language plpgsql;

-- Helper function to get current user's role
create or replace function get_user_role()
returns user_role
security definer
set search_path = public
as $$
declare
  current_role user_role;
begin
  select role into current_role
  from user_profiles
  where id = auth.uid();

  return current_role;
end;
$$ language plpgsql;

-- Create profiles for any existing users (migration safety)
-- This runs once when the migration is applied
insert into user_profiles (id, email, role)
select
  id,
  email,
  case
    when row_number() over (order by created_at) = 1 then 'admin'::user_role
    else 'viewer'::user_role
  end
from auth.users
where id not in (select id from user_profiles)
on conflict (id) do nothing;
