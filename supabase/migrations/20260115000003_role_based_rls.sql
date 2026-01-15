-- Replace simple authenticated-user RLS policies with role-based policies
-- Viewers: SELECT only
-- Operators: SELECT, INSERT, UPDATE
-- Admins: Full access including DELETE

----------------------------------------------
-- TRIPS
----------------------------------------------
drop policy if exists "Authenticated users can view trips" on trips;
drop policy if exists "Authenticated users can insert trips" on trips;
drop policy if exists "Authenticated users can update trips" on trips;
drop policy if exists "Authenticated users can delete trips" on trips;

create policy "All users can view trips" on trips
  for select using (auth.role() = 'authenticated');

create policy "Operators can insert trips" on trips
  for insert with check (user_has_role('operator'));

create policy "Operators can update trips" on trips
  for update using (user_has_role('operator'));

create policy "Admins can delete trips" on trips
  for delete using (user_has_role('admin'));

----------------------------------------------
-- EXPENSES
----------------------------------------------
drop policy if exists "Authenticated users can view expenses" on expenses;
drop policy if exists "Authenticated users can insert expenses" on expenses;
drop policy if exists "Authenticated users can update expenses" on expenses;
drop policy if exists "Authenticated users can delete expenses" on expenses;

create policy "All users can view expenses" on expenses
  for select using (auth.role() = 'authenticated');

create policy "Operators can insert expenses" on expenses
  for insert with check (user_has_role('operator'));

create policy "Operators can update expenses" on expenses
  for update using (user_has_role('operator'));

create policy "Admins can delete expenses" on expenses
  for delete using (user_has_role('admin'));

----------------------------------------------
-- EXPENSE_LINE_ITEMS
----------------------------------------------
drop policy if exists "Authenticated users can view expense_line_items" on expense_line_items;
drop policy if exists "Authenticated users can insert expense_line_items" on expense_line_items;
drop policy if exists "Authenticated users can update expense_line_items" on expense_line_items;
drop policy if exists "Authenticated users can delete expense_line_items" on expense_line_items;

create policy "All users can view expense_line_items" on expense_line_items
  for select using (auth.role() = 'authenticated');

create policy "Operators can insert expense_line_items" on expense_line_items
  for insert with check (user_has_role('operator'));

create policy "Operators can update expense_line_items" on expense_line_items
  for update using (user_has_role('operator'));

create policy "Admins can delete expense_line_items" on expense_line_items
  for delete using (user_has_role('admin'));

----------------------------------------------
-- AIRCRAFT
----------------------------------------------
drop policy if exists "Authenticated users can view aircraft" on aircraft;
drop policy if exists "Authenticated users can insert aircraft" on aircraft;
drop policy if exists "Authenticated users can update aircraft" on aircraft;
drop policy if exists "Authenticated users can delete aircraft" on aircraft;

create policy "All users can view aircraft" on aircraft
  for select using (auth.role() = 'authenticated');

create policy "Operators can insert aircraft" on aircraft
  for insert with check (user_has_role('operator'));

create policy "Operators can update aircraft" on aircraft
  for update using (user_has_role('operator'));

create policy "Admins can delete aircraft" on aircraft
  for delete using (user_has_role('admin'));

----------------------------------------------
-- VENDORS
----------------------------------------------
drop policy if exists "Authenticated users can view vendors" on vendors;
drop policy if exists "Authenticated users can insert vendors" on vendors;
drop policy if exists "Authenticated users can update vendors" on vendors;
drop policy if exists "Authenticated users can delete vendors" on vendors;

create policy "All users can view vendors" on vendors
  for select using (auth.role() = 'authenticated');

create policy "Operators can insert vendors" on vendors
  for insert with check (user_has_role('operator'));

create policy "Operators can update vendors" on vendors
  for update using (user_has_role('operator'));

create policy "Admins can delete vendors" on vendors
  for delete using (user_has_role('admin'));

----------------------------------------------
-- PAYMENT_METHODS
----------------------------------------------
drop policy if exists "Authenticated users can view payment_methods" on payment_methods;
drop policy if exists "Authenticated users can insert payment_methods" on payment_methods;
drop policy if exists "Authenticated users can update payment_methods" on payment_methods;
drop policy if exists "Authenticated users can delete payment_methods" on payment_methods;

create policy "All users can view payment_methods" on payment_methods
  for select using (auth.role() = 'authenticated');

create policy "Operators can insert payment_methods" on payment_methods
  for insert with check (user_has_role('operator'));

create policy "Operators can update payment_methods" on payment_methods
  for update using (user_has_role('operator'));

create policy "Admins can delete payment_methods" on payment_methods
  for delete using (user_has_role('admin'));

----------------------------------------------
-- EXPENSE_CATEGORIES
----------------------------------------------
drop policy if exists "Authenticated users can view expense_categories" on expense_categories;
drop policy if exists "Authenticated users can insert expense_categories" on expense_categories;
drop policy if exists "Authenticated users can update expense_categories" on expense_categories;
drop policy if exists "Authenticated users can delete expense_categories" on expense_categories;

create policy "All users can view expense_categories" on expense_categories
  for select using (auth.role() = 'authenticated');

create policy "Operators can insert expense_categories" on expense_categories
  for insert with check (user_has_role('operator'));

create policy "Operators can update expense_categories" on expense_categories
  for update using (user_has_role('operator'));

create policy "Admins can delete expense_categories" on expense_categories
  for delete using (user_has_role('admin'));

----------------------------------------------
-- RECEIPTS
----------------------------------------------
drop policy if exists "Authenticated users can view receipts" on receipts;
drop policy if exists "Authenticated users can insert receipts" on receipts;
drop policy if exists "Authenticated users can update receipts" on receipts;
drop policy if exists "Authenticated users can delete receipts" on receipts;

create policy "All users can view receipts" on receipts
  for select using (auth.role() = 'authenticated');

create policy "Operators can insert receipts" on receipts
  for insert with check (user_has_role('operator'));

create policy "Operators can update receipts" on receipts
  for update using (user_has_role('operator'));

create policy "Admins can delete receipts" on receipts
  for delete using (user_has_role('admin'));

----------------------------------------------
-- IMPORT_SESSIONS (user-owned, but admins can see all)
----------------------------------------------
drop policy if exists "Users can view own import sessions" on import_sessions;
drop policy if exists "Users can insert own import sessions" on import_sessions;
drop policy if exists "Users can update own import sessions" on import_sessions;
drop policy if exists "Users can delete own import sessions" on import_sessions;

-- Users can see their own, admins can see all
create policy "Users can view import sessions" on import_sessions
  for select using (
    user_id = auth.uid()
    or user_has_role('admin')
  );

-- Operators can create import sessions
create policy "Operators can insert import sessions" on import_sessions
  for insert with check (
    user_has_role('operator')
    and user_id = auth.uid()
  );

-- Users can update their own
create policy "Users can update own import sessions" on import_sessions
  for update using (user_id = auth.uid());

-- Only admins can delete any, users can delete their own
create policy "Users can delete import sessions" on import_sessions
  for delete using (
    user_id = auth.uid()
    or user_has_role('admin')
  );

----------------------------------------------
-- IMPORT_LOGS (access through parent session)
----------------------------------------------
drop policy if exists "Users can view own import logs" on import_logs;
drop policy if exists "Users can insert own import logs" on import_logs;

create policy "Users can view import logs" on import_logs
  for select using (
    import_session_id in (
      select id from import_sessions
      where user_id = auth.uid() or user_has_role('admin')
    )
  );

create policy "Operators can insert import logs" on import_logs
  for insert with check (
    user_has_role('operator')
    and import_session_id in (
      select id from import_sessions where user_id = auth.uid()
    )
  );
