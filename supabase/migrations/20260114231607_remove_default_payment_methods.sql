-- Remove all default payment methods
-- These were user-convenience defaults but are too personal/variable.
-- Users should create their own payment methods as needed.

DELETE FROM payment_methods;
