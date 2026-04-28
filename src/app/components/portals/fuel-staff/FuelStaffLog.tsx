import { useState } from "react";
import { DashboardLayout } from "../../layouts/DashboardLayout";
import { Breadcrumb } from "../../shared/Breadcrumb";
import { Home, Fuel } from "lucide-react";

export default function FuelStaffLog() {
  const userName = sessionStorage.getItem("userEmail")?.split("@")[0] || "Fuel Staff";
  const [selectedFuelType, setSelectedFuelType] = useState("Jet-A1");
  const [formData, setFormData] = useState({
    aircraftReg: "",
    flight: "",
    quantity: "",
    dateTime: "",
    supplierRef: "",
  });

  const navItems = [
    { label: "Dashboard", path: "/fuel-staff", icon: <Home className="w-5 h-5" /> },
    { label: "Record Fuel Log", path: "/fuel-staff/log", icon: <Fuel className="w-5 h-5" /> },
  ];

  const fuelTypes = ["Jet-A1", "Avgas", "SAF"];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Fuel log submitted successfully!");
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
                <label htmlFor="flight" className="block text-sm mb-2" style={{ color: "#1B2A4A" }}>
                  Flight
                </label>
                <select
                  id="flight"
                  name="flight"
                  value={formData.flight}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 focus:border-[#2E86DE] focus:outline-none transition-colors"
                  style={{ borderRadius: "8px" }}
                  required
                >
                  <option value="">Select flight...</option>
                  <option value="AO101">AO101 - JFK to LHR</option>
                  <option value="AO202">AO202 - LHR to CDG</option>
                  <option value="AO303">AO303 - CDG to DXB</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm mb-2" style={{ color: "#1B2A4A" }}>
                Fuel Type
              </label>
              <div className="flex bg-white border border-gray-300 rounded-lg overflow-hidden">
                {fuelTypes.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setSelectedFuelType(type)}
                    className={`flex-1 px-6 py-3 transition-colors ${
                      selectedFuelType === type
                        ? "bg-[#2E86DE] text-white"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                    style={{ fontWeight: 500 }}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="quantity" className="block text-sm mb-2" style={{ color: "#1B2A4A" }}>
                Quantity in Litres
              </label>
              <input
                id="quantity"
                name="quantity"
                type="number"
                step="0.1"
                value={formData.quantity}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 focus:border-[#2E86DE] focus:outline-none transition-colors"
                style={{ borderRadius: "8px" }}
                placeholder="e.g., 50000"
                required
              />
            </div>

            <div>
              <label htmlFor="dateTime" className="block text-sm mb-2" style={{ color: "#1B2A4A" }}>
                Date & Time
              </label>
              <input
                id="dateTime"
                name="dateTime"
                type="datetime-local"
                value={formData.dateTime}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 focus:border-[#2E86DE] focus:outline-none transition-colors"
                style={{ borderRadius: "8px" }}
                required
              />
            </div>

            <div>
              <label htmlFor="supplierRef" className="block text-sm mb-2" style={{ color: "#1B2A4A" }}>
                Supplier Reference
              </label>
              <input
                id="supplierRef"
                name="supplierRef"
                type="text"
                value={formData.supplierRef}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 focus:border-[#2E86DE] focus:outline-none transition-colors"
                style={{ borderRadius: "8px" }}
                placeholder="e.g., SUP-2026-001"
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
          Submit Fuel Log
        </button>
      </form>
    </DashboardLayout>
  );
}
