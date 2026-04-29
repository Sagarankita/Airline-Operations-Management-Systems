-- Migration 003: Add audit trail columns to flight_schedule (UC-12 timestamped status changes)
ALTER TABLE flight_schedule
  ADD COLUMN IF NOT EXISTS updated_by_emp_id INT          REFERENCES employee(emp_id),
  ADD COLUMN IF NOT EXISTS status_updated_at TIMESTAMPTZ;
