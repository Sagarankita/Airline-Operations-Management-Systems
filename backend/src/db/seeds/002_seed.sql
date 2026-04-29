-- =============================================================
-- 002_seed.sql  |  Additional data: future flights, passengers,
--               |  reservations, crew assignments, fuel logs
-- =============================================================

-- ─── Additional Passengers (6-10) ────────────────────────────
INSERT INTO passenger (passenger_id, name, gender, passport_no, contact, email, status) VALUES
  (6,  'Priya Patel',    'Female', 'B1234567', '+91-9977665544', 'priya.patel@email.com',    'Active'),
  (7,  'Arjun Sharma',   'Male',   'B2345678', '+91-9977665545', 'arjun.sharma@email.com',   'Active'),
  (8,  'Kavya Menon',    'Female', 'B3456789', '+91-9977665546', 'kavya.menon@email.com',    'Active'),
  (9,  'Rahul Verma',    'Male',   'B4567890', '+91-9977665547', 'rahul.verma@email.com',    'Active'),
  (10, 'Ananya Singh',   'Female', 'B5678901', '+91-9977665548', 'ananya.singh@email.com',   'Active')
ON CONFLICT DO NOTHING;

-- ─── Future Flights ───────────────────────────────────────────
-- Flight 6: DEL→BOM, Boarding state (active boarding for demo)
-- Flight 7: BOM→BLR, Scheduled (upcoming)
-- Flight 8: DEL→LHR, Scheduled (upcoming long-haul)
INSERT INTO flight (flight_id, aircraft_id, departure_time, arrival_time, source_airport_code, dest_airport_code) VALUES
  (6, 2, '2026-05-15 08:00:00+05:30', '2026-05-15 10:30:00+05:30', 'DEL', 'BOM'),
  (7, 3, '2026-05-25 14:00:00+05:30', '2026-05-25 16:30:00+05:30', 'BOM', 'BLR'),
  (8, 4, '2026-06-10 22:00:00+05:30', '2026-06-11 08:00:00+05:30', 'DEL', 'LHR')
ON CONFLICT DO NOTHING;

-- ─── Flight Schedules for new flights ─────────────────────────
INSERT INTO flight_schedule (schedule_id, flight_id, schedule_date, status, delay_reason) VALUES
  (6, 6, '2026-05-15', 'Boarding',   NULL),
  (7, 7, '2026-05-25', 'Scheduled',  NULL),
  (8, 8, '2026-06-10', 'Scheduled',  NULL)
ON CONFLICT DO NOTHING;

-- ─── Reservations for future flights (Confirmed so boarding works) ──
-- Flight 6 (Boarding): 6 passengers ready to be checked in
INSERT INTO reservation (pnr_id, passenger_id, flight_id, seat_no, booking_date, status) VALUES
  (6,  3,  6, '05A', '2026-04-10', 'Confirmed'),
  (7,  4,  6, '05B', '2026-04-10', 'Confirmed'),
  (8,  5,  6, '12C', '2026-04-11', 'Confirmed'),
  (9,  6,  6, '12D', '2026-04-11', 'Confirmed'),
  (10, 7,  6, '18A', '2026-04-12', 'Confirmed'),
  (11, 8,  6, '18B', '2026-04-12', 'Confirmed'),
  -- Flight 7 (Scheduled): 4 passengers
  (12, 1,  7, '10A', '2026-04-20', 'Confirmed'),
  (13, 3,  7, '10B', '2026-04-20', 'Confirmed'),
  (14, 9,  7, '22C', '2026-04-21', 'Confirmed'),
  (15, 10, 7, '22D', '2026-04-21', 'Confirmed'),
  -- Flight 8 (Scheduled): 4 passengers
  (16, 6,  8, '30A', '2026-04-22', 'Confirmed'),
  (17, 7,  8, '30B', '2026-04-22', 'Confirmed'),
  (18, 9,  8, '44C', '2026-04-23', 'Confirmed'),
  (19, 10, 8, '44D', '2026-04-23', 'Confirmed')
ON CONFLICT DO NOTHING;

-- ─── Crew Assignments for new flights ─────────────────────────
INSERT INTO crew_assignment (emp_id, flight_id, assignment_date, role) VALUES
  (1, 6, '2026-05-15', 'Captain'),
  (3, 6, '2026-05-15', 'Cabin_Crew'),
  (4, 6, '2026-05-15', 'Cabin_Crew'),
  (2, 7, '2026-05-25', 'First Officer'),
  (5, 7, '2026-05-25', 'Cabin_Crew'),
  (1, 8, '2026-06-10', 'Captain'),
  (3, 8, '2026-06-10', 'Cabin_Crew'),
  (5, 8, '2026-06-10', 'Cabin_Crew')
ON CONFLICT DO NOTHING;

-- ─── Fuel Logs for new flights ────────────────────────────────
INSERT INTO fuel_log (fuellog_id, flight_id, aircraft_id, fuel_loaded, fuel_consumed, fuel_date) VALUES
  (4, 6, 2,  9800.00,  NULL, '2026-05-15'),
  (5, 7, 3, 75000.00,  NULL, '2026-05-25'),
  (6, 8, 4, 95000.00,  NULL, '2026-06-10')
ON CONFLICT DO NOTHING;

-- ─── Reset all SERIAL sequences ───────────────────────────────
SELECT setval('aircraft_aircraft_id_seq',       (SELECT MAX(aircraft_id)   FROM aircraft));
SELECT setval('employee_emp_id_seq',            (SELECT MAX(emp_id)        FROM employee));
SELECT setval('flight_flight_id_seq',           (SELECT MAX(flight_id)     FROM flight));
SELECT setval('flight_schedule_schedule_id_seq',(SELECT MAX(schedule_id)   FROM flight_schedule));
SELECT setval('duty_log_duty_id_seq',           (SELECT MAX(duty_id)       FROM duty_log));
SELECT setval('passenger_passenger_id_seq',     (SELECT MAX(passenger_id)  FROM passenger));
SELECT setval('reservation_pnr_id_seq',         (SELECT MAX(pnr_id)        FROM reservation));
SELECT setval('feedback_feedback_id_seq',       (SELECT MAX(feedback_id)   FROM feedback));
SELECT setval('fuel_log_fuellog_id_seq',        (SELECT MAX(fuellog_id)    FROM fuel_log));
SELECT setval('maintenance_log_s_no_seq',       (SELECT MAX(s_no)          FROM maintenance_log));
