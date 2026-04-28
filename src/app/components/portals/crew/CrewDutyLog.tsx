import { useState } from "react";
import { DashboardLayout } from "../../layouts/DashboardLayout";
import { Breadcrumb } from "../../shared/Breadcrumb";
import { Home, Plane, Calendar, FileText } from "lucide-react";

export default function CrewDutyLog() {
  const userName = sessionStorage.getItem("userEmail")?.split("@")[0] || "Crew";
  const [formData, setFormData] = useState({
    dutyStart: "",
    dutyEnd: "",
    observations: "",
  });

  const navItems = [
    { label: "Dashboard", path: "/crew", icon: <Home className="w-5 h-5" /> },
    { label: "Update Status", path: "/crew/update-status", icon: <Plane className="w-5 h-5" /> },
    { label: "Assigned Flights", path: "/crew/flights", icon: <Calendar className="w-5 h-5" /> },
    { label: "Duty Log", path: "/crew/duty-log", icon: <FileText className="w-5 h-5" /> },
  ];

  const calculateDuration = () => {
    if (formData.dutyStart && formData.dutyEnd) {
      const start = new Date(`2026-01-01T${formData.dutyStart}`);
      const end = new Date(`2026-01-01T${formData.dutyEnd}`);
      const diff = (end.getTime() - start.getTime()) / 1000 / 60 / 60; // hours
      return diff > 0 ? diff.toFixed(1) : "0.0";
    }
    return "0.0";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Duty log submitted successfully!");
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
        <h2 className="text-lg mb-3" style={{ color: "#1B2A4A", fontWeight: 600 }}>
          Flight Context
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Flight No:</span>
            <p style={{ color: "#1B2A4A", fontWeight: 500 }}>AO101</p>
          </div>
          <div>
            <span className="text-gray-600">Route:</span>
            <p style={{ color: "#1B2A4A", fontWeight: 500 }}>JFK → LHR</p>
          </div>
          <div>
            <span className="text-gray-600">Date:</span>
            <p style={{ color: "#1B2A4A", fontWeight: 500 }}>2026-04-06</p>
          </div>
          <div>
            <span className="text-gray-600">Aircraft:</span>
            <p style={{ color: "#1B2A4A", fontWeight: 500 }}>B777-300</p>
          </div>
        </div>
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

        <button
          type="submit"
          className="px-6 py-3 rounded-lg text-white transition-colors hover:opacity-90"
          style={{ backgroundColor: "#2E86DE" }}
        >
          Submit Duty Log
        </button>
      </form>
    </DashboardLayout>
  );
}
