import { DashboardLayout } from "../../layouts/DashboardLayout";
import { Breadcrumb } from "../../shared/Breadcrumb";
import { LoadingState, ErrorState, EmptyState } from "../../shared/ApiStates";
import { useFetch } from "../../../../lib/useApi";
import { session } from "../../../../lib/session";
import { Home, User, MessageSquare, Plane } from "lucide-react";
import { useNavigate } from "react-router";

const FLIGHT_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  Scheduled:  { bg: '#EBF5FB', text: '#2E86DE' },
  Boarding:   { bg: '#E8F8F5', text: '#27AE60' },
  Departed:   { bg: '#FEF9E7', text: '#F39C12' },
  En_Route:   { bg: '#FEF9E7', text: '#F39C12' },
  Landed:     { bg: '#E8F8F5', text: '#27AE60' },
  Delayed:    { bg: '#FDEDEC', text: '#E74C3C' },
  Cancelled:  { bg: '#F2F3F4', text: '#7F8C8D' },
  Completed:  { bg: '#F2F3F4', text: '#7F8C8D' },
};

export default function PassengerDashboard() {
  const navigate = useNavigate();
  const userName = sessionStorage.getItem("userEmail")?.split("@")[0] || "Passenger";
  const passengerId = session.getPassengerId();

  const { data: profile } = useFetch<any>(passengerId ? `/passengers/${passengerId}` : null);
  const { data: reservations, loading, error, refetch } = useFetch<any[]>(
    passengerId ? `/passengers/${passengerId}/reservations?limit=10` : null
  );
  const bookings: any[] = reservations ?? [];

  const navItems = [
    { label: "Dashboard", path: "/passenger", icon: <Home className="w-5 h-5" /> },
    { label: "My Profile", path: "/passenger/profile", icon: <User className="w-5 h-5" /> },
    { label: "Feedback", path: "/passenger/feedback", icon: <MessageSquare className="w-5 h-5" /> },
  ];

  const displayName = profile?.name ?? (userName.charAt(0).toUpperCase() + userName.slice(1));

  return (
    <DashboardLayout role="Passenger" userName={userName} navItems={navItems}>
      <Breadcrumb items={[{ label: "Dashboard" }]} />
      
      <h1 className="text-3xl mb-6" style={{ color: "#1B2A4A", fontWeight: 600 }}>
        Welcome back, {displayName}!
      </h1>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <QuickLinkCard
          icon={<User className="w-6 h-6" />}
          title="My Profile"
          description="View and edit your personal information"
          onClick={() => navigate("/passenger/profile")}
        />
        <QuickLinkCard
          icon={<MessageSquare className="w-6 h-6" />}
          title="Submit Feedback"
          description="Rate flights you have travelled on"
          onClick={() => navigate("/passenger/feedback")}
        />
      </div>

      {/* My Bookings */}
      <div className="bg-white shadow-sm overflow-hidden" style={{ borderRadius: "8px" }}>
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <Plane className="w-5 h-5" style={{ color: "#2E86DE" }} />
          <h2 className="text-lg" style={{ color: "#1B2A4A", fontWeight: 600 }}>My Bookings</h2>
        </div>
        {loading && <LoadingState message="Loading bookings..." />}
        {error   && <ErrorState message={error} onRetry={refetch} />}
        {!loading && !error && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead style={{ backgroundColor: "#F9FAFB" }}>
                <tr>
                  <th className="px-6 py-3 text-left text-sm" style={{ color: "#1B2A4A", fontWeight: 600 }}>Flight</th>
                  <th className="px-6 py-3 text-left text-sm" style={{ color: "#1B2A4A", fontWeight: 600 }}>Route</th>
                  <th className="px-6 py-3 text-left text-sm" style={{ color: "#1B2A4A", fontWeight: 600 }}>Departure</th>
                  <th className="px-6 py-3 text-left text-sm" style={{ color: "#1B2A4A", fontWeight: 600 }}>Seat</th>
                  <th className="px-6 py-3 text-left text-sm" style={{ color: "#1B2A4A", fontWeight: 600 }}>Booking Status</th>
                  <th className="px-6 py-3 text-left text-sm" style={{ color: "#1B2A4A", fontWeight: 600 }}>Flight Status</th>
                </tr>
              </thead>
              <tbody>
                {bookings.length === 0 ? (
                  <tr><td colSpan={6}><EmptyState message="No bookings found." /></td></tr>
                ) : bookings.map((b: any, i: number) => {
                  const flightColors = FLIGHT_STATUS_COLORS[b.flight_status] ?? { bg: '#F2F3F4', text: '#7F8C8D' };
                  return (
                    <tr key={b.pnr_id ?? i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <td className="px-6 py-3 text-sm" style={{ color: "#1B2A4A", fontWeight: 500 }}>#{b.flight_id}</td>
                      <td className="px-6 py-3 text-sm text-gray-600">{b.source_airport_code} → {b.dest_airport_code}</td>
                      <td className="px-6 py-3 text-sm text-gray-600">{b.departure_time ? new Date(b.departure_time).toLocaleString() : '—'}</td>
                      <td className="px-6 py-3 text-sm text-gray-600">{b.seat_no}</td>
                      <td className="px-6 py-3 text-sm">
                        <span className="px-2 py-1 rounded text-xs" style={{ backgroundColor: '#EBF5FB', color: '#2E86DE', fontWeight: 500 }}>{b.reservation_status}</span>
                      </td>
                      <td className="px-6 py-3 text-sm">
                        <span className="px-2 py-1 rounded text-xs" style={{ backgroundColor: flightColors.bg, color: flightColors.text, fontWeight: 500 }}>{b.flight_status ?? '—'}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

interface QuickLinkCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}

function QuickLinkCard({ icon, title, description, onClick }: QuickLinkCardProps) {
  return (
    <button
      onClick={onClick}
      className="bg-white p-6 shadow-sm hover:shadow-md transition-all text-left"
      style={{ borderRadius: "8px" }}
    >
      <div
        className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
        style={{ backgroundColor: "#2E86DE15", color: "#2E86DE" }}
      >
        {icon}
      </div>
      <h3 className="mb-2" style={{ color: "#1B2A4A", fontWeight: 600 }}>
        {title}
      </h3>
      <p className="text-sm text-gray-600">{description}</p>
    </button>
  );
}
