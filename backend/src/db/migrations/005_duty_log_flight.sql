-- Migration 005: Add flight association and observations to duty_log (UC-14 alignment)
-- duty_log in 001_schema.sql was missing flight_id and observations columns
ALTER TABLE duty_log
  ADD COLUMN IF NOT EXISTS flight_id    INT  REFERENCES flight(flight_id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS observations TEXT;

-- Partial unique index: one duty log per crew member per flight
CREATE UNIQUE INDEX IF NOT EXISTS uq_duty_crew_flight
  ON duty_log (emp_id, flight_id)
  WHERE flight_id IS NOT NULL;
