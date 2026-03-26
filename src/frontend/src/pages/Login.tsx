import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "@/lib/react-router-compat";
import { storage } from "@/lib/storage";
import {
  Award,
  Bird,
  Building2,
  Calendar,
  ClipboardList,
  DollarSign,
  Droplets,
  Eye,
  EyeOff,
  Heart,
  LayoutDashboard,
  Mail,
  Pill,
  Scale,
  User,
  UserPlus,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Signup from "./Signup";

const highlights = [
  { icon: Bird, label: "Chick Batch Management" },
  { icon: ClipboardList, label: "Daily Farm Data Entry" },
  { icon: Scale, label: "Feed & FCR Tracking" },
  { icon: Heart, label: "Mortality Monitoring" },
  { icon: Pill, label: "Medicine Management" },
  { icon: LayoutDashboard, label: "Farm Performance Dashboard" },
  { icon: DollarSign, label: "Financial & Expense Tracking" },
  { icon: Droplets, label: "Real-Time Analytics" },
];

const ERROR_MESSAGES: Record<string, string> = {
  user_not_found: "User not found",
  wrong_password: "Incorrect password",
  inactive: "Account is inactive. Please contact your administrator.",
  account_pending:
    "Your account is under approval. Please wait for admin confirmation.",
  account_rejected:
    "Your request was rejected. Please contact support at poultrixindia@gmail.com",
};

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowModal(false);
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  useEffect(() => {
    document.body.style.overflow = showModal ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [showModal]);

  const openModal = () => {
    setError("");
    setUsername("");
    setPassword("");
    setShowModal(true);
  };

  const closeModal = () => setShowModal(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const result = login(username.trim(), password.trim());
    setLoading(false);
    if (result.success) {
      const user = storage.getUserByUsername(username.trim());
      if (
        user?.role === "SuperAdmin" ||
        user?.role === "CompanyAdmin" ||
        user?.role === "Manager"
      ) {
        navigate("/dashboard");
      } else {
        navigate("/employee-dashboard");
      }
    } else {
      setError(
        ERROR_MESSAGES[result.error ?? ""] || "Login failed. Please try again.",
      );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-green-50">
      {/* Header */}
      <header className="bg-green-900 text-white py-3 px-6 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-green-600 flex items-center justify-center flex-shrink-0">
            <Bird size={18} className="text-white" />
          </div>
          <span className="text-lg font-bold tracking-wide">Poultrix</span>
          <span className="text-green-400 hidden sm:inline">|</span>
          <span className="text-green-200 text-sm hidden sm:inline">
            Smart Poultry Farm Management System
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowSignup(true)}
            className="flex items-center gap-2 bg-white hover:bg-green-50 text-green-800 text-sm font-semibold px-4 py-2 rounded-lg transition-all duration-200 shadow border border-green-200 hover:border-green-400"
            data-ocid="login.open_modal_button"
          >
            <UserPlus size={15} />
            Sign Up
          </button>
          <button
            type="button"
            onClick={openModal}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-500 active:bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-all duration-200 shadow hover:shadow-md"
            data-ocid="login.primary_button"
          >
            <User size={15} />
            Login
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 py-12 grid lg:grid-cols-2 gap-10 items-start">
          <section className="space-y-8">
            <div>
              <h1 className="text-3xl xl:text-4xl font-bold text-green-900 leading-tight mb-4">
                Poultrix – Smart Poultry Farm
                <span className="block text-green-600">
                  Management Platform
                </span>
              </h1>
              <p className="text-gray-600 text-base leading-relaxed">
                Poultrix is a comprehensive ERP solution designed specifically
                for poultry businesses. Manage farms, flocks, feed, mortality,
                medicines, and finances — all in one place. Built for Company
                Admins, Supervisors, Dealers, and Farmers to work together
                seamlessly with strict role-based access and real-time data.
              </p>
            </div>

            <div>
              <h2 className="text-sm font-semibold text-green-700 uppercase tracking-wider mb-4">
                Platform Features
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {highlights.map(({ icon: Icon, label }) => (
                  <div
                    key={label}
                    className="flex items-center gap-3 bg-white border border-green-100 rounded-xl p-3 shadow-sm transition-all duration-200 hover:scale-105 hover:shadow-md hover:border-green-300 cursor-default"
                  >
                    <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <Icon size={16} className="text-green-700" />
                    </div>
                    <span className="text-sm font-medium text-gray-700 leading-tight">
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 bg-green-900 rounded-2xl p-5 text-white">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-300">500+</div>
                <div className="text-xs text-green-200 mt-0.5">
                  Farms Managed
                </div>
              </div>
              <div className="text-center border-x border-green-700">
                <div className="text-2xl font-bold text-green-300">10+</div>
                <div className="text-xs text-green-200 mt-0.5">
                  Years Experience
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-300">99%</div>
                <div className="text-xs text-green-200 mt-0.5">Uptime SLA</div>
              </div>
            </div>

            <div className="flex gap-3 flex-wrap justify-center lg:justify-start">
              <button
                type="button"
                onClick={openModal}
                className="inline-flex items-center gap-2 bg-green-700 hover:bg-green-600 text-white font-semibold px-6 py-3 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 text-sm"
              >
                <User size={16} />
                Login to Poultrix
              </button>
              <button
                type="button"
                onClick={() => setShowSignup(true)}
                className="inline-flex items-center gap-2 bg-white hover:bg-green-50 text-green-800 font-semibold px-6 py-3 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 text-sm border border-green-300 hover:border-green-500"
              >
                <UserPlus size={16} />
                Sign Up
              </button>
            </div>
          </section>

          <section className="relative rounded-2xl overflow-hidden shadow-xl min-h-[400px] lg:min-h-[560px] hidden lg:block">
            <img
              src="/assets/generated/poultry-farm-hero.dim_900x700.jpg"
              alt="Poultry Farm"
              className="w-full h-full object-cover absolute inset-0"
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(to bottom, rgba(20,83,45,0.3) 0%, rgba(20,83,45,0.7) 100%)",
              }}
            />
            <div className="absolute bottom-8 left-8 right-8 text-white">
              <p className="text-lg font-semibold leading-snug">
                "Empowering every poultry farmer
                <br />
                with smart, data-driven tools."
              </p>
              <p className="text-sm text-green-200 mt-1">— Poultrix Platform</p>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-green-900 text-white">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-green-400 uppercase tracking-wider font-medium flex items-center gap-1.5">
                <Building2 size={12} /> Company
              </span>
              <span className="text-sm font-semibold">
                Poultrix India Pvt Ltd
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-green-400 uppercase tracking-wider font-medium flex items-center gap-1.5">
                <Calendar size={12} /> Established
              </span>
              <span className="text-sm font-semibold">2026</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-green-400 uppercase tracking-wider font-medium flex items-center gap-1.5">
                <User size={12} /> Founder
              </span>
              <span className="text-sm font-semibold">Sukhvinder Kaith</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-green-400 uppercase tracking-wider font-medium flex items-center gap-1.5">
                <Award size={12} /> Experience
              </span>
              <span className="text-sm font-semibold">
                10+ Years in Poultry Industry
              </span>
            </div>
          </div>
          <div className="border-t border-green-700 pt-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
            <a
              href="mailto:poultrixindia@gmail.com"
              className="flex items-center gap-2 text-green-200 hover:text-white transition-colors"
            >
              <Mail size={14} />
              For support: poultrixindia@gmail.com
            </a>
            <span className="text-green-400 text-xs">
              © {new Date().getFullYear()} Poultrix India Pvt Ltd. All rights
              reserved.
            </span>
          </div>
        </div>
      </footer>

      {/* Login Modal */}
      {showModal && (
        <>
          {/* Backdrop */}
          <button
            type="button"
            aria-label="Close modal"
            className="fixed inset-0 z-40 w-full h-full cursor-default"
            style={{
              background: "rgba(0,0,0,0.55)",
              backdropFilter: "blur(4px)",
            }}
            onClick={closeModal}
          />
          {/* Modal */}
          <div
            ref={modalRef}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-8 relative pointer-events-auto"
              style={{ animation: "loginModalIn 0.25s ease-out both" }}
            >
              <button
                type="button"
                onClick={closeModal}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors rounded-full p-1 hover:bg-gray-100"
                aria-label="Close login"
              >
                <X size={18} />
              </button>

              <div className="flex flex-col items-center mb-6">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3 shadow-md"
                  style={{
                    background: "linear-gradient(135deg, #16a34a, #15803d)",
                  }}
                >
                  <Bird size={28} className="text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">
                  Welcome Back
                </h2>
                <p className="text-sm text-gray-500 mt-1 text-center">
                  Sign in to your Poultrix account
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="username"
                    className="text-sm font-medium text-gray-700"
                  >
                    User
                  </Label>
                  <Input
                    id="username"
                    type="text"
                    autoComplete="username"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="h-10 border-gray-200 focus:border-green-500 focus:ring-green-500"
                    data-ocid="login.input"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="password"
                    className="text-sm font-medium text-gray-700"
                  >
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="h-10 pr-10 border-gray-200 focus:border-green-500 focus:ring-green-500"
                      data-ocid="login.password.input"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                      data-ocid="login.secondary_button"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div
                    className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2"
                    data-ocid="login.error_state"
                  >
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-10 font-semibold text-white transition-all duration-200 hover:shadow-lg hover:shadow-green-200"
                  style={{
                    background: loading
                      ? "#86efac"
                      : "linear-gradient(135deg, #16a34a, #15803d)",
                  }}
                  data-ocid="login.submit_button"
                >
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
              </form>

              <p className="text-center text-xs text-gray-400 mt-5">
                Poultrix – Smart Automation for Poultry Business Management
              </p>
              <div className="text-center mt-2">
                <a
                  href="mailto:poultrixindia@gmail.com"
                  className="text-xs text-green-600 hover:text-green-700 hover:underline transition-colors"
                >
                  📧 poultrixindia@gmail.com
                </a>
              </div>
            </div>
          </div>
        </>
      )}

      <Signup open={showSignup} onClose={() => setShowSignup(false)} />

      <style>{`
        @keyframes loginModalIn {
          from { opacity: 0; transform: scale(0.95) translateY(8px); }
          to   { opacity: 1; transform: scale(1)   translateY(0); }
        }
      `}</style>
    </div>
  );
}
