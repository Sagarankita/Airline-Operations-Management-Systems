import { useState } from "react";
import { DashboardLayout } from "../../layouts/DashboardLayout";
import { Breadcrumb } from "../../shared/Breadcrumb";
import { StatusBadge } from "../../shared/StatusBadge";
import { Home, Users, AlertTriangle, Search } from "lucide-react";

export default function GroundStaffBoarding() {
  const userName = sessionStorage.getItem("userEmail")?.split("@")[0] || "Staff";
  const [searchTerm, setSearchTerm] = useState("");
  const [showAlertModal, setShowAlertModal] = useState(false);

  const navItems = [
    { label: "Dashboard", path: "/ground-staff", icon: <Home className="w-5 h-5" /> },
    { label: "Passenger List", path: "/ground-staff/passengers", icon: <Users className="w-5 h-5" /> },
    { label: "Active Boarding", path: "/ground-staff/boarding", icon: <AlertTriangle className="w-5 h-5" /> },
  ];

  const passengers = [
    { name: "John Anderson", nationalId: "P1234567890", seat: "12A", status: "Boarded" },
    { name: "Sarah Johnson", nationalId: "P2345678901", seat: "12B", status: "Pending" },
    { name: "Michael Chen", nationalId: "P3456789012", seat: "15C", status: "Boarded" },
    { name: "Emma Williams", nationalId: "P4567890123", seat: "18D", status: "Pending" },
    { name: "James Brown", nationalId: "P5678901234", seat: "22E", status: "Alert" },
    { name: "Lisa Anderson", nationalId: "P6789012345", seat: "25F", status: "Boarded" },
  ];

  const filteredPassengers = passengers.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.seat.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const boardedCount = passengers.filter(p => p.status === "Boarded").length;
  const totalCount = passengers.length;
  const unboardedPassengers = passengers.filter(p => p.status === "Pending" || p.status === "Alert");

  const handleCloseBoardingAttempt = () => {
    if (unboardedPassengers.length > 0) {
      setShowAlertModal(true);
    } else {
      alert("Boarding closed successfully!");
    }
  };

  return (
    <DashboardLayout role="Ground Staff" userName={userName} navItems={navItems}>
      <Breadcrumb
        items={[{ label: "Dashboard", href: "/ground-staff" }, { label: "Active Boarding" }]}
      />
      
      {/* Flight Header Bar */}
      <div className="bg-white p-6 shadow-sm mb-6" style={{ borderRadius: "8px" }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl mb-1" style={{ color: "#1B2A4A", fontWeight: 600 }}>
              Flight AO101: JFK → LHR
            </h1>
            <p className="text-sm text-gray-600">Boarding Gate A12 | Departure: 08:00</p>
          </div>
          <div className="text-right">
            <p className="text-3xl" style={{ color: "#2E86DE", fontWeight: 700 }}>
              {boardedCount}/{totalCount}
            </p>
            <p className="text-sm text-gray-600">Passengers Boarded</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search passengers..."
            className="w-full pl-12 pr-4 py-3 border border-gray-300 focus:border-[#2E86DE] focus:outline-none transition-colors"
            style={{ borderRadius: "8px" }}
          />
        </div>
      </div>

      {/* Boarding List */}
      <div className="space-y-3 mb-24">
        {filteredPassengers.map((passenger, index) => (
          <div
            key={index}
            className="bg-white p-4 shadow-sm flex items-center justify-between"
            style={{ borderRadius: "8px" }}
          >
            <div className="flex-1">
              <p style={{ color: "#1B2A4A", fontWeight: 600 }}>{passenger.name}</p>
              <p className="text-sm text-gray-600">
                Seat {passenger.seat} • {passenger.nationalId}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <StatusBadge status={passenger.status} />
              {passenger.status === "Pending" && (
                <button
                  className="px-4 py-2 rounded-lg text-white transition-colors hover:opacity-90"
                  style={{ backgroundColor: "#27AE60" }}
                >
                  Confirm Boarding
                </button>
              )}
              {passenger.status === "Alert" && (
                <button
                  className="px-4 py-2 rounded-lg text-white transition-colors hover:opacity-90"
                  style={{ backgroundColor: "#E74C3C" }}
                >
                  Contact Passenger
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-64 right-0 bg-white border-t border-gray-200 p-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">
              <strong>{boardedCount}</strong> of <strong>{totalCount}</strong> passengers boarded
            </p>
          </div>
          <button
            onClick={handleCloseBoardingAttempt}
            className="px-6 py-3 rounded-lg text-white transition-colors hover:opacity-90"
            style={{ backgroundColor: "#E74C3C" }}
          >
            Close Boarding
          </button>
        </div>
      </div>

      {/* Outstanding Passenger Alert Modal */}
      {showAlertModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 max-w-2xl w-full shadow-xl" style={{ borderRadius: "8px" }}>
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-amber-600" />
              </div>
            </div>
            <h2 className="text-2xl text-center mb-2" style={{ color: "#1B2A4A", fontWeight: 600 }}>
              Outstanding Passengers
            </h2>
            <p className="text-gray-600 text-center mb-6">
              The following passengers have not boarded yet. Please take action before closing boarding.
            </p>

            <div className="bg-gray-50 p-4 rounded-lg mb-6 max-h-60 overflow-y-auto">
              <div className="space-y-3">
                {unboardedPassengers.map((passenger, index) => (
                  <div
                    key={index}
                    className="bg-white p-4 rounded-lg flex items-center justify-between"
                  >
                    <div>
                      <p style={{ color: "#1B2A4A", fontWeight: 600 }}>{passenger.name}</p>
                      <p className="text-sm text-gray-600">
                        Seat {passenger.seat} • {passenger.nationalId}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={passenger.status} variant="small" />
                      <button
                        className="px-3 py-1 rounded text-sm text-white transition-colors hover:opacity-90"
                        style={{ backgroundColor: "#2E86DE" }}
                      >
                        Notify Gate
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowAlertModal(false)}
                className="flex-1 px-4 py-3 rounded-lg border border-gray-300 text-gray-700 transition-colors hover:bg-gray-50"
              >
                Continue Boarding
              </button>
              <button
                onClick={() => {
                  setShowAlertModal(false);
                  alert("Boarding closed with outstanding passengers noted.");
                }}
                className="flex-1 px-4 py-3 rounded-lg text-white transition-colors hover:opacity-90"
                style={{ backgroundColor: "#E74C3C" }}
              >
                Force Close Boarding
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}