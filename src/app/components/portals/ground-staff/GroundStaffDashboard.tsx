import { DashboardLayout } from "../../layouts/DashboardLayout";
import { Breadcrumb } from "../../shared/Breadcrumb";
import { StatusBadge } from "../../shared/StatusBadge";
import { Home, Users, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router";

export default function GroundStaffDashboard() {
  const navigate = useNavigate();
  const userName = sessionStorage.getItem("userEmail")?.split("@")[0] || "Staff";

  const navItems = [
    { label: "Dashboard", path: "/ground-staff", icon: <Home className="w-5 h-5" /> },
    { label: "Passenger List", path: "/ground-staff/passengers", icon: <Users className="w-5 h-5" /> },
    { label: "Active Boarding", path: "/ground-staff/boarding", icon: <AlertTriangle className="w-5 h-5" /> },
  ];

  const todaysFlights = [
    {
      flightNo: "AO101",
      route: "JFK → LHR",
      departure: "08:00",
      gate: "A12",
      status: "Boarding",
      boarded: 245,
      total: 396,
    },
    {
      flightNo: "AO202",
      route: "LHR → CDG",
      departure: "14:30",
      gate: "B5",
      status: "Pending",
      boarded: 0,
      total: 180,
    },
    {
      flightNo: "AO303",
      route: "CDG → DXB",
      departure: "18:00",
      gate: "C3",
      status: "Active",
      boarded: 0,
      total: 525,
    },
  ];

  return (
    <DashboardLayout role="Ground Staff" userName={userName} navItems={navItems}>
      <Breadcrumb items={[{ label: "Dashboard" }]} />
      
      <h1 className="text-3xl mb-6" style={{ color: "#1B2A4A", fontWeight: 600 }}>
        Welcome, {userName.charAt(0).toUpperCase() + userName.slice(1)}!
      </h1>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <button
          onClick={() => navigate("/ground-staff/passengers")}
          className="bg-white p-6 shadow-sm hover:shadow-md transition-all text-left"
          style={{ borderRadius: "8px" }}
        >
          <div
            className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
            style={{ backgroundColor: "#2E86DE15", color: "#2E86DE" }}
          >
            <Users className="w-6 h-6" />
          </div>
          <h3 className="mb-2" style={{ color: "#1B2A4A", fontWeight: 600 }}>
            Passenger List
          </h3>
          <p className="text-sm text-gray-600">View passenger manifests and boarding status</p>
        </button>

        <button
          onClick={() => navigate("/ground-staff/boarding")}
          className="bg-white p-6 shadow-sm hover:shadow-md transition-all text-left"
          style={{ borderRadius: "8px" }}
        >
          <div
            className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
            style={{ backgroundColor: "#27AE6015", color: "#27AE60" }}
          >
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="mb-2" style={{ color: "#1B2A4A", fontWeight: 600 }}>
            Active Boarding
          </h3>
          <p className="text-sm text-gray-600">Manage active boarding operations</p>
        </button>
      </div>

      {/* Today's Flights */}
      <div className="bg-white p-6 shadow-sm" style={{ borderRadius: "8px" }}>
        <h2 className="text-xl mb-4" style={{ color: "#1B2A4A", fontWeight: 600 }}>
          Today's Flights
        </h2>
        <div className="space-y-3">
          {todaysFlights.map((flight) => (
            <div
              key={flight.flightNo}
              className="p-4 border border-gray-200 rounded-lg hover:border-[#2E86DE] transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <p style={{ color: "#1B2A4A", fontWeight: 600 }}>
                      {flight.flightNo} - {flight.route}
                    </p>
                    <StatusBadge status={flight.status} variant="small" />
                  </div>
                  <p className="text-sm text-gray-600">
                    Gate {flight.gate} | Departure: {flight.departure}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl" style={{ color: "#2E86DE", fontWeight: 700 }}>
                    {flight.boarded}/{flight.total}
                  </p>
                  <p className="text-xs text-gray-600">Boarded</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
