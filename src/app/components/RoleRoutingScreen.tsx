import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Loader2, Shield } from "lucide-react";

// Mock role assignment based on email patterns
const getUserRole = (email: string): string => {
  if (email.includes("admin")) return "Admin";
  if (email.includes("crew") || email.includes("pilot")) return "Crew";
  if (email.includes("passenger")) return "Passenger";
  if (email.includes("ground")) return "Ground Staff";
  if (email.includes("maintenance")) return "Maintenance";
  if (email.includes("fuel")) return "Fuel Staff";
  // Default role
  return "Passenger";
};

const getUserRolePath = (email: string): string => {
  if (email.includes("admin")) return "/admin";
  if (email.includes("crew") || email.includes("pilot")) return "/crew";
  if (email.includes("passenger")) return "/passenger";
  if (email.includes("ground")) return "/ground-staff";
  if (email.includes("maintenance")) return "/maintenance";
  if (email.includes("fuel")) return "/fuel-staff";
  // Default path
  return "/passenger";
};

const getUserName = (email: string): string => {
  const name = email.split("@")[0];
  return name.charAt(0).toUpperCase() + name.slice(1);
};

export default function RoleRoutingScreen() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState("");

  useEffect(() => {
    const email = sessionStorage.getItem("userEmail") || "user@aoms.com";
    const name = getUserName(email);
    const role = getUserRole(email);
    const rolePath = getUserRolePath(email);

    setUserName(name);
    setUserRole(role);

    // Show spinner for 1 second
    const loadingTimer = setTimeout(() => {
      setIsLoading(false);
      setShowWelcome(true);
    }, 1000);

    // Show welcome card, then navigate to dashboard
    const welcomeTimer = setTimeout(() => {
      navigate(rolePath);
    }, 2500);

    return () => {
      clearTimeout(loadingTimer);
      clearTimeout(welcomeTimer);
    };
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      {isLoading ? (
        // Loading spinner
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin" style={{ color: "#2E86DE" }} />
          <p className="text-gray-600">Verifying credentials...</p>
        </div>
      ) : (
        // Welcome card with role badge
        <div
          className="bg-white p-8 shadow-lg text-center max-w-md mx-4 animate-fadeIn"
          style={{ borderRadius: "8px", animation: "fadeIn 0.5s ease-in" }}
        >
          <div className="mb-4 flex justify-center">
            <div className="p-4 bg-blue-50 rounded-full">
              <Shield className="w-10 h-10" style={{ color: "#2E86DE" }} />
            </div>
          </div>

          <h2 className="text-2xl mb-2" style={{ color: "#1B2A4A", fontWeight: 600 }}>
            Welcome back, {userName}!
          </h2>

          <div className="flex justify-center my-4">
            <span
              className="inline-flex items-center gap-2 px-4 py-2 text-sm"
              style={{
                backgroundColor: "#2E86DE",
                color: "white",
                borderRadius: "8px",
                fontWeight: 600,
              }}
            >
              {userRole}
            </span>
          </div>

          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}