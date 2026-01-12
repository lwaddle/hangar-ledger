-- Expense categories table
create table expense_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  is_flight_expense boolean not null default true,
  is_general_expense boolean not null default true,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz,
  -- At least one expense type must be true
  constraint expense_categories_at_least_one_type
    check (is_flight_expense = true or is_general_expense = true),
  -- Unique name among active records
  constraint expense_categories_name_unique unique (name)
);

-- Indexes for expense_categories
create index expense_categories_name_idx on expense_categories(name);
create index expense_categories_deleted_at_idx on expense_categories(deleted_at);
create index expense_categories_flight_idx on expense_categories(is_flight_expense) where deleted_at is null;
create index expense_categories_general_idx on expense_categories(is_general_expense) where deleted_at is null;

-- Apply updated_at trigger to expense_categories
create trigger expense_categories_updated_at before update on expense_categories
  for each row execute function update_updated_at();

-- Enable RLS on expense_categories
alter table expense_categories enable row level security;

-- RLS Policies for expense_categories (same pattern as other tables)
create policy "Authenticated users can view expense_categories"
  on expense_categories for select using (auth.role() = 'authenticated');

create policy "Authenticated users can insert expense_categories"
  on expense_categories for insert with check (auth.role() = 'authenticated');

create policy "Authenticated users can update expense_categories"
  on expense_categories for update using (auth.role() = 'authenticated');

create policy "Authenticated users can delete expense_categories"
  on expense_categories for delete using (auth.role() = 'authenticated');

-- Seed with existing categories (all default to both flight and general)
insert into expense_categories (name, is_flight_expense, is_general_expense) values
  ('Fuel', true, true),
  ('Maintenance', true, true),
  ('Hangar', true, true),
  ('Catering', true, true),
  ('Charts & Subscriptions', true, true),
  ('Training', true, true),
  ('Landing Fees', true, true),
  ('Handling Fees', true, true),
  ('Customs', true, true),
  ('Other', true, true);

-- Add category_id FK to expenses table
alter table expenses
  add column category_id uuid references expense_categories(id) on delete set null;

-- Add category_id FK to expense_line_items table
alter table expense_line_items
  add column category_id uuid references expense_categories(id) on delete set null;

-- Create indexes for the new FKs
create index expenses_category_id_idx on expenses(category_id);
create index expense_line_items_category_id_idx on expense_line_items(category_id);

-- Migrate existing category text values to category_id
update expenses e
set category_id = ec.id
from expense_categories ec
where e.category = ec.name;

update expense_line_items eli
set category_id = ec.id
from expense_categories ec
where eli.category = ec.name;
