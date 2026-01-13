-- Restore fuel quantity tracking feature
-- Re-adds columns that were removed in 20250113000002_remove_fuel_tracking.sql

-- Add is_fuel_category column to expense_categories
ALTER TABLE expense_categories
ADD COLUMN is_fuel_category boolean NOT NULL DEFAULT false;

-- Set existing "Fuel" category to true
UPDATE expense_categories
SET is_fuel_category = true
WHERE name = 'Fuel' AND deleted_at IS NULL;

-- Add quantity_gallons column to expense_line_items
ALTER TABLE expense_line_items
ADD COLUMN quantity_gallons decimal(10,3);
