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
  X,
} from "lucide-react";

export default function AdminEmployees() {
  const userName = sessionStorage.getItem("userEmail")?.split("@")[0] || "Admin";
  const [searchTerm, setSearchTerm] = useState("");
  const [showDrawer, setShowDrawer] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [drawerForm, setDrawerForm] = useState({
    name: '', gender: '', dob: '', doj: '', role: '', contact: '', status: 'Active',
    pilot: { passport_no: '', license_number: '', rank: '', fitness: 'Fit', total_flight_hours: '' },
    cabin_crew: { passport_no: '', fitness: 'Fit', total_exp_years: '' },
    ground_staff: { department: '', shift_time: '' },
  });

  const { data: empData, loading, error, refetch } = useFetch<any[]>(`/employees?limit=100`);
  const allEmployees: any[] = empData ?? [];

  const navItems = [
    { label: "Dashboard", path: "/admin", icon: <Home className="w-5 h-5" /> },
    { label: "Employees", path: "/admin/employees", icon: <Users className="w-5 h-5" /> },
    { label: "Flight Schedule", path: "/admin/flights", icon: <Calendar className="w-5 h-5" /> },
    { label: "Aircraft", path: "/admin/aircraft", icon: <Plane className="w-5 h-5" /> },
    { label: "Delay Prediction", path: "/admin/delay-prediction", icon: <AlertTriangle className="w-5 h-5" /> },
    { label: "Crew Assignment", path: "/admin/crew-assignment", icon: <UserCheck className="w-5 h-5" /> },
    { label: "Reports", path: "/admin/reports", icon: <FileText className="w-5 h-5" /> },
  ];

  const filteredEmployees = allEmployees.filter(emp =>
    (emp.name ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(emp.emp_id).includes(searchTerm) ||
    (emp.role ?? '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddEmployee = () => {
    setIsEditMode(false);
    setSelectedEmployee(null);
    setSaveError(null);
    setDrawerForm({ name: '', gender: '', dob: '', doj: '', role: '', contact: '', status: 'Active', pilot: { passport_no: '', license_number: '', rank: '', fitness: 'Fit', total_flight_hours: '' }, cabin_crew: { passport_no: '', fitness: 'Fit', total_exp_years: '' }, ground_staff: { department: '', shift_time: '' } });
    setShowDrawer(true);
  };

  const handleEditEmployee = (emp: any) => {
    setIsEditMode(true);
    setSelectedEmployee(emp);
    setSaveError(null);
    setDrawerForm({ name: emp.name ?? '', gender: emp.gender ?? '', dob: emp.dob ?? '', doj: emp.doj ?? '', role: emp.role ?? '', contact: emp.contact ?? '', status: emp.status ?? emp.emp_status ?? 'Active', pilot: { passport_no: emp.passport_no ?? '', license_number: emp.license_number ?? '', rank: emp.pilot_rank ?? '', fitness: emp.pilot_fitness ?? 'Fit', total_flight_hours: String(emp.total_flight_hours ?? '') }, cabin_crew: { passport_no: emp.passport_no ?? '', fitness: emp.cabin_fitness ?? 'Fit', total_exp_years: String(emp.total_exp_years ?? '') }, ground_staff: { department: emp.department ?? '', shift_time: emp.shift_time ?? '' } });
    setShowDrawer(true);
  };

  const handleDeactivateEmployee = (emp: any) => {
    setSelectedEmployee(emp);
    setShowDeactivateModal(true);
  };

  const buildPayload = () => {
    const base: any = { name: drawerForm.name, gender: drawerForm.gender, dob: drawerForm.dob, doj: drawerForm.doj, role: drawerForm.role, contact: drawerForm.contact, status: drawerForm.status };
    if (drawerForm.role === 'Pilot') {
      base.pilot = { passport_no: drawerForm.pilot.passport_no, license_number: drawerForm.pilot.license_number, rank: drawerForm.pilot.rank, fitness: drawerForm.pilot.fitness || undefined, total_flight_hours: drawerForm.pilot.total_flight_hours ? parseInt(drawerForm.pilot.total_flight_hours) : undefined };
    } else if (drawerForm.role === 'Cabin_Crew') {
      base.cabin_crew = { passport_no: drawerForm.cabin_crew.passport_no, fitness: drawerForm.cabin_crew.fitness || undefined, total_exp_years: drawerForm.cabin_crew.total_exp_years ? parseInt(drawerForm.cabin_crew.total_exp_years) : undefined };
    } else if (drawerForm.role === 'Ground_Staff') {
      base.ground_staff = { department: drawerForm.ground_staff.department, shift_time: drawerForm.ground_staff.shift_time };
    }
    return base;
  };

  const handleDrawerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setSaveError(null);
    try {
      const payload = buildPayload();
      if (isEditMode) {
        await api.put(`/employees/${selectedEmployee.emp_id}`, payload);
      } else {
        await api.post('/employees', payload);
      }
      setShowDrawer(false);
      refetch();
    } catch (err: any) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const confirmDeactivate = async () => {
    try {
      await api.patch(`/employees/${selectedEmployee.emp_id}/status`, { status: 'Inactive' });
      setShowDeactivateModal(false);
      refetch();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <DashboardLayout role="Administrator" userName={userName} navItems={navItems}>
      <Breadcrumb items={[{ label: "Dashboard", href: "/admin" }, { label: "Employee Management" }]} />
      
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl" style={{ color: "#1B2A4A", fontWeight: 600 }}>
          Employee Management
        </h1>
        <button
          onClick={handleAddEmployee}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-white transition-colors hover:opacity-90"
          style={{ backgroundColor: "#2E86DE" }}
        >
          <Plus className="w-5 h-5" />
          Add Employee
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
            placeholder="Search employees..."
            className="w-full pl-12 pr-4 py-3 border border-gray-300 focus:border-[#2E86DE] focus:outline-none transition-colors"
            style={{ borderRadius: "8px" }}
          />
        </div>
      </div>

      {loading && <LoadingState message="Loading employees..." />}
      {error   && <ErrorState message={error} onRetry={refetch} />}

      {/* Employee Table */}
      {!loading && !error && (
      <div className="bg-white shadow-sm overflow-hidden" style={{ borderRadius: "8px" }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead style={{ backgroundColor: "#F9FAFB" }}>
              <tr>
                <th className="px-6 py-4 text-left text-sm" style={{ color: "#1B2A4A", fontWeight: 600 }}>
                  ID
                </th>
                <th className="px-6 py-4 text-left text-sm" style={{ color: "#1B2A4A", fontWeight: 600 }}>
                  Name
                </th>
                <th className="px-6 py-4 text-left text-sm" style={{ color: "#1B2A4A", fontWeight: 600 }}>
                  Role
                </th>
                <th className="px-6 py-4 text-left text-sm" style={{ color: "#1B2A4A", fontWeight: 600 }}>
                  Department
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
              {filteredEmployees.length === 0 ? (
                <tr><td colSpan={6}><EmptyState message="No employees found." /></td></tr>
              ) : filteredEmployees.map((employee, index) => (
                <tr key={employee.emp_id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="px-6 py-4 text-sm" style={{ color: "#1B2A4A" }}>
                    #{employee.emp_id}
                  </td>
                  <td className="px-6 py-4 text-sm" style={{ color: "#1B2A4A", fontWeight: 500 }}>
                    {employee.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {employee.role}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {employee.department ?? '—'}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={employee.emp_status ?? 'Active'} variant="small" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditEmployee(employee)}
                        className="p-2 rounded hover:bg-gray-200 transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" style={{ color: "#2E86DE" }} />
                      </button>
                      <button
                        onClick={() => handleDeactivateEmployee(employee)}
                        className="p-2 rounded hover:bg-gray-200 transition-colors"
                        title="Deactivate"
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

      {/* Right Drawer Form */}
      {showDrawer && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowDrawer(false)} />
          <div
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl" style={{ color: "#1B2A4A", fontWeight: 600 }}>
                  {isEditMode ? "Edit Employee" : "Add Employee"}
                </h2>
                <button
                  onClick={() => setShowDrawer(false)}
                  className="p-2 rounded hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleDrawerSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm mb-1" style={{ color: "#1B2A4A" }}>Full Name *</label>
                  <input type="text" value={drawerForm.name} onChange={e => setDrawerForm({...drawerForm, name: e.target.value})} required
                    className="w-full px-4 py-3 border border-gray-300 focus:border-[#2E86DE] focus:outline-none" style={{ borderRadius: "8px" }} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm mb-1" style={{ color: "#1B2A4A" }}>Gender *</label>
                    <select value={drawerForm.gender} onChange={e => setDrawerForm({...drawerForm, gender: e.target.value})} required
                      className="w-full px-4 py-3 border border-gray-300 focus:border-[#2E86DE] focus:outline-none" style={{ borderRadius: "8px" }}>
                      <option value="">Select...</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm mb-1" style={{ color: "#1B2A4A" }}>Status</label>
                    <select value={drawerForm.status} onChange={e => setDrawerForm({...drawerForm, status: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 focus:border-[#2E86DE] focus:outline-none" style={{ borderRadius: "8px" }}>
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                      <option value="On_Leave">On Leave</option>
                      <option value="Terminated">Terminated</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm mb-1" style={{ color: "#1B2A4A" }}>Date of Birth *</label>
                    <input type="date" value={drawerForm.dob} onChange={e => setDrawerForm({...drawerForm, dob: e.target.value})} required
                      className="w-full px-4 py-3 border border-gray-300 focus:border-[#2E86DE] focus:outline-none" style={{ borderRadius: "8px" }} />
                  </div>
                  <div>
                    <label className="block text-sm mb-1" style={{ color: "#1B2A4A" }}>Date of Joining *</label>
                    <input type="date" value={drawerForm.doj} onChange={e => setDrawerForm({...drawerForm, doj: e.target.value})} required
                      className="w-full px-4 py-3 border border-gray-300 focus:border-[#2E86DE] focus:outline-none" style={{ borderRadius: "8px" }} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm mb-1" style={{ color: "#1B2A4A" }}>Contact *</label>
                  <input type="text" value={drawerForm.contact} onChange={e => setDrawerForm({...drawerForm, contact: e.target.value})} required
                    placeholder="e.g., +91-9876543210"
                    className="w-full px-4 py-3 border border-gray-300 focus:border-[#2E86DE] focus:outline-none" style={{ borderRadius: "8px" }} />
                </div>
                <div>
                  <label className="block text-sm mb-1" style={{ color: "#1B2A4A" }}>Role *</label>
                  <select value={drawerForm.role} onChange={e => setDrawerForm({...drawerForm, role: e.target.value})} required
                    className="w-full px-4 py-3 border border-gray-300 focus:border-[#2E86DE] focus:outline-none" style={{ borderRadius: "8px" }}>
                    <option value="">Select role...</option>
                    <option value="Pilot">Pilot</option>
                    <option value="Cabin_Crew">Cabin Crew</option>
                    <option value="Ground_Staff">Ground Staff</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Fuel_Staff">Fuel Staff</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>

                {/* Pilot subtype */}
                {drawerForm.role === 'Pilot' && (
                  <div className="border border-blue-100 rounded-lg p-4 bg-blue-50 space-y-3">
                    <p className="text-xs font-semibold text-blue-700 uppercase">Pilot Details</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm mb-1" style={{ color: "#1B2A4A" }}>Passport No *</label>
                        <input type="text" value={drawerForm.pilot.passport_no} onChange={e => setDrawerForm({...drawerForm, pilot: {...drawerForm.pilot, passport_no: e.target.value}})} required
                          className="w-full px-3 py-2 border border-gray-300 focus:border-[#2E86DE] focus:outline-none" style={{ borderRadius: "8px" }} />
                      </div>
                      <div>
                        <label className="block text-sm mb-1" style={{ color: "#1B2A4A" }}>License No *</label>
                        <input type="text" value={drawerForm.pilot.license_number} onChange={e => setDrawerForm({...drawerForm, pilot: {...drawerForm.pilot, license_number: e.target.value}})} required
                          className="w-full px-3 py-2 border border-gray-300 focus:border-[#2E86DE] focus:outline-none" style={{ borderRadius: "8px" }} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm mb-1" style={{ color: "#1B2A4A" }}>Rank *</label>
                        <select value={drawerForm.pilot.rank} onChange={e => setDrawerForm({...drawerForm, pilot: {...drawerForm.pilot, rank: e.target.value}})} required
                          className="w-full px-3 py-2 border border-gray-300 focus:border-[#2E86DE] focus:outline-none" style={{ borderRadius: "8px" }}>
                          <option value="">Select...</option>
                          <option value="Captain">Captain</option>
                          <option value="First Officer">First Officer</option>
                          <option value="Second Officer">Second Officer</option>
                          <option value="Cadet">Cadet</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm mb-1" style={{ color: "#1B2A4A" }}>Fitness</label>
                        <select value={drawerForm.pilot.fitness} onChange={e => setDrawerForm({...drawerForm, pilot: {...drawerForm.pilot, fitness: e.target.value}})}
                          className="w-full px-3 py-2 border border-gray-300 focus:border-[#2E86DE] focus:outline-none" style={{ borderRadius: "8px" }}>
                          <option value="Fit">Fit</option>
                          <option value="Unfit">Unfit</option>
                          <option value="Conditional">Conditional</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm mb-1" style={{ color: "#1B2A4A" }}>Flight Hours</label>
                      <input type="number" value={drawerForm.pilot.total_flight_hours} onChange={e => setDrawerForm({...drawerForm, pilot: {...drawerForm.pilot, total_flight_hours: e.target.value}})}
                        className="w-full px-3 py-2 border border-gray-300 focus:border-[#2E86DE] focus:outline-none" style={{ borderRadius: "8px" }} placeholder="e.g., 5000" />
                    </div>
                  </div>
                )}

                {/* Cabin Crew subtype */}
                {drawerForm.role === 'Cabin_Crew' && (
                  <div className="border border-blue-100 rounded-lg p-4 bg-blue-50 space-y-3">
                    <p className="text-xs font-semibold text-blue-700 uppercase">Cabin Crew Details</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm mb-1" style={{ color: "#1B2A4A" }}>Passport No *</label>
                        <input type="text" value={drawerForm.cabin_crew.passport_no} onChange={e => setDrawerForm({...drawerForm, cabin_crew: {...drawerForm.cabin_crew, passport_no: e.target.value}})} required
                          className="w-full px-3 py-2 border border-gray-300 focus:border-[#2E86DE] focus:outline-none" style={{ borderRadius: "8px" }} />
                      </div>
                      <div>
                        <label className="block text-sm mb-1" style={{ color: "#1B2A4A" }}>Fitness</label>
                        <select value={drawerForm.cabin_crew.fitness} onChange={e => setDrawerForm({...drawerForm, cabin_crew: {...drawerForm.cabin_crew, fitness: e.target.value}})}
                          className="w-full px-3 py-2 border border-gray-300 focus:border-[#2E86DE] focus:outline-none" style={{ borderRadius: "8px" }}>
                          <option value="Fit">Fit</option>
                          <option value="Unfit">Unfit</option>
                          <option value="Conditional">Conditional</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm mb-1" style={{ color: "#1B2A4A" }}>Experience (years)</label>
                      <input type="number" value={drawerForm.cabin_crew.total_exp_years} onChange={e => setDrawerForm({...drawerForm, cabin_crew: {...drawerForm.cabin_crew, total_exp_years: e.target.value}})}
                        className="w-full px-3 py-2 border border-gray-300 focus:border-[#2E86DE] focus:outline-none" style={{ borderRadius: "8px" }} placeholder="e.g., 3" />
                    </div>
                  </div>
                )}

                {/* Ground Staff subtype */}
                {drawerForm.role === 'Ground_Staff' && (
                  <div className="border border-blue-100 rounded-lg p-4 bg-blue-50 space-y-3">
                    <p className="text-xs font-semibold text-blue-700 uppercase">Ground Staff Details</p>
                    <div>
                      <label className="block text-sm mb-1" style={{ color: "#1B2A4A" }}>Department *</label>
                      <input type="text" value={drawerForm.ground_staff.department} onChange={e => setDrawerForm({...drawerForm, ground_staff: {...drawerForm.ground_staff, department: e.target.value}})} required
                        placeholder="e.g., Boarding" className="w-full px-3 py-2 border border-gray-300 focus:border-[#2E86DE] focus:outline-none" style={{ borderRadius: "8px" }} />
                    </div>
                    <div>
                      <label className="block text-sm mb-1" style={{ color: "#1B2A4A" }}>Shift Time *</label>
                      <input type="text" value={drawerForm.ground_staff.shift_time} onChange={e => setDrawerForm({...drawerForm, ground_staff: {...drawerForm.ground_staff, shift_time: e.target.value}})} required
                        placeholder="e.g., 06:00-14:00" className="w-full px-3 py-2 border border-gray-300 focus:border-[#2E86DE] focus:outline-none" style={{ borderRadius: "8px" }} />
                    </div>
                  </div>
                )}
                {saveError && <p className="text-sm" style={{ color: '#E74C3C' }}>{saveError}</p>}
                <div className="pt-4">
                  <button type="submit" disabled={saving}
                    className="w-full py-3 rounded-lg text-white transition-colors hover:opacity-90 disabled:opacity-50"
                    style={{ backgroundColor: "#2E86DE" }}>
                    {saving ? 'Saving...' : isEditMode ? 'Save Changes' : 'Add Employee'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}

      {/* Deactivate Modal */}
      {showDeactivateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-8 max-w-md mx-4 shadow-xl" style={{ borderRadius: "8px" }}>
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
            </div>
            <h2 className="text-2xl text-center mb-2" style={{ color: "#1B2A4A", fontWeight: 600 }}>
              Deactivate Employee
            </h2>
            <p className="text-gray-600 text-center mb-6">
              Are you sure you want to deactivate <strong>{selectedEmployee?.name}</strong>? 
              They will no longer have access to the system.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeactivateModal(false)}
                className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 transition-colors hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeactivate}
                className="flex-1 px-4 py-2 rounded-lg text-white transition-colors hover:opacity-90"
                style={{ backgroundColor: "#E74C3C" }}
              >
                Deactivate
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

function FormField({ label, defaultValue }: { label: string; defaultValue: string }) {
  return (
    <div>
      <label className="block text-sm mb-2" style={{ color: "#1B2A4A" }}>
        {label}
      </label>
      <input
        type="text"
        defaultValue={defaultValue}
        className="w-full px-4 py-3 border border-gray-300 focus:border-[#2E86DE] focus:outline-none"
        style={{ borderRadius: "8px" }}
      />
    </div>
  );
}
