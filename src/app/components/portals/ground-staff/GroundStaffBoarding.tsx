import { useState } from "react";
import { DashboardLayout } from "../../layouts/DashboardLayout";
import { Breadcrumb } from "../../shared/Breadcrumb";
import { StatusBadge } from "../../shared/StatusBadge";
import { LoadingState, ErrorState, EmptyState } from "../../shared/ApiStates";
import { api } from "../../../../lib/api";
import { useFetch } from "../../../../lib/useApi";
import { Home, Users, AlertTriangle, Search } from "lucide-react";

export default function GroundStaffBoarding() {
  const userName = sessionStorage.getItem("userEmail")?.split("@")[0] || "Staff";
  const [searchTerm, setSearchTerm] = useState("");
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [selectedFlightId, setSelectedFlightId] = useState<string>("");
  const [checkingIn, setCheckingIn] = useState<number | null>(null);
  const [closing, setClosing] = useState(false);

  const { data: flightsData } = useFetch<any[]>('/flights?limit=50');
  const allFlights: any[] = flightsData ?? [];
  const flights = allFlights.filter(f => f.status === 'Scheduled' || f.status === 'Boarding');

  const { data: manifestData, loading, error, refetch } = useFetch<any[]>(
    selectedFlightId ? `/boarding/${selectedFlightId}/manifest?limit=100` : null
  );
  const passengers: any[] = manifestData ?? [];

  const { data: boardingStatus, refetch: refetchStatus } = useFetch<any>(
    selectedFlightId ? `/boarding/${selectedFlightId}/status` : null
  );

  const navItems = [
    { label: "Dashboard", path: "/ground-staff", icon: <Home className="w-5 h-5" /> },
    { label: "Passenger List", path: "/ground-staff/passengers", icon: <Users className="w-5 h-5" /> },
    { label: "Active Boarding", path: "/ground-staff/boarding", icon: <AlertTriangle className="w-5 h-5" /> },
  ];

  const filteredPassengers = passengers.filter((p: any) =>
    (p.passenger_name ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.passport_no ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.seat_no ?? '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCheckIn = async (pnrId: number) => {
    setCheckingIn(pnrId);
    try {
      await api.patch(`/boarding/${selectedFlightId}/check-in/${pnrId}`);
      refetch(); refetchStatus();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setCheckingIn(null);
    }
  };

  const handleCloseBoarding = async () => {
    const unboarded = passengers.filter((p: any) => p.boarding_status !== 'Checked_In' && p.boarding_status !== 'Completed');
    if (unboarded.length > 0) {
      setShowAlertModal(true);
      return;
    }
    await doCloseBoarding();
  };

  const doCloseBoarding = async () => {
    setClosing(true);
    try {
      await api.post(`/boarding/${selectedFlightId}/close`, {});
      setShowAlertModal(false);
      refetch(); refetchStatus();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setClosing(false);
    }
  };

  const boardedCount = passengers.filter(p => p.boarding_status === 'Checked_In' || p.boarding_status === 'Completed').length;
  const totalCount = passengers.length;
  const unboardedPassengers = passengers.filter(p => p.boarding_status !== 'Checked_In' && p.boarding_status !== 'Completed');

  return (
    <DashboardLayout role="Ground Staff" userName={userName} navItems={navItems}>
      <Breadcrumb
        items={[{ label: "Dashboard", href: "/ground-staff" }, { label: "Active Boarding" }]}
      />
      
      <h1 className="text-3xl mb-6" style={{ color: "#1B2A4A", fontWeight: 600 }}>
        Boarding Management
      </h1>

      {/* Flight Selector */}
      <div className="bg-white p-6 shadow-sm mb-6" style={{ borderRadius: "8px" }}>
        <h2 className="text-lg mb-3" style={{ color: "#1B2A4A", fontWeight: 600 }}>Select Flight</h2>
        <select
          value={selectedFlightId}
          onChange={e => setSelectedFlightId(e.target.value)}
          className="w-full max-w-md px-4 py-3 border border-gray-300 focus:border-[#2E86DE] focus:outline-none"
          style={{ borderRadius: "8px" }}
        >
          <option value="">Choose a flight...</option>
          {flights.map((f: any) => (
            <option key={f.flight_id} value={f.flight_id}>
              #{f.flight_id} — {f.source_airport_code} → {f.dest_airport_code} | Dep: {new Date(f.departure_time).toLocaleDateString()} | {f.status}
            </option>
          ))}
        </select>
        {boardingStatus && selectedFlightId && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-gray-600">Status: <strong>{boardingStatus.flight_status ?? '—'}</strong> {boardingStatus.boarding_open ? '• Boarding Open' : ''}</p>
            <p className="text-2xl" style={{ color: "#1B2A4A", fontWeight: 600 }}>
              {boardingStatus.boarded ?? 0} / {boardingStatus.total_booked ?? passengers.length} Boarded ({boardingStatus.boarding_pct ?? 0}%)
            </p>
          </div>
        )}
      </div>

      {!selectedFlightId && (
        <div className="bg-white p-8 shadow-sm text-center text-gray-500" style={{ borderRadius: "8px" }}>
          Select a flight above to manage boarding.
        </div>
      )}
      {loading && <LoadingState message="Loading manifest..." />}
      {error   && <ErrorState message={error} onRetry={refetch} />}

      {/* Search + Close Boarding */}
      {selectedFlightId && !loading && !error && (
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search passengers..."
            className="w-full pl-12 pr-4 py-3 border border-gray-300 focus:border-[#2E86DE] focus:outline-none transition-colors"
            style={{ borderRadius: "8px" }}
          />
        </div>
        <button
          onClick={handleCloseBoarding}
          disabled={closing}
          className="px-6 py-3 rounded-lg text-white transition-colors hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: "#E74C3C" }}
        >
          {closing ? 'Closing...' : 'Close Boarding'}
        </button>
      </div>
      )}

      {/* Passenger Table */}
      {selectedFlightId && !loading && !error && (
      <div className="bg-white shadow-sm overflow-hidden mb-24" style={{ borderRadius: "8px" }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead style={{ backgroundColor: "#F9FAFB" }}>
              <tr>
                <th className="px-6 py-4 text-left text-sm" style={{ color: "#1B2A4A", fontWeight: 600 }}>Name</th>
                <th className="px-6 py-4 text-left text-sm" style={{ color: "#1B2A4A", fontWeight: 600 }}>Passport / ID</th>
                <th className="px-6 py-4 text-left text-sm" style={{ color: "#1B2A4A", fontWeight: 600 }}>Seat</th>
                <th className="px-6 py-4 text-left text-sm" style={{ color: "#1B2A4A", fontWeight: 600 }}>Status</th>
                <th className="px-6 py-4 text-left text-sm" style={{ color: "#1B2A4A", fontWeight: 600 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredPassengers.length === 0 ? (
                <tr><td colSpan={5}><EmptyState message="No passengers found." /></td></tr>
              ) : filteredPassengers.map((passenger: any, index: number) => (
                <tr key={passenger.pnr_id ?? index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="px-6 py-4 text-sm" style={{ color: "#1B2A4A", fontWeight: 500 }}>
                    {passenger.passenger_name ?? '—'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {passenger.passport_no ?? '—'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {passenger.seat_no ?? '—'}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={passenger.boarding_status ?? 'Confirmed'} variant="small" />
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {passenger.boarding_status === 'Checked_In' || passenger.boarding_status === 'Completed' ? (
                      <span className="text-green-600">Checked In</span>
                    ) : passenger.boarding_status === 'No_Show' ? (
                      <span className="text-red-500">No Show</span>
                    ) : (
                      <button
                        onClick={() => handleCheckIn(passenger.pnr_id)}
                        disabled={checkingIn === passenger.pnr_id}
                        className="text-[#2E86DE] hover:underline disabled:opacity-50"
                      >
                        {checkingIn === passenger.pnr_id ? 'Processing...' : 'Check In'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-64 right-0 bg-white border-t border-gray-200 p-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">
              <strong>{boardedCount}</strong> of <strong>{totalCount}</strong> passengers boarded
            </p>
          </div>
        </div>
      </div>

      {/* Outstanding Passenger Alert Modal */}
      {showAlertModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 max-w-2xl w-full shadow-xl" style={{ borderRadius: "8px" }}>
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-amber-600" />
              </div>
            </div>
            <h2 className="text-2xl text-center mb-2" style={{ color: "#1B2A4A", fontWeight: 600 }}>
              Outstanding Passengers
            </h2>
            <p className="text-gray-600 text-center mb-6">
              The following passengers have not boarded yet. Please take action before closing boarding.
            </p>

            <div className="bg-gray-50 p-4 rounded-lg mb-6 max-h-60 overflow-y-auto">
              <div className="space-y-3">
                {unboardedPassengers.map((passenger, index) => (
                  <div
                    key={index}
                    className="bg-white p-4 rounded-lg flex items-center justify-between"
                  >
                    <div>
                      <p style={{ color: "#1B2A4A", fontWeight: 600 }}>{passenger.passenger_name}</p>
                      <p className="text-sm text-gray-600">
                        Seat {passenger.seat_no} • {passenger.passport_no}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={passenger.boarding_status} variant="small" />
                      <button
                        className="px-3 py-1 rounded text-sm text-white transition-colors hover:opacity-90"
                        style={{ backgroundColor: "#2E86DE" }}
                      >
                        Notify Gate
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowAlertModal(false)}
                className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={doCloseBoarding}
                disabled={closing}
                className="flex-1 px-4 py-2 rounded-lg text-white hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: "#E74C3C" }}
              >
                {closing ? 'Closing...' : 'Close Boarding Anyway'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}