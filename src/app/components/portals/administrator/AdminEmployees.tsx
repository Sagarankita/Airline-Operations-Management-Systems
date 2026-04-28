import { useState } from "react";
import { DashboardLayout } from "../../layouts/DashboardLayout";
import { Breadcrumb } from "../../shared/Breadcrumb";
import { StatusBadge } from "../../shared/StatusBadge";
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

  const navItems = [
    { label: "Dashboard", path: "/admin", icon: <Home className="w-5 h-5" /> },
    { label: "Employees", path: "/admin/employees", icon: <Users className="w-5 h-5" /> },
    { label: "Flight Schedule", path: "/admin/flights", icon: <Calendar className="w-5 h-5" /> },
    { label: "Aircraft", path: "/admin/aircraft", icon: <Plane className="w-5 h-5" /> },
    { label: "Delay Prediction", path: "/admin/delay-prediction", icon: <AlertTriangle className="w-5 h-5" /> },
    { label: "Crew Assignment", path: "/admin/crew-assignment", icon: <UserCheck className="w-5 h-5" /> },
    { label: "Reports", path: "/admin/reports", icon: <FileText className="w-5 h-5" /> },
  ];

  const employees = [
    { id: "E001", name: "Sarah Johnson", role: "Pilot", department: "Flight Operations", status: "Active" },
    { id: "E002", name: "Michael Chen", role: "Cabin Crew", department: "In-Flight Services", status: "Active" },
    { id: "E003", name: "Emma Williams", role: "Ground Staff", department: "Ground Operations", status: "Active" },
    { id: "E004", name: "James Brown", role: "Maintenance Engineer", department: "Maintenance", status: "On Leave" },
    { id: "E005", name: "Lisa Anderson", role: "Fuel Staff", department: "Ground Operations", status: "Active" },
  ];

  const filteredEmployees = employees.filter(emp =>
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddEmployee = () => {
    setIsEditMode(false);
    setSelectedEmployee(null);
    setShowDrawer(true);
  };

  const handleEditEmployee = (emp: any) => {
    setIsEditMode(true);
    setSelectedEmployee(emp);
    setShowDrawer(true);
  };

  const handleDeactivateEmployee = (emp: any) => {
    setSelectedEmployee(emp);
    setShowDeactivateModal(true);
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

      {/* Employee Table */}
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
              {filteredEmployees.map((employee, index) => (
                <tr key={employee.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="px-6 py-4 text-sm" style={{ color: "#1B2A4A" }}>
                    {employee.id}
                  </td>
                  <td className="px-6 py-4 text-sm" style={{ color: "#1B2A4A", fontWeight: 500 }}>
                    {employee.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {employee.role}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {employee.department}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={employee.status} variant="small" />
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

              <form className="space-y-5">
                <FormField label="Employee ID" defaultValue={selectedEmployee?.id || ""} />
                <FormField label="Full Name" defaultValue={selectedEmployee?.name || ""} />
                <div>
                  <label className="block text-sm mb-2" style={{ color: "#1B2A4A" }}>
                    Role
                  </label>
                  <select
                    defaultValue={selectedEmployee?.role || ""}
                    className="w-full px-4 py-3 border border-gray-300 focus:border-[#2E86DE] focus:outline-none"
                    style={{ borderRadius: "8px" }}
                  >
                    <option value="">Select role...</option>
                    <option value="Pilot">Pilot</option>
                    <option value="Cabin Crew">Cabin Crew</option>
                    <option value="Ground Staff">Ground Staff</option>
                    <option value="Maintenance Engineer">Maintenance Engineer</option>
                    <option value="Fuel Staff">Fuel Staff</option>
                  </select>
                </div>
                <FormField label="Department" defaultValue={selectedEmployee?.department || ""} />
                <div>
                  <label className="block text-sm mb-2" style={{ color: "#1B2A4A" }}>
                    Status
                  </label>
                  <select
                    defaultValue={selectedEmployee?.status || "Active"}
                    className="w-full px-4 py-3 border border-gray-300 focus:border-[#2E86DE] focus:outline-none"
                    style={{ borderRadius: "8px" }}
                  >
                    <option value="Active">Active</option>
                    <option value="On Leave">On Leave</option>
                    <option value="On Duty">On Duty</option>
                  </select>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    className="w-full py-3 rounded-lg text-white transition-colors hover:opacity-90"
                    style={{ backgroundColor: "#2E86DE" }}
                  >
                    {isEditMode ? "Save Changes" : "Add Employee"}
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
                onClick={() => setShowDeactivateModal(false)}
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
