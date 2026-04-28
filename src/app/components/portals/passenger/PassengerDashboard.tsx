import { DashboardLayout } from "../../layouts/DashboardLayout";
import { Breadcrumb } from "../../shared/Breadcrumb";
import { Home, User, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router";

export default function PassengerDashboard() {
  const navigate = useNavigate();
  const userName = sessionStorage.getItem("userEmail")?.split("@")[0] || "Passenger";

  const navItems = [
    { label: "Dashboard", path: "/passenger", icon: <Home className="w-5 h-5" /> },
    { label: "My Profile", path: "/passenger/profile", icon: <User className="w-5 h-5" /> },
    { label: "Feedback", path: "/passenger/feedback", icon: <MessageSquare className="w-5 h-5" /> },
  ];

  return (
    <DashboardLayout role="Passenger" userName={userName} navItems={navItems}>
      <Breadcrumb items={[{ label: "Dashboard" }]} />
      
      <h1 className="text-3xl mb-6" style={{ color: "#1B2A4A", fontWeight: 600 }}>
        Welcome back, {userName.charAt(0).toUpperCase() + userName.slice(1)}!
      </h1>

      {/* Welcome Card */}
      <div
        className="bg-white p-6 shadow-sm mb-6"
        style={{ borderRadius: "8px" }}
      >
        <h2 className="text-xl mb-2" style={{ color: "#1B2A4A", fontWeight: 600 }}>
          Your Passenger Portal
        </h2>
        <p className="text-gray-600 mb-4">
          Manage your profile and share your flight experiences with us.
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => navigate("/passenger/profile")}
            className="px-4 py-2 rounded-lg text-white transition-colors hover:opacity-90"
            style={{ backgroundColor: "#2E86DE" }}
          >
            View My Profile
          </button>
          <button
            onClick={() => navigate("/passenger/feedback")}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 transition-colors hover:bg-gray-50"
          >
            Submit Feedback
          </button>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <QuickLinkCard
          icon={<User className="w-6 h-6" />}
          title="My Profile"
          description="View and edit your personal information"
          onClick={() => navigate("/passenger/profile")}
        />
        <QuickLinkCard
          icon={<MessageSquare className="w-6 h-6" />}
          title="My Feedback"
          description="View your feedback history and submit new feedback"
          onClick={() => navigate("/passenger/feedback")}
        />
      </div>
    </DashboardLayout>
  );
}

interface QuickLinkCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}

function QuickLinkCard({ icon, title, description, onClick }: QuickLinkCardProps) {
  return (
    <button
      onClick={onClick}
      className="bg-white p-6 shadow-sm hover:shadow-md transition-all text-left"
      style={{ borderRadius: "8px" }}
    >
      <div
        className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
        style={{ backgroundColor: "#2E86DE15", color: "#2E86DE" }}
      >
        {icon}
      </div>
      <h3 className="mb-2" style={{ color: "#1B2A4A", fontWeight: 600 }}>
        {title}
      </h3>
      <p className="text-sm text-gray-600">{description}</p>
    </button>
  );
}
