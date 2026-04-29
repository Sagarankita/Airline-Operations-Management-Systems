import { useState } from "react";
import { DashboardLayout } from "../../layouts/DashboardLayout";
import { Breadcrumb } from "../../shared/Breadcrumb";
import { api } from "../../../../lib/api";
import { useFetch } from "../../../../lib/useApi";
import { session } from "../../../../lib/session";
import { Home, Wrench, History } from "lucide-react";

export default function MaintenanceRecord() {
  const userName = sessionStorage.getItem("userEmail")?.split("@")[0] || "Engineer";
  const [formData, setFormData] = useState({
    aircraft_id: "",
    maintenance_type: "",
    date: "",
    title: "",
    remark: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState<string | null>(null);
  const empId = session.getEmpId();
  const { data: acData } = useFetch<any[]>('/aircraft?limit=100');
  const aircraftList: any[] = acData ?? [];

  const navItems = [
    { label: "Dashboard", path: "/maintenance", icon: <Home className="w-5 h-5" /> },
    { label: "Record Maintenance", path: "/maintenance/record", icon: <Wrench className="w-5 h-5" /> },
    { label: "Maintenance History", path: "/maintenance/history", icon: <History className="w-5 h-5" /> },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true); setSubmitMsg(null);
    try {
      await api.post('/maintenance', {
        aircraft_id:      Number(formData.aircraft_id),
        maintenance_type: formData.maintenance_type,
        date:             formData.date,
        title:            formData.title,
        remark:           formData.remark,
        emp_id:           empId,
      });
      setSubmitMsg('Maintenance record submitted successfully!');
      setFormData({ aircraft_id: '', maintenance_type: '', date: '', title: '', remark: '' });
    } catch (err: any) {
      setSubmitMsg(`Error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout role="Maintenance Engineer" userName={userName} navItems={navItems}>
      <Breadcrumb
        items={[{ label: "Dashboard", href: "/maintenance" }, { label: "Record Maintenance" }]}
      />
      
      <h1 className="text-3xl mb-6" style={{ color: "#1B2A4A", fontWeight: 600 }}>
        Record Maintenance
      </h1>

      <form onSubmit={handleSubmit}>
        <div className="bg-white p-8 shadow-sm mb-6" style={{ borderRadius: "8px" }}>
          <div className="space-y-5">
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
              <label htmlFor="maintenanceType" className="block text-sm mb-2" style={{ color: "#1B2A4A" }}>
                Maintenance Type
              </label>
              <select
                id="maintenance_type"
                name="maintenance_type"
                value={formData.maintenance_type}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 focus:border-[#2E86DE] focus:outline-none transition-colors"
                style={{ borderRadius: "8px" }}
                required
              >
                <option value="">Select type...</option>
                <option value="Scheduled">Scheduled</option>
                <option value="Unscheduled">Unscheduled</option>
                <option value="Emergency">Emergency</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label htmlFor="date" className="block text-sm mb-2" style={{ color: "#1B2A4A" }}>
                  Date of Service
                </label>
                <input
                  id="date"
                  name="date"
                  type="date"
                  value={formData.date}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 focus:border-[#2E86DE] focus:outline-none transition-colors"
                  style={{ borderRadius: "8px" }}
                  required
                />
              </div>

              <div>
                <label htmlFor="title" className="block text-sm mb-2" style={{ color: "#1B2A4A" }}>
                  Title / Activity
                </label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 focus:border-[#2E86DE] focus:outline-none transition-colors"
                  style={{ borderRadius: "8px" }}
                  placeholder="e.g., Engine A Overhaul"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="remark" className="block text-sm mb-2" style={{ color: "#1B2A4A" }}>
                Remarks / Parts Replaced
              </label>
              <input
                id="remark"
                name="remark"
                type="text"
                value={formData.remark}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 focus:border-[#2E86DE] focus:outline-none transition-colors"
                style={{ borderRadius: "8px" }}
                placeholder="e.g., Replaced hydraulic pump, oil filter"
              />
            </div>

            <div className="text-sm text-gray-500">Logged by: Employee #{empId}</div>
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
          {submitting ? 'Submitting...' : 'Submit Record'}
        </button>
      </form>
    </DashboardLayout>
  );
}
