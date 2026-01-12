-- Expense line items table
create table expense_line_items (
  id uuid primary key default gen_random_uuid(),
  expense_id uuid references expenses(id) on delete cascade not null,
  description text,
  category text not null,
  amount decimal(10,2) not null,
  sort_order integer not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes
create index expense_line_items_expense_id_idx on expense_line_items(expense_id);

-- Updated_at trigger
create trigger expense_line_items_updated_at before update on expense_line_items
  for each row execute function update_updated_at();

-- RLS
alter table expense_line_items enable row level security;

create policy "Authenticated users can view expense_line_items"
  on expense_line_items for select using (auth.role() = 'authenticated');

create policy "Authenticated users can insert expense_line_items"
  on expense_line_items for insert with check (auth.role() = 'authenticated');

create policy "Authenticated users can update expense_line_items"
  on expense_line_items for update using (auth.role() = 'authenticated');

create policy "Authenticated users can delete expense_line_items"
  on expense_line_items for delete using (auth.role() = 'authenticated');

-- Migrate existing expenses to line items
insert into expense_line_items (expense_id, description, category, amount, sort_order)
select id, null, category, amount, 0
from expenses
where deleted_at is null;
