-- no-transaction
-- Lab 07 state machine: add Departed, En_Route, Landed to flight_status enum
-- ALTER TYPE ADD VALUE cannot run inside a transaction on PostgreSQL < 12
ALTER TYPE flight_status ADD VALUE IF NOT EXISTS 'Departed';
ALTER TYPE flight_status ADD VALUE IF NOT EXISTS 'En_Route';
ALTER TYPE flight_status ADD VALUE IF NOT EXISTS 'Landed';
