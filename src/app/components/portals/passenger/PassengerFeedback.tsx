import { useState } from "react";
import { DashboardLayout } from "../../layouts/DashboardLayout";
import { Breadcrumb } from "../../shared/Breadcrumb";
import { Home, User, MessageSquare, Star, Plus, ArrowUpDown } from "lucide-react";
import { useNavigate } from "react-router";

export default function PassengerFeedback() {
  const navigate = useNavigate();
  const userName = sessionStorage.getItem("userEmail")?.split("@")[0] || "Passenger";
  const [activeTab, setActiveTab] = useState<"submit" | "history">("submit");

  const navItems = [
    { label: "Dashboard", path: "/passenger", icon: <Home className="w-5 h-5" /> },
    { label: "My Profile", path: "/passenger/profile", icon: <User className="w-5 h-5" /> },
    { label: "Feedback", path: "/passenger/feedback", icon: <MessageSquare className="w-5 h-5" /> },
  ];

  return (
    <DashboardLayout role="Passenger" userName={userName} navItems={navItems}>
      <Breadcrumb items={[{ label: "Dashboard", href: "/passenger" }, { label: "Feedback" }]} />
      
      <h1 className="text-3xl mb-6" style={{ color: "#1B2A4A", fontWeight: 600 }}>
        Feedback
      </h1>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("submit")}
          className={`pb-3 px-1 border-b-2 transition-colors ${
            activeTab === "submit"
              ? "border-[#2E86DE] text-[#2E86DE]"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
          style={{ fontWeight: 500 }}
        >
          Submit Feedback
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`pb-3 px-1 border-b-2 transition-colors ${
            activeTab === "history"
              ? "border-[#2E86DE] text-[#2E86DE]"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
          style={{ fontWeight: 500 }}
        >
          Feedback History
        </button>
      </div>

      {activeTab === "submit" ? <SubmitFeedbackForm /> : <FeedbackHistory />}
    </DashboardLayout>
  );
}

function SubmitFeedbackForm() {
  const [selectedFlight, setSelectedFlight] = useState("");
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comments, setComments] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Submit logic here
    alert("Feedback submitted successfully!");
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="bg-white p-8 shadow-sm mb-6" style={{ borderRadius: "8px" }}>
        <div className="space-y-6">
          {/* Flight Selector */}
          <div>
            <label htmlFor="flight" className="block text-sm mb-2" style={{ color: "#1B2A4A" }}>
              Select Flight
            </label>
            <select
              id="flight"
              value={selectedFlight}
              onChange={(e) => setSelectedFlight(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 focus:border-[#2E86DE] focus:outline-none transition-colors"
              style={{ borderRadius: "8px" }}
              required
            >
              <option value="">Choose a flight...</option>
              <option value="AO101">AO101 - New York to London</option>
              <option value="AO202">AO202 - London to Paris</option>
              <option value="AO303">AO303 - Paris to Dubai</option>
            </select>
          </div>

          {/* Star Rating */}
          <div>
            <label className="block text-sm mb-2" style={{ color: "#1B2A4A" }}>
              Rating
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className="w-8 h-8"
                    fill={star <= (hoveredRating || rating) ? "#F39C12" : "none"}
                    stroke={star <= (hoveredRating || rating) ? "#F39C12" : "#D1D5DB"}
                    strokeWidth={2}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Comments */}
          <div>
            <label htmlFor="comments" className="block text-sm mb-2" style={{ color: "#1B2A4A" }}>
              Comments
            </label>
            <textarea
              id="comments"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={6}
              className="w-full px-4 py-3 border border-gray-300 focus:border-[#2E86DE] focus:outline-none transition-colors resize-none"
              style={{ borderRadius: "8px" }}
              placeholder="Share your experience..."
              required
            />
          </div>
        </div>
      </div>

      <button
        type="submit"
        className="px-6 py-2 rounded-lg text-white transition-colors hover:opacity-90"
        style={{ backgroundColor: "#2E86DE" }}
      >
        Submit Feedback
      </button>
    </form>
  );
}

function FeedbackHistory() {
  const feedbackData = [
    {
      flight: "AO101",
      date: "2026-03-15",
      rating: 5,
      comments: "Excellent service and on-time departure!",
    },
    {
      flight: "AO202",
      date: "2026-02-28",
      rating: 4,
      comments: "Good flight, but check-in took longer than expected.",
    },
    {
      flight: "AO303",
      date: "2026-01-10",
      rating: 3,
      comments: "Average experience. Food could be improved.",
    },
  ];

  return (
    <div className="bg-white shadow-sm overflow-hidden" style={{ borderRadius: "8px" }}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead style={{ backgroundColor: "#F9FAFB" }}>
            <tr>
              <th className="px-6 py-4 text-left text-sm" style={{ color: "#1B2A4A", fontWeight: 600 }}>
                <button className="flex items-center gap-2 hover:text-[#2E86DE]">
                  Flight
                  <ArrowUpDown className="w-4 h-4" />
                </button>
              </th>
              <th className="px-6 py-4 text-left text-sm" style={{ color: "#1B2A4A", fontWeight: 600 }}>
                <button className="flex items-center gap-2 hover:text-[#2E86DE]">
                  Date
                  <ArrowUpDown className="w-4 h-4" />
                </button>
              </th>
              <th className="px-6 py-4 text-left text-sm" style={{ color: "#1B2A4A", fontWeight: 600 }}>
                Rating
              </th>
              <th className="px-6 py-4 text-left text-sm" style={{ color: "#1B2A4A", fontWeight: 600 }}>
                Comments
              </th>
            </tr>
          </thead>
          <tbody>
            {feedbackData.map((feedback, index) => (
              <tr
                key={index}
                className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
              >
                <td className="px-6 py-4 text-sm" style={{ color: "#1B2A4A" }}>
                  {feedback.flight}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {feedback.date}
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className="w-4 h-4"
                        fill={i < feedback.rating ? "#F39C12" : "none"}
                        stroke={i < feedback.rating ? "#F39C12" : "#D1D5DB"}
                        strokeWidth={2}
                      />
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {feedback.comments}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
