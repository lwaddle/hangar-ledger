-- Add is_active column to expense_categories, vendors, and payment_methods
-- This enables deactivation of items without deleting them

-- Add is_active column to expense_categories
ALTER TABLE expense_categories
ADD COLUMN is_active boolean NOT NULL DEFAULT true;

-- Add is_active column to vendors
ALTER TABLE vendors
ADD COLUMN is_active boolean NOT NULL DEFAULT true;

-- Add is_active column to payment_methods
ALTER TABLE payment_methods
ADD COLUMN is_active boolean NOT NULL DEFAULT true;

-- Create indexes for filtering active items efficiently
CREATE INDEX expense_categories_is_active_idx ON expense_categories(is_active) WHERE deleted_at IS NULL;
CREATE INDEX vendors_is_active_idx ON vendors(is_active) WHERE deleted_at IS NULL;
CREATE INDEX payment_methods_is_active_idx ON payment_methods(is_active) WHERE deleted_at IS NULL;
