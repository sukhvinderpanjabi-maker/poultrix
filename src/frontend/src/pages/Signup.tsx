import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { storage } from "@/lib/storage";
import { Bird, CheckCircle, Eye, EyeOff, Loader2, X } from "lucide-react";
import { useRef, useState } from "react";

type Props = { open: boolean; onClose: () => void };

const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Delhi",
  "Jammu & Kashmir",
  "Ladakh",
  "Chandigarh",
  "Puducherry",
];

type FormData = {
  fullName: string;
  mobileNumber: string;
  email: string;
  farmName: string;
  state: string;
  city: string;
  role: "Farmer" | "Dealer" | "Company" | "";
  birdCapacity: string;
  password: string;
  confirmPassword: string;
};

type FormErrors = Partial<Record<keyof FormData, string>>;

const EMPTY_FORM: FormData = {
  fullName: "",
  mobileNumber: "",
  email: "",
  farmName: "",
  state: "",
  city: "",
  role: "",
  birdCapacity: "",
  password: "",
  confirmPassword: "",
};

export default function Signup({ open, onClose }: Props) {
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const setField = (field: keyof FormData, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const validate = (): boolean => {
    const e: FormErrors = {};
    if (!form.fullName.trim()) e.fullName = "Full name is required";
    if (!form.mobileNumber.trim() || !/^\d{10}$/.test(form.mobileNumber.trim()))
      e.mobileNumber = "Enter a valid 10-digit mobile number";
    if (!form.email.trim() || !/^[^@]+@[^@]+\.[^@]+$/.test(form.email))
      e.email = "Enter a valid email address";
    if (!form.farmName.trim()) e.farmName = "Farm name is required";
    if (!form.state) e.state = "Please select a state";
    if (!form.city.trim()) e.city = "City is required";
    if (!form.role) e.role = "Please select a role";
    const cap = Number.parseInt(form.birdCapacity, 10);
    if (!form.birdCapacity || Number.isNaN(cap) || cap <= 0)
      e.birdCapacity = "Enter a valid positive bird capacity";
    if (!form.password || form.password.length < 6)
      e.password = "Password must be at least 6 characters";
    if (form.password !== form.confirmPassword)
      e.confirmPassword = "Passwords do not match";
    setErrors(e);
    if (Object.keys(e).length > 0) {
      scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    }
    return Object.keys(e).length === 0;
  };

  const doSubmit = () => {
    console.log("[SIGNUP] Submit triggered");
    if (!validate()) {
      console.log("[SIGNUP] Validation failed");
      return;
    }
    setLoading(true);
    setSubmitError(null);
    try {
      console.log("[SIGNUP] Saving request...", {
        email: form.email,
        mobile: form.mobileNumber,
      });
      const result = storage.addSignupRequest({
        fullName: form.fullName.trim(),
        mobileNumber: form.mobileNumber.trim(),
        email: form.email.trim().toLowerCase(),
        farmName: form.farmName.trim(),
        state: form.state,
        city: form.city.trim(),
        role: form.role as "Farmer" | "Dealer" | "Company",
        birdCapacity: Number.parseInt(form.birdCapacity, 10),
        password: form.password,
        status: "pending",
        createdAt: new Date().toISOString(),
      });
      console.log("[SIGNUP] Result:", result);
      if (result.success) {
        setSubmitted(true);
      } else {
        setSubmitError(result.error || "Submission failed. Please try again.");
      }
    } catch (err) {
      console.error("[SIGNUP] Error:", err);
      setSubmitError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    doSubmit();
  };

  const handleClose = () => {
    setSubmitted(false);
    setForm(EMPTY_FORM);
    setErrors({});
    setSubmitError(null);
    onClose();
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop as button for a11y */}
      <button
        type="button"
        aria-label="Close signup"
        className="fixed inset-0 z-40 w-full h-full cursor-default"
        style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
        onClick={handleClose}
      />
      {/* Modal container */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-white w-full max-w-lg rounded-2xl shadow-2xl relative flex flex-col pointer-events-auto"
          style={{
            animation: "loginModalIn 0.25s ease-out both",
            maxHeight: "92vh",
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shadow-md"
                style={{
                  background: "linear-gradient(135deg, #16a34a, #15803d)",
                }}
              >
                <Bird size={18} className="text-white" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900">
                  Create Account
                </h2>
                <p className="text-xs text-gray-500">Sign up for Poultrix</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors rounded-full p-1 hover:bg-gray-100"
              aria-label="Close signup"
            >
              <X size={18} />
            </button>
          </div>

          {submitted ? (
            /* Success State */
            <div className="flex flex-col items-center text-center py-10 px-8 gap-4">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle size={36} className="text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                Request Submitted!
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed max-w-xs">
                Your signup request has been submitted successfully. Admin will
                review and approve your account. You will receive your login
                credentials once approved.
              </p>
              <Button
                type="button"
                onClick={handleClose}
                className="mt-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-8"
              >
                Close
              </Button>
            </div>
          ) : (
            <>
              {/* Scrollable form area */}
              <div ref={scrollRef} className="overflow-y-auto flex-1 px-6 py-4">
                <form
                  id="signup-form"
                  onSubmit={handleFormSubmit}
                  className="space-y-3"
                >
                  {/* Full Name */}
                  <div className="space-y-1">
                    <Label
                      htmlFor="s-fullName"
                      className="text-sm font-medium text-gray-700"
                    >
                      Full Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="s-fullName"
                      value={form.fullName}
                      onChange={(e) => setField("fullName", e.target.value)}
                      placeholder="Enter your full name"
                      className={`h-9 ${errors.fullName ? "border-red-400" : "border-gray-200"} focus:border-green-500`}
                    />
                    {errors.fullName && (
                      <p className="text-red-500 text-xs">{errors.fullName}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Mobile */}
                    <div className="space-y-1">
                      <Label
                        htmlFor="s-mobile"
                        className="text-sm font-medium text-gray-700"
                      >
                        Mobile <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="s-mobile"
                        value={form.mobileNumber}
                        onChange={(e) =>
                          setField("mobileNumber", e.target.value)
                        }
                        placeholder="10-digit mobile"
                        maxLength={10}
                        className={`h-9 ${errors.mobileNumber ? "border-red-400" : "border-gray-200"} focus:border-green-500`}
                      />
                      {errors.mobileNumber && (
                        <p className="text-red-500 text-xs">
                          {errors.mobileNumber}
                        </p>
                      )}
                    </div>
                    {/* Email */}
                    <div className="space-y-1">
                      <Label
                        htmlFor="s-email"
                        className="text-sm font-medium text-gray-700"
                      >
                        Email <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="s-email"
                        type="email"
                        value={form.email}
                        onChange={(e) => setField("email", e.target.value)}
                        placeholder="your@email.com"
                        className={`h-9 ${errors.email ? "border-red-400" : "border-gray-200"} focus:border-green-500`}
                      />
                      {errors.email && (
                        <p className="text-red-500 text-xs">{errors.email}</p>
                      )}
                    </div>
                  </div>

                  {/* Farm Name */}
                  <div className="space-y-1">
                    <Label
                      htmlFor="s-farmName"
                      className="text-sm font-medium text-gray-700"
                    >
                      Farm Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="s-farmName"
                      value={form.farmName}
                      onChange={(e) => setField("farmName", e.target.value)}
                      placeholder="Enter farm name"
                      className={`h-9 ${errors.farmName ? "border-red-400" : "border-gray-200"} focus:border-green-500`}
                    />
                    {errors.farmName && (
                      <p className="text-red-500 text-xs">{errors.farmName}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* State */}
                    <div className="space-y-1">
                      <Label
                        htmlFor="s-state"
                        className="text-sm font-medium text-gray-700"
                      >
                        State <span className="text-red-500">*</span>
                      </Label>
                      <select
                        id="s-state"
                        value={form.state}
                        onChange={(e) => setField("state", e.target.value)}
                        className={`w-full h-9 rounded-md border px-3 text-sm focus:outline-none focus:border-green-500 bg-white ${
                          errors.state ? "border-red-400" : "border-gray-200"
                        }`}
                      >
                        <option value="">Select state</option>
                        {INDIAN_STATES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                      {errors.state && (
                        <p className="text-red-500 text-xs">{errors.state}</p>
                      )}
                    </div>
                    {/* City */}
                    <div className="space-y-1">
                      <Label
                        htmlFor="s-city"
                        className="text-sm font-medium text-gray-700"
                      >
                        City <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="s-city"
                        value={form.city}
                        onChange={(e) => setField("city", e.target.value)}
                        placeholder="Enter city"
                        className={`h-9 ${errors.city ? "border-red-400" : "border-gray-200"} focus:border-green-500`}
                      />
                      {errors.city && (
                        <p className="text-red-500 text-xs">{errors.city}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Role */}
                    <div className="space-y-1">
                      <Label
                        htmlFor="s-role"
                        className="text-sm font-medium text-gray-700"
                      >
                        Role <span className="text-red-500">*</span>
                      </Label>
                      <select
                        id="s-role"
                        value={form.role}
                        onChange={(e) => setField("role", e.target.value)}
                        className={`w-full h-9 rounded-md border px-3 text-sm focus:outline-none focus:border-green-500 bg-white ${
                          errors.role ? "border-red-400" : "border-gray-200"
                        }`}
                      >
                        <option value="">Select role</option>
                        <option value="Farmer">Farmer</option>
                        <option value="Dealer">Dealer</option>
                        <option value="Company">Company</option>
                      </select>
                      {errors.role && (
                        <p className="text-red-500 text-xs">{errors.role}</p>
                      )}
                    </div>
                    {/* Bird Capacity */}
                    <div className="space-y-1">
                      <Label
                        htmlFor="s-birds"
                        className="text-sm font-medium text-gray-700"
                      >
                        Bird Capacity <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="s-birds"
                        type="number"
                        min="1"
                        value={form.birdCapacity}
                        onChange={(e) =>
                          setField("birdCapacity", e.target.value)
                        }
                        placeholder="e.g. 5000"
                        className={`h-9 ${errors.birdCapacity ? "border-red-400" : "border-gray-200"} focus:border-green-500`}
                      />
                      {errors.birdCapacity && (
                        <p className="text-red-500 text-xs">
                          {errors.birdCapacity}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-1">
                    <Label
                      htmlFor="s-password"
                      className="text-sm font-medium text-gray-700"
                    >
                      Password <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="s-password"
                        type={showPassword ? "text" : "password"}
                        value={form.password}
                        onChange={(e) => setField("password", e.target.value)}
                        placeholder="Min 6 characters"
                        className={`h-9 pr-10 ${errors.password ? "border-red-400" : "border-gray-200"} focus:border-green-500`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? (
                          <EyeOff size={15} />
                        ) : (
                          <Eye size={15} />
                        )}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-red-500 text-xs">{errors.password}</p>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-1 pb-2">
                    <Label
                      htmlFor="s-confirm"
                      className="text-sm font-medium text-gray-700"
                    >
                      Confirm Password <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="s-confirm"
                        type={showConfirm ? "text" : "password"}
                        value={form.confirmPassword}
                        onChange={(e) =>
                          setField("confirmPassword", e.target.value)
                        }
                        placeholder="Re-enter password"
                        className={`h-9 pr-10 ${errors.confirmPassword ? "border-red-400" : "border-gray-200"} focus:border-green-500`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-red-500 text-xs">
                        {errors.confirmPassword}
                      </p>
                    )}
                  </div>

                  {/* Hidden submit so Enter key works in form */}
                  <input type="submit" className="hidden" />
                </form>
              </div>

              {/* Sticky footer -- always visible, never inside scroll area */}
              <div className="flex-shrink-0 px-6 pb-5 pt-3 border-t border-gray-100 bg-white rounded-b-2xl">
                {submitError && (
                  <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">
                    {submitError}
                  </div>
                )}
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => {
                    console.log("[SIGNUP] Submit button clicked");
                    doSubmit();
                  }}
                  className="w-full h-10 rounded-md font-semibold text-white text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
                  style={{
                    background: loading
                      ? "#86efac"
                      : "linear-gradient(135deg, #16a34a, #15803d)",
                  }}
                  data-ocid="signup.submit_button"
                >
                  {loading && <Loader2 size={16} className="animate-spin" />}
                  {loading ? "Submitting..." : "Submit Request"}
                </button>
                <p className="text-center text-xs text-gray-400 mt-2">
                  Admin will review your request before activation.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
