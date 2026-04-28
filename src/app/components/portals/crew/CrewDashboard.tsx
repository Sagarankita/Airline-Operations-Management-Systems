import { DashboardLayout } from "../../layouts/DashboardLayout";
import { Breadcrumb } from "../../shared/Breadcrumb";
import { StatusBadge } from "../../shared/StatusBadge";
import { Home, Plane, Calendar, FileText } from "lucide-react";
import { useNavigate } from "react-router";

export default function CrewDashboard() {
  const navigate = useNavigate();
  const userName = sessionStorage.getItem("userEmail")?.split("@")[0] || "Crew";

  const navItems = [
    { label: "Dashboard", path: "/crew", icon: <Home className="w-5 h-5" /> },
    { label: "Update Status", path: "/crew/update-status", icon: <Plane className="w-5 h-5" /> },
    { label: "Assigned Flights", path: "/crew/flights", icon: <Calendar className="w-5 h-5" /> },
    { label: "Duty Log", path: "/crew/duty-log", icon: <FileText className="w-5 h-5" /> },
  ];

  const upcomingFlights = [
    {
      flightNo: "AO101",
      route: "JFK → LHR",
      departure: "2026-04-06 08:00",
      aircraft: "B777-300",
      status: "Active",
    },
    {
      flightNo: "AO505",
      route: "LHR → DXB",
      departure: "2026-04-08 14:30",
      aircraft: "A380-800",
      status: "Pending",
    },
    {
      flightNo: "AO707",
      route: "DXB → SIN",
      departure: "2026-04-10 22:00",
      aircraft: "B787-9",
      status: "Pending",
    },
  ];

  return (
    <DashboardLayout role="Pilot / Cabin Crew" userName={userName} navItems={navItems}>
      <Breadcrumb items={[{ label: "Dashboard" }]} />
      
      <h1 className="text-3xl mb-6" style={{ color: "#1B2A4A", fontWeight: 600 }}>
        Welcome, {userName.charAt(0).toUpperCase() + userName.slice(1)}!
      </h1>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <button
          onClick={() => navigate("/crew/update-status")}
          className="bg-white p-6 shadow-sm hover:shadow-md transition-all text-left"
          style={{ borderRadius: "8px" }}
        >
          <div
            className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
            style={{ backgroundColor: "#2E86DE15", color: "#2E86DE" }}
          >
            <Plane className="w-6 h-6" />
          </div>
          <h3 className="mb-2" style={{ color: "#1B2A4A", fontWeight: 600 }}>
            Update Flight Status
          </h3>
          <p className="text-sm text-gray-600">Update the status of your current flight</p>
        </button>

        <button
          onClick={() => navigate("/crew/duty-log")}
          className="bg-white p-6 shadow-sm hover:shadow-md transition-all text-left"
          style={{ borderRadius: "8px" }}
        >
          <div
            className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
            style={{ backgroundColor: "#27AE6015", color: "#27AE60" }}
          >
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="mb-2" style={{ color: "#1B2A4A", fontWeight: 600 }}>
            Log Duty Details
          </h3>
          <p className="text-sm text-gray-600">Record your duty hours and observations</p>
        </button>
      </div>

      {/* Upcoming Flights */}
      <div className="bg-white p-6 shadow-sm" style={{ borderRadius: "8px" }}>
        <h2 className="text-xl mb-4" style={{ color: "#1B2A4A", fontWeight: 600 }}>
          Your Upcoming Flights
        </h2>
        <div className="space-y-3">
          {upcomingFlights.map((flight) => (
            <div
              key={flight.flightNo}
              className="p-4 border border-gray-200 rounded-lg hover:border-[#2E86DE] transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p style={{ color: "#1B2A4A", fontWeight: 600 }}>
                    {flight.flightNo} - {flight.route}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Departure: {flight.departure} | Aircraft: {flight.aircraft}
                  </p>
                </div>
                <StatusBadge status={flight.status} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
