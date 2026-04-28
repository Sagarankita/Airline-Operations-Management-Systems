import { useState } from "react";
import { DashboardLayout } from "../../layouts/DashboardLayout";
import { Breadcrumb } from "../../shared/Breadcrumb";
import { Home, Wrench, History } from "lucide-react";

export default function MaintenanceRecord() {
  const userName = sessionStorage.getItem("userEmail")?.split("@")[0] || "Engineer";
  const [formData, setFormData] = useState({
    aircraftReg: "",
    maintenanceType: "",
    dateOfService: "",
    duration: "",
    partsReplaced: "",
    technicianId: "",
  });

  const navItems = [
    { label: "Dashboard", path: "/maintenance", icon: <Home className="w-5 h-5" /> },
    { label: "Record Maintenance", path: "/maintenance/record", icon: <Wrench className="w-5 h-5" /> },
    { label: "Maintenance History", path: "/maintenance/history", icon: <History className="w-5 h-5" /> },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Maintenance record submitted successfully!");
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
                id="aircraftReg"
                name="aircraftReg"
                value={formData.aircraftReg}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 focus:border-[#2E86DE] focus:outline-none transition-colors"
                style={{ borderRadius: "8px" }}
                required
              >
                <option value="">Select aircraft...</option>
                <option value="N12345">N12345 - B777-300</option>
                <option value="N67890">N67890 - A380-800</option>
                <option value="N24680">N24680 - B787-9</option>
                <option value="N13579">N13579 - A320-200</option>
              </select>
            </div>

            <div>
              <label htmlFor="maintenanceType" className="block text-sm mb-2" style={{ color: "#1B2A4A" }}>
                Maintenance Type
              </label>
              <select
                id="maintenanceType"
                name="maintenanceType"
                value={formData.maintenanceType}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 focus:border-[#2E86DE] focus:outline-none transition-colors"
                style={{ borderRadius: "8px" }}
                required
              >
                <option value="">Select type...</option>
                <option value="Routine Inspection">Routine Inspection</option>
                <option value="Engine Maintenance">Engine Maintenance</option>
                <option value="Hydraulics">Hydraulics</option>
                <option value="Avionics">Avionics</option>
                <option value="Emergency Repair">Emergency Repair</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label htmlFor="dateOfService" className="block text-sm mb-2" style={{ color: "#1B2A4A" }}>
                  Date of Service
                </label>
                <input
                  id="dateOfService"
                  name="dateOfService"
                  type="date"
                  value={formData.dateOfService}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 focus:border-[#2E86DE] focus:outline-none transition-colors"
                  style={{ borderRadius: "8px" }}
                  required
                />
              </div>

              <div>
                <label htmlFor="duration" className="block text-sm mb-2" style={{ color: "#1B2A4A" }}>
                  Duration (hours)
                </label>
                <input
                  id="duration"
                  name="duration"
                  type="number"
                  step="0.5"
                  value={formData.duration}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 focus:border-[#2E86DE] focus:outline-none transition-colors"
                  style={{ borderRadius: "8px" }}
                  placeholder="e.g., 4.5"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="partsReplaced" className="block text-sm mb-2" style={{ color: "#1B2A4A" }}>
                Parts Replaced
              </label>
              <input
                id="partsReplaced"
                name="partsReplaced"
                type="text"
                value={formData.partsReplaced}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 focus:border-[#2E86DE] focus:outline-none transition-colors"
                style={{ borderRadius: "8px" }}
                placeholder="e.g., Hydraulic pump, Oil filter (comma separated)"
                required
              />
            </div>

            <div>
              <label htmlFor="technicianId" className="block text-sm mb-2" style={{ color: "#1B2A4A" }}>
                Technician ID
              </label>
              <input
                id="technicianId"
                name="technicianId"
                type="text"
                value={formData.technicianId}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 focus:border-[#2E86DE] focus:outline-none transition-colors"
                style={{ borderRadius: "8px" }}
                placeholder="e.g., TECH-001"
                required
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="px-6 py-3 rounded-lg text-white transition-colors hover:opacity-90"
          style={{ backgroundColor: "#27AE60" }}
        >
          Submit Record
        </button>
      </form>
    </DashboardLayout>
  );
}
