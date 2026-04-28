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

export default function AdminDelayPrediction() {
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

  const delayRisk = 72; // percentage
  const riskLevel = delayRisk >= 70 ? "High" : delayRisk >= 40 ? "Medium" : "Low";
  const riskColor = delayRisk >= 70 ? "#E74C3C" : delayRisk >= 40 ? "#F39C12" : "#27AE60";

  const contributingFactors = [
    "Weather conditions at destination (Heavy rain forecast)",
    "High air traffic congestion at LHR",
    "Potential crew availability issues",
    "Aircraft maintenance scheduled close to departure",
  ];

  return (
    <DashboardLayout role="Administrator" userName={userName} navItems={navItems}>
      <Breadcrumb items={[{ label: "Dashboard", href: "/admin" }, { label: "Delay Prediction" }]} />
      
      <h1 className="text-3xl mb-6" style={{ color: "#1B2A4A", fontWeight: 600 }}>
        Delay Prediction
      </h1>

      {/* Flight Info Card */}
      <div className="bg-white p-6 shadow-sm mb-6" style={{ borderRadius: "8px" }}>
        <h2 className="text-lg mb-3" style={{ color: "#1B2A4A", fontWeight: 600 }}>
          Flight Information
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Flight No:</span>
            <p style={{ color: "#1B2A4A", fontWeight: 500 }}>AO101</p>
          </div>
          <div>
            <span className="text-gray-600">Route:</span>
            <p style={{ color: "#1B2A4A", fontWeight: 500 }}>JFK → LHR</p>
          </div>
          <div>
            <span className="text-gray-600">Scheduled Departure:</span>
            <p style={{ color: "#1B2A4A", fontWeight: 500 }}>2026-04-06 08:00</p>
          </div>
          <div>
            <span className="text-gray-600">Aircraft:</span>
            <p style={{ color: "#1B2A4A", fontWeight: 500 }}>B777-300</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Delay Risk Gauge */}
        <div className="bg-white p-8 shadow-sm" style={{ borderRadius: "8px" }}>
          <h2 className="text-xl mb-6 text-center" style={{ color: "#1B2A4A", fontWeight: 600 }}>
            Delay Risk Assessment
          </h2>
          
          {/* Circular Gauge */}
          <div className="flex justify-center mb-6">
            <div className="relative w-48 h-48">
              <svg className="w-full h-full transform -rotate-90">
                {/* Background circle */}
                <circle
                  cx="96"
                  cy="96"
                  r="80"
                  stroke="#E5E7EB"
                  strokeWidth="16"
                  fill="none"
                />
                {/* Progress circle */}
                <circle
                  cx="96"
                  cy="96"
                  r="80"
                  stroke={riskColor}
                  strokeWidth="16"
                  fill="none"
                  strokeDasharray={`${(delayRisk / 100) * 502.4} 502.4`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-5xl" style={{ color: riskColor, fontWeight: 700 }}>
                  {delayRisk}%
                </p>
                <p className="text-sm text-gray-600">Delay Risk</p>
              </div>
            </div>
          </div>

          {/* Risk Badge */}
          <div className="flex justify-center">
            <span
              className="px-6 py-2 rounded-full text-white"
              style={{ backgroundColor: riskColor, fontWeight: 600 }}
            >
              {riskLevel} Risk
            </span>
          </div>
        </div>

        {/* Contributing Factors */}
        <div className="bg-white p-8 shadow-sm" style={{ borderRadius: "8px" }}>
          <h2 className="text-xl mb-6" style={{ color: "#1B2A4A", fontWeight: 600 }}>
            Contributing Factors
          </h2>
          <ul className="space-y-4">
            {contributingFactors.map((factor, index) => (
              <li key={index} className="flex items-start gap-3">
                <div className="mt-1">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: riskColor }}
                  />
                </div>
                <p className="text-gray-700 flex-1">{factor}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="bg-white p-6 shadow-sm" style={{ borderRadius: "8px" }}>
        <h2 className="text-lg mb-4" style={{ color: "#1B2A4A", fontWeight: 600 }}>
          Recommended Actions
        </h2>
        <div className="flex flex-wrap gap-3">
          <button
            className="px-6 py-3 rounded-lg text-white transition-colors hover:opacity-90"
            style={{ backgroundColor: "#2E86DE" }}
          >
            Reschedule Flight
          </button>
          <button
            className="px-6 py-3 rounded-lg text-white transition-colors hover:opacity-90"
            style={{ backgroundColor: "#F39C12" }}
          >
            Reassign Crew
          </button>
          <button
            className="px-6 py-3 rounded-lg border border-gray-300 text-gray-700 transition-colors hover:bg-gray-50"
          >
            Dismiss
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
