-- Add default payment methods for new users
-- These are user-editable defaults (not system-protected)

INSERT INTO payment_methods (name) VALUES
  ('AVCARD'),
  ('Amex'),
  ('Cash'),
  ('Check'),
  ('Direct Bill'),
  ('Mastercard'),
  ('Multi Service'),
  ('Visa'),
  ('World Fuel')
ON CONFLICT (name) DO NOTHING;
