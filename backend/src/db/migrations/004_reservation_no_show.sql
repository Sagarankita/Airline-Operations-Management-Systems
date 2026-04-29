-- no-transaction
-- Lab 07: Passenger boarding state machine needs No_Show terminal state
ALTER TYPE reservation_status ADD VALUE IF NOT EXISTS 'No_Show';
