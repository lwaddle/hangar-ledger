-- Add quantity_gallons column for fuel tracking
alter table expense_line_items
  add column quantity_gallons decimal(10,3);

-- Note: quantity_gallons is nullable (only used for Fuel category)
-- Application will enforce required for Fuel items
