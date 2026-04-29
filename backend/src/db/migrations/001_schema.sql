-- =============================================================
-- 001_schema.sql  |  Airline Operations Management System
-- =============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================
-- ENUM TYPES
-- =============================================================

CREATE TYPE gender_type AS ENUM ('Male', 'Female', 'Other');

CREATE TYPE fitness_type AS ENUM ('Fit', 'Unfit', 'Conditional');

CREATE TYPE pilot_rank AS ENUM (
  'Captain', 'First Officer', 'Second Officer', 'Cadet'
);

CREATE TYPE employee_role AS ENUM (
  'Pilot', 'Cabin_Crew', 'Ground_Staff', 'Maintenance', 'Fuel_Staff', 'Admin'
);

CREATE TYPE employee_status AS ENUM (
  'Active', 'On_Leave', 'Inactive', 'Terminated'
);

CREATE TYPE aircraft_status AS ENUM ('Active', 'In_Maintenance', 'Retired');

CREATE TYPE flight_status AS ENUM (
  'Scheduled', 'Boarding', 'Delayed', 'Cancelled', 'Completed'
);

CREATE TYPE passenger_status AS ENUM ('Active', 'Blacklisted', 'Inactive');

CREATE TYPE reservation_status AS ENUM (
  'Confirmed', 'Waitlisted', 'Checked_In', 'Cancelled', 'Completed'
);

CREATE TYPE maintenance_type AS ENUM (
  'Scheduled', 'Unscheduled', 'Emergency'
);

-- =============================================================
-- MASTER TABLES
-- =============================================================

CREATE TABLE airport (
  airport_code  VARCHAR(10)  PRIMARY KEY,
  name          VARCHAR(200) NOT NULL,
  city          VARCHAR(100) NOT NULL,
  country       VARCHAR(100) NOT NULL,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE aircraft (
  aircraft_id      SERIAL          PRIMARY KEY,
  model            VARCHAR(100)    NOT NULL,
  manufacturer     VARCHAR(100)    NOT NULL,
  weight_capacity  INT             NOT NULL,
  range_km         INT             NOT NULL,
  status           aircraft_status NOT NULL DEFAULT 'Active',
  created_at       TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_aircraft_capacity CHECK (weight_capacity > 0),
  CONSTRAINT chk_aircraft_range    CHECK (range_km > 0)
);

-- =============================================================
-- EMPLOYEE DOMAIN
-- =============================================================

CREATE TABLE employee (
  emp_id     SERIAL          PRIMARY KEY,
  name       VARCHAR(200)    NOT NULL,
  gender     gender_type     NOT NULL,
  dob        DATE            NOT NULL,
  doj        DATE            NOT NULL,
  role       employee_role   NOT NULL,
  contact    VARCHAR(20)     NOT NULL,
  status     employee_status NOT NULL DEFAULT 'Active',
  created_at TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_emp_contact UNIQUE (contact),
  CONSTRAINT chk_emp_dob    CHECK  (dob < CURRENT_DATE),
  CONSTRAINT chk_emp_age    CHECK  (doj >= dob + INTERVAL '18 years')
);

CREATE TABLE pilot (
  emp_id             INT          PRIMARY KEY
                       REFERENCES employee(emp_id) ON DELETE CASCADE,
  passport_no        VARCHAR(50)  NOT NULL,
  license_number     VARCHAR(50)  NOT NULL,
  fitness            fitness_type NOT NULL DEFAULT 'Fit',
  total_flight_hours INT          NOT NULL DEFAULT 0,
  rank               pilot_rank   NOT NULL DEFAULT 'Cadet',
  base_airport       VARCHAR(10)
                       REFERENCES airport(airport_code) ON DELETE SET NULL,
  CONSTRAINT uq_pilot_passport UNIQUE (passport_no),
  CONSTRAINT uq_pilot_license  UNIQUE (license_number),
  CONSTRAINT chk_pilot_hours   CHECK  (total_flight_hours >= 0)
);

CREATE TABLE cabin_crew (
  emp_id          INT          PRIMARY KEY
                    REFERENCES employee(emp_id) ON DELETE CASCADE,
  passport_no     VARCHAR(50)  NOT NULL,
  fitness         fitness_type NOT NULL DEFAULT 'Fit',
  base_airport    VARCHAR(10)
                    REFERENCES airport(airport_code) ON DELETE SET NULL,
  total_exp_years INT          NOT NULL DEFAULT 0,
  CONSTRAINT uq_cabin_crew_passport UNIQUE (passport_no),
  CONSTRAINT chk_cabin_crew_exp     CHECK  (total_exp_years >= 0)
);

CREATE TABLE ground_staff (
  emp_id     INT          PRIMARY KEY
               REFERENCES employee(emp_id) ON DELETE CASCADE,
  department VARCHAR(100) NOT NULL,
  shift_time VARCHAR(50)  NOT NULL
);

-- =============================================================
-- FLIGHT OPERATIONS
-- =============================================================

CREATE TABLE flight (
  flight_id           SERIAL      PRIMARY KEY,
  aircraft_id         INT         NOT NULL REFERENCES aircraft(aircraft_id),
  departure_time      TIMESTAMPTZ NOT NULL,
  arrival_time        TIMESTAMPTZ NOT NULL,
  source_airport_code VARCHAR(10) NOT NULL REFERENCES airport(airport_code),
  dest_airport_code   VARCHAR(10) NOT NULL REFERENCES airport(airport_code),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_flight_airports CHECK (source_airport_code <> dest_airport_code),
  CONSTRAINT chk_flight_times    CHECK (arrival_time > departure_time)
);

CREATE TABLE flight_schedule (
  schedule_id   SERIAL        PRIMARY KEY,
  flight_id     INT           NOT NULL
                  REFERENCES flight(flight_id) ON DELETE CASCADE,
  schedule_date DATE          NOT NULL,
  status        flight_status NOT NULL DEFAULT 'Scheduled',
  delay_reason  VARCHAR(500),
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_flight_schedule UNIQUE (flight_id, schedule_date)
);

CREATE TABLE crew_assignment (
  emp_id          INT         NOT NULL
                    REFERENCES employee(emp_id) ON DELETE CASCADE,
  flight_id       INT         NOT NULL
                    REFERENCES flight(flight_id) ON DELETE CASCADE,
  assignment_date DATE        NOT NULL,
  role            VARCHAR(50) NOT NULL,
  PRIMARY KEY (emp_id, flight_id, assignment_date)
);

CREATE TABLE duty_log (
  duty_id    SERIAL      PRIMARY KEY,
  emp_id     INT         NOT NULL
               REFERENCES employee(emp_id) ON DELETE CASCADE,
  duty_start TIMESTAMPTZ NOT NULL,
  duty_end   TIMESTAMPTZ NOT NULL,
  rest_start TIMESTAMPTZ,
  rest_end   TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_duty_times CHECK (duty_end > duty_start),
  CONSTRAINT chk_rest_times CHECK (
    rest_end IS NULL
    OR (rest_start IS NOT NULL AND rest_end > rest_start)
  )
);

-- =============================================================
-- PASSENGER DOMAIN
-- =============================================================

CREATE TABLE passenger (
  passenger_id SERIAL           PRIMARY KEY,
  name         VARCHAR(200)     NOT NULL,
  gender       gender_type      NOT NULL,
  passport_no  VARCHAR(50),
  contact      VARCHAR(20)      NOT NULL,
  email        VARCHAR(200)     NOT NULL,
  status       passenger_status NOT NULL DEFAULT 'Active',
  created_at   TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_passenger_passport UNIQUE (passport_no),
  CONSTRAINT uq_passenger_contact  UNIQUE (contact),
  CONSTRAINT uq_passenger_email    UNIQUE (email)
);

CREATE TABLE reservation (
  pnr_id       SERIAL             PRIMARY KEY,
  passenger_id INT                NOT NULL
                 REFERENCES passenger(passenger_id),
  flight_id    INT                NOT NULL
                 REFERENCES flight(flight_id),
  seat_no      VARCHAR(10)        NOT NULL,
  booking_date DATE               NOT NULL DEFAULT CURRENT_DATE,
  status       reservation_status NOT NULL DEFAULT 'Confirmed',
  created_at   TIMESTAMPTZ        NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ        NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_reservation_seat UNIQUE (flight_id, seat_no)
);

CREATE TABLE feedback (
  feedback_id   SERIAL      PRIMARY KEY,
  passenger_id  INT         NOT NULL REFERENCES passenger(passenger_id),
  flight_id     INT         NOT NULL REFERENCES flight(flight_id),
  rating        SMALLINT    NOT NULL,
  comments      VARCHAR(2000),
  feedback_date DATE        NOT NULL DEFAULT CURRENT_DATE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_feedback_rating CHECK (rating BETWEEN 1 AND 5),
  CONSTRAINT uq_feedback_once    UNIQUE (passenger_id, flight_id)
);

-- =============================================================
-- OPERATIONAL LOGS
-- =============================================================

CREATE TABLE fuel_log (
  fuellog_id    SERIAL        PRIMARY KEY,
  flight_id     INT           NOT NULL REFERENCES flight(flight_id),
  aircraft_id   INT           NOT NULL REFERENCES aircraft(aircraft_id),
  fuel_loaded   NUMERIC(10,2) NOT NULL,
  fuel_consumed NUMERIC(10,2),
  fuel_date     DATE          NOT NULL DEFAULT CURRENT_DATE,
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_fuel_loaded   CHECK (fuel_loaded > 0),
  CONSTRAINT chk_fuel_consumed CHECK (fuel_consumed IS NULL OR fuel_consumed >= 0)
);

CREATE TABLE maintenance_log (
  s_no             SERIAL           PRIMARY KEY,
  date             DATE             NOT NULL,
  title            VARCHAR(200)     NOT NULL,
  remark           TEXT,
  emp_id           INT              NOT NULL REFERENCES employee(emp_id),
  aircraft_id      INT              NOT NULL REFERENCES aircraft(aircraft_id),
  maintenance_type maintenance_type NOT NULL DEFAULT 'Scheduled',
  created_at       TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);

-- =============================================================
-- PERFORMANCE INDEXES
-- =============================================================

CREATE INDEX idx_employee_role       ON employee(role);
CREATE INDEX idx_employee_status     ON employee(status);

CREATE INDEX idx_flight_departure    ON flight(departure_time);
CREATE INDEX idx_flight_arrival      ON flight(arrival_time);
CREATE INDEX idx_flight_source       ON flight(source_airport_code);
CREATE INDEX idx_flight_dest         ON flight(dest_airport_code);
CREATE INDEX idx_flight_aircraft     ON flight(aircraft_id);

CREATE INDEX idx_schedule_date       ON flight_schedule(schedule_date);
CREATE INDEX idx_schedule_status     ON flight_schedule(status);

CREATE INDEX idx_crew_assign_emp     ON crew_assignment(emp_id);
CREATE INDEX idx_crew_assign_flight  ON crew_assignment(flight_id);
CREATE INDEX idx_crew_assign_date    ON crew_assignment(assignment_date);

CREATE INDEX idx_duty_emp            ON duty_log(emp_id);
CREATE INDEX idx_duty_start          ON duty_log(duty_start);

CREATE INDEX idx_reservation_pax     ON reservation(passenger_id);
CREATE INDEX idx_reservation_flight  ON reservation(flight_id);
CREATE INDEX idx_reservation_status  ON reservation(status);

CREATE INDEX idx_feedback_flight     ON feedback(flight_id);
CREATE INDEX idx_feedback_pax        ON feedback(passenger_id);

CREATE INDEX idx_fuel_flight         ON fuel_log(flight_id);
CREATE INDEX idx_fuel_aircraft       ON fuel_log(aircraft_id);
CREATE INDEX idx_fuel_date           ON fuel_log(fuel_date);

CREATE INDEX idx_maint_aircraft      ON maintenance_log(aircraft_id);
CREATE INDEX idx_maint_date          ON maintenance_log(date);
CREATE INDEX idx_maint_emp           ON maintenance_log(emp_id);
