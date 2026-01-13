-- Remove fuel tracking columns

-- Drop is_fuel_category column from expense_categories
ALTER TABLE expense_categories DROP COLUMN IF EXISTS is_fuel_category;

-- Drop quantity_gallons column from expense_line_items
ALTER TABLE expense_line_items DROP COLUMN IF EXISTS quantity_gallons;
