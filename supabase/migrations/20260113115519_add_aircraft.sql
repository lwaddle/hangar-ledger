-- Aircraft table (same pattern as vendors)
create table aircraft (
  id uuid primary key default gen_random_uuid(),
  tail_number text not null,
  name text,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz,
  constraint aircraft_tail_number_unique unique (tail_number)
);

-- Indexes
create index aircraft_tail_number_idx on aircraft(tail_number);
create index aircraft_deleted_at_idx on aircraft(deleted_at);
create index aircraft_is_active_idx on aircraft(is_active) where deleted_at is null;

-- Add aircraft_id to trips (required - db will be reset)
alter table trips
  add column aircraft_id uuid not null references aircraft(id) on delete restrict,
  add column aircraft text not null;

-- Index for aircraft lookups on trips
create index trips_aircraft_id_idx on trips(aircraft_id);

-- Apply updated_at trigger
create trigger aircraft_updated_at before update on aircraft
  for each row execute function update_updated_at();

-- Enable RLS
alter table aircraft enable row level security;

-- RLS Policies
create policy "Authenticated users can view aircraft"
  on aircraft for select using (auth.role() = 'authenticated');

create policy "Authenticated users can insert aircraft"
  on aircraft for insert with check (auth.role() = 'authenticated');

create policy "Authenticated users can update aircraft"
  on aircraft for update using (auth.role() = 'authenticated');

create policy "Authenticated users can delete aircraft"
  on aircraft for delete using (auth.role() = 'authenticated');
