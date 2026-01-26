-- Allow operators to delete their own unlocked trips and expenses
-- Admins retain full delete access regardless of ownership or lock status

----------------------------------------------
-- TRIPS
----------------------------------------------
DROP POLICY IF EXISTS "Admins can delete trips" ON trips;

CREATE POLICY "Users can delete trips" ON trips
  FOR DELETE USING (
    -- Admins can delete any trip
    user_has_role('admin')
    OR (
      -- Operators can delete their own unlocked trips
      user_has_role('operator')
      AND created_by = auth.uid()
      AND is_locked = false
    )
  );

----------------------------------------------
-- EXPENSES
----------------------------------------------
DROP POLICY IF EXISTS "Admins can delete expenses" ON expenses;

CREATE POLICY "Users can delete expenses" ON expenses
  FOR DELETE USING (
    -- Admins can delete any expense
    user_has_role('admin')
    OR (
      -- Operators can delete their own unlocked expenses
      user_has_role('operator')
      AND created_by = auth.uid()
      AND NOT expense_is_effectively_locked(id)
    )
  );
