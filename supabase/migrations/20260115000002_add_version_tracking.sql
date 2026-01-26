-- Add version tracking and user attribution to all main tables
-- Used for optimistic locking and audit trail

-- Function to increment version on update
create or replace function increment_version()
returns trigger as $$
begin
  new.version = old.version + 1;
  return new;
end;
$$ language plpgsql;

-- Function to set updated_by on update
create or replace function set_updated_by()
returns trigger as $$
begin
  new.updated_by = auth.uid();
  return new;
end;
$$ language plpgsql;

-- Function to set created_by on insert
create or replace function set_created_by()
returns trigger as $$
begin
  new.created_by = auth.uid();
  new.updated_by = auth.uid();
  return new;
end;
$$ language plpgsql;

----------------------------------------------
-- TRIPS
----------------------------------------------
alter table trips
  add column version integer not null default 1,
  add column created_by uuid references auth.users(id),
  add column updated_by uuid references auth.users(id);

create index trips_created_by_idx on trips(created_by);
create index trips_updated_by_idx on trips(updated_by);

create trigger trips_version before update on trips
  for each row execute function increment_version();

create trigger trips_set_updated_by before update on trips
  for each row execute function set_updated_by();

create trigger trips_set_created_by before insert on trips
  for each row execute function set_created_by();

----------------------------------------------
-- EXPENSES
----------------------------------------------
alter table expenses
  add column version integer not null default 1,
  add column created_by uuid references auth.users(id),
  add column updated_by uuid references auth.users(id);

create index expenses_created_by_idx on expenses(created_by);
create index expenses_updated_by_idx on expenses(updated_by);

create trigger expenses_version before update on expenses
  for each row execute function increment_version();

create trigger expenses_set_updated_by before update on expenses
  for each row execute function set_updated_by();

create trigger expenses_set_created_by before insert on expenses
  for each row execute function set_created_by();

----------------------------------------------
-- AIRCRAFT
----------------------------------------------
alter table aircraft
  add column version integer not null default 1,
  add column created_by uuid references auth.users(id),
  add column updated_by uuid references auth.users(id);

create index aircraft_created_by_idx on aircraft(created_by);
create index aircraft_updated_by_idx on aircraft(updated_by);

create trigger aircraft_version before update on aircraft
  for each row execute function increment_version();

create trigger aircraft_set_updated_by before update on aircraft
  for each row execute function set_updated_by();

create trigger aircraft_set_created_by before insert on aircraft
  for each row execute function set_created_by();

----------------------------------------------
-- VENDORS
----------------------------------------------
alter table vendors
  add column version integer not null default 1,
  add column created_by uuid references auth.users(id),
  add column updated_by uuid references auth.users(id);

create index vendors_created_by_idx on vendors(created_by);
create index vendors_updated_by_idx on vendors(updated_by);

create trigger vendors_version before update on vendors
  for each row execute function increment_version();

create trigger vendors_set_updated_by before update on vendors
  for each row execute function set_updated_by();

create trigger vendors_set_created_by before insert on vendors
  for each row execute function set_created_by();

----------------------------------------------
-- PAYMENT_METHODS
----------------------------------------------
alter table payment_methods
  add column version integer not null default 1,
  add column created_by uuid references auth.users(id),
  add column updated_by uuid references auth.users(id);

create index payment_methods_created_by_idx on payment_methods(created_by);
create index payment_methods_updated_by_idx on payment_methods(updated_by);

create trigger payment_methods_version before update on payment_methods
  for each row execute function increment_version();

create trigger payment_methods_set_updated_by before update on payment_methods
  for each row execute function set_updated_by();

create trigger payment_methods_set_created_by before insert on payment_methods
  for each row execute function set_created_by();

----------------------------------------------
-- EXPENSE_CATEGORIES
----------------------------------------------
alter table expense_categories
  add column version integer not null default 1,
  add column created_by uuid references auth.users(id),
  add column updated_by uuid references auth.users(id);

create index expense_categories_created_by_idx on expense_categories(created_by);
create index expense_categories_updated_by_idx on expense_categories(updated_by);

create trigger expense_categories_version before update on expense_categories
  for each row execute function increment_version();

create trigger expense_categories_set_updated_by before update on expense_categories
  for each row execute function set_updated_by();

create trigger expense_categories_set_created_by before insert on expense_categories
  for each row execute function set_created_by();
