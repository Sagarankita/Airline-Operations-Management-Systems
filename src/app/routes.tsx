import { createBrowserRouter } from "react-router";
import LoginPage from "./components/LoginPage";
import RoleRoutingScreen from "./components/RoleRoutingScreen";
import Dashboard from "./components/Dashboard";

// Passenger Portal
import PassengerDashboard from "./components/portals/passenger/PassengerDashboard";
import PassengerProfile from "./components/portals/passenger/PassengerProfile";
import PassengerProfileEdit from "./components/portals/passenger/PassengerProfileEdit";
import PassengerFeedback from "./components/portals/passenger/PassengerFeedback";

// Administrator Portal
import AdminDashboard from "./components/portals/administrator/AdminDashboard";
import AdminEmployees from "./components/portals/administrator/AdminEmployees";
import AdminFlights from "./components/portals/administrator/AdminFlights";
import AdminAircraft from "./components/portals/administrator/AdminAircraft";
import AdminCrewAssignment from "./components/portals/administrator/AdminCrewAssignment";
import AdminDelayPrediction from "./components/portals/administrator/AdminDelayPrediction";

// Crew Portal
import CrewDashboard from "./components/portals/crew/CrewDashboard";
import CrewUpdateStatus from "./components/portals/crew/CrewUpdateStatus";
import CrewDutyLog from "./components/portals/crew/CrewDutyLog";

// Ground Staff Portal
import GroundStaffDashboard from "./components/portals/ground-staff/GroundStaffDashboard";
import GroundStaffBoarding from "./components/portals/ground-staff/GroundStaffBoarding";

// Maintenance Portal
import MaintenanceDashboard from "./components/portals/maintenance/MaintenanceDashboard";
import MaintenanceRecord from "./components/portals/maintenance/MaintenanceRecord";
import MaintenanceHistory from "./components/portals/maintenance/MaintenanceHistory";

// Fuel Staff Portal
import FuelStaffDashboard from "./components/portals/fuel-staff/FuelStaffDashboard";
import FuelStaffLog from "./components/portals/fuel-staff/FuelStaffLog";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: LoginPage,
  },
  {
    path: "/role-routing",
    Component: RoleRoutingScreen,
  },
  {
    path: "/dashboard",
    Component: Dashboard,
  },
  // Passenger Routes
  {
    path: "/passenger",
    Component: PassengerDashboard,
  },
  {
    path: "/passenger/profile",
    Component: PassengerProfile,
  },
  {
    path: "/passenger/profile/edit",
    Component: PassengerProfileEdit,
  },
  {
    path: "/passenger/feedback",
    Component: PassengerFeedback,
  },
  // Admin Routes
  {
    path: "/admin",
    Component: AdminDashboard,
  },
  {
    path: "/admin/employees",
    Component: AdminEmployees,
  },
  {
    path: "/admin/flights",
    Component: AdminFlights,
  },
  {
    path: "/admin/aircraft",
    Component: AdminAircraft,
  },
  {
    path: "/admin/delay-prediction",
    Component: AdminDelayPrediction,
  },
  {
    path: "/admin/crew-assignment",
    Component: AdminCrewAssignment,
  },
  {
    path: "/admin/reports",
    Component: AdminDashboard, // Placeholder
  },
  // Crew Routes
  {
    path: "/crew",
    Component: CrewDashboard,
  },
  {
    path: "/crew/update-status",
    Component: CrewUpdateStatus,
  },
  {
    path: "/crew/flights",
    Component: CrewDashboard, // Placeholder
  },
  {
    path: "/crew/duty-log",
    Component: CrewDutyLog,
  },
  // Ground Staff Routes
  {
    path: "/ground-staff",
    Component: GroundStaffDashboard,
  },
  {
    path: "/ground-staff/passengers",
    Component: GroundStaffBoarding,
  },
  {
    path: "/ground-staff/boarding",
    Component: GroundStaffBoarding,
  },
  // Maintenance Routes
  {
    path: "/maintenance",
    Component: MaintenanceDashboard,
  },
  {
    path: "/maintenance/record",
    Component: MaintenanceRecord,
  },
  {
    path: "/maintenance/history",
    Component: MaintenanceHistory,
  },
  // Fuel Staff Routes
  {
    path: "/fuel-staff",
    Component: FuelStaffDashboard,
  },
  {
    path: "/fuel-staff/log",
    Component: FuelStaffLog,
  },
]);