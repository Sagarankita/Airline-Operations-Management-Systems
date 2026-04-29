import { useState } from "react";
import { DashboardLayout } from "../../layouts/DashboardLayout";
import { Breadcrumb } from "../../shared/Breadcrumb";
import { StatusBadge } from "../../shared/StatusBadge";
import { LoadingState, ErrorState } from "../../shared/ApiStates";
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
  ChevronRight,
} from "lucide-react";

export default function AdminCrewAssignment() {
  const userName = sessionStorage.getItem("userEmail")?.split("@")[0] || "Admin";
  const [selectedFlightId, setSelectedFlightId] = useState<string>("");
  const [selectedCrew, setSelectedCrew] = useState<number[]>([]);
  const [assigning, setAssigning] = useState(false);
  const [assignMsg, setAssignMsg] = useState<string | null>(null);

  const { data: flightsData } = useFetch<any[]>('/flights?limit=50');
  const flights: any[] = flightsData ?? [];
  const selectedFlight = flights.find(f => String(f.flight_id) === selectedFlightId) ?? null;

  const { data: pilotData, loading: pilotLoading, error: pilotError } = useFetch<any[]>(
    selectedFlightId ? `/employees?role=Pilot&limit=100` : null
  );
  const { data: cabinData, loading: cabinLoading, error: cabinError } = useFetch<any[]>(
    selectedFlightId ? `/employees?role=Cabin_Crew&limit=100` : null
  );
  const pilots: any[]    = pilotData ?? [];
  const cabinCrew: any[] = cabinData ?? [];
  const allCrew: any[]   = [...pilots, ...cabinCrew];
  const crewLoading = pilotLoading || cabinLoading;
  const crewError   = pilotError || cabinError;

  const navItems = [
    { label: "Dashboard", path: "/admin", icon: <Home className="w-5 h-5" /> },
    { label: "Employees", path: "/admin/employees", icon: <Users className="w-5 h-5" /> },
    { label: "Flight Schedule", path: "/admin/flights", icon: <Calendar className="w-5 h-5" /> },
    { label: "Aircraft", path: "/admin/aircraft", icon: <Plane className="w-5 h-5" /> },
    { label: "Delay Prediction", path: "/admin/delay-prediction", icon: <AlertTriangle className="w-5 h-5" /> },
    { label: "Crew Assignment", path: "/admin/crew-assignment", icon: <UserCheck className="w-5 h-5" /> },
    { label: "Reports", path: "/admin/reports", icon: <FileText className="w-5 h-5" /> },
  ];

  const toggleCrewSelection = (id: number) => {
    setSelectedCrew(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const getSelectedCrewNames = () =>
    allCrew.filter(c => selectedCrew.includes(c.emp_id)).map(c => c.name);

  const getRoleForEmp = (empId: number): string => {
    const emp = allCrew.find(e => e.emp_id === empId);
    if (!emp) return 'Cabin_Crew';
    if (emp.role === 'Pilot') return emp.pilot_rank ?? 'First Officer';
    return 'Cabin_Crew';
  };

  const handleConfirmAssignment = async () => {
    if (!selectedFlightId || selectedCrew.length === 0) return;
    setAssigning(true); setAssignMsg(null);
    const errors: string[] = [];
    for (const empId of selectedCrew) {
      try {
        await api.post(`/flights/${selectedFlightId}/crew`, {
          emp_id: empId,
          role:   getRoleForEmp(empId),
        });
      } catch (err: any) {
        errors.push(`#${empId}: ${err.message}`);
      }
    }
    if (errors.length) {
      setAssignMsg(`Errors: ${errors.join('; ')}`);
    } else {
      setAssignMsg(`${selectedCrew.length} crew member(s) assigned successfully.`);
      setSelectedCrew([]);
    }
    setAssigning(false);
  };

  return (
    <DashboardLayout role="Administrator" userName={userName} navItems={navItems}>
      <Breadcrumb items={[{ label: "Dashboard", href: "/admin" }, { label: "Crew Assignment" }]} />
      
      <h1 className="text-3xl mb-6" style={{ color: "#1B2A4A", fontWeight: 600 }}>
        Assign Crew to Flight
      </h1>

      {/* Flight Selector */}
      <div className="bg-white p-6 shadow-sm mb-6" style={{ borderRadius: "8px" }}>
        <h2 className="text-lg mb-3" style={{ color: "#1B2A4A", fontWeight: 600 }}>Select Flight</h2>
        <select
          value={selectedFlightId}
          onChange={e => { setSelectedFlightId(e.target.value); setSelectedCrew([]); setAssignMsg(null); }}
          className="w-full max-w-md px-4 py-3 border border-gray-300 focus:border-[#2E86DE] focus:outline-none"
          style={{ borderRadius: "8px" }}
        >
          <option value="">Choose a flight...</option>
          {flights.map((f: any) => (
            <option key={f.flight_id} value={f.flight_id}>
              #{f.flight_id} — {f.source_airport_code} → {f.dest_airport_code} ({f.departure_time ? new Date(f.departure_time).toLocaleDateString() : ''})
            </option>
          ))}
        </select>
        {selectedFlight && (
          <div className="grid grid-cols-3 gap-4 text-sm mt-4">
            <div><span className="text-gray-600">Departure:</span><p style={{ color: "#1B2A4A", fontWeight: 500 }}>{new Date(selectedFlight.departure_time).toLocaleString()}</p></div>
            <div><span className="text-gray-600">Aircraft:</span><p style={{ color: "#1B2A4A", fontWeight: 500 }}>{selectedFlight.aircraft_model ?? selectedFlight.aircraft_id}</p></div>
            <div><span className="text-gray-600">Status:</span><p style={{ color: "#1B2A4A", fontWeight: 500 }}>{selectedFlight.schedule_status ?? 'Scheduled'}</p></div>
          </div>
        )}
      </div>

      {!selectedFlightId && (
        <div className="bg-white p-8 shadow-sm text-center text-gray-500" style={{ borderRadius: "8px" }}>
          Select a flight above to assign crew.
        </div>
      )}
      {assignMsg && (
        <div className="mb-4 px-4 py-3 rounded-lg text-sm" style={{ backgroundColor: assignMsg.startsWith('Error') ? '#FEE2E2' : '#D1FAE5', color: assignMsg.startsWith('Error') ? '#991B1B' : '#065F46' }}>
          {assignMsg}
        </div>
      )}
      {crewLoading && <LoadingState message="Loading available crew..." />}
      {crewError   && <ErrorState message={crewError} />}

      {selectedFlightId && !crewLoading && !crewError && (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Left Panel: Available Crew */}
        <div>
          <h2 className="text-xl mb-4" style={{ color: "#1B2A4A", fontWeight: 600 }}>
            Available Crew
          </h2>

          {/* Pilots */}
          <div className="bg-white p-6 shadow-sm mb-4" style={{ borderRadius: "8px" }}>
            <h3 className="mb-4" style={{ color: "#1B2A4A", fontWeight: 600 }}>Pilots</h3>
            <div className="space-y-2">
              {pilots.length === 0 ? <p className="text-sm text-gray-500">No pilots available.</p> :
              pilots.map(pilot => (
                <CrewCard key={pilot.emp_id} id={pilot.emp_id} name={pilot.name}
                  availability={pilot.emp_status ?? 'Active'}
                  isSelected={selectedCrew.includes(pilot.emp_id)} onToggle={toggleCrewSelection} />
              ))}
            </div>
          </div>

          {/* Cabin Crew */}
          <div className="bg-white p-6 shadow-sm" style={{ borderRadius: "8px" }}>
            <h3 className="mb-4" style={{ color: "#1B2A4A", fontWeight: 600 }}>Cabin Crew</h3>
            <div className="space-y-2">
              {cabinCrew.length === 0 ? <p className="text-sm text-gray-500">No cabin crew available.</p> :
              cabinCrew.map(crew => (
                <CrewCard key={crew.emp_id} id={crew.emp_id} name={crew.name}
                  availability={crew.emp_status ?? 'Active'}
                  isSelected={selectedCrew.includes(crew.emp_id)} onToggle={toggleCrewSelection} />
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel: Selected Crew */}
        <div>
          <h2 className="text-xl mb-4" style={{ color: "#1B2A4A", fontWeight: 600 }}>
            Selected Crew for Flight
          </h2>
          <div className="bg-white p-6 shadow-sm" style={{ borderRadius: "8px", minHeight: "400px" }}>
            {selectedCrew.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                <UserCheck className="w-16 h-16 mb-3" />
                <p>No crew members selected</p>
                <p className="text-sm">Click on crew members to add them</p>
              </div>
            ) : (
              <div className="space-y-3">
                {getSelectedCrewNames().map((name, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg"
                  >
                    <UserCheck className="w-5 h-5" style={{ color: "#2E86DE" }} />
                    <span style={{ color: "#1B2A4A", fontWeight: 500 }}>{name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      )}

      {/* Sticky Bottom Action Bar */}
      {selectedFlightId && (
      <div className="fixed bottom-0 left-64 right-0 bg-white border-t border-gray-200 p-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <p className="text-sm text-gray-600">
            <strong>{selectedCrew.length}</strong> crew member(s) selected
          </p>
          <button
            onClick={handleConfirmAssignment}
            disabled={selectedCrew.length === 0 || assigning}
            className="px-6 py-3 rounded-lg text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: "#27AE60" }}
          >
            {assigning ? 'Assigning...' : 'Confirm Assignment'}
          </button>
        </div>
      </div>
      )}
    </DashboardLayout>
  );
}

interface CrewCardProps {
  id: number;
  name: string;
  availability: string;
  isSelected: boolean;
  onToggle: (id: number) => void;
}

function CrewCard({ id, name, availability, isSelected, onToggle }: CrewCardProps) {
  const isAvailable = availability === "Active" || availability === "Available";
  
  return (
    <button
      onClick={() => isAvailable && onToggle(id)}
      disabled={!isAvailable}
      className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
        isSelected
          ? "border-[#2E86DE] bg-blue-50"
          : isAvailable
          ? "border-gray-200 hover:border-[#2E86DE] hover:bg-gray-50"
          : "border-gray-200 opacity-50 cursor-not-allowed"
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p style={{ color: "#1B2A4A", fontWeight: 500 }}>{name}</p>
          <StatusBadge status={availability} variant="small" />
        </div>
        {isSelected && <ChevronRight className="w-5 h-5" style={{ color: "#2E86DE" }} />}
      </div>
    </button>
  );
}
