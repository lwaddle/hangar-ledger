-- Drop unused fuel_entries table
-- Fuel tracking is now handled via quantity_gallons on expense_line_items
DROP TABLE IF EXISTS fuel_entries;
