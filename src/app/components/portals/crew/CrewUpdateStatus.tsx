import { useState } from "react";
import { DashboardLayout } from "../../layouts/DashboardLayout";
import { Breadcrumb } from "../../shared/Breadcrumb";
import { Home, Plane, Calendar, FileText } from "lucide-react";

export default function CrewUpdateStatus() {
  const userName = sessionStorage.getItem("userEmail")?.split("@")[0] || "Crew";
  const [selectedStatus, setSelectedStatus] = useState("Boarding");

  const navItems = [
    { label: "Dashboard", path: "/crew", icon: <Home className="w-5 h-5" /> },
    { label: "Update Status", path: "/crew/update-status", icon: <Plane className="w-5 h-5" /> },
    { label: "Assigned Flights", path: "/crew/flights", icon: <Calendar className="w-5 h-5" /> },
    { label: "Duty Log", path: "/crew/duty-log", icon: <FileText className="w-5 h-5" /> },
  ];

  const statusOptions = ["Boarding", "Departed", "En Route", "Landed", "Delayed"];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Flight status updated to: ${selectedStatus}`);
  };

  return (
    <DashboardLayout role="Pilot / Cabin Crew" userName={userName} navItems={navItems}>
      <Breadcrumb
        items={[{ label: "Dashboard", href: "/crew" }, { label: "Update Flight Status" }]}
      />
      
      <h1 className="text-3xl mb-6" style={{ color: "#1B2A4A", fontWeight: 600 }}>
        Update Flight Status
      </h1>

      {/* Flight Summary Card */}
      <div className="bg-white p-6 shadow-sm mb-6" style={{ borderRadius: "8px" }}>
        <h2 className="text-lg mb-3" style={{ color: "#1B2A4A", fontWeight: 600 }}>
          Current Flight
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
            <span className="text-gray-600">Departure:</span>
            <p style={{ color: "#1B2A4A", fontWeight: 500 }}>2026-04-06 08:00</p>
          </div>
          <div>
            <span className="text-gray-600">Aircraft:</span>
            <p style={{ color: "#1B2A4A", fontWeight: 500 }}>B777-300</p>
          </div>
        </div>
      </div>

      {/* Status Selection Form */}
      <form onSubmit={handleSubmit}>
        <div className="bg-white p-8 shadow-sm mb-6" style={{ borderRadius: "8px" }}>
          <h2 className="text-lg mb-4" style={{ color: "#1B2A4A", fontWeight: 600 }}>
            Select Flight Status
          </h2>

          {/* Segmented Control */}
          <div className="flex flex-wrap gap-3">
            {statusOptions.map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setSelectedStatus(status)}
                className={`px-6 py-3 rounded-lg border-2 transition-all ${
                  selectedStatus === status
                    ? "border-[#2E86DE] bg-[#2E86DE] text-white"
                    : "border-gray-300 text-gray-700 hover:border-[#2E86DE] hover:bg-blue-50"
                }`}
                style={{ fontWeight: 500 }}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="px-6 py-3 rounded-lg text-white transition-colors hover:opacity-90"
          style={{ backgroundColor: "#2E86DE" }}
        >
          Update Status
        </button>
      </form>
    </DashboardLayout>
  );
}
