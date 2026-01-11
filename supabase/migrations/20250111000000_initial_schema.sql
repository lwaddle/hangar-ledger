-- TRIPS TABLE
create table trips (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  start_date date not null,
  end_date date,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

-- EXPENSES TABLE
create table expenses (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references trips(id) on delete set null,
  date date not null,
  vendor text not null,
  amount decimal(10,2) not null,
  category text not null,
  payment_method text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

-- FUEL_ENTRIES TABLE
create table fuel_entries (
  id uuid primary key default gen_random_uuid(),
  expense_id uuid references expenses(id) on delete cascade not null,
  gallons decimal(10,2) not null,
  location text,
  created_at timestamptz default now()
);

-- RECEIPTS TABLE
create table receipts (
  id uuid primary key default gen_random_uuid(),
  expense_id uuid references expenses(id) on delete cascade not null,
  storage_path text not null,
  original_filename text not null,
  uploaded_by uuid references auth.users(id),
  uploaded_at timestamptz default now()
);

-- Indexes for performance
create index expenses_trip_id_idx on expenses(trip_id);
create index expenses_date_idx on expenses(date);
create index expenses_category_idx on expenses(category);
create index fuel_entries_expense_id_idx on fuel_entries(expense_id);
create index receipts_expense_id_idx on receipts(expense_id);

-- Updated_at trigger function
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Apply triggers for auto-updating timestamps
create trigger trips_updated_at before update on trips
  for each row execute function update_updated_at();
create trigger expenses_updated_at before update on expenses
  for each row execute function update_updated_at();

-- Enable Row Level Security on all tables
alter table trips enable row level security;
alter table expenses enable row level security;
alter table fuel_entries enable row level security;
alter table receipts enable row level security;

-- RLS Policies: All authenticated users have full access (1-5 trusted users)
create policy "Authenticated users can view trips"
  on trips for select using (auth.role() = 'authenticated');
create policy "Authenticated users can insert trips"
  on trips for insert with check (auth.role() = 'authenticated');
create policy "Authenticated users can update trips"
  on trips for update using (auth.role() = 'authenticated');
create policy "Authenticated users can delete trips"
  on trips for delete using (auth.role() = 'authenticated');

create policy "Authenticated users can view expenses"
  on expenses for select using (auth.role() = 'authenticated');
create policy "Authenticated users can insert expenses"
  on expenses for insert with check (auth.role() = 'authenticated');
create policy "Authenticated users can update expenses"
  on expenses for update using (auth.role() = 'authenticated');
create policy "Authenticated users can delete expenses"
  on expenses for delete using (auth.role() = 'authenticated');

create policy "Authenticated users can view fuel_entries"
  on fuel_entries for select using (auth.role() = 'authenticated');
create policy "Authenticated users can insert fuel_entries"
  on fuel_entries for insert with check (auth.role() = 'authenticated');
create policy "Authenticated users can update fuel_entries"
  on fuel_entries for update using (auth.role() = 'authenticated');
create policy "Authenticated users can delete fuel_entries"
  on fuel_entries for delete using (auth.role() = 'authenticated');

create policy "Authenticated users can view receipts"
  on receipts for select using (auth.role() = 'authenticated');
create policy "Authenticated users can insert receipts"
  on receipts for insert with check (auth.role() = 'authenticated');
create policy "Authenticated users can update receipts"
  on receipts for update using (auth.role() = 'authenticated');
create policy "Authenticated users can delete receipts"
  on receipts for delete using (auth.role() = 'authenticated');
