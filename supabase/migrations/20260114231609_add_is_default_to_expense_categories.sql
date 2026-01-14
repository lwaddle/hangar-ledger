-- Add is_default column to track seeded vs user-created categories
-- This allows "Delete All Data" to preserve default categories while removing user-created ones
ALTER TABLE expense_categories ADD COLUMN is_default boolean NOT NULL DEFAULT false;

-- Mark all current categories as defaults
-- (This runs after Uncategorized is removed, so all remaining categories are the seeded defaults)
UPDATE expense_categories SET is_default = true;
