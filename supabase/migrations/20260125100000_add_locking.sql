-- Add locking columns to trips table
ALTER TABLE trips ADD COLUMN is_locked boolean NOT NULL DEFAULT false;
ALTER TABLE trips ADD COLUMN locked_at timestamptz;
ALTER TABLE trips ADD COLUMN locked_by uuid REFERENCES auth.users(id);

-- Add locking columns to expenses table
ALTER TABLE expenses ADD COLUMN is_locked boolean NOT NULL DEFAULT false;
ALTER TABLE expenses ADD COLUMN locked_at timestamptz;
ALTER TABLE expenses ADD COLUMN locked_by uuid REFERENCES auth.users(id);

-- Helper function to check if an expense is effectively locked
-- An expense is effectively locked if either:
-- 1. The expense itself is locked (is_locked = true)
-- 2. The expense's parent trip is locked (trip.is_locked = true)
CREATE OR REPLACE FUNCTION expense_is_effectively_locked(expense_id uuid)
RETURNS boolean AS $$
  SELECT COALESCE(e.is_locked, false) OR COALESCE(t.is_locked, false)
  FROM expenses e
  LEFT JOIN trips t ON e.trip_id = t.id
  WHERE e.id = expense_id;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Update RLS policies to prevent updates on locked records (except for admins)
-- First, drop existing update policies
DROP POLICY IF EXISTS "trips_update" ON trips;
DROP POLICY IF EXISTS "expenses_update" ON expenses;

-- Create new update policy for trips that respects locking
CREATE POLICY "trips_update" ON trips
  FOR UPDATE TO authenticated
  USING (
    deleted_at IS NULL
    AND EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'operator')
    )
  )
  WITH CHECK (
    deleted_at IS NULL
    AND EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND (
        user_profiles.role = 'admin'
        OR (
          user_profiles.role = 'operator'
          AND NOT trips.is_locked
        )
      )
    )
  );

-- Create new update policy for expenses that respects locking
CREATE POLICY "expenses_update" ON expenses
  FOR UPDATE TO authenticated
  USING (
    deleted_at IS NULL
    AND EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'operator')
    )
  )
  WITH CHECK (
    deleted_at IS NULL
    AND EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND (
        user_profiles.role = 'admin'
        OR (
          user_profiles.role = 'operator'
          AND NOT expense_is_effectively_locked(expenses.id)
        )
      )
    )
  );
