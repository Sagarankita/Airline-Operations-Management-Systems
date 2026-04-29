import { DashboardLayout } from "../../layouts/DashboardLayout";
import { Breadcrumb } from "../../shared/Breadcrumb";
import { StatusBadge } from "../../shared/StatusBadge";
import { LoadingState, ErrorState, EmptyState } from "../../shared/ApiStates";
import { useFetch } from "../../../../lib/useApi";
import { Home, Users, AlertTriangle, Plane } from "lucide-react";
import { useNavigate } from "react-router";

export default function GroundStaffDashboard() {
  const navigate = useNavigate();
  const userName = sessionStorage.getItem("userEmail")?.split("@")[0] || "Staff";

  const { data: flightsData, loading, error, refetch } = useFetch<any[]>('/flights?limit=50');
  const allFlights: any[] = flightsData ?? [];
  const upcomingFlights = allFlights.filter(f => f.status === 'Scheduled' || f.status === 'Boarding');

  const navItems = [
    { label: "Dashboard", path: "/ground-staff", icon: <Home className="w-5 h-5" /> },
    { label: "Passenger List", path: "/ground-staff/passengers", icon: <Users className="w-5 h-5" /> },
    { label: "Active Boarding", path: "/ground-staff/boarding", icon: <AlertTriangle className="w-5 h-5" /> },
  ];

  return (
    <DashboardLayout role="Ground Staff" userName={userName} navItems={navItems}>
      <Breadcrumb items={[{ label: "Dashboard" }]} />
      
      <h1 className="text-3xl mb-6" style={{ color: "#1B2A4A", fontWeight: 600 }}>
        Ground Operations Dashboard
      </h1>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <button
          onClick={() => navigate("/ground-staff/passengers")}
          className="bg-white p-6 shadow-sm hover:shadow-md transition-all text-left"
          style={{ borderRadius: "8px" }}
        >
          <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4" style={{ backgroundColor: "#2E86DE15", color: "#2E86DE" }}>
            <Users className="w-6 h-6" />
          </div>
          <h3 className="mb-2" style={{ color: "#1B2A4A", fontWeight: 600 }}>Passenger Manifest</h3>
          <p className="text-sm text-gray-600">View passenger lists and boarding status flight-wise</p>
        </button>

        <button
          onClick={() => navigate("/ground-staff/boarding")}
          className="bg-white p-6 shadow-sm hover:shadow-md transition-all text-left"
          style={{ borderRadius: "8px" }}
        >
          <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4" style={{ backgroundColor: "#27AE6015", color: "#27AE60" }}>
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="mb-2" style={{ color: "#1B2A4A", fontWeight: 600 }}>Active Boarding</h3>
          <p className="text-sm text-gray-600">Check in passengers and close boarding</p>
        </button>
      </div>

      {/* Upcoming & Active Flights */}
      <div className="bg-white shadow-sm overflow-hidden" style={{ borderRadius: "8px" }}>
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <Plane className="w-5 h-5" style={{ color: "#2E86DE" }} />
          <h2 className="text-lg" style={{ color: "#1B2A4A", fontWeight: 600 }}>Scheduled &amp; Boarding Flights</h2>
        </div>
        {loading && <LoadingState message="Loading flights..." />}
        {error   && <ErrorState message={error} onRetry={refetch} />}
        {!loading && !error && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead style={{ backgroundColor: "#F9FAFB" }}>
                <tr>
                  <th className="px-6 py-3 text-left text-sm" style={{ color: "#1B2A4A", fontWeight: 600 }}>Flight #</th>
                  <th className="px-6 py-3 text-left text-sm" style={{ color: "#1B2A4A", fontWeight: 600 }}>Route</th>
                  <th className="px-6 py-3 text-left text-sm" style={{ color: "#1B2A4A", fontWeight: 600 }}>Departure</th>
                  <th className="px-6 py-3 text-left text-sm" style={{ color: "#1B2A4A", fontWeight: 600 }}>Aircraft</th>
                  <th className="px-6 py-3 text-left text-sm" style={{ color: "#1B2A4A", fontWeight: 600 }}>Status</th>
                  <th className="px-6 py-3 text-left text-sm" style={{ color: "#1B2A4A", fontWeight: 600 }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {upcomingFlights.length === 0 ? (
                  <tr><td colSpan={6}><EmptyState message="No upcoming flights." /></td></tr>
                ) : upcomingFlights.map((f: any, i: number) => (
                  <tr key={f.flight_id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="px-6 py-3 text-sm" style={{ color: "#1B2A4A", fontWeight: 500 }}>#{f.flight_id}</td>
                    <td className="px-6 py-3 text-sm text-gray-600">{f.source_airport_code} → {f.dest_airport_code}</td>
                    <td className="px-6 py-3 text-sm text-gray-600">{new Date(f.departure_time).toLocaleString()}</td>
                    <td className="px-6 py-3 text-sm text-gray-600">{f.aircraft_model}</td>
                    <td className="px-6 py-3 text-sm"><StatusBadge status={f.status} variant="small" /></td>
                    <td className="px-6 py-3 text-sm">
                      <button
                        onClick={() => navigate("/ground-staff/boarding")}
                        className="text-[#2E86DE] hover:underline text-sm"
                      >
                        Manage Boarding
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
