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
  List,
  CalendarDays,
  Edit,
  XCircle,
} from "lucide-react";

export default function AdminFlights() {
  const userName = sessionStorage.getItem("userEmail")?.split("@")[0] || "Admin";
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showFlightForm, setShowFlightForm] = useState(false);
  const [selectedFlight, setSelectedFlight] = useState<any>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({
    flightNo: "",
    origin: "",
    destination: "",
    departure: "",
    arrival: "",
    aircraft: "",
    status: "Active",
  });

  const navItems = [
    { label: "Dashboard", path: "/admin", icon: <Home className="w-5 h-5" /> },
    { label: "Employees", path: "/admin/employees", icon: <Users className="w-5 h-5" /> },
    { label: "Flight Schedule", path: "/admin/flights", icon: <Calendar className="w-5 h-5" /> },
    { label: "Aircraft", path: "/admin/aircraft", icon: <Plane className="w-5 h-5" /> },
    { label: "Delay Prediction", path: "/admin/delay-prediction", icon: <AlertTriangle className="w-5 h-5" /> },
    { label: "Crew Assignment", path: "/admin/crew-assignment", icon: <UserCheck className="w-5 h-5" /> },
    { label: "Reports", path: "/admin/reports", icon: <FileText className="w-5 h-5" /> },
  ];

  const [flights, setFlights] = useState([
    {
      flightNo: "AO101",
      origin: "JFK",
      destination: "LHR",
      departure: "2026-04-06 08:00",
      arrival: "2026-04-06 20:15",
      aircraft: "B777-300",
      status: "Active",
    },
    {
      flightNo: "AO202",
      origin: "LHR",
      destination: "CDG",
      departure: "2026-04-06 14:30",
      arrival: "2026-04-06 16:45",
      aircraft: "A320-200",
      status: "Delayed",
    },
    {
      flightNo: "AO303",
      origin: "CDG",
      destination: "DXB",
      departure: "2026-04-07 10:00",
      arrival: "2026-04-07 19:30",
      aircraft: "A380-800",
      status: "Active",
    },
    {
      flightNo: "AO404",
      origin: "DXB",
      destination: "SIN",
      departure: "2026-04-07 22:00",
      arrival: "2026-04-08 08:15",
      aircraft: "B787-9",
      status: "Pending",
    },
  ]);

  const handleAddFlight = () => {
    setIsEditMode(false);
    setSelectedFlight(null);
    setFormData({
      flightNo: "",
      origin: "",
      destination: "",
      departure: "",
      arrival: "",
      aircraft: "",
      status: "Active",
    });
    setShowFlightForm(true);
  };

  const handleEditFlight = (flight: any) => {
    setIsEditMode(true);
    setSelectedFlight(flight);
    setFormData({ ...flight });
    setShowFlightForm(true);
  };

  const handleCancelFlight = (flight: any) => {
    setSelectedFlight(flight);
    setShowCancelModal(true);
  };

  const handleSubmitFlight = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isEditMode) {
      // Update existing flight
      setFlights(flights.map(f => 
        f.flightNo === selectedFlight.flightNo ? formData : f
      ));
    } else {
      // Add new flight
      setFlights([...flights, formData]);
    }
    
    setShowFlightForm(false);
  };

  const confirmCancelFlight = () => {
    setFlights(flights.map(f =>
      f.flightNo === selectedFlight.flightNo
        ? { ...f, status: "Cancelled" }
        : f
    ));
    setShowCancelModal(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <DashboardLayout role="Administrator" userName={userName} navItems={navItems}>
      <Breadcrumb items={[{ label: "Dashboard", href: "/admin" }, { label: "Flight Schedule" }]} />
      
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl" style={{ color: "#1B2A4A", fontWeight: 600 }}>
          Flight Schedule
        </h1>
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex bg-white border border-gray-300 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-2 px-4 py-2 transition-colors ${
                viewMode === "list"
                  ? "bg-[#2E86DE] text-white"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <List className="w-4 h-4" />
              List
            </button>
            <button
              onClick={() => setViewMode("calendar")}
              className={`flex items-center gap-2 px-4 py-2 transition-colors ${
                viewMode === "calendar"
                  ? "bg-[#2E86DE] text-white"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <CalendarDays className="w-4 h-4" />
              Calendar
            </button>
          </div>
          <button
            onClick={handleAddFlight}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-white transition-colors hover:opacity-90"
            style={{ backgroundColor: "#2E86DE" }}
          >
            <Plus className="w-5 h-5" />
            Add Flight
          </button>
        </div>
      </div>

      {viewMode === "list" ? (
        <div className="bg-white shadow-sm overflow-hidden" style={{ borderRadius: "8px" }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead style={{ backgroundColor: "#F9FAFB" }}>
                <tr>
                  <th className="px-6 py-4 text-left text-sm" style={{ color: "#1B2A4A", fontWeight: 600 }}>
                    Flight No.
                  </th>
                  <th className="px-6 py-4 text-left text-sm" style={{ color: "#1B2A4A", fontWeight: 600 }}>
                    Origin
                  </th>
                  <th className="px-6 py-4 text-left text-sm" style={{ color: "#1B2A4A", fontWeight: 600 }}>
                    Destination
                  </th>
                  <th className="px-6 py-4 text-left text-sm" style={{ color: "#1B2A4A", fontWeight: 600 }}>
                    Departure
                  </th>
                  <th className="px-6 py-4 text-left text-sm" style={{ color: "#1B2A4A", fontWeight: 600 }}>
                    Arrival
                  </th>
                  <th className="px-6 py-4 text-left text-sm" style={{ color: "#1B2A4A", fontWeight: 600 }}>
                    Aircraft
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
                {flights.map((flight, index) => (
                  <tr key={flight.flightNo} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="px-6 py-4 text-sm" style={{ color: "#1B2A4A", fontWeight: 500 }}>
                      {flight.flightNo}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {flight.origin}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {flight.destination}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {flight.departure}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {flight.arrival}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {flight.aircraft}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={flight.status} variant="small" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleEditFlight(flight)}
                          className="p-2 rounded hover:bg-gray-200 transition-colors" 
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" style={{ color: "#2E86DE" }} />
                        </button>
                        <button
                          onClick={() => handleCancelFlight(flight)}
                          className="p-2 rounded hover:bg-gray-200 transition-colors"
                          title="Cancel"
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
      ) : (
        <div className="bg-white p-8 shadow-sm" style={{ borderRadius: "8px" }}>
          <p className="text-center text-gray-600">Calendar view coming soon...</p>
        </div>
      )}

      {/* Cancel Modal */}
      {showCancelModal && selectedFlight && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-8 max-w-lg mx-4 shadow-xl" style={{ borderRadius: "8px" }}>
            <h2 className="text-2xl mb-4" style={{ color: "#1B2A4A", fontWeight: 600 }}>
              Cancel Flight
            </h2>
            
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <h3 className="mb-3" style={{ color: "#1B2A4A", fontWeight: 600 }}>
                Flight Summary
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-600">Flight No:</span>
                  <p style={{ color: "#1B2A4A", fontWeight: 500 }}>{selectedFlight.flightNo}</p>
                </div>
                <div>
                  <span className="text-gray-600">Aircraft:</span>
                  <p style={{ color: "#1B2A4A", fontWeight: 500 }}>{selectedFlight.aircraft}</p>
                </div>
                <div>
                  <span className="text-gray-600">Route:</span>
                  <p style={{ color: "#1B2A4A", fontWeight: 500 }}>
                    {selectedFlight.origin} → {selectedFlight.destination}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600">Departure:</span>
                  <p style={{ color: "#1B2A4A", fontWeight: 500 }}>{selectedFlight.departure}</p>
                </div>
              </div>
            </div>

            <p className="text-gray-600 mb-6">
              Are you sure you want to cancel this flight? All passengers will be notified.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 transition-colors hover:bg-gray-50"
              >
                Keep Flight
              </button>
              <button
                onClick={confirmCancelFlight}
                className="flex-1 px-4 py-2 rounded-lg text-white transition-colors hover:opacity-90"
                style={{ backgroundColor: "#E74C3C" }}
              >
                Cancel Flight
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Flight Form Modal */}
      {showFlightForm && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowFlightForm(false)} />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white p-8 max-w-2xl w-full shadow-xl my-8" style={{ borderRadius: "8px" }}>
              <h2 className="text-2xl mb-6" style={{ color: "#1B2A4A", fontWeight: 600 }}>
                {isEditMode ? "Edit Flight" : "Add Flight"}
              </h2>

              <form onSubmit={handleSubmitFlight} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label htmlFor="flightNo" className="block text-sm mb-2" style={{ color: "#1B2A4A" }}>
                      Flight Number
                    </label>
                    <input
                      id="flightNo"
                      name="flightNo"
                      type="text"
                      value={formData.flightNo}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 focus:border-[#2E86DE] focus:outline-none"
                      style={{ borderRadius: "8px" }}
                      placeholder="e.g., AO101"
                      required
                      disabled={isEditMode}
                    />
                  </div>

                  <div>
                    <label htmlFor="aircraft" className="block text-sm mb-2" style={{ color: "#1B2A4A" }}>
                      Aircraft
                    </label>
                    <select
                      id="aircraft"
                      name="aircraft"
                      value={formData.aircraft}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 focus:border-[#2E86DE] focus:outline-none"
                      style={{ borderRadius: "8px" }}
                      required
                    >
                      <option value="">Select aircraft...</option>
                      <option value="B777-300">Boeing 777-300</option>
                      <option value="A380-800">Airbus A380-800</option>
                      <option value="B787-9">Boeing 787-9</option>
                      <option value="A320-200">Airbus A320-200</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label htmlFor="origin" className="block text-sm mb-2" style={{ color: "#1B2A4A" }}>
                      Origin (Airport Code)
                    </label>
                    <input
                      id="origin"
                      name="origin"
                      type="text"
                      value={formData.origin}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 focus:border-[#2E86DE] focus:outline-none"
                      style={{ borderRadius: "8px" }}
                      placeholder="e.g., JFK"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="destination" className="block text-sm mb-2" style={{ color: "#1B2A4A" }}>
                      Destination (Airport Code)
                    </label>
                    <input
                      id="destination"
                      name="destination"
                      type="text"
                      value={formData.destination}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 focus:border-[#2E86DE] focus:outline-none"
                      style={{ borderRadius: "8px" }}
                      placeholder="e.g., LHR"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label htmlFor="departure" className="block text-sm mb-2" style={{ color: "#1B2A4A" }}>
                      Departure Date & Time
                    </label>
                    <input
                      id="departure"
                      name="departure"
                      type="datetime-local"
                      value={formData.departure.replace(" ", "T")}
                      onChange={(e) => setFormData({ ...formData, departure: e.target.value.replace("T", " ") })}
                      className="w-full px-4 py-3 border border-gray-300 focus:border-[#2E86DE] focus:outline-none"
                      style={{ borderRadius: "8px" }}
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="arrival" className="block text-sm mb-2" style={{ color: "#1B2A4A" }}>
                      Arrival Date & Time
                    </label>
                    <input
                      id="arrival"
                      name="arrival"
                      type="datetime-local"
                      value={formData.arrival.replace(" ", "T")}
                      onChange={(e) => setFormData({ ...formData, arrival: e.target.value.replace("T", " ") })}
                      className="w-full px-4 py-3 border border-gray-300 focus:border-[#2E86DE] focus:outline-none"
                      style={{ borderRadius: "8px" }}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="status" className="block text-sm mb-2" style={{ color: "#1B2A4A" }}>
                    Status
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 focus:border-[#2E86DE] focus:outline-none"
                    style={{ borderRadius: "8px" }}
                  >
                    <option value="Active">Active</option>
                    <option value="Delayed">Delayed</option>
                    <option value="Pending">Pending</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowFlightForm(false)}
                    className="flex-1 px-4 py-3 rounded-lg border border-gray-300 text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 rounded-lg text-white transition-colors hover:opacity-90"
                    style={{ backgroundColor: "#2E86DE" }}
                  >
                    {isEditMode ? "Save Changes" : "Add Flight"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}