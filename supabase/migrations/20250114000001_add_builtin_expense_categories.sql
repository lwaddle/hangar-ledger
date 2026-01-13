-- Add is_system column to expense_categories
-- System categories cannot be deleted or modified
ALTER TABLE expense_categories ADD COLUMN is_system boolean NOT NULL DEFAULT false;

-- Create index for is_system column
CREATE INDEX expense_categories_is_system_idx ON expense_categories(is_system) WHERE is_system = true;

-- Mark Fuel as system category (flight expense only)
UPDATE expense_categories
SET is_system = true, is_flight_expense = true, is_general_expense = false
WHERE name = 'Fuel' AND deleted_at IS NULL;

-- Insert Uncategorized category if it doesn't exist, or update if it does
INSERT INTO expense_categories (name, is_flight_expense, is_general_expense, is_system)
VALUES ('Uncategorized', true, true, true)
ON CONFLICT (name) DO UPDATE SET
  is_system = true,
  is_flight_expense = true,
  is_general_expense = true,
  deleted_at = NULL;
