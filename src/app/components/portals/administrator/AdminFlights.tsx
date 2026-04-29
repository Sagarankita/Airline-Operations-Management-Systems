import { useState, useEffect } from "react";
import { DashboardLayout } from "../../layouts/DashboardLayout";
import { Breadcrumb } from "../../shared/Breadcrumb";
import { StatusBadge } from "../../shared/StatusBadge";
import { LoadingState, ErrorState, EmptyState } from "../../shared/ApiStates";
import { api } from "../../../../lib/api";
import { useFetch } from "../../../../lib/useApi";
import {
  Home,
  Users,
  Plane,
  Calendar,
  AlertTriangle,
  UserCheck,
  FileText,
  Plus,
  List,
  CalendarDays,
  Edit,
  XCircle,
} from "lucide-react";

export default function AdminFlights() {
  const userName = sessionStorage.getItem("userEmail")?.split("@")[0] || "Admin";
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showFlightForm, setShowFlightForm] = useState(false);
  const [selectedFlight, setSelectedFlight] = useState<any>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    source_airport_code: "",
    dest_airport_code: "",
    departure_time: "",
    arrival_time: "",
    aircraft_id: "",
  });

  const navItems = [
    { label: "Dashboard", path: "/admin", icon: <Home className="w-5 h-5" /> },
    { label: "Employees", path: "/admin/employees", icon: <Users className="w-5 h-5" /> },
    { label: "Flight Schedule", path: "/admin/flights", icon: <Calendar className="w-5 h-5" /> },
    { label: "Aircraft", path: "/admin/aircraft", icon: <Plane className="w-5 h-5" /> },
    { label: "Delay Prediction", path: "/admin/delay-prediction", icon: <AlertTriangle className="w-5 h-5" /> },
    { label: "Crew Assignment", path: "/admin/crew-assignment", icon: <UserCheck className="w-5 h-5" /> },
    { label: "Reports", path: "/admin/reports", icon: <FileText className="w-5 h-5" /> },
  ];

  const { data: flightsData, loading, error, refetch } = useFetch<any[]>('/flights?limit=50');
  const { data: aircraftData } = useFetch<any[]>('/aircraft?limit=100');
  const flights: any[] = flightsData ?? [];
  const aircraftList: any[] = aircraftData ?? [];

  const handleAddFlight = () => {
    setIsEditMode(false);
    setSelectedFlight(null);
    setSaveError(null);
    setFormData({ source_airport_code: "", dest_airport_code: "", departure_time: "", arrival_time: "", aircraft_id: "" });
    setShowFlightForm(true);
  };

  const handleEditFlight = (flight: any) => {
    setIsEditMode(true);
    setSelectedFlight(flight);
    setSaveError(null);
    setFormData({
      source_airport_code: flight.source_airport_code,
      dest_airport_code:   flight.dest_airport_code,
      departure_time:      flight.departure_time?.replace('Z','').slice(0,16),
      arrival_time:        flight.arrival_time?.replace('Z','').slice(0,16),
      aircraft_id:         String(flight.aircraft_id),
    });
    setShowFlightForm(true);
  };

  const handleCancelFlight = (flight: any) => {
    setSelectedFlight(flight);
    setShowCancelModal(true);
  };

  const handleSubmitFlight = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setSaveError(null);
    try {
      const payload = {
        source_airport_code: formData.source_airport_code.toUpperCase(),
        dest_airport_code:   formData.dest_airport_code.toUpperCase(),
        departure_time:      formData.departure_time,
        arrival_time:        formData.arrival_time,
        aircraft_id:         Number(formData.aircraft_id),
      };
      if (isEditMode) {
        await api.put(`/flights/${selectedFlight.flight_id}`, payload);
      } else {
        await api.post('/flights', payload);
      }
      setShowFlightForm(false);
      refetch();
    } catch (err: any) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const confirmCancelFlight = async () => {
    try {
      await api.patch(`/flights/${selectedFlight.flight_id}/status`, { status: 'Cancelled' });
      setShowCancelModal(false);
      refetch();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <DashboardLayout role="Administrator" userName={userName} navItems={navItems}>
      <Breadcrumb items={[{ label: "Dashboard", href: "/admin" }, { label: "Flight Schedule" }]} />
      
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl" style={{ color: "#1B2A4A", fontWeight: 600 }}>
          Flight Schedule
        </h1>
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex bg-white border border-gray-300 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-2 px-4 py-2 transition-colors ${
                viewMode === "list"
                  ? "bg-[#2E86DE] text-white"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <List className="w-4 h-4" />
              List
            </button>
            <button
              onClick={() => setViewMode("calendar")}
              className={`flex items-center gap-2 px-4 py-2 transition-colors ${
                viewMode === "calendar"
                  ? "bg-[#2E86DE] text-white"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <CalendarDays className="w-4 h-4" />
              Calendar
            </button>
          </div>
          <button
            onClick={handleAddFlight}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-white transition-colors hover:opacity-90"
            style={{ backgroundColor: "#2E86DE" }}
          >
            <Plus className="w-5 h-5" />
            Add Flight
          </button>
        </div>
      </div>

      {viewMode === "list" ? (
        loading ? <LoadingState message="Loading flights..." /> :
        error   ? <ErrorState message={error} onRetry={refetch} /> :
        <div className="bg-white shadow-sm overflow-hidden" style={{ borderRadius: "8px" }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead style={{ backgroundColor: "#F9FAFB" }}>
                <tr>
                  <th className="px-6 py-4 text-left text-sm" style={{ color: "#1B2A4A", fontWeight: 600 }}>
                    Flight ID
                  </th>
                  <th className="px-6 py-4 text-left text-sm" style={{ color: "#1B2A4A", fontWeight: 600 }}>
                    Origin
                  </th>
                  <th className="px-6 py-4 text-left text-sm" style={{ color: "#1B2A4A", fontWeight: 600 }}>
                    Destination
                  </th>
                  <th className="px-6 py-4 text-left text-sm" style={{ color: "#1B2A4A", fontWeight: 600 }}>
                    Departure
                  </th>
                  <th className="px-6 py-4 text-left text-sm" style={{ color: "#1B2A4A", fontWeight: 600 }}>
                    Arrival
                  </th>
                  <th className="px-6 py-4 text-left text-sm" style={{ color: "#1B2A4A", fontWeight: 600 }}>
                    Aircraft
                  </th>
                  <th className="px-6 py-4 text-left text-sm" style={{ color: "#1B2A4A", fontWeight: 600 }}>
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-sm" style={{ color: "#1B2A4A", fontWeight: 600 }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {flights.length === 0 ? (
                  <tr><td colSpan={8}><EmptyState message="No flights found." /></td></tr>
                ) : flights.map((flight, index) => (
                  <tr key={flight.flight_id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="px-6 py-4 text-sm" style={{ color: "#1B2A4A", fontWeight: 500 }}>
                      #{flight.flight_id}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {flight.source_airport_code}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {flight.dest_airport_code}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {flight.departure_time ? new Date(flight.departure_time).toLocaleString() : '—'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {flight.arrival_time ? new Date(flight.arrival_time).toLocaleString() : '—'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {flight.aircraft_model ?? flight.aircraft_id}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={flight.schedule_status ?? 'Scheduled'} variant="small" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleEditFlight(flight)}
                          className="p-2 rounded hover:bg-gray-200 transition-colors" 
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" style={{ color: "#2E86DE" }} />
                        </button>
                        <button
                          onClick={() => handleCancelFlight(flight)}
                          className="p-2 rounded hover:bg-gray-200 transition-colors"
                          title="Cancel"
                        >
                          <XCircle className="w-4 h-4" style={{ color: "#E74C3C" }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white p-8 shadow-sm" style={{ borderRadius: "8px" }}>
          <p className="text-center text-gray-600">Calendar view coming soon...</p>
        </div>
      )}

      {/* Cancel Modal */}
      {showCancelModal && selectedFlight && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-8 max-w-lg mx-4 shadow-xl" style={{ borderRadius: "8px" }}>
            <h2 className="text-2xl mb-4" style={{ color: "#1B2A4A", fontWeight: 600 }}>
              Cancel Flight
            </h2>
            
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <h3 className="mb-3" style={{ color: "#1B2A4A", fontWeight: 600 }}>
                Flight Summary
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-600">Flight No:</span>
                  <p style={{ color: "#1B2A4A", fontWeight: 500 }}>{selectedFlight.flightNo}</p>
                </div>
                <div>
                  <span className="text-gray-600">Aircraft:</span>
                  <p style={{ color: "#1B2A4A", fontWeight: 500 }}>{selectedFlight.aircraft}</p>
                </div>
                <div>
                  <span className="text-gray-600">Route:</span>
                  <p style={{ color: "#1B2A4A", fontWeight: 500 }}>
                    {selectedFlight.origin} → {selectedFlight.destination}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600">Departure:</span>
                  <p style={{ color: "#1B2A4A", fontWeight: 500 }}>{selectedFlight.departure}</p>
                </div>
              </div>
            </div>

            <p className="text-gray-600 mb-6">
              Are you sure you want to cancel this flight? All passengers will be notified.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 transition-colors hover:bg-gray-50"
              >
                Keep Flight
              </button>
              <button
                onClick={confirmCancelFlight}
                className="flex-1 px-4 py-2 rounded-lg text-white transition-colors hover:opacity-90"
                style={{ backgroundColor: "#E74C3C" }}
              >
                Cancel Flight
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Flight Form Modal */}
      {showFlightForm && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowFlightForm(false)} />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white p-8 max-w-2xl w-full shadow-xl my-8" style={{ borderRadius: "8px" }}>
              <h2 className="text-2xl mb-6" style={{ color: "#1B2A4A", fontWeight: 600 }}>
                {isEditMode ? "Edit Flight" : "Add Flight"}
              </h2>
              <form onSubmit={handleSubmitFlight} className="space-y-5">
                <div>
                  <label htmlFor="aircraft_id" className="block text-sm mb-2" style={{ color: "#1B2A4A" }}>
                    Aircraft
                  </label>
                  <select
                    id="aircraft_id"
                    name="aircraft_id"
                    value={formData.aircraft_id}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 focus:border-[#2E86DE] focus:outline-none"
                    style={{ borderRadius: "8px" }}
                    required
                  >
                    <option value="">Select aircraft...</option>
                    {aircraftList.map((ac: any) => (
                      <option key={ac.aircraft_id} value={ac.aircraft_id}>
                        {ac.model} ({ac.status})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label htmlFor="source_airport_code" className="block text-sm mb-2" style={{ color: "#1B2A4A" }}>
                      Origin (Airport Code)
                    </label>
                    <input
                      id="source_airport_code"
                      name="source_airport_code"
                      type="text"
                      maxLength={3}
                      value={formData.source_airport_code}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 focus:border-[#2E86DE] focus:outline-none"
                      style={{ borderRadius: "8px" }}
                      placeholder="e.g., JFK"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="dest_airport_code" className="block text-sm mb-2" style={{ color: "#1B2A4A" }}>
                      Destination (Airport Code)
                    </label>
                    <input
                      id="dest_airport_code"
                      name="dest_airport_code"
                      type="text"
                      maxLength={3}
                      value={formData.dest_airport_code}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 focus:border-[#2E86DE] focus:outline-none"
                      style={{ borderRadius: "8px" }}
                      placeholder="e.g., LHR"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label htmlFor="departure_time" className="block text-sm mb-2" style={{ color: "#1B2A4A" }}>
                      Departure Date &amp; Time
                    </label>
                    <input
                      id="departure_time"
                      name="departure_time"
                      type="datetime-local"
                      value={formData.departure_time}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 focus:border-[#2E86DE] focus:outline-none"
                      style={{ borderRadius: "8px" }}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="arrival_time" className="block text-sm mb-2" style={{ color: "#1B2A4A" }}>
                      Arrival Date &amp; Time
                    </label>
                    <input
                      id="arrival_time"
                      name="arrival_time"
                      type="datetime-local"
                      value={formData.arrival_time}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 focus:border-[#2E86DE] focus:outline-none"
                      style={{ borderRadius: "8px" }}
                      required
                    />
                  </div>
                </div>

                {saveError && <p className="text-sm" style={{ color: '#E74C3C' }}>{saveError}</p>}

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowFlightForm(false)}
                    className="flex-1 px-4 py-3 rounded-lg border border-gray-300 text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 px-4 py-3 rounded-lg text-white transition-colors hover:opacity-90 disabled:opacity-50"
                    style={{ backgroundColor: "#2E86DE" }}
                  >
                    {saving ? 'Saving...' : isEditMode ? 'Save Changes' : 'Add Flight'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}