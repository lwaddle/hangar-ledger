-- Add trip_number column to trips table
-- Format: YYYY-NNN (e.g., 2026-001, 2026-002)
-- Numbers are sequential within each calendar year based on start_date

-- Step 1: Add the trip_number column (nullable initially for backfill)
ALTER TABLE trips ADD COLUMN trip_number TEXT;

-- Step 2: Create counter table to track next number per year
CREATE TABLE trip_number_counters (
  year INTEGER PRIMARY KEY,
  next_number INTEGER NOT NULL DEFAULT 1
);

-- Step 3: Enable RLS on counter table
ALTER TABLE trip_number_counters ENABLE ROW LEVEL SECURITY;

-- Counter table policies - all authenticated users can read, only system can write
CREATE POLICY "Authenticated users can view counters"
  ON trip_number_counters FOR SELECT
  TO authenticated
  USING (true);

-- Step 4: Create function to generate and reserve a trip number
CREATE OR REPLACE FUNCTION generate_trip_number(trip_year INTEGER)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  current_number INTEGER;
BEGIN
  -- Insert or update the counter for this year, returning the number to use
  INSERT INTO trip_number_counters (year, next_number)
  VALUES (trip_year, 2)
  ON CONFLICT (year) DO UPDATE
    SET next_number = trip_number_counters.next_number + 1
  RETURNING next_number - 1 INTO current_number;

  -- Format as YYYY-NNN
  RETURN trip_year::TEXT || '-' || LPAD(current_number::TEXT, 3, '0');
END;
$$;

-- Step 5: Create trigger function to auto-assign trip numbers on insert
CREATE OR REPLACE FUNCTION assign_trip_number()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  trip_year INTEGER;
BEGIN
  -- Extract year from start_date
  trip_year := EXTRACT(YEAR FROM NEW.start_date);

  -- Generate and assign the trip number
  NEW.trip_number := generate_trip_number(trip_year);

  RETURN NEW;
END;
$$;

-- Step 6: Create the trigger (BEFORE INSERT)
CREATE TRIGGER trip_number_trigger
  BEFORE INSERT ON trips
  FOR EACH ROW
  EXECUTE FUNCTION assign_trip_number();

-- Step 7: Backfill existing trips with trip numbers in chronological order
-- This assigns numbers based on start_date, then created_at within each year
DO $$
DECLARE
  trip_record RECORD;
  current_year INTEGER := 0;
  counter INTEGER := 0;
BEGIN
  -- Process trips in order by start_date, then created_at
  FOR trip_record IN
    SELECT id, EXTRACT(YEAR FROM start_date)::INTEGER AS year
    FROM trips
    WHERE deleted_at IS NULL
    ORDER BY start_date, created_at
  LOOP
    -- Reset counter when year changes
    IF trip_record.year != current_year THEN
      current_year := trip_record.year;
      counter := 0;
    END IF;

    counter := counter + 1;

    -- Update the trip with its number
    UPDATE trips
    SET trip_number = current_year::TEXT || '-' || LPAD(counter::TEXT, 3, '0')
    WHERE id = trip_record.id;
  END LOOP;
END $$;

-- Also backfill deleted trips (they keep their numbers for audit trail)
DO $$
DECLARE
  trip_record RECORD;
  current_year INTEGER := 0;
  counter INTEGER := 0;
  max_counter INTEGER;
BEGIN
  -- For deleted trips, assign numbers after the active trips for each year
  FOR trip_record IN
    SELECT id, EXTRACT(YEAR FROM start_date)::INTEGER AS year
    FROM trips
    WHERE deleted_at IS NOT NULL
    ORDER BY start_date, created_at
  LOOP
    -- Get the max counter for this year from existing trips
    IF trip_record.year != current_year THEN
      current_year := trip_record.year;
      SELECT COALESCE(MAX(SUBSTRING(trip_number FROM 6)::INTEGER), 0)
      INTO max_counter
      FROM trips
      WHERE EXTRACT(YEAR FROM start_date) = current_year
        AND trip_number IS NOT NULL;
      counter := max_counter;
    END IF;

    counter := counter + 1;

    -- Update the deleted trip with its number
    UPDATE trips
    SET trip_number = current_year::TEXT || '-' || LPAD(counter::TEXT, 3, '0')
    WHERE id = trip_record.id;
  END LOOP;
END $$;

-- Step 8: Initialize counters based on max existing trip numbers per year
INSERT INTO trip_number_counters (year, next_number)
SELECT
  EXTRACT(YEAR FROM start_date)::INTEGER AS year,
  COALESCE(MAX(SUBSTRING(trip_number FROM 6)::INTEGER), 0) + 1 AS next_number
FROM trips
WHERE trip_number IS NOT NULL
GROUP BY EXTRACT(YEAR FROM start_date)
ON CONFLICT (year) DO UPDATE
  SET next_number = EXCLUDED.next_number;

-- Step 9: Add unique constraint and make column NOT NULL
ALTER TABLE trips ALTER COLUMN trip_number SET NOT NULL;
ALTER TABLE trips ADD CONSTRAINT trips_trip_number_unique UNIQUE (trip_number);

-- Step 10: Create index for efficient lookups
CREATE INDEX idx_trips_trip_number ON trips (trip_number);
