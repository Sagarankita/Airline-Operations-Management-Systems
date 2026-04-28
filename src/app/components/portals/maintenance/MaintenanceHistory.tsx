import { useState } from "react";
import { DashboardLayout } from "../../layouts/DashboardLayout";
import { Breadcrumb } from "../../shared/Breadcrumb";
import { Home, Wrench, History, Filter } from "lucide-react";

export default function MaintenanceHistory() {
  const userName = sessionStorage.getItem("userEmail")?.split("@")[0] || "Engineer";
  const [selectedAircraft, setSelectedAircraft] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [maintenanceType, setMaintenanceType] = useState("");

  const navItems = [
    { label: "Dashboard", path: "/maintenance", icon: <Home className="w-5 h-5" /> },
    { label: "Record Maintenance", path: "/maintenance/record", icon: <Wrench className="w-5 h-5" /> },
    { label: "Maintenance History", path: "/maintenance/history", icon: <History className="w-5 h-5" /> },
  ];

  // Mock maintenance history data
  const allMaintenanceRecords = [
    {
      date: "2026-04-04",
      aircraft: "N12345",
      type: "Engine Maintenance",
      duration: 6.5,
      parts: "Oil filter, Hydraulic pump",
      technician: "TECH-001",
    },
    {
      date: "2026-04-02",
      aircraft: "N12345",
      type: "Routine Inspection",
      duration: 3.0,
      parts: "None",
      technician: "TECH-003",
    },
    {
      date: "2026-03-28",
      aircraft: "N67890",
      type: "Avionics",
      duration: 4.5,
      parts: "Navigation display unit",
      technician: "TECH-002",
    },
    {
      date: "2026-03-25",
      aircraft: "N12345",
      type: "Hydraulics",
      duration: 5.0,
      parts: "Hydraulic actuator, Pressure sensor",
      technician: "TECH-001",
    },
    {
      date: "2026-03-20",
      aircraft: "N24680",
      type: "Emergency Repair",
      duration: 8.0,
      parts: "Landing gear component, Brake assembly",
      technician: "TECH-004",
    },
    {
      date: "2026-03-15",
      aircraft: "N67890",
      type: "Routine Inspection",
      duration: 2.5,
      parts: "Air filter",
      technician: "TECH-003",
    },
  ];

  // Filter records
  const filteredRecords = allMaintenanceRecords.filter((record) => {
    if (selectedAircraft && record.aircraft !== selectedAircraft) return false;
    if (maintenanceType && record.type !== maintenanceType) return false;
    if (dateFrom && record.date < dateFrom) return false;
    if (dateTo && record.date > dateTo) return false;
    return true;
  });

  const handleReset = () => {
    setSelectedAircraft("");
    setDateFrom("");
    setDateTo("");
    setMaintenanceType("");
  };

  return (
    <DashboardLayout role="Maintenance Engineer" userName={userName} navItems={navItems}>
      <Breadcrumb
        items={[{ label: "Dashboard", href: "/maintenance" }, { label: "Maintenance History" }]}
      />
      
      <h1 className="text-3xl mb-6" style={{ color: "#1B2A4A", fontWeight: 600 }}>
        Maintenance History
      </h1>

      {/* Filters */}
      <div className="bg-white p-6 shadow-sm mb-6" style={{ borderRadius: "8px" }}>
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5" style={{ color: "#1B2A4A" }} />
          <h2 className="text-lg" style={{ color: "#1B2A4A", fontWeight: 600 }}>
            Filters
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label htmlFor="aircraft" className="block text-sm mb-2" style={{ color: "#1B2A4A" }}>
              Aircraft Registration
            </label>
            <select
              id="aircraft"
              value={selectedAircraft}
              onChange={(e) => setSelectedAircraft(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 focus:border-[#2E86DE] focus:outline-none transition-colors"
              style={{ borderRadius: "8px" }}
            >
              <option value="">All Aircraft</option>
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
              value={maintenanceType}
              onChange={(e) => setMaintenanceType(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 focus:border-[#2E86DE] focus:outline-none transition-colors"
              style={{ borderRadius: "8px" }}
            >
              <option value="">All Types</option>
              <option value="Routine Inspection">Routine Inspection</option>
              <option value="Engine Maintenance">Engine Maintenance</option>
              <option value="Hydraulics">Hydraulics</option>
              <option value="Avionics">Avionics</option>
              <option value="Emergency Repair">Emergency Repair</option>
            </select>
          </div>

          <div>
            <label htmlFor="dateFrom" className="block text-sm mb-2" style={{ color: "#1B2A4A" }}>
              Date From
            </label>
            <input
              id="dateFrom"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 focus:border-[#2E86DE] focus:outline-none transition-colors"
              style={{ borderRadius: "8px" }}
            />
          </div>

          <div>
            <label htmlFor="dateTo" className="block text-sm mb-2" style={{ color: "#1B2A4A" }}>
              Date To
            </label>
            <input
              id="dateTo"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 focus:border-[#2E86DE] focus:outline-none transition-colors"
              style={{ borderRadius: "8px" }}
            />
          </div>
        </div>

        <div className="mt-4 flex gap-3">
          <button
            onClick={handleReset}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 transition-colors hover:bg-gray-50"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-4">
        <p className="text-sm text-gray-600">
          Showing <strong>{filteredRecords.length}</strong> maintenance record(s)
        </p>
      </div>

      {/* Maintenance History Table */}
      <div className="bg-white shadow-sm overflow-hidden" style={{ borderRadius: "8px" }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead style={{ backgroundColor: "#F9FAFB" }}>
              <tr>
                <th className="px-6 py-4 text-left text-sm" style={{ color: "#1B2A4A", fontWeight: 600 }}>
                  Date
                </th>
                <th className="px-6 py-4 text-left text-sm" style={{ color: "#1B2A4A", fontWeight: 600 }}>
                  Aircraft
                </th>
                <th className="px-6 py-4 text-left text-sm" style={{ color: "#1B2A4A", fontWeight: 600 }}>
                  Type
                </th>
                <th className="px-6 py-4 text-left text-sm" style={{ color: "#1B2A4A", fontWeight: 600 }}>
                  Duration (hrs)
                </th>
                <th className="px-6 py-4 text-left text-sm" style={{ color: "#1B2A4A", fontWeight: 600 }}>
                  Parts Replaced
                </th>
                <th className="px-6 py-4 text-left text-sm" style={{ color: "#1B2A4A", fontWeight: 600 }}>
                  Technician
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length > 0 ? (
                filteredRecords.map((record, index) => (
                  <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="px-6 py-4 text-sm" style={{ color: "#1B2A4A", fontWeight: 500 }}>
                      {record.date}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {record.aircraft}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {record.type}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {record.duration}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {record.parts}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {record.technician}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No maintenance records found matching the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
