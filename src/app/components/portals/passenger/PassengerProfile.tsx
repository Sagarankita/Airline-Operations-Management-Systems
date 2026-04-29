import { useState } from "react";
import { DashboardLayout } from "../../layouts/DashboardLayout";
import { Breadcrumb } from "../../shared/Breadcrumb";
import { Home, User, MessageSquare, Edit, Trash2 } from "lucide-react";
import { useNavigate } from "react-router";
import { useFetch } from "../../../../lib/useApi";
import { session } from "../../../../lib/session";
import { LoadingState, ErrorState } from "../../shared/ApiStates";

export default function PassengerProfile() {
  const navigate = useNavigate();
  const userName = sessionStorage.getItem("userEmail")?.split("@")[0] || "Passenger";
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const passengerId = session.getPassengerId();
  const { data: profile, loading, error, refetch } = useFetch<any>(
    passengerId ? `/passengers/${passengerId}` : null
  );

  const navItems = [
    { label: "Dashboard", path: "/passenger", icon: <Home className="w-5 h-5" /> },
    { label: "My Profile", path: "/passenger/profile", icon: <User className="w-5 h-5" /> },
    { label: "Feedback", path: "/passenger/feedback", icon: <MessageSquare className="w-5 h-5" /> },
  ];

  const handleDeleteAccount = () => {
    sessionStorage.clear();
    navigate("/");
  };

  return (
    <DashboardLayout role="Passenger" userName={userName} navItems={navItems}>
      <Breadcrumb items={[{ label: "Dashboard", href: "/passenger" }, { label: "My Profile" }]} />

      {loading && <LoadingState message="Loading profile..." />}
      {error   && <ErrorState message={error} onRetry={refetch} />}
      
      {!loading && !error && (
      <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl" style={{ color: "#1B2A4A", fontWeight: 600 }}>
          My Profile
        </h1>
        <div className="flex gap-3">
          <button
            onClick={() => navigate("/passenger/profile/edit")}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-white transition-colors hover:opacity-90"
            style={{ backgroundColor: "#2E86DE" }}
          >
            <Edit className="w-4 h-4" />
            Edit Profile
          </button>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-white transition-colors hover:opacity-90"
            style={{ backgroundColor: "#E74C3C" }}
          >
            <Trash2 className="w-4 h-4" />
            Delete Account
          </button>
        </div>
      </div>

      {/* Profile Card */}
      <div className="bg-white p-8 shadow-sm" style={{ borderRadius: "8px" }}>
        {profile ? (
        <>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <ProfileField label="Full Name" value={profile.name ?? '—'} />
          <ProfileField label="Passport Number" value={profile.passport_no ?? '—'} />
          <ProfileField label="Gender" value={profile.gender ?? '—'} />
          <ProfileField label="Status" value={profile.status ?? '—'} />
          <ProfileField label="Email" value={profile.email ?? sessionStorage.getItem('userEmail') ?? '—'} />
          <ProfileField label="Contact" value={profile.contact ?? '—'} />
        </div>
        {profile.recent_reservations?.length > 0 && (
          <div className="mt-6">
            <h3 className="text-base mb-3" style={{ color: '#1B2A4A', fontWeight: 600 }}>Recent Reservations</h3>
            <div className="space-y-2">
              {profile.recent_reservations.map((r: any) => (
                <div key={r.pnr_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm">
                  <span style={{ color: '#1B2A4A', fontWeight: 500 }}>Flight #{r.flight_id} — {r.source_airport_code} → {r.dest_airport_code}</span>
                  <span className="text-gray-500">Seat {r.seat_no} &bull; {r.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        </>
        ) : (
        <p className="text-gray-500 text-sm">No profile data available.</p>
        )}
      </div>
      </>
      )}

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div
            className="bg-white p-8 max-w-md mx-4 shadow-xl"
            style={{ borderRadius: "8px" }}
          >
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
            </div>
            <h2 className="text-2xl text-center mb-2" style={{ color: "#1B2A4A", fontWeight: 600 }}>
              Delete Account
            </h2>
            <p className="text-gray-600 text-center mb-6">
              Are you sure you want to delete your account? This action cannot be undone and all your
              data will be permanently removed.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 transition-colors hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                className="flex-1 px-4 py-2 rounded-lg text-white transition-colors hover:opacity-90"
                style={{ backgroundColor: "#E74C3C" }}
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

interface ProfileFieldProps {
  label: string;
  value: string;
}

function ProfileField({ label, value }: ProfileFieldProps) {
  return (
    <div>
      <label className="block text-sm text-gray-600 mb-1">{label}</label>
      <p className="text-base" style={{ color: "#1B2A4A", fontWeight: 500 }}>
        {value}
      </p>
    </div>
  );
}
