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
  ChevronRight,
} from "lucide-react";

export default function AdminCrewAssignment() {
  const userName = sessionStorage.getItem("userEmail")?.split("@")[0] || "Admin";
  const [selectedCrew, setSelectedCrew] = useState<string[]>([]);

  const navItems = [
    { label: "Dashboard", path: "/admin", icon: <Home className="w-5 h-5" /> },
    { label: "Employees", path: "/admin/employees", icon: <Users className="w-5 h-5" /> },
    { label: "Flight Schedule", path: "/admin/flights", icon: <Calendar className="w-5 h-5" /> },
    { label: "Aircraft", path: "/admin/aircraft", icon: <Plane className="w-5 h-5" /> },
    { label: "Delay Prediction", path: "/admin/delay-prediction", icon: <AlertTriangle className="w-5 h-5" /> },
    { label: "Crew Assignment", path: "/admin/crew-assignment", icon: <UserCheck className="w-5 h-5" /> },
    { label: "Reports", path: "/admin/reports", icon: <FileText className="w-5 h-5" /> },
  ];

  const pilots = [
    { id: "P001", name: "Capt. Sarah Johnson", availability: "Available" },
    { id: "P002", name: "F/O Michael Chen", availability: "On Duty" },
    { id: "P003", name: "Capt. Robert Martinez", availability: "Available" },
    { id: "P004", name: "F/O Emily Davis", availability: "On Leave" },
  ];

  const cabinCrew = [
    { id: "C001", name: "Emma Williams", availability: "Available" },
    { id: "C002", name: "James Brown", availability: "Available" },
    { id: "C003", name: "Lisa Anderson", availability: "On Duty" },
    { id: "C004", name: "David Wilson", availability: "Available" },
    { id: "C005", name: "Maria Garcia", availability: "On Leave" },
  ];

  const toggleCrewSelection = (id: string) => {
    if (selectedCrew.includes(id)) {
      setSelectedCrew(selectedCrew.filter(crewId => crewId !== id));
    } else {
      setSelectedCrew([...selectedCrew, id]);
    }
  };

  const getSelectedCrewNames = () => {
    const allCrew = [...pilots, ...cabinCrew];
    return selectedCrew.map(id => allCrew.find(c => c.id === id)?.name).filter(Boolean);
  };

  return (
    <DashboardLayout role="Administrator" userName={userName} navItems={navItems}>
      <Breadcrumb items={[{ label: "Dashboard", href: "/admin" }, { label: "Crew Assignment" }]} />
      
      <h1 className="text-3xl mb-6" style={{ color: "#1B2A4A", fontWeight: 600 }}>
        Assign Crew to Flight
      </h1>

      {/* Flight Info */}
      <div className="bg-white p-6 shadow-sm mb-6" style={{ borderRadius: "8px" }}>
        <h2 className="text-lg mb-3" style={{ color: "#1B2A4A", fontWeight: 600 }}>
          Flight AO101: JFK → LHR
        </h2>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Departure:</span>
            <p style={{ color: "#1B2A4A", fontWeight: 500 }}>2026-04-06 08:00</p>
          </div>
          <div>
            <span className="text-gray-600">Aircraft:</span>
            <p style={{ color: "#1B2A4A", fontWeight: 500 }}>B777-300</p>
          </div>
          <div>
            <span className="text-gray-600">Duration:</span>
            <p style={{ color: "#1B2A4A", fontWeight: 500 }}>7h 15m</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Left Panel: Available Crew */}
        <div>
          <h2 className="text-xl mb-4" style={{ color: "#1B2A4A", fontWeight: 600 }}>
            Available Crew
          </h2>

          {/* Pilots */}
          <div className="bg-white p-6 shadow-sm mb-4" style={{ borderRadius: "8px" }}>
            <h3 className="mb-4" style={{ color: "#1B2A4A", fontWeight: 600 }}>
              Pilots
            </h3>
            <div className="space-y-2">
              {pilots.map((pilot) => (
                <CrewCard
                  key={pilot.id}
                  id={pilot.id}
                  name={pilot.name}
                  availability={pilot.availability}
                  isSelected={selectedCrew.includes(pilot.id)}
                  onToggle={toggleCrewSelection}
                />
              ))}
            </div>
          </div>

          {/* Cabin Crew */}
          <div className="bg-white p-6 shadow-sm" style={{ borderRadius: "8px" }}>
            <h3 className="mb-4" style={{ color: "#1B2A4A", fontWeight: 600 }}>
              Cabin Crew
            </h3>
            <div className="space-y-2">
              {cabinCrew.map((crew) => (
                <CrewCard
                  key={crew.id}
                  id={crew.id}
                  name={crew.name}
                  availability={crew.availability}
                  isSelected={selectedCrew.includes(crew.id)}
                  onToggle={toggleCrewSelection}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel: Selected Crew */}
        <div>
          <h2 className="text-xl mb-4" style={{ color: "#1B2A4A", fontWeight: 600 }}>
            Selected Crew for Flight
          </h2>
          <div className="bg-white p-6 shadow-sm" style={{ borderRadius: "8px", minHeight: "400px" }}>
            {selectedCrew.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                <UserCheck className="w-16 h-16 mb-3" />
                <p>No crew members selected</p>
                <p className="text-sm">Click on crew members to add them</p>
              </div>
            ) : (
              <div className="space-y-3">
                {getSelectedCrewNames().map((name, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg"
                  >
                    <UserCheck className="w-5 h-5" style={{ color: "#2E86DE" }} />
                    <span style={{ color: "#1B2A4A", fontWeight: 500 }}>{name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sticky Bottom Action Bar */}
      <div className="fixed bottom-0 left-64 right-0 bg-white border-t border-gray-200 p-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <p className="text-sm text-gray-600">
            <strong>{selectedCrew.length}</strong> crew member(s) selected
          </p>
          <button
            disabled={selectedCrew.length === 0}
            className="px-6 py-3 rounded-lg text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: "#27AE60" }}
          >
            Confirm Assignment
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}

interface CrewCardProps {
  id: string;
  name: string;
  availability: string;
  isSelected: boolean;
  onToggle: (id: string) => void;
}

function CrewCard({ id, name, availability, isSelected, onToggle }: CrewCardProps) {
  const isAvailable = availability === "Available";
  
  return (
    <button
      onClick={() => isAvailable && onToggle(id)}
      disabled={!isAvailable}
      className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
        isSelected
          ? "border-[#2E86DE] bg-blue-50"
          : isAvailable
          ? "border-gray-200 hover:border-[#2E86DE] hover:bg-gray-50"
          : "border-gray-200 opacity-50 cursor-not-allowed"
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p style={{ color: "#1B2A4A", fontWeight: 500 }}>{name}</p>
          <StatusBadge status={availability} variant="small" />
        </div>
        {isSelected && <ChevronRight className="w-5 h-5" style={{ color: "#2E86DE" }} />}
      </div>
    </button>
  );
}
