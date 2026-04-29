import { useState } from "react";
import { DashboardLayout } from "../../layouts/DashboardLayout";
import { Breadcrumb } from "../../shared/Breadcrumb";
import { StatusBadge } from "../../shared/StatusBadge";
import { LoadingState, ErrorState, EmptyState } from "../../shared/ApiStates";
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
  Plus,
  Search,
  Edit,
  XCircle,
} from "lucide-react";

export default function AdminAircraft() {
  const userName = sessionStorage.getItem("userEmail")?.split("@")[0] || "Admin";
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showDecommissionModal, setShowDecommissionModal] = useState(false);
  const [selectedAircraft, setSelectedAircraft] = useState<any>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({
    model: "",
    manufacturer: "",
    weight_capacity: "",
    range_km: "",
    status: "Active",
  });

  const navItems = [
    { label: "Dashboard", path: "/admin", icon: <Home className="w-5 h-5" /> },
    { label: "Employees", path: "/admin/employees", icon: <Users className="w-5 h-5" /> },
    { label: "Flight Schedule", path: "/admin/flights", icon: <Calendar className="w-5 h-5" /> },
    { label: "Aircraft", path: "/admin/aircraft", icon: <Plane className="w-5 h-5" /> },
    { label: "Delay Prediction", path: "/admin/delay-prediction", icon: <AlertTriangle className="w-5 h-5" /> },
    { label: "Crew Assignment", path: "/admin/crew-assignment", icon: <UserCheck className="w-5 h-5" /> },
    { label: "Reports", path: "/admin/reports", icon: <FileText className="w-5 h-5" /> },
  ];

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const { data: acData, loading, error, refetch } = useFetch<any[]>('/aircraft?limit=100');
  const aircraft: any[] = acData ?? [];
  const filteredAircraft = aircraft.filter(a =>
    (a.model ?? '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddAircraft = () => {
    setIsEditMode(false);
    setSelectedAircraft(null);
    setSaveError(null);
    setFormData({ model: "", manufacturer: "", weight_capacity: "", range_km: "", status: "Active" });
    setShowForm(true);
  };

  const handleEditAircraft = (ac: any) => {
    setIsEditMode(true);
    setSelectedAircraft(ac);
    setSaveError(null);
    setFormData({ model: ac.model ?? '', manufacturer: ac.manufacturer ?? '', weight_capacity: String(ac.weight_capacity ?? ''), range_km: String(ac.range_km ?? ''), status: ac.status ?? 'Active' });
    setShowForm(true);
  };

  const handleDecommissionAircraft = (ac: any) => {
    setSelectedAircraft(ac);
    setShowDecommissionModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setSaveError(null);
    try {
      const payload = { model: formData.model, manufacturer: formData.manufacturer, weight_capacity: parseInt(formData.weight_capacity), range_km: parseInt(formData.range_km), status: formData.status };
      if (isEditMode) {
        await api.put(`/aircraft/${selectedAircraft.aircraft_id}`, payload);
      } else {
        await api.post('/aircraft', payload);
      }
      setShowForm(false);
      refetch();
    } catch (err: any) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const confirmDecommission = async () => {
    try {
      await api.patch(`/aircraft/${selectedAircraft.aircraft_id}/status`, { status: 'Retired' });
      setSelectedAircraft(null);
      setShowDecommissionModal(false);
      refetch();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <DashboardLayout role="Administrator" userName={userName} navItems={navItems}>
      <Breadcrumb items={[{ label: "Dashboard", href: "/admin" }, { label: "Aircraft Management" }]} />
      
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl" style={{ color: "#1B2A4A", fontWeight: 600 }}>
          Aircraft Management
        </h1>
        <button
          onClick={handleAddAircraft}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-white transition-colors hover:opacity-90"
          style={{ backgroundColor: "#2E86DE" }}
        >
          <Plus className="w-5 h-5" />
          Register Aircraft
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search aircraft..."
            className="w-full pl-12 pr-4 py-3 border border-gray-300 focus:border-[#2E86DE] focus:outline-none transition-colors"
            style={{ borderRadius: "8px" }}
          />
        </div>
      </div>

      {loading && <LoadingState message="Loading aircraft..." />}
      {error   && <ErrorState message={error} onRetry={refetch} />}

      {/* Aircraft Table */}
      {!loading && !error && (
      <div className="bg-white shadow-sm overflow-hidden" style={{ borderRadius: "8px" }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead style={{ backgroundColor: "#F9FAFB" }}>
              <tr>
                <th className="px-6 py-4 text-left text-sm" style={{ color: "#1B2A4A", fontWeight: 600 }}>
                  Registration No.
                </th>
                <th className="px-6 py-4 text-left text-sm" style={{ color: "#1B2A4A", fontWeight: 600 }}>
                  Model
                </th>
                <th className="px-6 py-4 text-left text-sm" style={{ color: "#1B2A4A", fontWeight: 600 }}>
                  Capacity
                </th>
                <th className="px-6 py-4 text-left text-sm" style={{ color: "#1B2A4A", fontWeight: 600 }}>
                  Status
                </th>
                <th className="px-6 py-4 text-left text-sm" style={{ color: "#1B2A4A", fontWeight: 600 }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredAircraft.length === 0 ? (
                <tr><td colSpan={5}><EmptyState message="No aircraft found." /></td></tr>
              ) : filteredAircraft.map((ac, index) => (
                <tr key={ac.aircraft_id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="px-6 py-4 text-sm" style={{ color: "#1B2A4A", fontWeight: 500 }}>
                    #{ac.aircraft_id}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {ac.model}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {ac.capacity} seats
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={ac.status ?? 'Active'} variant="small" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditAircraft(ac)}
                        className="p-2 rounded hover:bg-gray-200 transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" style={{ color: "#2E86DE" }} />
                      </button>
                      <button
                        onClick={() => handleDecommissionAircraft(ac)}
                        className="p-2 rounded hover:bg-gray-200 transition-colors"
                        title="Decommission"
                      >
                        <XCircle className="w-4 h-4" style={{ color: "#E74C3C" }} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* Add/Edit Form Modal */}
      {showForm && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowForm(false)} />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-8 max-w-md w-full shadow-xl" style={{ borderRadius: "8px" }}>
              <h2 className="text-2xl mb-6" style={{ color: "#1B2A4A", fontWeight: 600 }}>
                {isEditMode ? "Edit Aircraft" : "Register Aircraft"}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="model" className="block text-sm mb-2" style={{ color: "#1B2A4A" }}>
                    Aircraft Model
                  </label>
                  <input
                    id="model"
                    name="model"
                    type="text"
                    value={formData.model}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 focus:border-[#2E86DE] focus:outline-none"
                    style={{ borderRadius: "8px" }}
                    placeholder="e.g., Boeing 777-300"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="manufacturer" className="block text-sm mb-2" style={{ color: "#1B2A4A" }}>
                    Manufacturer
                  </label>
                  <input
                    id="manufacturer"
                    name="manufacturer"
                    type="text"
                    value={formData.manufacturer}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 focus:border-[#2E86DE] focus:outline-none"
                    style={{ borderRadius: "8px" }}
                    placeholder="e.g., Boeing"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="weight_capacity" className="block text-sm mb-2" style={{ color: "#1B2A4A" }}>
                      Weight Capacity (kg)
                    </label>
                    <input
                      id="weight_capacity"
                      name="weight_capacity"
                      type="number"
                      value={formData.weight_capacity}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 focus:border-[#2E86DE] focus:outline-none"
                      style={{ borderRadius: "8px" }}
                      placeholder="e.g., 100000"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="range_km" className="block text-sm mb-2" style={{ color: "#1B2A4A" }}>
                      Range (km)
                    </label>
                    <input
                      id="range_km"
                      name="range_km"
                      type="number"
                      value={formData.range_km}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 focus:border-[#2E86DE] focus:outline-none"
                      style={{ borderRadius: "8px" }}
                      placeholder="e.g., 13500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="status" className="block text-sm mb-2" style={{ color: "#1B2A4A" }}>
                    Status
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 focus:border-[#2E86DE] focus:outline-none"
                    style={{ borderRadius: "8px" }}
                  >
                    <option value="Active">Active</option>
                    <option value="In_Maintenance">In Maintenance</option>
                    <option value="Retired">Retired</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 px-4 py-3 rounded-lg border border-gray-300 text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  {saveError && <p className="text-sm mb-2" style={{ color: '#E74C3C' }}>{saveError}</p>}
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 px-4 py-3 rounded-lg text-white transition-colors hover:opacity-90 disabled:opacity-50"
                    style={{ backgroundColor: "#2E86DE" }}
                  >
                    {saving ? 'Saving...' : isEditMode ? 'Save Changes' : 'Register Aircraft'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}

      {/* Decommission Modal */}
      {showDecommissionModal && selectedAircraft && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 max-w-md shadow-xl" style={{ borderRadius: "8px" }}>
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
            </div>
            <h2 className="text-2xl text-center mb-2" style={{ color: "#1B2A4A", fontWeight: 600 }}>
              Decommission Aircraft
            </h2>
            <p className="text-gray-600 text-center mb-6">
              Are you sure you want to decommission <strong>#{selectedAircraft.aircraft_id}</strong> ({selectedAircraft.model})? 
              This aircraft will be removed from the active fleet.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDecommissionModal(false)}
                className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 transition-colors hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDecommission}
                className="flex-1 px-4 py-2 rounded-lg text-white transition-colors hover:opacity-90"
                style={{ backgroundColor: "#E74C3C" }}
              >
                Decommission
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
