-- Allow operators to delete expense_line_items (needed for updating expenses)
-- Previously only admins could delete, but operators need to replace line items
-- when updating expenses.

drop policy if exists "Admins can delete expense_line_items" on expense_line_items;

create policy "Operators can delete expense_line_items" on expense_line_items
  for delete using (user_has_role('operator'));
