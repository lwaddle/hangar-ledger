-- Vendors table
create table vendors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz,
  constraint vendors_name_unique unique (name)
);

-- Indexes for vendors
create index vendors_name_idx on vendors(name);
create index vendors_deleted_at_idx on vendors(deleted_at);

-- Add vendor_id to expenses (nullable FK, keeps vendor text for denormalization)
alter table expenses
  add column vendor_id uuid references vendors(id) on delete set null;

-- Index for vendor lookups on expenses
create index expenses_vendor_id_idx on expenses(vendor_id);

-- Apply updated_at trigger to vendors
create trigger vendors_updated_at before update on vendors
  for each row execute function update_updated_at();

-- Enable RLS on vendors
alter table vendors enable row level security;

-- RLS Policies for vendors (same pattern as other tables)
create policy "Authenticated users can view vendors"
  on vendors for select using (auth.role() = 'authenticated');

create policy "Authenticated users can insert vendors"
  on vendors for insert with check (auth.role() = 'authenticated');

create policy "Authenticated users can update vendors"
  on vendors for update using (auth.role() = 'authenticated');

create policy "Authenticated users can delete vendors"
  on vendors for delete using (auth.role() = 'authenticated');
