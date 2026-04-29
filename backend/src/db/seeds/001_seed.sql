-- =============================================================
-- 001_seed.sql  |  Realistic sample data — safe to re-run
-- =============================================================

-- ─── Airports ────────────────────────────────────────────────
INSERT INTO airport (airport_code, name, city, country) VALUES
  ('DEL', 'Indira Gandhi International Airport',              'New Delhi',  'India'),
  ('BOM', 'Chhatrapati Shivaji Maharaj International Airport','Mumbai',     'India'),
  ('BLR', 'Kempegowda International Airport',                 'Bengaluru',  'India'),
  ('LHR', 'Heathrow Airport',                                 'London',     'United Kingdom'),
  ('DXB', 'Dubai International Airport',                      'Dubai',      'UAE')
ON CONFLICT DO NOTHING;

-- ─── Aircraft ────────────────────────────────────────────────
INSERT INTO aircraft (aircraft_id, model, manufacturer, weight_capacity, range_km, status) VALUES
  (1, 'A320',        'Airbus',  180, 6150,  'Active'),
  (2, 'B737-800',    'Boeing',  162, 5765,  'Active'),
  (3, 'A380-800',    'Airbus',  555, 15200, 'Active'),
  (4, 'B777-300ER',  'Boeing',  396, 13650, 'Active'),
  (5, 'ATR 72-600',  'ATR',      70, 1528,  'In_Maintenance')
ON CONFLICT DO NOTHING;

-- ─── Employees ───────────────────────────────────────────────
INSERT INTO employee (emp_id, name, gender, dob, doj, role, contact, status) VALUES
  (1,  'Rajesh Kumar',   'Male',   '1978-04-12', '2005-06-01', 'Pilot',        '+91-9876543210', 'Active'),
  (2,  'Priya Sharma',   'Female', '1982-08-22', '2008-03-15', 'Pilot',        '+91-9876543211', 'Active'),
  (3,  'Aisha Nair',     'Female', '1990-01-10', '2015-07-01', 'Cabin_Crew',   '+91-9876543212', 'Active'),
  (4,  'Vikram Singh',   'Male',   '1988-05-30', '2012-09-20', 'Cabin_Crew',   '+91-9876543213', 'Active'),
  (5,  'Deepa Reddy',    'Female', '1993-11-05', '2018-01-10', 'Cabin_Crew',   '+91-9876543214', 'Active'),
  (6,  'Amit Patel',     'Male',   '1985-07-18', '2010-04-12', 'Ground_Staff', '+91-9876543215', 'Active'),
  (7,  'Sunita Verma',   'Female', '1991-03-25', '2016-08-05', 'Ground_Staff', '+91-9876543216', 'Active'),
  (8,  'Karan Mehta',    'Male',   '1987-09-14', '2013-11-20', 'Maintenance',  '+91-9876543217', 'Active'),
  (9,  'Pooja Iyer',     'Female', '1994-06-28', '2019-02-14', 'Fuel_Staff',   '+91-9876543218', 'Active'),
  (10, 'Sanjay Gupta',   'Male',   '1975-12-03', '2000-01-15', 'Admin',        '+91-9876543219', 'Active')
ON CONFLICT DO NOTHING;

-- ─── Pilots ──────────────────────────────────────────────────
INSERT INTO pilot (emp_id, passport_no, license_number, fitness, total_flight_hours, rank, base_airport) VALUES
  (1, 'P1234567', 'DGCA-PIL-2005-001', 'Fit', 8540, 'Captain',       'DEL'),
  (2, 'P2345678', 'DGCA-PIL-2008-002', 'Fit', 5230, 'First Officer', 'BOM')
ON CONFLICT DO NOTHING;

-- ─── Cabin Crew ──────────────────────────────────────────────
INSERT INTO cabin_crew (emp_id, passport_no, fitness, base_airport, total_exp_years) VALUES
  (3, 'P3456789', 'Fit', 'DEL', 9),
  (4, 'P4567890', 'Fit', 'BOM', 6),
  (5, 'P5678901', 'Fit', 'BLR', 5)
ON CONFLICT DO NOTHING;

-- ─── Ground Staff ────────────────────────────────────────────
INSERT INTO ground_staff (emp_id, department, shift_time) VALUES
  (6, 'Ground Operations', 'Morning'),
  (7, 'Customer Service',  'Evening')
ON CONFLICT DO NOTHING;

-- ─── Flights ─────────────────────────────────────────────────
INSERT INTO flight (flight_id, aircraft_id, departure_time, arrival_time, source_airport_code, dest_airport_code) VALUES
  (1, 1, '2025-05-01 06:00:00+05:30', '2025-05-01 08:30:00+05:30', 'DEL', 'BOM'),
  (2, 2, '2025-05-01 10:00:00+05:30', '2025-05-01 12:00:00+05:30', 'BOM', 'BLR'),
  (3, 3, '2025-05-01 14:00:00+05:30', '2025-05-02 00:00:00+05:30', 'DEL', 'LHR'),
  (4, 4, '2025-05-02 08:00:00+05:30', '2025-05-02 14:00:00+05:30', 'BOM', 'DXB'),
  (5, 1, '2025-05-03 16:00:00+05:30', '2025-05-03 18:30:00+05:30', 'BLR', 'DEL')
ON CONFLICT DO NOTHING;

-- ─── Flight Schedules ────────────────────────────────────────
INSERT INTO flight_schedule (schedule_id, flight_id, schedule_date, status, delay_reason) VALUES
  (1, 1, '2025-05-01', 'Completed', NULL),
  (2, 2, '2025-05-01', 'Completed', NULL),
  (3, 3, '2025-05-01', 'Delayed',   'Air traffic control hold at origin'),
  (4, 4, '2025-05-02', 'Scheduled', NULL),
  (5, 5, '2025-05-03', 'Scheduled', NULL)
ON CONFLICT DO NOTHING;

-- ─── Crew Assignments ────────────────────────────────────────
INSERT INTO crew_assignment (emp_id, flight_id, assignment_date, role) VALUES
  (1, 1, '2025-05-01', 'Captain'),
  (3, 1, '2025-05-01', 'Cabin_Crew'),
  (2, 3, '2025-05-01', 'First Officer'),
  (4, 3, '2025-05-01', 'Cabin_Crew'),
  (5, 4, '2025-05-02', 'Cabin_Crew')
ON CONFLICT DO NOTHING;

-- ─── Duty Logs ───────────────────────────────────────────────
INSERT INTO duty_log (duty_id, emp_id, duty_start, duty_end, rest_start, rest_end) VALUES
  (1, 1, '2025-05-01 04:00:00+05:30', '2025-05-01 10:00:00+05:30', '2025-05-01 10:00:00+05:30', '2025-05-01 18:00:00+05:30'),
  (2, 2, '2025-05-01 12:00:00+05:30', '2025-05-01 22:00:00+05:30', '2025-05-01 22:00:00+05:30', '2025-05-02 08:00:00+05:30'),
  (3, 3, '2025-05-01 04:00:00+05:30', '2025-05-01 10:00:00+05:30', '2025-05-01 10:00:00+05:30', '2025-05-01 18:00:00+05:30')
ON CONFLICT DO NOTHING;

-- ─── Passengers ──────────────────────────────────────────────
INSERT INTO passenger (passenger_id, name, gender, passport_no, contact, email, status) VALUES
  (1, 'Aarav Joshi',   'Male',   'A1234567', '+91-9988776655', 'aarav.joshi@email.com',   'Active'),
  (2, 'Meera Pillai',  'Female', 'A2345678', '+91-9988776656', 'meera.pillai@email.com',  'Active'),
  (3, 'Rohan Das',     'Male',   'A3456789', '+91-9988776657', 'rohan.das@email.com',     'Active'),
  (4, 'Sneha Kapoor',  'Female', 'A4567890', '+91-9988776658', 'sneha.kapoor@email.com',  'Active'),
  (5, 'Tarun Bose',    'Male',   'A5678901', '+91-9988776659', 'tarun.bose@email.com',    'Active')
ON CONFLICT DO NOTHING;

-- ─── Reservations ────────────────────────────────────────────
INSERT INTO reservation (pnr_id, passenger_id, flight_id, seat_no, booking_date, status) VALUES
  (1, 1, 1, '12A', '2025-04-20', 'Completed'),
  (2, 2, 1, '12B', '2025-04-20', 'Completed'),
  (3, 3, 3, '45C', '2025-04-22', 'Confirmed'),
  (4, 4, 4, '22D', '2025-04-23', 'Confirmed'),
  (5, 5, 5, '08A', '2025-04-24', 'Confirmed')
ON CONFLICT DO NOTHING;

-- ─── Feedback ────────────────────────────────────────────────
INSERT INTO feedback (feedback_id, passenger_id, flight_id, rating, comments, feedback_date) VALUES
  (1, 1, 1, 5, 'Excellent service and perfectly on-time departure.',        '2025-05-01'),
  (2, 2, 1, 4, 'Good experience overall. Cabin crew was very friendly.',    '2025-05-01'),
  (3, 3, 3, 3, 'Flight was delayed by 2 hours. Announcements were unclear.','2025-05-02')
ON CONFLICT DO NOTHING;

-- ─── Fuel Logs ───────────────────────────────────────────────
INSERT INTO fuel_log (fuellog_id, flight_id, aircraft_id, fuel_loaded, fuel_consumed, fuel_date) VALUES
  (1, 1, 1,  12500.00, 11200.50, '2025-05-01'),
  (2, 2, 2,   9800.00,  8750.25, '2025-05-01'),
  (3, 3, 3,  85000.00,     NULL, '2025-05-01')
ON CONFLICT DO NOTHING;

-- ─── Maintenance Logs ────────────────────────────────────────
INSERT INTO maintenance_log (s_no, date, title, remark, emp_id, aircraft_id, maintenance_type) VALUES
  (1, '2025-04-28', 'Routine A-Check',             'All systems nominal. Cleared for operations.',    8, 2, 'Scheduled'),
  (2, '2025-04-30', 'Engine Oil Leak Fix',          'Minor oil leak detected in engine 2 and fixed.', 8, 5, 'Unscheduled'),
  (3, '2025-04-15', 'Cabin Pressurization Check',   'Pressure seals replaced. Aircraft cleared.',     8, 4, 'Scheduled')
ON CONFLICT DO NOTHING;

-- ─── Reset all SERIAL sequences ──────────────────────────────
SELECT setval('aircraft_aircraft_id_seq',      (SELECT MAX(aircraft_id)   FROM aircraft));
SELECT setval('employee_emp_id_seq',           (SELECT MAX(emp_id)        FROM employee));
SELECT setval('flight_flight_id_seq',          (SELECT MAX(flight_id)     FROM flight));
SELECT setval('flight_schedule_schedule_id_seq',(SELECT MAX(schedule_id)  FROM flight_schedule));
SELECT setval('duty_log_duty_id_seq',          (SELECT MAX(duty_id)       FROM duty_log));
SELECT setval('passenger_passenger_id_seq',    (SELECT MAX(passenger_id)  FROM passenger));
SELECT setval('reservation_pnr_id_seq',        (SELECT MAX(pnr_id)        FROM reservation));
SELECT setval('feedback_feedback_id_seq',      (SELECT MAX(feedback_id)   FROM feedback));
SELECT setval('fuel_log_fuellog_id_seq',       (SELECT MAX(fuellog_id)    FROM fuel_log));
SELECT setval('maintenance_log_s_no_seq',      (SELECT MAX(s_no)          FROM maintenance_log));
