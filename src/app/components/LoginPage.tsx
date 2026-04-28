import { useState } from "react";
import { useNavigate } from "react-router";
import { Eye, EyeOff, Plane } from "lucide-react";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Store email for role routing screen
    sessionStorage.setItem("userEmail", email);
    navigate("/role-routing");
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left branded panel */}
      <div
        className="w-full md:w-1/2 bg-cover bg-center relative flex items-center justify-center p-8 md:p-12 min-h-[300px] md:min-h-screen"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(27, 42, 74, 0.95), rgba(46, 134, 222, 0.85)), url('https://images.unsplash.com/photo-1591395896364-6db656ac5c2f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhaXJwbGFuZSUyMHNpbGhvdWV0dGUlMjBzdW5zZXQlMjBibHVlJTIwc2t5fGVufDF8fHx8MTc3NTM3NzY4Nnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral')`,
        }}
      >
        <div className="text-white z-10 text-center max-w-md">
          {/* AOMS Logo */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl">
              <Plane className="w-10 h-10 text-white" />
            </div>
            <div>
              <h1 className="text-4xl tracking-tight" style={{ fontWeight: 700 }}>
                AOMS
              </h1>
            </div>
          </div>

          {/* Tagline */}
          <p className="text-lg text-white/90 leading-relaxed">
            Powering every flight, every role.
          </p>

          {/* Decorative line */}
          <div className="mt-8 w-24 h-1 bg-white/30 mx-auto rounded-full"></div>
        </div>
      </div>

      {/* Right login form panel */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6 md:p-12 bg-white">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h2 className="text-3xl mb-2" style={{ color: "#1B2A4A", fontWeight: 600 }}>
              Welcome back
            </h2>
            <p className="text-gray-600">Sign in to access your dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email/Username input */}
            <div>
              <label htmlFor="email" className="block text-sm mb-2" style={{ color: "#1B2A4A" }}>
                Email or Username
              </label>
              <input
                id="email"
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 focus:border-[#2E86DE] focus:outline-none transition-colors"
                style={{ borderRadius: "8px" }}
                placeholder="Enter your email"
                required
              />
            </div>

            {/* Password input with toggle */}
            <div>
              <label htmlFor="password" className="block text-sm mb-2" style={{ color: "#1B2A4A" }}>
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 focus:border-[#2E86DE] focus:outline-none transition-colors"
                  style={{ borderRadius: "8px" }}
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Log In button */}
            <button
              type="submit"
              className="w-full py-3 text-white transition-all hover:opacity-90"
              style={{
                backgroundColor: "#1B2A4A",
                borderRadius: "8px",
                fontWeight: 600,
              }}
            >
              Log In
            </button>

            {/* Forgot password link */}
            <div className="text-center">
              <a
                href="#"
                className="text-sm hover:underline transition-colors"
                style={{ color: "#2E86DE" }}
              >
                Forgot Password?
              </a>
            </div>
          </form>

          {/* Role hint */}
          <div
            className="mt-8 pt-6 border-t text-center text-sm"
            style={{ borderColor: "#E5E7EB", color: "#6B7280" }}
          >
            <p className="mb-3">
              Access is role-based — your dashboard loads automatically.
            </p>
            <div className="text-xs text-gray-500 space-y-1">
              <p><strong>Test accounts:</strong></p>
              <p>admin@aoms.com • passenger@aoms.com • crew@aoms.com</p>
              <p>ground@aoms.com • maintenance@aoms.com • fuel@aoms.com</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}