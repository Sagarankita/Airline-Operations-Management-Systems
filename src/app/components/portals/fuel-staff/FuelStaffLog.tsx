import { useState } from "react";
import { DashboardLayout } from "../../layouts/DashboardLayout";
import { Breadcrumb } from "../../shared/Breadcrumb";
import { api } from "../../../../lib/api";
import { useFetch } from "../../../../lib/useApi";
import { session } from "../../../../lib/session";
import { Home, Fuel } from "lucide-react";

export default function FuelStaffLog() {
  const userName = sessionStorage.getItem("userEmail")?.split("@")[0] || "Fuel Staff";
  const [formData, setFormData] = useState({
    aircraft_id: "",
    flight_id: "",
    fuel_loaded: "",
    fuel_date: "",
    fuel_consumed: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState<string | null>(null);
  const empId = session.getEmpId();
  const { data: acData } = useFetch<any[]>('/aircraft?limit=100');
  const aircraftList: any[] = acData ?? [];
  const { data: flightsData } = useFetch<any[]>('/flights?limit=50');
  const flights: any[] = flightsData ?? [];

  const navItems = [
    { label: "Dashboard", path: "/fuel-staff", icon: <Home className="w-5 h-5" /> },
    { label: "Record Fuel Log", path: "/fuel-staff/log", icon: <Fuel className="w-5 h-5" /> },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true); setSubmitMsg(null);
    try {
      await api.post('/fuel-logs', {
        aircraft_id:   Number(formData.aircraft_id),
        flight_id:     Number(formData.flight_id),
        fuel_loaded:   parseFloat(formData.fuel_loaded),
        fuel_consumed: formData.fuel_consumed ? parseFloat(formData.fuel_consumed) : undefined,
        fuel_date:     formData.fuel_date || undefined,
        emp_id:        empId || undefined,
      });
      setSubmitMsg('Fuel log submitted successfully!');
      setFormData({ aircraft_id: '', flight_id: '', fuel_loaded: '', fuel_date: '', fuel_consumed: '' });
    } catch (err: any) {
      setSubmitMsg(`Error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout role="Fuel Staff" userName={userName} navItems={navItems}>
      <Breadcrumb
        items={[{ label: "Dashboard", href: "/fuel-staff" }, { label: "Record Fuel Log" }]}
      />
      
      <h1 className="text-3xl mb-6" style={{ color: "#1B2A4A", fontWeight: 600 }}>
        Record Fuel Log
      </h1>

      <form onSubmit={handleSubmit}>
        <div className="bg-white p-8 shadow-sm mb-6" style={{ borderRadius: "8px" }}>
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label htmlFor="aircraftReg" className="block text-sm mb-2" style={{ color: "#1B2A4A" }}>
                  Aircraft Registration
                </label>
                <select
                  id="aircraft_id"
                  name="aircraft_id"
                  value={formData.aircraft_id}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 focus:border-[#2E86DE] focus:outline-none transition-colors"
                  style={{ borderRadius: "8px" }}
                  required
                >
                  <option value="">Select aircraft...</option>
                  {aircraftList.map((ac: any) => (
                    <option key={ac.aircraft_id} value={ac.aircraft_id}>{ac.model} (#{ac.aircraft_id})</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="flight" className="block text-sm mb-2" style={{ color: "#1B2A4A" }}>
                  Flight
                </label>
                <select
                  id="flight_id"
                  name="flight_id"
                  value={formData.flight_id}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 focus:border-[#2E86DE] focus:outline-none transition-colors"
                  style={{ borderRadius: "8px" }}
                  required
                >
                  <option value="">Select flight...</option>
                  {flights.map((f: any) => (
                    <option key={f.flight_id} value={f.flight_id}>
                      #{f.flight_id} — {f.source_airport_code} → {f.dest_airport_code}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label htmlFor="fuel_loaded" className="block text-sm mb-2" style={{ color: "#1B2A4A" }}>
                  Fuel Loaded (litres)
                </label>
                <input
                  id="fuel_loaded"
                  name="fuel_loaded"
                  type="number"
                  step="0.01"
                  value={formData.fuel_loaded}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 focus:border-[#2E86DE] focus:outline-none transition-colors"
                  style={{ borderRadius: "8px" }}
                  placeholder="e.g., 45000"
                  required
                />
              </div>

              <div>
                <label htmlFor="fuel_consumed" className="block text-sm mb-2" style={{ color: "#1B2A4A" }}>
                  Fuel Consumed (litres, optional)
                </label>
                <input
                  id="fuel_consumed"
                  name="fuel_consumed"
                  type="number"
                  step="0.01"
                  value={formData.fuel_consumed}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 focus:border-[#2E86DE] focus:outline-none transition-colors"
                  style={{ borderRadius: "8px" }}
                  placeholder="e.g., 42000"
                />
              </div>
            </div>

            <div>
              <label htmlFor="fuel_date" className="block text-sm mb-2" style={{ color: "#1B2A4A" }}>
                Fueling Date
              </label>
              <input
                id="fuel_date"
                name="fuel_date"
                type="date"
                value={formData.fuel_date}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 focus:border-[#2E86DE] focus:outline-none transition-colors"
                style={{ borderRadius: "8px" }}
              />
            </div>
          </div>
        </div>

        {submitMsg && (
          <div className="mt-4 mb-4 px-4 py-3 rounded-lg text-sm" style={{ backgroundColor: submitMsg.startsWith('Error') ? '#FEE2E2' : '#D1FAE5', color: submitMsg.startsWith('Error') ? '#991B1B' : '#065F46' }}>
            {submitMsg}
          </div>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="px-6 py-3 rounded-lg text-white transition-colors hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: "#27AE60" }}
        >
          {submitting ? 'Submitting...' : 'Submit Fuel Log'}
        </button>
      </form>
    </DashboardLayout>
  );
}
