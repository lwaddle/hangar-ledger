-- Fix permissions for trip number generation
-- The generate_trip_number function needs SECURITY DEFINER to write to the counter table

-- Recreate the function with SECURITY DEFINER
CREATE OR REPLACE FUNCTION generate_trip_number(trip_year INTEGER)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
