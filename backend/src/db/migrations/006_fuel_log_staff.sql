-- Migration 006: Track which Fuel_Staff member created each fuel log (UC-18 auditability)
-- Also add updated_at to fuel_log for update tracking
ALTER TABLE fuel_log
  ADD COLUMN IF NOT EXISTS emp_id     INT         REFERENCES employee(emp_id),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
