-- Add location field to expenses table
-- This optional field tracks where an expense occurred (typically airport codes like KPDX)

ALTER TABLE expenses ADD COLUMN location TEXT;

-- Add index for filtering/searching by location
CREATE INDEX idx_expenses_location ON expenses (location) WHERE location IS NOT NULL;
