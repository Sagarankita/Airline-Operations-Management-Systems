import { useState, useMemo } from "react";
import { DashboardLayout } from "../../layouts/DashboardLayout";
import { Breadcrumb } from "../../shared/Breadcrumb";
import { LoadingState, ErrorState, EmptyState } from "../../shared/ApiStates";
import { useFetch } from "../../../../lib/useApi";
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

  const { data: acData } = useFetch<any[]>('/aircraft?limit=100');
  const aircraftList: any[] = acData ?? [];

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (selectedAircraft) params.set('aircraft_id', selectedAircraft);
    if (maintenanceType)  params.set('type', maintenanceType);
    if (dateFrom)         params.set('from_date', dateFrom);
    if (dateTo)           params.set('to_date', dateTo);
    params.set('limit', '100');
    return `/maintenance?${params.toString()}`;
  }, [selectedAircraft, maintenanceType, dateFrom, dateTo]);

  const { data, loading, error, refetch } = useFetch<any[]>(query);
  const filteredRecords: any[] = data ?? [];

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
            <label className="block text-sm mb-2" style={{ color: "#1B2A4A" }}>
              Aircraft
            </label>
            <select
              value={selectedAircraft}
              onChange={(e) => setSelectedAircraft(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 focus:border-[#2E86DE] focus:outline-none"
              style={{ borderRadius: "8px" }}
            >
              <option value="">All Aircraft</option>
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
              id="maintenanceType"
              value={maintenanceType}
              onChange={(e) => setMaintenanceType(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 focus:border-[#2E86DE] focus:outline-none"
              style={{ borderRadius: "8px" }}
            >
              <option value="">All Types</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Unscheduled">Unscheduled</option>
              <option value="Emergency">Emergency</option>
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
              className="w-full px-4 py-3 border border-gray-300 focus:border-[#2E86DE] focus:outline-none"
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
              className="w-full px-4 py-3 border border-gray-300 focus:border-[#2E86DE] focus:outline-none"
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
      {loading && <LoadingState message="Loading maintenance history..." />}
      {error   && <ErrorState message={error} onRetry={refetch} />}
      {!loading && !error && (
        <div className="bg-white shadow-sm overflow-hidden" style={{ borderRadius: "8px" }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead style={{ backgroundColor: "#F9FAFB" }}>
                <tr>
                  <th className="px-6 py-4 text-left text-sm" style={{ color: "#1B2A4A", fontWeight: 600 }}>Date</th>
                  <th className="px-6 py-4 text-left text-sm" style={{ color: "#1B2A4A", fontWeight: 600 }}>Aircraft</th>
                  <th className="px-6 py-4 text-left text-sm" style={{ color: "#1B2A4A", fontWeight: 600 }}>Type</th>
                  <th className="px-6 py-4 text-left text-sm" style={{ color: "#1B2A4A", fontWeight: 600 }}>Title</th>
                  <th className="px-6 py-4 text-left text-sm" style={{ color: "#1B2A4A", fontWeight: 600 }}>Remarks</th>
                  <th className="px-6 py-4 text-left text-sm" style={{ color: "#1B2A4A", fontWeight: 600 }}>Technician</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.length === 0 ? (
                  <tr><td colSpan={6}><EmptyState message="No maintenance records found." /></td></tr>
                ) : filteredRecords.map((record: any, index: number) => (
                  <tr key={record.s_no ?? index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="px-6 py-4 text-sm text-gray-600">{record.date ? new Date(record.date).toLocaleDateString() : '—'}</td>
                    <td className="px-6 py-4 text-sm" style={{ color: "#1B2A4A", fontWeight: 500 }}>{record.aircraft_model ?? `#${record.aircraft_id}`}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{record.maintenance_type}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{record.title ?? '—'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{record.remark ?? '—'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{record.staff_name ?? `#${record.emp_id}`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
