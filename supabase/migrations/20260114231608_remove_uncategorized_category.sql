-- Remove Uncategorized system category
-- Not needed since the app requires explicit category assignment/reassignment.
-- The only remaining system category is "Fuel" (for gallon tracking).

DELETE FROM expense_categories WHERE name = 'Uncategorized';
