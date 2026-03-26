import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/context/AuthContext";
import { getRoleDefaults } from "@/lib/permissions";
import { type User, storage } from "@/lib/storage";
import {
  Copy,
  Edit,
  KeyRound,
  Loader2,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

const ROLE_COLORS: Record<string, string> = {
  Manager: "bg-blue-100 text-blue-700",
  Supervisor: "bg-purple-100 text-purple-700",
  Staff: "bg-gray-100 text-gray-700",
};

type SubUserRole = "Manager" | "Supervisor" | "Staff";

type FormState = {
  name: string;
  username: string;
  password: string;
  role: SubUserRole | "";
  assignedBranchIds: string[];
  assignedZoneIds: string[];
  assignedFarmIds: string[];
  mobileNumber: string;
  assignedShedId: string;
  active: boolean;
  canUpdate?: boolean;
  canDelete?: boolean;
  canPrint?: boolean;
};

const emptyForm = (): FormState => ({
  name: "",
  username: "",
  password: "",
  role: "",
  assignedBranchIds: [],
  assignedZoneIds: [],
  assignedFarmIds: [],
  mobileNumber: "",
  assignedShedId: "",
  active: true,
  canUpdate: undefined,
  canDelete: undefined,
  canPrint: undefined,
});

function safeLoadData(
  myCompanyId: string | undefined,
  currentUserId: string | undefined,
) {
  try {
    console.log("[MyTeam] loadData called, companyId:", myCompanyId);
    const allUsers = storage.getUsers();
    const subUsers = allUsers.filter(
      (u) =>
        (u.companyId === myCompanyId || u.createdBy === currentUserId) &&
        ["Manager", "Supervisor", "Staff"].includes(u.role),
    );
    const branches = storage.getBranchesByCompany(myCompanyId);
    const zones = storage.getZonesByCompany(myCompanyId);
    const farms = storage.getFarmsByCompany(myCompanyId);
    const sheds = storage.getSheds();
    console.log(
      "[MyTeam] loadData done. subUsers:",
      subUsers.length,
      "branches:",
      branches.length,
      "farms:",
      farms.length,
    );
    return { subUsers, branches, zones, farms, sheds, allUsers };
  } catch (err) {
    console.error("[MyTeam] loadData error:", err);
    return {
      subUsers: [] as User[],
      branches: [] as ReturnType<typeof storage.getBranchesByCompany>,
      zones: [] as ReturnType<typeof storage.getZonesByCompany>,
      farms: [] as ReturnType<typeof storage.getFarmsByCompany>,
      sheds: [] as ReturnType<typeof storage.getSheds>,
      allUsers: [] as User[],
    };
  }
}

export default function MyTeam() {
  const { currentUser } = useAuth();
  const [addOpen, setAddOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [resetUser, setResetUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [form, setForm] = useState<FormState>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [identityResult, setIdentityResult] = useState<{
    serialNumber: string;
    username: string;
  } | null>(null);

  // myCompanyId: prefer companyId, fallback to user's own id (for CompanyAdmin who IS the company)
  const myCompanyId = currentUser?.companyId || currentUser?.id;

  const loadData = useCallback(
    () => safeLoadData(myCompanyId, currentUser?.id),
    [myCompanyId, currentUser?.id],
  );

  const [data, setData] = useState(() => loadData());

  // Refresh list whenever dialog closes
  useEffect(() => {
    if (!addOpen) {
      setData(loadData());
    }
  }, [addOpen, loadData]);

  const { subUsers, branches, zones, farms, sheds } = data;

  // Cascading selects based on form state
  const filteredFarms = farms.filter(
    (f) =>
      (form.assignedBranchIds.length === 0 ||
        (f.branchId && form.assignedBranchIds.includes(f.branchId))) &&
      (form.assignedZoneIds.length === 0 ||
        (f.zoneId && form.assignedZoneIds.includes(f.zoneId))),
  );
  const filteredSheds = sheds.filter(
    (s) =>
      form.assignedFarmIds.length === 0 ||
      form.assignedFarmIds.includes(s.farmId),
  );

  function openAdd() {
    setForm(emptyForm());
    setEditUser(null);
    setAddOpen(true);
  }

  function openEdit(u: User) {
    setEditUser(u);
    setForm({
      name: u.name,
      username: u.username,
      password: u.password,
      role: (u.role as SubUserRole) || "",
      mobileNumber: u.mobileNumber || "",
      assignedBranchIds: u.assignedBranchIds || [],
      assignedZoneIds: u.assignedZoneIds || [],
      assignedFarmIds: u.assignedFarmIds || [],
      assignedShedId: u.assignedShedId || "",
      active: u.active !== false,
    });
    setAddOpen(true);
  }

  function validateForm(): string | null {
    if (!form.name.trim()) return "Name is required";
    if (!form.username.trim()) return "Username is required";
    if (!editUser && !form.password.trim()) return "Password is required";
    if (!form.role) return "Role is required";
    // Duplicate username check
    const allUsers = storage.getUsers();
    const dup = allUsers.find(
      (u) =>
        u.username?.toLowerCase() === form.username.trim().toLowerCase() &&
        u.id !== editUser?.id,
    );
    if (dup) return "Username already exists";
    return null;
  }

  function handleSave() {
    console.log("[MyTeam] handleSave called, form:", {
      name: form.name,
      username: form.username.trim().toLowerCase(),
      role: form.role,
      companyId: myCompanyId,
    });

    const err = validateForm();
    if (err) {
      console.warn("[MyTeam] Validation failed:", err);
      toast.error(err);
      return;
    }

    setSaving(true);
    try {
      if (editUser) {
        storage.updateUser(editUser.id, {
          name: form.name,
          username: form.username.trim().toLowerCase(),
          password: form.password || editUser.password,
          role: form.role as SubUserRole,
          assignedBranchIds: form.assignedBranchIds,
          assignedZoneIds: form.assignedZoneIds,
          assignedFarmIds: form.assignedFarmIds,
          assignedShedId: form.assignedShedId || undefined,
          active: form.active,
          permissions: {
            canUpdate: form.canUpdate,
            canDelete: form.canDelete,
            canPrint: form.canPrint,
          },
        });
        console.log("[MyTeam] User updated:", editUser.id);
        toast.success(`${form.name} updated successfully`);
      } else {
        const newUser = storage.addUser({
          name: form.name.trim(),
          username: form.username.trim().toLowerCase(),
          password: form.password.trim(),
          role: form.role as SubUserRole,
          companyId: myCompanyId,
          createdBy: currentUser?.id,
          mobileNumber: form.mobileNumber.trim() || undefined,
          assignedBranchIds: form.assignedBranchIds,
          assignedZoneIds: form.assignedZoneIds,
          assignedFarmIds: form.assignedFarmIds,
          assignedShedId: form.assignedShedId || undefined,
          active: form.active,
        });
        setIdentityResult({
          serialNumber: newUser.serialNumber ?? "",
          username: newUser.username,
        });
        console.log("[MyTeam] New user created:", newUser.id, newUser.username);

        // Add notifications (wrapped in try/catch so notification failure doesn't break creation)
        try {
          storage.addNotification({
            userId: newUser.id,
            companyId: myCompanyId,
            type: "sub_user_assigned",
            title: "Welcome to the Team",
            message: `You have been added to the team as a ${form.role}. Log in with username: ${newUser.username}`,
            read: false,
            createdAt: new Date().toISOString(),
          });
          if (currentUser) {
            storage.addNotification({
              userId: currentUser.id,
              companyId: myCompanyId,
              type: "sub_user_assigned",
              title: "New Sub-User Created",
              message: `${form.name} has been added as a ${form.role} to your team.`,
              read: false,
              createdAt: new Date().toISOString(),
            });
          }
        } catch (notifErr) {
          console.error("[MyTeam] Notification error (non-fatal):", notifErr);
        }

        toast.success(`${form.name} created! Username: ${newUser.username}`);
      }

      setSaving(false);
      setAddOpen(false);
      // Refresh list from storage
      const freshData = safeLoadData(myCompanyId, currentUser?.id);
      setData(freshData);
      console.log(
        "[MyTeam] List refreshed. Total sub-users:",
        freshData.subUsers.length,
      );
    } catch (e) {
      console.error("[MyTeam] Save error:", e);
      const message = e instanceof Error ? e.message : "Unknown error";
      toast.error(`Failed to save: ${message}`);
      setSaving(false);
    }
  }

  function handleDelete(u: User) {
    if (!confirm(`Delete user ${u.name}? This cannot be undone.`)) return;
    try {
      storage.deleteUser(u.id);
      toast.success("User deleted");
      setData(loadData());
    } catch (err) {
      console.error("[MyTeam] Delete error:", err);
      toast.error("Failed to delete user.");
    }
  }

  function handleResetPassword() {
    if (!resetUser || !newPassword.trim()) {
      toast.error("Enter a new password");
      return;
    }
    try {
      storage.updateUser(resetUser.id, { password: newPassword.trim() });
      toast.success("Password reset successfully");
      setResetUser(null);
      setNewPassword("");
      setData(loadData());
    } catch (err) {
      console.error("[MyTeam] Password reset error:", err);
      toast.error("Failed to reset password.");
    }
  }

  function toggleMulti(
    key: "assignedBranchIds" | "assignedZoneIds" | "assignedFarmIds",
    value: string,
  ) {
    setForm((f) => {
      const arr = f[key];
      return {
        ...f,
        [key]: arr.includes(value)
          ? arr.filter((x) => x !== value)
          : [...arr, value],
      };
    });
  }

  return (
    <div className="space-y-6" data-ocid="my_team.page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Team</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage sub-users within your organization
          </p>
        </div>
        <Button
          onClick={openAdd}
          className="gap-2"
          data-ocid="my_team.open_modal_button"
        >
          <UserPlus size={16} />
          Add Sub-User
        </Button>
      </div>

      {subUsers.length === 0 ? (
        <div
          className="text-center py-16 text-muted-foreground"
          data-ocid="my_team.empty_state"
        >
          <Users size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">No sub-users yet</p>
          <p className="text-sm mt-1">
            Add Managers, Supervisors, or Staff to your team
          </p>
        </div>
      ) : (
        <div
          className="rounded-xl border bg-card overflow-x-auto"
          data-ocid="my_team.table"
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Serial No.</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Employee ID</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Assigned Branch</TableHead>
                <TableHead>Assigned Farm/Line</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subUsers.map((u, idx) => {
                const userBranches = (u.assignedBranchIds || [])
                  .map((id) => branches.find((b) => b.id === id)?.name)
                  .filter(Boolean)
                  .join(", ");
                const userFarms = (u.assignedFarmIds || [])
                  .map((id) => farms.find((f) => f.id === id)?.name)
                  .filter(Boolean)
                  .join(", ");
                const shedName = u.assignedShedId
                  ? sheds.find((s) => s.id === u.assignedShedId)?.name
                  : null;
                return (
                  <TableRow key={u.id} data-ocid={`my_team.item.${idx + 1}`}>
                    <TableCell>
                      <code className="text-xs font-mono bg-muted px-1 rounded">
                        {u.serialNumber || "—"}
                      </code>
                    </TableCell>
                    <TableCell className="font-medium">{u.name}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {u.employeeId || "—"}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          ROLE_COLORS[u.role] || "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {u.role}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {u.username}
                    </TableCell>
                    <TableCell className="text-sm">
                      {userBranches || (
                        <span className="text-muted-foreground">\u2014</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {userFarms || shedName ? (
                        <span>
                          {userFarms}
                          {shedName ? (
                            <Badge variant="outline" className="ml-1 text-xs">
                              {shedName}
                            </Badge>
                          ) : null}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">\u2014</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={u.active !== false ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {u.active !== false ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 justify-end">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => openEdit(u)}
                          data-ocid={`my_team.edit_button.${idx + 1}`}
                          aria-label="Edit"
                        >
                          <Edit size={14} />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            setResetUser(u);
                            setNewPassword("");
                          }}
                          data-ocid={`my_team.secondary_button.${idx + 1}`}
                          aria-label="Reset Password"
                        >
                          <KeyRound size={14} />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(u)}
                          data-ocid={`my_team.delete_button.${idx + 1}`}
                          aria-label="Delete"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog
        open={addOpen}
        onOpenChange={(o) => {
          if (!o) setAddOpen(false);
        }}
      >
        <DialogContent
          className="max-w-lg max-h-[90vh] overflow-y-auto"
          data-ocid="my_team.dialog"
        >
          <DialogHeader>
            <DialogTitle>
              {editUser ? "Edit Sub-User" : "Add Sub-User"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="su-username">Username *</Label>
              <Input
                id="su-username"
                value={form.username}
                onChange={(e) =>
                  setForm((f) => ({ ...f, username: e.target.value }))
                }
                placeholder="Enter username"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="su-name">Full Name *</Label>
                <Input
                  id="su-name"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="Enter full name"
                  data-ocid="my_team.input"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="su-mobile">Mobile Number</Label>
                <Input
                  id="su-mobile"
                  value={form.mobileNumber}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, mobileNumber: e.target.value }))
                  }
                  placeholder="+91 XXXXX XXXXX"
                  data-ocid="my_team.input"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="su-password">
                  Password {editUser ? "(leave blank to keep)" : "*"}
                </Label>
                <Input
                  id="su-password"
                  type="password"
                  value={form.password}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, password: e.target.value }))
                  }
                  placeholder="Set password"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Role *</Label>
                {/* Bug 2 fix: pass undefined when role is empty so placeholder shows */}
                <Select
                  value={form.role || undefined}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, role: v as SubUserRole }))
                  }
                >
                  <SelectTrigger data-ocid="my_team.select">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Manager">Manager</SelectItem>
                    <SelectItem value="Supervisor">Supervisor</SelectItem>
                    {currentUser?.role !== "Farmer" && (
                      <SelectItem value="Staff">Staff</SelectItem>
                    )}
                    {currentUser?.role === "Farmer" && (
                      <SelectItem value="Staff">Staff</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Permission Overrides */}
              {form.role &&
                ["Manager", "Supervisor", "Staff"].includes(form.role) &&
                (() => {
                  const defaults = getRoleDefaults(form.role);
                  return (
                    <div className="p-3 border rounded-lg bg-muted/30 space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Permission Overrides
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Leave unchecked to use role defaults.
                      </p>
                      <label className="flex items-center gap-2 cursor-pointer text-sm">
                        <input
                          type="checkbox"
                          checked={
                            form.canUpdate !== undefined
                              ? form.canUpdate
                              : defaults.canUpdate
                          }
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              canUpdate: e.target.checked,
                            }))
                          }
                          className="rounded"
                          data-ocid="my_team.perm_update.checkbox"
                        />
                        Allow Update
                        <span className="text-xs text-muted-foreground">
                          (default: {defaults.canUpdate ? "Yes" : "No"})
                        </span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer text-sm">
                        <input
                          type="checkbox"
                          checked={
                            form.canDelete !== undefined
                              ? form.canDelete
                              : defaults.canDelete
                          }
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              canDelete: e.target.checked,
                            }))
                          }
                          className="rounded"
                          data-ocid="my_team.perm_delete.checkbox"
                        />
                        Allow Delete
                        <span className="text-xs text-muted-foreground">
                          (default: {defaults.canDelete ? "Yes" : "No"})
                        </span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer text-sm">
                        <input
                          type="checkbox"
                          checked={
                            form.canPrint !== undefined
                              ? form.canPrint
                              : defaults.canPrint
                          }
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              canPrint: e.target.checked,
                            }))
                          }
                          className="rounded"
                          data-ocid="my_team.perm_print.checkbox"
                        />
                        Allow Print
                        <span className="text-xs text-muted-foreground">
                          (default: {defaults.canPrint ? "Yes" : "No"})
                        </span>
                      </label>
                    </div>
                  );
                })()}
            </div>

            {/* Assigned Branch */}
            {branches.length > 0 && (
              <div className="space-y-1.5">
                <Label>Assigned Branch(es)</Label>
                <div className="border rounded-lg p-3 space-y-2 max-h-32 overflow-y-auto">
                  {branches.map((b) => (
                    <label
                      key={b.id}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={form.assignedBranchIds.includes(b.id)}
                        onChange={() => toggleMulti("assignedBranchIds", b.id)}
                        className="rounded"
                        data-ocid="my_team.checkbox"
                      />
                      <span className="text-sm">
                        {b.name}
                        {b.branchCode ? (
                          <span className="text-xs text-muted-foreground ml-1">
                            ({b.branchCode})
                          </span>
                        ) : null}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Assigned Zone */}
            {zones.length > 0 && (
              <div className="space-y-1.5">
                <Label>Assigned Zone(s)</Label>
                <div className="border rounded-lg p-3 space-y-2 max-h-32 overflow-y-auto">
                  {zones.map((z) => (
                    <label
                      key={z.id}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={form.assignedZoneIds.includes(z.id)}
                        onChange={() => toggleMulti("assignedZoneIds", z.id)}
                        className="rounded"
                      />
                      <span className="text-sm">{z.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Bug 3 fix: show message when company has no farms at all */}
            {farms.length === 0 && (
              <p
                className="text-sm text-muted-foreground"
                data-ocid="my_team.empty_state"
              >
                No farms available for your company.
              </p>
            )}

            {/* Assigned Farms */}
            {filteredFarms.length > 0 && (
              <div className="space-y-1.5">
                <Label>Assigned Farm(s)</Label>
                <div className="border rounded-lg p-3 space-y-2 max-h-32 overflow-y-auto">
                  {filteredFarms.map((f) => (
                    <label
                      key={f.id}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={form.assignedFarmIds.includes(f.id)}
                        onChange={() => toggleMulti("assignedFarmIds", f.id)}
                        className="rounded"
                      />
                      <span className="text-sm">{f.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Assigned Line/Shed — Bug 1 fix: use "none" sentinel instead of empty string */}
            {filteredSheds.length > 0 && (
              <div className="space-y-1.5">
                <Label>Assigned Line / Area (Shed)</Label>
                <Select
                  value={form.assignedShedId || "none"}
                  onValueChange={(v) =>
                    setForm((f) => ({
                      ...f,
                      assignedShedId: v === "none" ? "" : v,
                    }))
                  }
                >
                  <SelectTrigger data-ocid="my_team.select">
                    <SelectValue placeholder="Select shed/line (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {filteredSheds.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex items-center gap-3">
              <Switch
                id="su-active"
                checked={form.active}
                onCheckedChange={(v) => setForm((f) => ({ ...f, active: v }))}
                data-ocid="my_team.switch"
              />
              <Label htmlFor="su-active">Active Account</Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAddOpen(false)}
              data-ocid="my_team.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              data-ocid="my_team.submit_button"
            >
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {editUser ? "Save Changes" : "Create Sub-User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog
        open={!!resetUser}
        onOpenChange={(o) => {
          if (!o) setResetUser(null);
        }}
      >
        <DialogContent data-ocid="my_team.dialog">
          <DialogHeader>
            <DialogTitle>Reset Password \u2014 {resetUser?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label htmlFor="new-pw">New Password</Label>
            <Input
              id="new-pw"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              data-ocid="my_team.input"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setResetUser(null)}
              data-ocid="my_team.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleResetPassword}
              data-ocid="my_team.confirm_button"
            >
              Reset Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Identity Result Modal */}
      <Dialog
        open={!!identityResult}
        onOpenChange={() => setIdentityResult(null)}
      >
        <DialogContent className="max-w-md" data-ocid="my_team.identity.dialog">
          <DialogHeader>
            <DialogTitle className="text-green-700">
              ✓ Sub-User Created Successfully
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Share these credentials with the new team member:
            </p>
            <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Serial Number
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <code className="flex-1 text-sm font-mono bg-background border rounded px-3 py-1.5">
                    {identityResult?.serialNumber}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        identityResult?.serialNumber ?? "",
                      );
                      toast.success("Copied!");
                    }}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => setIdentityResult(null)}
              data-ocid="my_team.identity.close_button"
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
