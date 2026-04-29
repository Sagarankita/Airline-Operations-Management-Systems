import { useState } from "react";
import { DashboardLayout } from "../../layouts/DashboardLayout";
import { Breadcrumb } from "../../shared/Breadcrumb";
import { api } from "../../../../lib/api";
import { useFetch } from "../../../../lib/useApi";
import { session } from "../../../../lib/session";
import { Home, Plane, Calendar, FileText } from "lucide-react";

export default function CrewDutyLog() {
  const userName = sessionStorage.getItem("userEmail")?.split("@")[0] || "Crew";
  const [formData, setFormData] = useState({
    dutyStart: "",
    dutyEnd: "",
    observations: "",
  });
  const [selectedFlightId, setSelectedFlightId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState<string | null>(null);

  const empId = session.getEmpId();
  const { data: assignmentsData } = useFetch<any[]>(
    empId ? `/crew-assignments/employee/${empId}` : null
  );
  const assignments: any[] = assignmentsData ?? [];
  const selectedAssignment = assignments.find(a => String(a.flight_id) === selectedFlightId) ?? null;

  const navItems = [
    { label: "Dashboard", path: "/crew", icon: <Home className="w-5 h-5" /> },
    { label: "Update Status", path: "/crew/update-status", icon: <Plane className="w-5 h-5" /> },
    { label: "Assigned Flights", path: "/crew/flights", icon: <Calendar className="w-5 h-5" /> },
    { label: "Duty Log", path: "/crew/duty-log", icon: <FileText className="w-5 h-5" /> },
  ];

  const calculateDuration = () => {
    if (formData.dutyStart && formData.dutyEnd && selectedAssignment?.departure_time) {
      const dateStr = new Date(selectedAssignment.departure_time).toISOString().slice(0, 10);
      const start = new Date(`${dateStr}T${formData.dutyStart}:00Z`);
      const end   = new Date(`${dateStr}T${formData.dutyEnd}:00Z`);
      const diff = (end.getTime() - start.getTime()) / 3600000;
      return diff > 0 ? diff.toFixed(1) : "0.0";
    }
    return "0.0";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment) { setSubmitMsg('Error: Select a flight assignment first.'); return; }
    setSubmitting(true); setSubmitMsg(null);
    try {
      const dateStr = new Date(selectedAssignment.departure_time).toISOString().slice(0, 10);
      const dutyStart = `${dateStr}T${formData.dutyStart}:00Z`;
      const dutyEnd   = `${dateStr}T${formData.dutyEnd}:00Z`;
      await api.post('/duty-logs', {
        emp_id:       empId,
        flight_id:    selectedAssignment.flight_id,
        duty_start:   dutyStart,
        duty_end:     dutyEnd,
        observations: formData.observations,
      });
      setSubmitMsg('Duty log submitted successfully!');
      setFormData({ dutyStart: '', dutyEnd: '', observations: '' });
      setSelectedFlightId('');
    } catch (err: any) {
      setSubmitMsg(`Error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <DashboardLayout role="Pilot / Cabin Crew" userName={userName} navItems={navItems}>
      <Breadcrumb items={[{ label: "Dashboard", href: "/crew" }, { label: "Log Duty Details" }]} />
      
      <h1 className="text-3xl mb-6" style={{ color: "#1B2A4A", fontWeight: 600 }}>
        Log Duty Details
      </h1>

      {/* Flight Context */}
      <div className="bg-white p-6 shadow-sm mb-6" style={{ borderRadius: "8px" }}>
        <h2 className="text-lg mb-3" style={{ color: "#1B2A4A", fontWeight: 600 }}>Flight Assignment</h2>
        <select
          value={selectedFlightId}
          onChange={e => setSelectedFlightId(e.target.value)}
          className="w-full max-w-md px-4 py-3 border border-gray-300 focus:border-[#2E86DE] focus:outline-none"
          style={{ borderRadius: "8px" }}
        >
          <option value="">Select assignment...</option>
          {assignments.map((a: any) => (
            <option key={`${a.flight_id}-${a.assignment_date}`} value={a.flight_id}>
              Flight #{a.flight_id} — {a.source_airport_code ?? ''} → {a.dest_airport_code ?? ''} ({a.flight_status})
            </option>
          ))}
        </select>
        {selectedAssignment && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mt-4">
            <div><span className="text-gray-600">Flight ID:</span><p style={{ color: "#1B2A4A", fontWeight: 500 }}>#{selectedAssignment.flight_id}</p></div>
            <div><span className="text-gray-600">Route:</span><p style={{ color: "#1B2A4A", fontWeight: 500 }}>{selectedAssignment.source_airport_code} → {selectedAssignment.dest_airport_code}</p></div>
            <div><span className="text-gray-600">Departure:</span><p style={{ color: "#1B2A4A", fontWeight: 500 }}>{selectedAssignment.departure_time ? new Date(selectedAssignment.departure_time).toLocaleString() : '—'}</p></div>
            <div><span className="text-gray-600">Aircraft:</span><p style={{ color: "#1B2A4A", fontWeight: 500 }}>{selectedAssignment.aircraft_model ?? selectedAssignment.aircraft_id}</p></div>
          </div>
        )}
      </div>

      {/* Duty Log Form */}
      <form onSubmit={handleSubmit}>
        <div className="bg-white p-8 shadow-sm mb-6" style={{ borderRadius: "8px" }}>
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label htmlFor="dutyStart" className="block text-sm mb-2" style={{ color: "#1B2A4A" }}>
                  Duty Start Time
                </label>
                <input
                  id="dutyStart"
                  name="dutyStart"
                  type="time"
                  value={formData.dutyStart}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 focus:border-[#2E86DE] focus:outline-none transition-colors"
                  style={{ borderRadius: "8px" }}
                  required
                />
              </div>

              <div>
                <label htmlFor="dutyEnd" className="block text-sm mb-2" style={{ color: "#1B2A4A" }}>
                  Duty End Time
                </label>
                <input
                  id="dutyEnd"
                  name="dutyEnd"
                  type="time"
                  value={formData.dutyEnd}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 focus:border-[#2E86DE] focus:outline-none transition-colors"
                  style={{ borderRadius: "8px" }}
                  required
                />
              </div>

              <div>
                <label className="block text-sm mb-2" style={{ color: "#1B2A4A" }}>
                  Total Duration (hours)
                </label>
                <input
                  type="text"
                  value={calculateDuration()}
                  disabled
                  className="w-full px-4 py-3 border border-gray-300 bg-gray-100 text-gray-600"
                  style={{ borderRadius: "8px" }}
                />
              </div>
            </div>

            <div>
              <label htmlFor="observations" className="block text-sm mb-2" style={{ color: "#1B2A4A" }}>
                Observations
              </label>
              <textarea
                id="observations"
                name="observations"
                value={formData.observations}
                onChange={handleChange}
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 focus:border-[#2E86DE] focus:outline-none transition-colors resize-none"
                style={{ borderRadius: "8px" }}
                placeholder="Enter any observations or notes about the duty period..."
                required
              />
            </div>
          </div>
        </div>

        {submitMsg && (
          <div className="mt-4 px-4 py-3 rounded-lg text-sm" style={{ backgroundColor: submitMsg.startsWith('Error') ? '#FEE2E2' : '#D1FAE5', color: submitMsg.startsWith('Error') ? '#991B1B' : '#065F46' }}>
            {submitMsg}
          </div>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="px-6 py-3 rounded-lg text-white transition-colors hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: "#2E86DE" }}
        >
          {submitting ? 'Submitting...' : 'Submit Duty Log'}
        </button>
      </form>
    </DashboardLayout>
  );
}
