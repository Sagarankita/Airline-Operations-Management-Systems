import { useState } from "react";
import { DashboardLayout } from "../../layouts/DashboardLayout";
import { Breadcrumb } from "../../shared/Breadcrumb";
import { LoadingState, ErrorState, EmptyState } from "../../shared/ApiStates";
import { api } from "../../../../lib/api";
import { useFetch } from "../../../../lib/useApi";
import { session } from "../../../../lib/session";
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

  const passengerId = session.getPassengerId();

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

      {activeTab === "submit" ? <SubmitFeedbackForm passengerId={passengerId} /> : <FeedbackHistory passengerId={passengerId} />}
    </DashboardLayout>
  );
}

const REVIEWABLE = new Set(['Departed', 'En_Route', 'Landed', 'Completed']);

function SubmitFeedbackForm({ passengerId }: { passengerId: number }) {
  const [selectedFlight, setSelectedFlight] = useState("");
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comments, setComments] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState<string | null>(null);

  const { data: reservationsData } = useFetch<any[]>(
    passengerId ? `/passengers/${passengerId}/reservations?limit=100` : null
  );
  const eligibleFlights = (reservationsData ?? []).filter(
    (r: any) =>
      (r.reservation_status === 'Checked_In' || r.reservation_status === 'Completed') &&
      REVIEWABLE.has(r.flight_status)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating) { setSubmitMsg('Please select a rating.'); return; }
    if (!selectedFlight) { setSubmitMsg('Please select a flight.'); return; }
    setSubmitting(true); setSubmitMsg(null);
    try {
      await api.post('/feedback', {
        passenger_id: passengerId,
        flight_id:    Number(selectedFlight),
        rating,
        comments,
      });
      setSubmitMsg('Feedback submitted successfully!');
      setSelectedFlight(''); setRating(0); setComments('');
    } catch (err: any) {
      setSubmitMsg(`Error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="bg-white p-8 shadow-sm mb-6" style={{ borderRadius: "8px" }}>
        <div className="space-y-6">
          {/* Flight Selector */}
          <div>
            <label htmlFor="flight" className="block text-sm mb-2" style={{ color: "#1B2A4A" }}>
              Select Flight (flights you have travelled on)
            </label>
            {eligibleFlights.length === 0 ? (
              <p className="text-sm text-gray-500 italic">No eligible flights found. Feedback can only be submitted for flights you have boarded with Checked-In or Completed status.</p>
            ) : (
            <select
              id="flight"
              value={selectedFlight}
              onChange={(e) => setSelectedFlight(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 focus:border-[#2E86DE] focus:outline-none transition-colors"
              style={{ borderRadius: "8px" }}
              required
            >
              <option value="">Choose a flight...</option>
              {eligibleFlights.map((r: any) => (
                <option key={r.pnr_id} value={r.flight_id}>
                  #{r.flight_id} — {r.source_airport_code} → {r.dest_airport_code} ({r.flight_status})
                </option>
              ))}
            </select>
            )}
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

      {submitMsg && (
        <div className="mt-4 px-4 py-3 rounded-lg text-sm" style={{ backgroundColor: submitMsg.startsWith('Error') ? '#FEE2E2' : '#D1FAE5', color: submitMsg.startsWith('Error') ? '#991B1B' : '#065F46' }}>
          {submitMsg}
        </div>
      )}
      <button
        type="submit"
        disabled={submitting}
        className="px-6 py-2 rounded-lg text-white transition-colors hover:opacity-90 disabled:opacity-50"
        style={{ backgroundColor: "#2E86DE" }}
      >
        {submitting ? 'Submitting...' : 'Submit Feedback'}
      </button>
    </form>
  );
}

function FeedbackHistory({ passengerId }: { passengerId: number }) {
  const { data, loading, error, refetch } = useFetch<any[]>(
    passengerId ? `/feedback/passenger/${passengerId}` : null
  );
  const feedbackData: any[] = data ?? [];

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
            {loading ? (
              <tr><td colSpan={4}><LoadingState message="Loading history..." /></td></tr>
            ) : error ? (
              <tr><td colSpan={4}><ErrorState message={error} onRetry={refetch} /></td></tr>
            ) : feedbackData.length === 0 ? (
              <tr><td colSpan={4}><EmptyState message="No feedback submitted yet." /></td></tr>
            ) : feedbackData.map((feedback, index) => (
              <tr
                key={feedback.feedback_id ?? index}
                className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
              >
                <td className="px-6 py-4 text-sm" style={{ color: "#1B2A4A" }}>
                  #{feedback.flight_id ?? '—'}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {feedback.created_at ? new Date(feedback.created_at).toLocaleDateString() : '—'}
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
