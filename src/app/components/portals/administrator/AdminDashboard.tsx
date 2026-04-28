import { DashboardLayout } from "../../layouts/DashboardLayout";
import { Breadcrumb } from "../../shared/Breadcrumb";
import {
  Home,
  Users,
  Plane,
  Calendar,
  AlertTriangle,
  UserCheck,
  FileText,
} from "lucide-react";
import { useNavigate } from "react-router";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const userName = sessionStorage.getItem("userEmail")?.split("@")[0] || "Admin";

  const navItems = [
    { label: "Dashboard", path: "/admin", icon: <Home className="w-5 h-5" /> },
    { label: "Employees", path: "/admin/employees", icon: <Users className="w-5 h-5" /> },
    { label: "Flight Schedule", path: "/admin/flights", icon: <Calendar className="w-5 h-5" /> },
    { label: "Aircraft", path: "/admin/aircraft", icon: <Plane className="w-5 h-5" /> },
    { label: "Delay Prediction", path: "/admin/delay-prediction", icon: <AlertTriangle className="w-5 h-5" /> },
    { label: "Crew Assignment", path: "/admin/crew-assignment", icon: <UserCheck className="w-5 h-5" /> },
    { label: "Reports", path: "/admin/reports", icon: <FileText className="w-5 h-5" /> },
  ];

  return (
    <DashboardLayout role="Administrator" userName={userName} navItems={navItems}>
      <Breadcrumb items={[{ label: "Dashboard" }]} />
      
      <h1 className="text-3xl mb-6" style={{ color: "#1B2A4A", fontWeight: 600 }}>
        Administrator Dashboard
      </h1>

      <p className="text-gray-600 mb-8">
        Manage all aspects of airline operations from this central hub.
      </p>

      {/* Module Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <ModuleCard
          icon={<Users className="w-8 h-8" />}
          title="Employee Management"
          description="Manage staff, roles, and departments"
          onClick={() => navigate("/admin/employees")}
          color="#2E86DE"
        />
        <ModuleCard
          icon={<Calendar className="w-8 h-8" />}
          title="Flight Schedule"
          description="View and manage flight schedules"
          onClick={() => navigate("/admin/flights")}
          color="#27AE60"
        />
        <ModuleCard
          icon={<Plane className="w-8 h-8" />}
          title="Aircraft Management"
          description="Track aircraft status and maintenance"
          onClick={() => navigate("/admin/aircraft")}
          color="#F39C12"
        />
        <ModuleCard
          icon={<AlertTriangle className="w-8 h-8" />}
          title="Delay Prediction"
          description="AI-powered delay risk assessment"
          onClick={() => navigate("/admin/delay-prediction")}
          color="#E74C3C"
        />
        <ModuleCard
          icon={<UserCheck className="w-8 h-8" />}
          title="Crew Assignment"
          description="Assign crew to flights efficiently"
          onClick={() => navigate("/admin/crew-assignment")}
          color="#9B59B6"
        />
        <ModuleCard
          icon={<FileText className="w-8 h-8" />}
          title="Reports"
          description="Generate operational reports"
          onClick={() => navigate("/admin/reports")}
          color="#34495E"
        />
      </div>
    </DashboardLayout>
  );
}

interface ModuleCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  color: string;
}

function ModuleCard({ icon, title, description, onClick, color }: ModuleCardProps) {
  return (
    <button
      onClick={onClick}
      className="bg-white p-6 shadow-sm hover:shadow-md transition-all text-left"
      style={{ borderRadius: "8px" }}
    >
      <div
        className="w-16 h-16 rounded-lg flex items-center justify-center mb-4"
        style={{ backgroundColor: `${color}15`, color }}
      >
        {icon}
      </div>
      <h3 className="text-lg mb-2" style={{ color: "#1B2A4A", fontWeight: 600 }}>
        {title}
      </h3>
      <p className="text-sm text-gray-600">{description}</p>
    </button>
  );
}
