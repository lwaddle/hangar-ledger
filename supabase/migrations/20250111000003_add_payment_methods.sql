-- Payment methods table
create table payment_methods (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz,
  constraint payment_methods_name_unique unique (name)
);

-- Indexes for payment_methods
create index payment_methods_name_idx on payment_methods(name);
create index payment_methods_deleted_at_idx on payment_methods(deleted_at);

-- Add payment_method_id to expenses (nullable FK, keeps payment_method text for denormalization)
alter table expenses
  add column payment_method_id uuid references payment_methods(id) on delete set null;

-- Index for payment_method lookups on expenses
create index expenses_payment_method_id_idx on expenses(payment_method_id);

-- Apply updated_at trigger to payment_methods
create trigger payment_methods_updated_at before update on payment_methods
  for each row execute function update_updated_at();

-- Enable RLS on payment_methods
alter table payment_methods enable row level security;

-- RLS Policies for payment_methods (same pattern as vendors)
create policy "Authenticated users can view payment_methods"
  on payment_methods for select using (auth.role() = 'authenticated');

create policy "Authenticated users can insert payment_methods"
  on payment_methods for insert with check (auth.role() = 'authenticated');

create policy "Authenticated users can update payment_methods"
  on payment_methods for update using (auth.role() = 'authenticated');

create policy "Authenticated users can delete payment_methods"
  on payment_methods for delete using (auth.role() = 'authenticated');

-- Migrate existing payment_method text values to the new table
-- Insert unique payment_method values that are not null or empty
insert into payment_methods (name)
select distinct payment_method
from expenses
where payment_method is not null
  and payment_method != ''
  and deleted_at is null
on conflict (name) do nothing;

-- Update expenses with the new payment_method_id references
update expenses e
set payment_method_id = pm.id
from payment_methods pm
where e.payment_method = pm.name
  and e.payment_method is not null
  and e.payment_method != '';
