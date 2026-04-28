import { useState } from "react";
import { DashboardLayout } from "../../layouts/DashboardLayout";
import { Breadcrumb } from "../../shared/Breadcrumb";
import { Home, User, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router";

export default function PassengerProfileEdit() {
  const navigate = useNavigate();
  const userName = sessionStorage.getItem("userEmail")?.split("@")[0] || "Passenger";

  const [formData, setFormData] = useState({
    fullName: "John Anderson",
    dateOfBirth: "1985-06-15",
    nationalId: "P1234567890",
    nationality: "United States",
    email: "passenger@aoms.com",
    phone: "+1 555-0123",
  });

  const navItems = [
    { label: "Dashboard", path: "/passenger", icon: <Home className="w-5 h-5" /> },
    { label: "My Profile", path: "/passenger/profile", icon: <User className="w-5 h-5" /> },
    { label: "Feedback", path: "/passenger/feedback", icon: <MessageSquare className="w-5 h-5" /> },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Save logic here
    navigate("/passenger/profile");
  };

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
            <FormField
              label="Full Name"
              name="fullName"
              type="text"
              value={formData.fullName}
              onChange={handleChange}
              required
            />
            <FormField
              label="Date of Birth"
              name="dateOfBirth"
              type="date"
              value={formData.dateOfBirth}
              onChange={handleChange}
              required
            />
            <FormField
              label="National ID / Passport No."
              name="nationalId"
              type="text"
              value={formData.nationalId}
              onChange={handleChange}
              required
            />
            <FormField
              label="Nationality"
              name="nationality"
              type="text"
              value={formData.nationality}
              onChange={handleChange}
              required
            />
            <FormField
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
            <FormField
              label="Phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            className="px-6 py-2 rounded-lg text-white transition-colors hover:opacity-90"
            style={{ backgroundColor: "#2E86DE" }}
          >
            Save Changes
          </button>
          <button
            type="button"
            onClick={() => navigate("/passenger/profile")}
            className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 transition-colors hover:bg-gray-50"
          >
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
}

function FormField({ label, name, type, value, onChange, required }: FormFieldProps) {
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
        className="w-full px-4 py-3 border border-gray-300 focus:border-[#2E86DE] focus:outline-none transition-colors"
        style={{ borderRadius: "8px" }}
      />
    </div>
  );
}
