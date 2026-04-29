import { useState, useEffect } from "react";
import { DashboardLayout } from "../../layouts/DashboardLayout";
import { Breadcrumb } from "../../shared/Breadcrumb";
import { LoadingState } from "../../shared/ApiStates";
import { api } from "../../../../lib/api";
import { useFetch } from "../../../../lib/useApi";
import { session } from "../../../../lib/session";
import { Home, User, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router";

export default function PassengerProfileEdit() {
  const navigate = useNavigate();
  const userName = sessionStorage.getItem("userEmail")?.split("@")[0] || "Passenger";
  const passengerId = session.getPassengerId();

  const [formData, setFormData] = useState({
    name: "",
    contact: "",
    email: "",
    passport_no: "",
  });
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  const { data: profile, loading } = useFetch<any>(
    passengerId ? `/passengers/${passengerId}` : null
  );

  useEffect(() => {
    if (profile) {
      setFormData({
        name:        profile.name        ?? "",
        contact:     profile.contact     ?? "",
        email:       profile.email       ?? "",
        passport_no: profile.passport_no ?? "",
      });
    }
  }, [profile]);

  const navItems = [
    { label: "Dashboard", path: "/passenger", icon: <Home className="w-5 h-5" /> },
    { label: "My Profile", path: "/passenger/profile", icon: <User className="w-5 h-5" /> },
    { label: "Feedback", path: "/passenger/feedback", icon: <MessageSquare className="w-5 h-5" /> },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setSaveMsg(null);
    try {
      await api.put(`/passengers/${passengerId}`, formData);
      setSaveMsg('Profile updated successfully!');
      setTimeout(() => navigate("/passenger/profile"), 1200);
    } catch (err: any) {
      setSaveMsg(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <DashboardLayout role="Passenger" userName={userName} navItems={[
      { label: "Dashboard", path: "/passenger", icon: <Home className="w-5 h-5" /> },
    ]}>
      <LoadingState message="Loading profile..." />
    </DashboardLayout>
  );

  return (
    <DashboardLayout role="Passenger" userName={userName} navItems={navItems}>
      <Breadcrumb
        items={[
          { label: "Dashboard", href: "/passenger" },
          { label: "My Profile", href: "/passenger/profile" },
          { label: "Edit Profile" },
        ]}
      />
      
      <h1 className="text-3xl mb-6" style={{ color: "#1B2A4A", fontWeight: 600 }}>
        Edit Profile
      </h1>

      <form onSubmit={handleSubmit}>
        <div className="bg-white p-8 shadow-sm mb-6" style={{ borderRadius: "8px" }}>
          <div className="space-y-5">
            <FormField label="Full Name"    name="name"        type="text"  value={formData.name}        onChange={handleChange} required />
            <FormField label="Contact"      name="contact"     type="text"  value={formData.contact}     onChange={handleChange} placeholder="e.g., +91-9876543210" />
            <FormField label="Email"        name="email"       type="email" value={formData.email}        onChange={handleChange} />
            <FormField label="Passport No." name="passport_no" type="text"  value={formData.passport_no} onChange={handleChange} placeholder="e.g., A1234567" />
          </div>
        </div>

        {saveMsg && (
          <div className="mb-4 px-4 py-3 rounded-lg text-sm" style={{ backgroundColor: saveMsg.startsWith('Error') ? '#FEE2E2' : '#D1FAE5', color: saveMsg.startsWith('Error') ? '#991B1B' : '#065F46' }}>
            {saveMsg}
          </div>
        )}

        <div className="flex gap-3">
          <button type="submit" disabled={saving}
            className="px-6 py-2 rounded-lg text-white transition-colors hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: "#2E86DE" }}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <button type="button" onClick={() => navigate("/passenger/profile")}
            className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 transition-colors hover:bg-gray-50">
            Cancel
          </button>
        </div>
      </form>
    </DashboardLayout>
  );
}

interface FormFieldProps {
  label: string;
  name: string;
  type: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  placeholder?: string;
}

function FormField({ label, name, type, value, onChange, required, placeholder }: FormFieldProps) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm mb-2" style={{ color: "#1B2A4A" }}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        className="w-full px-4 py-3 border border-gray-300 focus:border-[#2E86DE] focus:outline-none transition-colors"
        style={{ borderRadius: "8px" }}
      />
    </div>
  );
}
