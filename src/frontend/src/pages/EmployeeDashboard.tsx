import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { useCompanyScope } from "@/lib/roleFilter";
import { storage } from "@/lib/storage";
import {
  BadgeCheck,
  Bird,
  Briefcase,
  Building2,
  GitBranch,
  Home,
  Mail,
  MapPin,
  Phone,
  Shield,
  User as UserIcon,
} from "lucide-react";

const roleColors: Record<string, string> = {
  SuperAdmin: "bg-purple-100 text-purple-800 border-purple-200",
  CompanyAdmin: "bg-blue-100 text-blue-800 border-blue-200",
  Manager: "bg-indigo-100 text-indigo-800 border-indigo-200",
  Supervisor: "bg-cyan-100 text-cyan-800 border-cyan-200",
  Farmer: "bg-green-100 text-green-800 border-green-200",
  Dealer: "bg-amber-100 text-amber-800 border-amber-200",
  Staff: "bg-gray-100 text-gray-800 border-gray-200",
};

export default function EmployeeDashboard() {
  const { currentUser } = useAuth();
  const { farms: allFarms, branches: allBranches } = useCompanyScope();
  if (!currentUser) return null;
  const allCompanies = storage.getCompanies();
  const allSheds = storage.getSheds();

  const company = allCompanies.find((c) => c.id === currentUser.companyId);

  const assignedBranches = allBranches.filter((b) =>
    (currentUser.assignedBranchIds || []).includes(b.id),
  );

  const assignedFarms = allFarms.filter((f) =>
    (currentUser.assignedFarmIds || []).includes(f.id),
  );

  const assignedSheds = allSheds.filter((s) =>
    assignedFarms.some((f) => f.id === s.farmId),
  );

  const isSuperAdmin = currentUser.role === "SuperAdmin";

  const initials = currentUser.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (isSuperAdmin) {
    return (
      <div className="space-y-6 max-w-3xl" data-ocid="employee_dashboard.page">
        <div>
          <h2 className="text-2xl font-bold">My Profile</h2>
          <p className="text-muted-foreground text-sm">
            Platform administrator overview
          </p>
        </div>
        <Card data-ocid="employee_dashboard.profile.card">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 text-xl font-bold">
                {initials}
              </div>
              <div>
                <h3 className="text-xl font-semibold">{currentUser.name}</h3>
                <p className="text-muted-foreground text-sm">
                  {currentUser.username}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge
                    className={`${roleColors[currentUser.role]} border text-xs`}
                  >
                    <Shield size={10} className="mr-1" />
                    {currentUser.role}
                  </Badge>
                  {currentUser.employeeId && (
                    <Badge variant="outline" className="text-xs font-mono">
                      {currentUser.employeeId}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="mt-6 p-4 rounded-lg bg-purple-50 border border-purple-100">
              <div className="flex items-center gap-2 text-purple-700">
                <BadgeCheck size={16} />
                <span className="font-medium text-sm">
                  Platform-wide Super Administrator
                </span>
              </div>
              <p className="text-xs text-purple-600 mt-1">
                Full access to all companies, farms, users, and system settings.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl" data-ocid="employee_dashboard.page">
      <div>
        <h2 className="text-2xl font-bold">My Profile</h2>
        <p className="text-muted-foreground text-sm">
          Your account details and assigned resources
        </p>
      </div>

      {/* Company Card */}
      {company && (
        <Card data-ocid="employee_dashboard.company.card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 size={16} />
              Company Information
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center gap-4">
              {company.logoUrl ? (
                <img
                  src={company.logoUrl}
                  alt="Company Logo"
                  className="w-14 h-14 object-contain rounded-lg border bg-white p-1"
                />
              ) : (
                <div className="w-14 h-14 rounded-lg bg-green-50 border border-green-100 flex items-center justify-center">
                  <Bird size={24} className="text-green-600" />
                </div>
              )}
              <div>
                <h3 className="font-semibold text-lg">{company.name}</h3>
                {company.address && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin size={12} /> {company.address}
                  </p>
                )}
                <div className="flex flex-wrap gap-2 mt-1">
                  {company.subscriptionPlan && (
                    <Badge variant="secondary" className="text-xs">
                      {company.subscriptionPlan} Plan
                    </Badge>
                  )}
                  {company.email && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Mail size={10} /> {company.email}
                    </span>
                  )}
                  {company.contactNumber && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Phone size={10} /> {company.contactNumber}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Profile Card */}
      <Card data-ocid="employee_dashboard.profile.card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <UserIcon size={16} />
            Employee Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold">{currentUser.name}</h3>
              <p className="text-sm text-muted-foreground">
                {currentUser.username}
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <Badge
                  className={`${roleColors[currentUser.role]} border text-xs`}
                >
                  <Briefcase size={10} className="mr-1" />
                  {currentUser.role}
                </Badge>
                {currentUser.employeeId && (
                  <Badge variant="outline" className="text-xs font-mono">
                    {currentUser.employeeId}
                  </Badge>
                )}
              </div>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {currentUser.mobileNumber && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone size={13} className="text-primary" />
                    {currentUser.mobileNumber}
                  </div>
                )}
                {currentUser.email && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail size={13} className="text-primary" />
                    {currentUser.email}
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assignments Card */}
      <Card data-ocid="employee_dashboard.assignments.card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Home size={16} />
            Assignments
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-4">
          {/* Branches */}
          {assignedBranches.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
                <GitBranch size={11} /> Assigned Branches
              </p>
              <div className="flex flex-wrap gap-2">
                {assignedBranches.map((b) => (
                  <Badge key={b.id} variant="secondary" className="text-xs">
                    {b.branchCode && (
                      <span className="font-mono mr-1">{b.branchCode}</span>
                    )}
                    {b.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Assigned Area (Supervisor) */}
          {currentUser.assignedArea && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
                <MapPin size={11} /> Assigned Area / Line
              </p>
              <Badge variant="outline" className="text-xs">
                {currentUser.assignedArea}
              </Badge>
            </div>
          )}

          {/* Farms */}
          {assignedFarms.length > 0 ? (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
                <Building2 size={11} /> Assigned Farms ({assignedFarms.length})
              </p>
              <div className="space-y-1">
                {assignedFarms.map((f) => (
                  <div
                    key={f.id}
                    className="flex items-center justify-between text-sm p-2 rounded bg-muted/40"
                  >
                    <span className="font-medium">{f.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {f.location}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No farms assigned yet.
            </p>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 border-t">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">
                {assignedFarms.length}
              </p>
              <p className="text-xs text-muted-foreground">Farms</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">
                {assignedSheds.length}
              </p>
              <p className="text-xs text-muted-foreground">Sheds</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">
                {assignedBranches.length}
              </p>
              <p className="text-xs text-muted-foreground">Branches</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
