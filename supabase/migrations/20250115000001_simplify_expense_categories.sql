-- Simplify expense categories: remove flight/general distinction
-- Start with a clean slate for expense_categories table

-- First, clear out all existing expense categories
DELETE FROM expense_categories;

-- Drop the check constraint that requires at least one type selected
ALTER TABLE expense_categories DROP CONSTRAINT IF EXISTS expense_categories_type_check;

-- Drop the indexes on the type columns
DROP INDEX IF EXISTS expense_categories_is_flight_expense_idx;
DROP INDEX IF EXISTS expense_categories_is_general_expense_idx;

-- Drop the columns
ALTER TABLE expense_categories DROP COLUMN IF EXISTS is_flight_expense;
ALTER TABLE expense_categories DROP COLUMN IF EXISTS is_general_expense;

-- Insert the default expense categories
-- System categories (cannot be deleted/modified)
INSERT INTO expense_categories (name, is_system) VALUES
  ('Fuel', true),
  ('Uncategorized', true);

-- User-editable default categories (alphabetical order for reference, but will be sorted on query)
INSERT INTO expense_categories (name, is_system) VALUES
  ('Aircraft Parking', false),
  ('Aircraft Supplies', false),
  ('Airline', false),
  ('Airport Fee', false),
  ('Call Out Fee', false),
  ('Catering', false),
  ('Crew Transport (Taxi/Town Car)', false),
  ('Flight Attendant Service', false),
  ('GPU', false),
  ('Grooming', false),
  ('Handling', false),
  ('Hangar', false),
  ('Hotels', false),
  ('Internet/Phone', false),
  ('Landing Fee', false),
  ('Lav Service', false),
  ('Maintenance', false),
  ('Meals', false),
  ('Misc', false),
  ('Oil', false),
  ('Passenger Transport (Taxi/Town Car)', false),
  ('Pilot Service', false),
  ('Ramp Fee', false),
  ('Rental Car', false),
  ('Sales Tax', false),
  ('Security Fee', false),
  ('Subscriptions', false),
  ('Supplies', false),
  ('Tips/Gratuity', false),
  ('Tolls/Parking', false),
  ('Towing', false);
