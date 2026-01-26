-- Add foreign keys from updated_by columns to user_profiles
-- This enables PostgREST joins for "Last edited by" feature

-- Trips
alter table trips
  add constraint trips_updated_by_profile_fkey
  foreign key (updated_by) references user_profiles(id);

-- Expenses
alter table expenses
  add constraint expenses_updated_by_profile_fkey
  foreign key (updated_by) references user_profiles(id);
