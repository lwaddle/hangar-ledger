-- Add is_fuel_category column to expense_categories
-- This flag indicates categories that should track fuel quantity (gallons/liters)

alter table expense_categories
  add column is_fuel_category boolean not null default false;

-- Set existing "Fuel" category to true
update expense_categories
  set is_fuel_category = true
  where name = 'Fuel' and deleted_at is null;
