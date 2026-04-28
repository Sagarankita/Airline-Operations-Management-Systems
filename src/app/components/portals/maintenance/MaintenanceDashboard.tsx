import { DashboardLayout } from "../../layouts/DashboardLayout";
import { Breadcrumb } from "../../shared/Breadcrumb";
import { Home, Wrench, History } from "lucide-react";
import { useNavigate } from "react-router";

export default function MaintenanceDashboard() {
  const navigate = useNavigate();
  const userName = sessionStorage.getItem("userEmail")?.split("@")[0] || "Engineer";

  const navItems = [
    { label: "Dashboard", path: "/maintenance", icon: <Home className="w-5 h-5" /> },
    { label: "Record Maintenance", path: "/maintenance/record", icon: <Wrench className="w-5 h-5" /> },
    { label: "Maintenance History", path: "/maintenance/history", icon: <History className="w-5 h-5" /> },
  ];

  const recentLogs = [
    {
      date: "2026-04-04",
      aircraft: "N12345 - B777-300",
      type: "Engine Maintenance",
      duration: "6.5 hrs",
    },
    {
      date: "2026-04-02",
      aircraft: "N12345 - B777-300",
      type: "Routine Inspection",
      duration: "3.0 hrs",
    },
    {
      date: "2026-03-28",
      aircraft: "N67890 - A380-800",
      type: "Avionics",
      duration: "4.5 hrs",
    },
  ];

  return (
    <DashboardLayout role="Maintenance Engineer" userName={userName} navItems={navItems}>
      <Breadcrumb items={[{ label: "Dashboard" }]} />
      
      <h1 className="text-3xl mb-6" style={{ color: "#1B2A4A", fontWeight: 600 }}>
        Welcome, {userName.charAt(0).toUpperCase() + userName.slice(1)}!
      </h1>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <button
          onClick={() => navigate("/maintenance/record")}
          className="bg-white p-6 shadow-sm hover:shadow-md transition-all text-left"
          style={{ borderRadius: "8px" }}
        >
          <div
            className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
            style={{ backgroundColor: "#27AE6015", color: "#27AE60" }}
          >
            <Wrench className="w-6 h-6" />
          </div>
          <h3 className="mb-2" style={{ color: "#1B2A4A", fontWeight: 600 }}>
            Record Maintenance
          </h3>
          <p className="text-sm text-gray-600">Log new maintenance activities and repairs</p>
        </button>

        <button
          onClick={() => navigate("/maintenance/history")}
          className="bg-white p-6 shadow-sm hover:shadow-md transition-all text-left"
          style={{ borderRadius: "8px" }}
        >
          <div
            className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
            style={{ backgroundColor: "#2E86DE15", color: "#2E86DE" }}
          >
            <History className="w-6 h-6" />
          </div>
          <h3 className="mb-2" style={{ color: "#1B2A4A", fontWeight: 600 }}>
            Maintenance History
          </h3>
          <p className="text-sm text-gray-600">View past maintenance records and reports</p>
        </button>
      </div>

      {/* Recent Maintenance Logs */}
      <div className="bg-white p-6 shadow-sm" style={{ borderRadius: "8px" }}>
        <h2 className="text-xl mb-4" style={{ color: "#1B2A4A", fontWeight: 600 }}>
          Recent Maintenance Logs
        </h2>
        <div className="space-y-3">
          {recentLogs.map((log, index) => (
            <div
              key={index}
              className="p-4 border border-gray-200 rounded-lg hover:border-[#2E86DE] transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p style={{ color: "#1B2A4A", fontWeight: 600 }}>
                    {log.aircraft} - {log.type}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {log.date} | Duration: {log.duration}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
