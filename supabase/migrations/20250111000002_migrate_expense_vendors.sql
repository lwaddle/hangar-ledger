-- Data migration: Create vendors from existing expense vendor names and link them

-- Step 1: Create vendors from unique expense vendor names
INSERT INTO vendors (name)
SELECT DISTINCT vendor
FROM expenses
WHERE deleted_at IS NULL
  AND vendor IS NOT NULL
  AND vendor != ''
ON CONFLICT (name) DO NOTHING;

-- Step 2: Update expenses with vendor_id based on matching vendor name
UPDATE expenses e
SET vendor_id = v.id
FROM vendors v
WHERE e.vendor = v.name
  AND e.vendor_id IS NULL;
