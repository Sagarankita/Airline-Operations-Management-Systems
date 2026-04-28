import { DashboardLayout } from "../../layouts/DashboardLayout";
import { Breadcrumb } from "../../shared/Breadcrumb";
import { Home, Fuel } from "lucide-react";
import { useNavigate } from "react-router";

export default function FuelStaffDashboard() {
  const navigate = useNavigate();
  const userName = sessionStorage.getItem("userEmail")?.split("@")[0] || "Fuel Staff";

  const navItems = [
    { label: "Dashboard", path: "/fuel-staff", icon: <Home className="w-5 h-5" /> },
    { label: "Record Fuel Log", path: "/fuel-staff/log", icon: <Fuel className="w-5 h-5" /> },
  ];

  const todaysSummary = {
    totalLitres: 185000,
    flightsFuelled: 12,
    lastUpdate: "14:30",
  };

  const recentLogs = [
    {
      time: "14:30",
      aircraft: "N12345",
      flight: "AO101",
      fuelType: "Jet-A1",
      quantity: 50000,
    },
    {
      time: "12:15",
      aircraft: "N67890",
      flight: "AO202",
      fuelType: "Jet-A1",
      quantity: 35000,
    },
    {
      time: "10:00",
      aircraft: "N24680",
      flight: "AO303",
      fuelType: "SAF",
      quantity: 45000,
    },
  ];

  return (
    <DashboardLayout role="Fuel Staff" userName={userName} navItems={navItems}>
      <Breadcrumb items={[{ label: "Dashboard" }]} />
      
      <h1 className="text-3xl mb-6" style={{ color: "#1B2A4A", fontWeight: 600 }}>
        Welcome, {userName.charAt(0).toUpperCase() + userName.slice(1)}!
      </h1>

      {/* Today's Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-6 shadow-sm" style={{ borderRadius: "8px" }}>
          <p className="text-sm text-gray-600 mb-2">Total Fuel Today</p>
          <p className="text-3xl" style={{ color: "#2E86DE", fontWeight: 700 }}>
            {todaysSummary.totalLitres.toLocaleString()} L
          </p>
        </div>

        <div className="bg-white p-6 shadow-sm" style={{ borderRadius: "8px" }}>
          <p className="text-sm text-gray-600 mb-2">Flights Fuelled</p>
          <p className="text-3xl" style={{ color: "#27AE60", fontWeight: 700 }}>
            {todaysSummary.flightsFuelled}
          </p>
        </div>

        <div className="bg-white p-6 shadow-sm" style={{ borderRadius: "8px" }}>
          <p className="text-sm text-gray-600 mb-2">Last Update</p>
          <p className="text-3xl" style={{ color: "#1B2A4A", fontWeight: 700 }}>
            {todaysSummary.lastUpdate}
          </p>
        </div>
      </div>

      {/* Quick Action */}
      <button
        onClick={() => navigate("/fuel-staff/log")}
        className="w-full bg-white p-6 shadow-sm hover:shadow-md transition-all text-left mb-6"
        style={{ borderRadius: "8px" }}
      >
        <div
          className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
          style={{ backgroundColor: "#F39C1215", color: "#F39C12" }}
        >
          <Fuel className="w-6 h-6" />
        </div>
        <h3 className="mb-2" style={{ color: "#1B2A4A", fontWeight: 600 }}>
          Record Fuel Log
        </h3>
        <p className="text-sm text-gray-600">Log new fuelling operations</p>
      </button>

      {/* Recent Logs */}
      <div className="bg-white p-6 shadow-sm" style={{ borderRadius: "8px" }}>
        <h2 className="text-xl mb-4" style={{ color: "#1B2A4A", fontWeight: 600 }}>
          Today's Fuelling Log
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead style={{ backgroundColor: "#F9FAFB" }}>
              <tr>
                <th className="px-4 py-3 text-left text-sm" style={{ color: "#1B2A4A", fontWeight: 600 }}>
                  Time
                </th>
                <th className="px-4 py-3 text-left text-sm" style={{ color: "#1B2A4A", fontWeight: 600 }}>
                  Aircraft
                </th>
                <th className="px-4 py-3 text-left text-sm" style={{ color: "#1B2A4A", fontWeight: 600 }}>
                  Flight
                </th>
                <th className="px-4 py-3 text-left text-sm" style={{ color: "#1B2A4A", fontWeight: 600 }}>
                  Fuel Type
                </th>
                <th className="px-4 py-3 text-left text-sm" style={{ color: "#1B2A4A", fontWeight: 600 }}>
                  Quantity (L)
                </th>
              </tr>
            </thead>
            <tbody>
              {recentLogs.map((log, index) => (
                <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="px-4 py-3 text-sm" style={{ color: "#1B2A4A", fontWeight: 500 }}>
                    {log.time}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{log.aircraft}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{log.flight}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{log.fuelType}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {log.quantity.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
