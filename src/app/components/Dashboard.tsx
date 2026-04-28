import { useNavigate } from "react-router";
import {
  Plane,
  LayoutDashboard,
  Users,
  Calendar,
  Settings,
  LogOut,
} from "lucide-react";

export default function Dashboard() {
  const navigate = useNavigate();
  const userName = sessionStorage.getItem("userEmail")?.split("@")[0] || "User";
  const userRole =
    sessionStorage.getItem("userEmail")?.includes("admin")
      ? "Admin"
      : sessionStorage.getItem("userEmail")?.includes("crew")
      ? "Crew"
      : sessionStorage.getItem("userEmail")?.includes("passenger")
      ? "Passenger"
      : "Admin";

  const handleLogout = () => {
    sessionStorage.clear();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ backgroundColor: "#1B2A4A" }}>
              <Plane className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl" style={{ color: "#1B2A4A", fontWeight: 700 }}>
                AOMS
              </h1>
              <p className="text-xs text-gray-500">Airline Operations Management</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm" style={{ color: "#1B2A4A", fontWeight: 600 }}>
                {userName.charAt(0).toUpperCase() + userName.slice(1)}
              </p>
              <p
                className="text-xs px-2 py-0.5 rounded inline-block"
                style={{ backgroundColor: "#2E86DE", color: "white" }}
              >
                {userRole}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Logout"
            >
              <LogOut className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl mb-2" style={{ color: "#1B2A4A", fontWeight: 600 }}>
            Welcome to your Dashboard
          </h2>
          <p className="text-gray-600">
            Manage your operations and track performance in real-time
          </p>
        </div>

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <DashboardCard
            icon={<LayoutDashboard className="w-6 h-6" />}
            title="Overview"
            description="System status and metrics"
            color="#2E86DE"
          />
          <DashboardCard
            icon={<Calendar className="w-6 h-6" />}
            title="Schedule"
            description="Flight schedules and planning"
            color="#1B2A4A"
          />
          <DashboardCard
            icon={<Users className="w-6 h-6" />}
            title="Team"
            description="Crew and staff management"
            color="#2E86DE"
          />
          <DashboardCard
            icon={<Settings className="w-6 h-6" />}
            title="Settings"
            description="System configuration"
            color="#1B2A4A"
          />
        </div>

        {/* Info Section */}
        <div
          className="mt-8 p-6 bg-white shadow-sm"
          style={{ borderRadius: "8px", borderLeft: "4px solid #2E86DE" }}
        >
          <h3 className="mb-2" style={{ color: "#1B2A4A", fontWeight: 600 }}>
            Role-Based Access
          </h3>
          <p className="text-gray-600">
            Your dashboard is customized based on your role ({userRole}). You have access to
            features and data relevant to your responsibilities within the airline operations
            management system.
          </p>
        </div>
      </main>
    </div>
  );
}

interface DashboardCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}

function DashboardCard({ icon, title, description, color }: DashboardCardProps) {
  return (
    <div
      className="bg-white p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      style={{ borderRadius: "8px" }}
    >
      <div
        className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
        style={{ backgroundColor: `${color}15`, color }}
      >
        {icon}
      </div>
      <h3 className="mb-1" style={{ color: "#1B2A4A", fontWeight: 600 }}>
        {title}
      </h3>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  );
}
