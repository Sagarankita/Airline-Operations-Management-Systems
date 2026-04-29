import { ReactNode } from "react";
import { useNavigate, useLocation } from "react-router";
import { LogOut, User } from "lucide-react";
import { useUserName } from "../../../lib/useUserName";

interface DashboardLayoutProps {
  children: ReactNode;
  role: string;
  userName: string;
  navItems: { label: string; path: string; icon: ReactNode }[];
}

export function DashboardLayout({ children, role, userName: fallback, navItems }: DashboardLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const userName = useUserName(fallback);

  const handleLogout = () => {
    sessionStorage.clear();
    navigate("/");
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside
        className="w-64 flex flex-col shadow-lg"
        style={{ backgroundColor: "#1B2A4A" }}
      >
        {/* User info */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-white" style={{ fontWeight: 600 }}>
                {userName}
              </p>
              <p className="text-sm text-white/70">{role}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item, index) => (
            <button
              key={index}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                isActive(item.path)
                  ? "bg-white/10 text-white"
                  : "text-white/70 hover:bg-white/5 hover:text-white"
              }`}
            >
              <span className="w-5 h-5">{item.icon}</span>
              <span style={{ fontWeight: 500 }}>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-white/70 hover:bg-white/5 hover:text-white transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span style={{ fontWeight: 500 }}>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 bg-gray-50 overflow-auto">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
