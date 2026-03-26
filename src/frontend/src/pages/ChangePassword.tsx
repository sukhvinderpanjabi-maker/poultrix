import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "@/lib/react-router-compat";
import { storage } from "@/lib/storage";
import { Eye, EyeOff, KeyRound, ShieldAlert } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const ATTEMPT_KEY = (userId: string) => `pw_change_attempts_${userId}`;
const MAX_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

type AttemptRecord = { count: number; firstAt: number };

function getAttempts(userId: string): AttemptRecord {
  try {
    const raw = localStorage.getItem(ATTEMPT_KEY(userId));
    if (!raw) return { count: 0, firstAt: Date.now() };
    return JSON.parse(raw) as AttemptRecord;
  } catch {
    return { count: 0, firstAt: Date.now() };
  }
}

function recordAttempt(userId: string): AttemptRecord {
  const prev = getAttempts(userId);
  const now = Date.now();
  const windowMs = LOCKOUT_MINUTES * 60 * 1000;
  // reset if window expired
  const next: AttemptRecord =
    now - prev.firstAt > windowMs
      ? { count: 1, firstAt: now }
      : { count: prev.count + 1, firstAt: prev.firstAt };
  localStorage.setItem(ATTEMPT_KEY(userId), JSON.stringify(next));
  return next;
}

function clearAttempts(userId: string) {
  localStorage.removeItem(ATTEMPT_KEY(userId));
}

function isLockedOut(userId: string): { locked: boolean; minutesLeft: number } {
  const rec = getAttempts(userId);
  const windowMs = LOCKOUT_MINUTES * 60 * 1000;
  const now = Date.now();
  if (rec.count >= MAX_ATTEMPTS && now - rec.firstAt < windowMs) {
    const minutesLeft = Math.ceil((rec.firstAt + windowMs - now) / 60000);
    return { locked: true, minutesLeft };
  }
  return { locked: false, minutesLeft: 0 };
}

function validatePassword(pw: string): string[] {
  const errors: string[] = [];
  if (pw.length < 8) errors.push("At least 8 characters");
  if (!/[A-Z]/.test(pw)) errors.push("At least 1 uppercase letter");
  if (!/[a-z]/.test(pw)) errors.push("At least 1 lowercase letter");
  if (!/[0-9]/.test(pw)) errors.push("At least 1 number");
  if (!/[^A-Za-z0-9]/.test(pw)) errors.push("At least 1 special character");
  return errors;
}

export default function ChangePassword() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const [current, setCurrent] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<{
    current?: string;
    new?: string[];
    confirm?: string;
  }>({});
  const [loading, setLoading] = useState(false);

  // Access guard
  if (!currentUser || currentUser.role !== "SuperAdmin") {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-[60vh] gap-4"
        data-ocid="change_password.error_state"
      >
        <ShieldAlert size={48} className="text-red-500" />
        <h2 className="text-xl font-bold text-red-600">Access Denied</h2>
        <p className="text-muted-foreground">
          Only Super Admin can change the password.
        </p>
        <Button onClick={() => navigate("/dashboard")}>Go to Dashboard</Button>
      </div>
    );
  }

  const lockStatus = isLockedOut(currentUser.id);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const newErrors: typeof errors = {};
    let hasError = false;

    // Rate limit check
    if (isLockedOut(currentUser!.id).locked) return;

    // Validate current password
    if (current !== currentUser!.password) {
      const attempt = recordAttempt(currentUser!.id);
      if (attempt.count >= MAX_ATTEMPTS) {
        toast.error(
          `Too many failed attempts. Try again in ${LOCKOUT_MINUTES} minutes.`,
        );
        return;
      }
      newErrors.current = "Current password is incorrect";
      hasError = true;
    }

    // Validate new password strength
    const pwErrors = validatePassword(newPw);
    if (pwErrors.length > 0) {
      newErrors.new = pwErrors;
      hasError = true;
    }

    // Check password history
    if (!newErrors.new) {
      const history = currentUser!.passwordHistory ?? [];
      if (history.includes(newPw)) {
        newErrors.new = ["Cannot reuse one of your last 3 passwords"];
        hasError = true;
      }
    }

    // Confirm match
    if (newPw !== confirm) {
      newErrors.confirm = "Passwords do not match";
      hasError = true;
    }

    setErrors(newErrors);
    if (hasError) return;

    setLoading(true);
    try {
      const history = currentUser!.passwordHistory ?? [];
      const updatedHistory = [...history, currentUser!.password].slice(-3);

      storage.updateUser(currentUser!.id, {
        password: newPw,
        passwordHistory: updatedHistory,
        passwordLastChanged: new Date().toISOString(),
      });

      storage.addAuditLog({
        module: "Change Password",
        action: "delete" as const, // reusing AuditLog action type; logged as change-password
        recordId: currentUser!.id,
        recordSummary: "Super Admin changed password",
        deletedBy: currentUser!.name,
        deletedByRole: currentUser!.role,
        companyId: currentUser!.companyId,
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString(),
      });

      clearAttempts(currentUser!.id);
      toast.success("Password changed successfully. Please login again.");

      setTimeout(() => {
        logout();
      }, 2000);
    } catch (_err) {
      toast.error("Failed to update password. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto mt-10" data-ocid="change_password.panel">
      <Card>
        <CardHeader className="flex flex-row items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <KeyRound size={20} className="text-primary" />
          </div>
          <CardTitle>Change Password</CardTitle>
        </CardHeader>
        <CardContent>
          {lockStatus.locked ? (
            <div
              className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700"
              data-ocid="change_password.error_state"
            >
              <p className="font-semibold">Account temporarily locked</p>
              <p className="text-sm mt-1">
                Too many failed attempts. Try again in {lockStatus.minutesLeft}{" "}
                minute(s).
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Current Password */}
              <div className="space-y-1">
                <Label htmlFor="current-pw">Current Password</Label>
                <div className="relative">
                  <Input
                    id="current-pw"
                    type={showCurrent ? "text" : "password"}
                    value={current}
                    onChange={(e) => setCurrent(e.target.value)}
                    placeholder="Enter current password"
                    data-ocid="change_password.input"
                    className={errors.current ? "border-red-500" : ""}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.current && (
                  <p className="text-xs text-red-600 mt-1">{errors.current}</p>
                )}
              </div>

              {/* New Password */}
              <div className="space-y-1">
                <Label htmlFor="new-pw">New Password</Label>
                <div className="relative">
                  <Input
                    id="new-pw"
                    type={showNew ? "text" : "password"}
                    value={newPw}
                    onChange={(e) => setNewPw(e.target.value)}
                    placeholder="Enter new password"
                    data-ocid="change_password.input"
                    className={errors.new ? "border-red-500" : ""}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.new && (
                  <ul className="text-xs text-red-600 mt-1 space-y-0.5 list-disc list-inside">
                    {errors.new.map((e) => (
                      <li key={e}>{e}</li>
                    ))}
                  </ul>
                )}
                <p className="text-xs text-muted-foreground">
                  Min 8 chars, uppercase, lowercase, number, special character.
                </p>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1">
                <Label htmlFor="confirm-pw">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirm-pw"
                    type={showConfirm ? "text" : "password"}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Re-enter new password"
                    data-ocid="change_password.input"
                    className={errors.confirm ? "border-red-500" : ""}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.confirm && (
                  <p className="text-xs text-red-600 mt-1">{errors.confirm}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
                data-ocid="change_password.submit_button"
              >
                {loading ? "Updating..." : "Change Password"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
