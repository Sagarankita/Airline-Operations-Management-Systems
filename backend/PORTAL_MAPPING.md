# Frontend Portal to Backend Module Mapping

This document maps each frontend portal route to its backend module.
Use this as the integration reference when wiring API calls in the frontend.

## Admin Portal (/admin)
| Frontend Page            | Backend Module(s)                                     |
|--------------------------|-------------------------------------------------------|
| /admin                   | Aggregate: flights/today, employees, aircraft, reservations, fuel |
| /admin/employees         | employees, pilot, cabin_crew, ground_staff             |
| /admin/flights           | flights, flight_schedule                              |
| /admin/aircraft          | aircraft                                              |
| /admin/crew-assignment   | crew_assignment (employees as source pool)            |
| /admin/delay-prediction  | flight_schedule (status analytics, delay trends)      |
| /admin/reports           | Cross-module aggregations with date-range filters     |

## Passenger Portal (/passenger)
| Frontend Page             | Backend Module(s)             |
|---------------------------|-------------------------------|
| /passenger                | reservations (upcoming), flights |
| /passenger/profile        | passenger                     |
| /passenger/profile/edit   | passenger (update)            |
| /passenger/feedback       | feedback                      |

## Crew Portal (/crew)
| Frontend Page             | Backend Module(s)                        |
|---------------------------|------------------------------------------|
| /crew                     | crew_assignment (upcoming), flights      |
| /crew/update-status       | crew_assignment (status update)          |
| /crew/duty-log            | duty_log                                 |

## Ground Staff Portal (/ground-staff)
| Frontend Page             | Backend Module(s)                          |
|---------------------------|--------------------------------------------|
| /ground-staff             | flights (today), reservations (summary)    |
| /ground-staff/boarding    | reservations, passenger (check-in update)  |
| /ground-staff/passengers  | passenger (search + view)                  |

## Maintenance Portal (/maintenance)
| Frontend Page             | Backend Module(s)                          |
|---------------------------|--------------------------------------------|
| /maintenance              | maintenance_log (summary), aircraft status |
| /maintenance/record       | maintenance_log (create / update)          |
| /maintenance/history      | maintenance_log (list + date filter)       |

## Fuel Staff Portal (/fuel-staff)
| Frontend Page             | Backend Module(s)                     |
|---------------------------|---------------------------------------|
| /fuel-staff               | fuel_log (summary), flights (today)   |
| /fuel-staff/log           | fuel_log (create / list)              |

## Auth (Login Page) — Implemented Last (Prompt 8)
| Frontend Page             | Backend Module(s)                                 |
|---------------------------|---------------------------------------------------|
| / (login)                 | users table, JWT issue / refresh                  |
| /role-routing             | Role claim from JWT maps to portal redirect       |
| All protected routes      | Authorization middleware (per-role scope guards)  |

## API Base URL Convention
- Development:  http://localhost:5000/api/v1
- Swagger Docs: http://localhost:5000/api-docs
