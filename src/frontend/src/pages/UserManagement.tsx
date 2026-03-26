import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";
import { useCompanyScope } from "@/lib/roleFilter";
import {
  type Branch,
  UNASSIGNED_SENTINEL,
  type User,
  storage,
} from "@/lib/storage";
import {
  Copy,
  GitBranch,
  Pencil,
  Plus,
  Trash2,
  UserCheck,
  UserX,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type FormState = {
  name: string;
  username: string;
  password: string;
  role: User["role"];
  companyId: string;
  mobileNumber: string;
  email: string;
  assignedArea: string;
  assignedFarmIds: string[];
  assignedZoneIds: string[];
  assignedBranchIds: string[];
  assignedShedId: string;
  active: boolean;
};

type BranchFormState = {
  name: string;
  companyId: string;
  zoneId: string;
  address: string;
  branchManagerId: string;
  contactNumber: string;
};

const emptyForm = (): FormState => ({
  name: "",
  username: "",
  password: "",
  role: "Farmer",
  companyId: "",
  mobileNumber: "",
  email: "",
  assignedArea: "",
  assignedFarmIds: [],
  assignedZoneIds: [],
  assignedBranchIds: [],
  assignedShedId: "",
  active: true,
});

const emptyBranchForm = (): BranchFormState => ({
  name: "",
  companyId: "",
  zoneId: "",
  address: "",
  branchManagerId: "",
  contactNumber: "",
});

export default function UserManagement() {
  const { currentUser } = useAuth();
  const {
    users: scopedUsers,
    branches: scopedBranches,
    companyId: myCompanyId,
  } = useCompanyScope();
  const [users, setUsers] = useState<User[]>(() => scopedUsers);
  const [branches, setBranches] = useState<Branch[]>(() => scopedBranches);
  const [dialog, setDialog] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [identityResult, setIdentityResult] = useState<{
    serialNumber: string;
    username: string;
  } | null>(null);

  const [branchDialog, setBranchDialog] = useState(false);
  const [branchEditId, setBranchEditId] = useState<string | null>(null);
  const [branchForm, setBranchForm] = useState<BranchFormState>(
    emptyBranchForm(),
  );
  const [confirmDeleteBranch, setConfirmDeleteBranch] = useState<string | null>(
    null,
  );

  const companies = storage.getCompanies();
  const allSheds = storage.getSheds();

  const isSuperAdmin = currentUser?.role === "SuperAdmin";
  const isCompanyAdmin = currentUser?.role === "CompanyAdmin";

  // Use sentinel-safe scoped helpers so SuperAdmin without company selection sees nothing
  // For SuperAdmin: use form.companyId if selected, else UNASSIGNED_SENTINEL (no data until company picked)
  // For CompanyAdmin: always use their own companyId
  const formScopeId = isSuperAdmin
    ? form.companyId || UNASSIGNED_SENTINEL
    : currentUser?.companyId || UNASSIGNED_SENTINEL;

  const allZones = storage.getZonesByCompany(formScopeId);
  const allBranches = storage.getBranchesByCompany(formScopeId);
  const allFarms = storage.getFarmsByCompany(formScopeId);

  const visibleUsers = users.filter((u) => {
    if (isSuperAdmin) return true;
    if (isCompanyAdmin) return u.companyId === currentUser?.companyId;
    return false;
  });

  const _formCompanyId = isSuperAdmin
    ? form.companyId
    : currentUser?.companyId || "";
  const filteredZones = allZones;
  const filteredBranches = allBranches;
  const filteredFarms = allFarms;
  const filteredSheds = allSheds.filter(
    (s) =>
      form.assignedFarmIds.includes(s.farmId) ||
      filteredFarms.some((f) => f.id === s.farmId),
  );

  const managerUsers = users.filter(
    (u) =>
      u.role === "Manager" &&
      (isSuperAdmin || u.companyId === currentUser?.companyId),
  );

  const availableRoles: User["role"][] = isSuperAdmin
    ? ["CompanyAdmin", "Dealer", "Farmer"]
    : isCompanyAdmin
      ? ["Manager", "Supervisor", "Staff"]
      : [];

  // --- User dialog ---
  const openAdd = () => {
    setEditId(null);
    setForm(emptyForm());
    setDialog(true);
  };

  const openEdit = (u: User) => {
    setEditId(u.id);
    setForm({
      name: u.name,
      username: u.username,
      password: "",
      role: u.role,
      companyId: u.companyId || "",
      mobileNumber: u.mobileNumber || "",
      email: u.email || "",
      assignedArea: u.assignedArea || "",
      assignedFarmIds: u.assignedFarmIds || [],
      assignedZoneIds: u.assignedZoneIds || [],
      assignedBranchIds: u.assignedBranchIds || [],
      assignedShedId: u.assignedShedId || "",
      active: u.active !== false,
    });
    setDialog(true);
  };

  const save = () => {
    if (!form.name) return;
    const companyId = isSuperAdmin
      ? form.companyId || undefined
      : currentUser?.companyId;
    if (editId) {
      const trimmedUsernameEdit = (form.username?.trim() || "").toLowerCase();
      if (!trimmedUsernameEdit) {
        toast.error("Username is required");
        return;
      }
      const allUsersEdit = storage.getUsers();
      const dupEdit = allUsersEdit.find(
        (u) =>
          u.username?.toLowerCase() === trimmedUsernameEdit.toLowerCase() &&
          u.id !== editId,
      );
      if (dupEdit) {
        toast.error("Username already exists");
        return;
      }
      const updates: Partial<User> = {
        name: form.name,
        username: trimmedUsernameEdit,
        role: form.role,
        companyId,
        mobileNumber: form.mobileNumber || undefined,
        email: form.email || undefined,
        assignedArea: form.assignedArea || undefined,
        assignedFarmIds: form.assignedFarmIds,
        assignedZoneIds: form.assignedZoneIds,
        assignedBranchIds: form.assignedBranchIds,
        assignedShedId: form.assignedShedId || undefined,
        active: form.active,
      };
      if (form.password) updates.password = form.password;
      storage.updateUser(editId, updates);
    } else {
      if (!form.password) return;
      const trimmedUsername = (form.username?.trim() || "").toLowerCase();
      if (!trimmedUsername) {
        toast.error("Username is required");
        return;
      }
      const allUsers = storage.getUsers();
      const duplicate = allUsers.find(
        (u) => u.username?.toLowerCase() === trimmedUsername.toLowerCase(),
      );
      if (duplicate) {
        toast.error("Username already exists");
        return;
      }
      const newUser = storage.addUser({
        name: form.name,
        username: trimmedUsername,
        password: form.password,
        role: form.role,
        companyId,
        mobileNumber: form.mobileNumber || undefined,
        email: form.email || undefined,
        assignedArea: form.assignedArea || undefined,
        assignedFarmIds: form.assignedFarmIds,
        assignedZoneIds: form.assignedZoneIds,
        assignedBranchIds: form.assignedBranchIds,
        assignedShedId: form.assignedShedId || undefined,
        active: form.active,
      });
      setIdentityResult({
        serialNumber: newUser.serialNumber ?? "",
        username: newUser.username,
      });
    }
    setUsers(storage.getUsersByCompany(myCompanyId));
    setDialog(false);
  };

  const toggleActive = (u: User) => {
    storage.updateUser(u.id, { active: !(u.active === false) });
    setUsers(storage.getUsersByCompany(myCompanyId));
  };

  const doDelete = (id: string) => {
    storage.deleteUser(id);
    setUsers(storage.getUsersByCompany(myCompanyId));
    setConfirmDelete(null);
  };

  const toggleFarmId = (id: string) => {
    setForm((f) => ({
      ...f,
      assignedFarmIds: f.assignedFarmIds.includes(id)
        ? f.assignedFarmIds.filter((x) => x !== id)
        : [...f.assignedFarmIds, id],
    }));
  };
  const toggleZoneId = (id: string) => {
    setForm((f) => ({
      ...f,
      assignedZoneIds: f.assignedZoneIds.includes(id)
        ? f.assignedZoneIds.filter((x) => x !== id)
        : [...f.assignedZoneIds, id],
    }));
  };
  const toggleBranchId = (id: string) => {
    setForm((f) => ({
      ...f,
      assignedBranchIds: f.assignedBranchIds.includes(id)
        ? f.assignedBranchIds.filter((x) => x !== id)
        : [...f.assignedBranchIds, id],
    }));
  };

  // --- Branch dialog ---
  const openAddBranch = () => {
    setBranchEditId(null);
    setBranchForm(emptyBranchForm());
    setBranchDialog(true);
  };

  const openEditBranch = (b: Branch) => {
    setBranchEditId(b.id);
    setBranchForm({
      name: b.name,
      companyId: b.companyId || "",
      zoneId: b.zoneId || "",
      address: b.address || "",
      branchManagerId: b.branchManagerId || "",
      contactNumber: b.contactNumber || "",
    });
    setBranchDialog(true);
  };

  const saveBranch = () => {
    if (!branchForm.name) return;
    const companyId = isSuperAdmin
      ? branchForm.companyId
      : currentUser?.companyId || "";
    if (branchEditId) {
      storage.updateBranch(branchEditId, {
        name: branchForm.name,
        companyId,
        zoneId: branchForm.zoneId,
        address: branchForm.address || undefined,
        branchManagerId: branchForm.branchManagerId || undefined,
        contactNumber: branchForm.contactNumber || undefined,
      });
    } else {
      storage.addBranch({
        name: branchForm.name,
        companyId,
        zoneId: branchForm.zoneId,
        address: branchForm.address || undefined,
        branchManagerId: branchForm.branchManagerId || undefined,
        contactNumber: branchForm.contactNumber || undefined,
      });
    }
    setBranches(storage.getBranchesByCompany(myCompanyId));
    setBranchDialog(false);
  };

  const doDeleteBranch = (id: string) => {
    storage.deleteBranch(id);
    setBranches(storage.getBranchesByCompany(myCompanyId));
    setConfirmDeleteBranch(null);
  };

  const roleColor: Record<string, string> = {
    SuperAdmin: "bg-purple-100 text-purple-800",
    CompanyAdmin: "bg-blue-100 text-blue-800",
    Manager: "bg-indigo-100 text-indigo-800",
    Supervisor: "bg-cyan-100 text-cyan-800",
    Farmer: "bg-green-100 text-green-800",
    Dealer: "bg-amber-100 text-amber-800",
    Staff: "bg-gray-100 text-gray-800",
  };

  const visibleBranches = isSuperAdmin
    ? branches
    : branches.filter((b) => b.companyId === currentUser?.companyId);

  const branchFilteredZones = allZones.filter(
    (z) => !branchForm.companyId || z.companyId === branchForm.companyId,
  );

  return (
    <div className="space-y-6" data-ocid="users.page">
      <div>
        <h2 className="text-2xl font-bold">User Management</h2>
        <p className="text-muted-foreground text-sm">
          Manage users, roles, branch assignments, and farm access
        </p>
      </div>

      <Tabs defaultValue="users">
        <TabsList data-ocid="users.tabs.tab">
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="branches" data-ocid="users.branch_management.tab">
            <GitBranch size={14} className="mr-1" /> Branch Management
          </TabsTrigger>
        </TabsList>

        {/* ===== USERS TAB ===== */}
        <TabsContent value="users" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={openAdd} data-ocid="users.add_user.button">
              <Plus size={16} className="mr-1" /> Add User
            </Button>
          </div>

          {visibleUsers.length === 0 ? (
            <Card data-ocid="users.empty_state">
              <CardContent className="p-8 text-center text-muted-foreground">
                No users found.
              </CardContent>
            </Card>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm" data-ocid="users.table">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-2">#</th>
                    <th className="text-left p-2">Serial No.</th>
                    <th className="text-left p-2">Name</th>
                    <th className="text-left p-2">Emp ID</th>
                    <th className="text-left p-2">Username</th>
                    <th className="text-left p-2">Role</th>
                    <th className="text-left p-2">Mobile</th>
                    <th className="text-left p-2">Company</th>
                    <th className="text-left p-2">Assigned Farms</th>
                    <th className="text-left p-2">Status</th>
                    <th className="p-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleUsers.map((u, i) => (
                    <tr
                      key={u.id}
                      className="border-b hover:bg-muted/30"
                      data-ocid={`users.row.${i + 1}`}
                    >
                      <td className="p-2 text-muted-foreground">{i + 1}</td>
                      <td className="p-2">
                        <code className="text-xs font-mono bg-muted px-1 rounded">
                          {u.serialNumber || "—"}
                        </code>
                      </td>
                      <td className="p-2 font-medium">{u.name}</td>
                      <td className="p-2 font-mono text-xs text-muted-foreground">
                        {u.employeeId || "-"}
                      </td>
                      <td className="p-2 font-mono text-xs">{u.username}</td>
                      <td className="p-2">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            roleColor[u.role] || "bg-gray-100"
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="p-2 text-xs text-muted-foreground">
                        {u.mobileNumber || "-"}
                      </td>
                      <td className="p-2 text-sm text-muted-foreground">
                        {companies.find((c) => c.id === u.companyId)?.name ||
                          "-"}
                      </td>
                      <td className="p-2 text-xs text-muted-foreground">
                        {(u.assignedFarmIds || []).length > 0
                          ? (u.assignedFarmIds || [])
                              .map(
                                (fid) =>
                                  allFarms.find((f) => f.id === fid)?.name,
                              )
                              .filter(Boolean)
                              .join(", ")
                          : "-"}
                      </td>
                      <td className="p-2">
                        <Badge
                          variant={u.active !== false ? "default" : "secondary"}
                        >
                          {u.active !== false ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="p-2 text-right space-x-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openEdit(u)}
                          data-ocid={`users.edit_button.${i + 1}`}
                        >
                          <Pencil size={14} />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => toggleActive(u)}
                          title={u.active !== false ? "Deactivate" : "Activate"}
                          data-ocid={`users.toggle.${i + 1}`}
                        >
                          {u.active !== false ? (
                            <UserX size={14} className="text-orange-500" />
                          ) : (
                            <UserCheck size={14} className="text-green-500" />
                          )}
                        </Button>
                        {u.id !== currentUser?.id && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-600"
                            onClick={() => setConfirmDelete(u.id)}
                            data-ocid={`users.delete_button.${i + 1}`}
                          >
                            <Trash2 size={14} />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        {/* ===== BRANCH MANAGEMENT TAB ===== */}
        <TabsContent value="branches" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={openAddBranch} data-ocid="users.add_branch.button">
              <Plus size={16} className="mr-1" /> Add Branch
            </Button>
          </div>

          {visibleBranches.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                No branches found. Create your first branch.
              </CardContent>
            </Card>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm" data-ocid="users.branch.table">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-2">#</th>
                    <th className="text-left p-2">Code</th>
                    <th className="text-left p-2">Branch Name</th>
                    <th className="text-left p-2">Address</th>
                    <th className="text-left p-2">Manager</th>
                    <th className="text-left p-2">Contact</th>
                    <th className="text-left p-2">Company</th>
                    <th className="p-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleBranches.map((b, i) => (
                    <tr key={b.id} className="border-b hover:bg-muted/30">
                      <td className="p-2 text-muted-foreground">{i + 1}</td>
                      <td className="p-2 font-mono text-xs">
                        <Badge variant="outline">{b.branchCode || "-"}</Badge>
                      </td>
                      <td className="p-2 font-medium">{b.name}</td>
                      <td className="p-2 text-xs text-muted-foreground">
                        {b.address || "-"}
                      </td>
                      <td className="p-2 text-xs text-muted-foreground">
                        {users.find((u) => u.id === b.branchManagerId)?.name ||
                          "-"}
                      </td>
                      <td className="p-2 text-xs text-muted-foreground">
                        {b.contactNumber || "-"}
                      </td>
                      <td className="p-2 text-xs text-muted-foreground">
                        {companies.find((c) => c.id === b.companyId)?.name ||
                          "-"}
                      </td>
                      <td className="p-2 text-right space-x-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openEditBranch(b)}
                        >
                          <Pencil size={14} />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-600"
                          onClick={() => setConfirmDeleteBranch(b.id)}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ===== ADD/EDIT USER DIALOG ===== */}
      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent
          className="max-w-lg max-h-[90vh] overflow-y-auto"
          data-ocid="users.user.dialog"
        >
          <DialogHeader>
            <DialogTitle>{editId ? "Edit User" : "Add User"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Full Name *</Label>
              <Input
                data-ocid="users.name.input"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="Full name"
              />
            </div>
            <div>
              <Label>Username *</Label>
              <Input
                data-ocid="users.username.input"
                value={form.username}
                onChange={(e) =>
                  setForm((f) => ({ ...f, username: e.target.value }))
                }
                placeholder="Enter username"
              />
            </div>
            <div>
              <Label>
                {editId ? "New Password (leave blank to keep)" : "Password *"}
              </Label>
              <Input
                data-ocid="users.password.input"
                type="password"
                value={form.password}
                onChange={(e) =>
                  setForm((f) => ({ ...f, password: e.target.value }))
                }
                placeholder={
                  editId ? "Leave blank to keep current" : "Set password"
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Mobile Number</Label>
                <Input
                  data-ocid="users.mobile.input"
                  value={form.mobileNumber}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, mobileNumber: e.target.value }))
                  }
                  placeholder="+91 XXXXX XXXXX"
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  data-ocid="users.email.input"
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, email: e.target.value }))
                  }
                  placeholder="email@example.com"
                />
              </div>
            </div>
            <div>
              <Label>Role *</Label>
              <select
                data-ocid="users.role.select"
                value={form.role}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    role: e.target.value as User["role"],
                    assignedFarmIds: [],
                    assignedZoneIds: [],
                    assignedBranchIds: [],
                    assignedShedId: "",
                    assignedArea: "",
                  }))
                }
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                {availableRoles.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            {isSuperAdmin && (
              <div>
                <Label>Company</Label>
                <select
                  data-ocid="users.company.select"
                  value={form.companyId}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, companyId: e.target.value }))
                  }
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">Select Company...</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {form.role === "Supervisor" && (
              <div>
                <Label>Assigned Area / Line</Label>
                <Input
                  data-ocid="users.area.input"
                  value={form.assignedArea}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, assignedArea: e.target.value }))
                  }
                  placeholder="e.g. Line A, Zone North, Shed 3-5"
                />
              </div>
            )}

            {form.role === "Manager" && filteredZones.length > 0 && (
              <div>
                <Label>Assigned Zones</Label>
                <div className="space-y-2 max-h-32 overflow-y-auto border rounded p-2">
                  {filteredZones.map((z) => (
                    <div key={z.id} className="flex items-center gap-2">
                      <Checkbox
                        data-ocid="users.zone.checkbox"
                        checked={form.assignedZoneIds.includes(z.id)}
                        onCheckedChange={() => toggleZoneId(z.id)}
                      />
                      <span className="text-sm">{z.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(form.role === "Manager" || form.role === "Supervisor") &&
              filteredBranches.length > 0 && (
                <div>
                  <Label>Assigned Branches</Label>
                  <div className="space-y-2 max-h-32 overflow-y-auto border rounded p-2">
                    {filteredBranches.map((b) => (
                      <div key={b.id} className="flex items-center gap-2">
                        <Checkbox
                          data-ocid="users.branch.checkbox"
                          checked={form.assignedBranchIds.includes(b.id)}
                          onCheckedChange={() => toggleBranchId(b.id)}
                        />
                        <span className="text-sm">
                          {b.branchCode && (
                            <span className="font-mono text-xs mr-1">
                              {b.branchCode}
                            </span>
                          )}
                          {b.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {["Supervisor", "Farmer", "Dealer", "Staff"].includes(form.role) &&
              filteredFarms.length > 0 && (
                <div>
                  <Label>Assigned Farms</Label>
                  <div className="space-y-2 max-h-40 overflow-y-auto border rounded p-2">
                    {filteredFarms.map((f) => (
                      <div key={f.id} className="flex items-center gap-2">
                        <Checkbox
                          data-ocid="users.farm.checkbox"
                          checked={form.assignedFarmIds.includes(f.id)}
                          onCheckedChange={() => toggleFarmId(f.id)}
                        />
                        <span className="text-sm">{f.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {form.role === "Staff" && filteredSheds.length > 0 && (
              <div>
                <Label>Assigned Shed</Label>
                <select
                  data-ocid="users.shed.select"
                  value={form.assignedShedId}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, assignedShedId: e.target.value }))
                  }
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">Select Shed...</option>
                  {filteredSheds.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} (
                      {allFarms.find((f) => f.id === s.farmId)?.name || "?"})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex items-center gap-3">
              <Switch
                data-ocid="users.active.switch"
                checked={form.active}
                onCheckedChange={(v) => setForm((f) => ({ ...f, active: v }))}
              />
              <Label>Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialog(false)}
              data-ocid="users.user.cancel_button"
            >
              Cancel
            </Button>
            <Button onClick={save} data-ocid="users.user.submit_button">
              {editId ? "Save Changes" : "Create User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== ADD/EDIT BRANCH DIALOG ===== */}
      <Dialog open={branchDialog} onOpenChange={setBranchDialog}>
        <DialogContent className="max-w-md" data-ocid="users.branch.dialog">
          <DialogHeader>
            <DialogTitle>
              {branchEditId ? "Edit Branch" : "Add Branch"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Branch Name *</Label>
              <Input
                value={branchForm.name}
                onChange={(e) =>
                  setBranchForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="Branch name"
              />
            </div>
            {!branchEditId && (
              <p className="text-xs text-muted-foreground">
                Branch Code will be auto-generated (e.g. BR-001)
              </p>
            )}
            {isSuperAdmin && (
              <div>
                <Label>Company</Label>
                <select
                  value={branchForm.companyId}
                  onChange={(e) =>
                    setBranchForm((f) => ({
                      ...f,
                      companyId: e.target.value,
                      zoneId: "",
                    }))
                  }
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">Select Company...</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <Label>Zone</Label>
              <select
                value={branchForm.zoneId}
                onChange={(e) =>
                  setBranchForm((f) => ({ ...f, zoneId: e.target.value }))
                }
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">Select Zone...</option>
                {(isSuperAdmin
                  ? branchFilteredZones
                  : allZones.filter(
                      (z) => z.companyId === currentUser?.companyId,
                    )
                ).map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Address</Label>
              <Input
                value={branchForm.address}
                onChange={(e) =>
                  setBranchForm((f) => ({ ...f, address: e.target.value }))
                }
                placeholder="Branch address"
              />
            </div>
            <div>
              <Label>Branch Manager</Label>
              <select
                value={branchForm.branchManagerId}
                onChange={(e) =>
                  setBranchForm((f) => ({
                    ...f,
                    branchManagerId: e.target.value,
                  }))
                }
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">Select Manager...</option>
                {managerUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Contact Number</Label>
              <Input
                value={branchForm.contactNumber}
                onChange={(e) =>
                  setBranchForm((f) => ({
                    ...f,
                    contactNumber: e.target.value,
                  }))
                }
                placeholder="Contact number"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBranchDialog(false)}
              data-ocid="users.branch.cancel_button"
            >
              Cancel
            </Button>
            <Button onClick={saveBranch} data-ocid="users.branch.submit_button">
              {branchEditId ? "Save Changes" : "Create Branch"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirm */}
      <Dialog
        open={!!confirmDelete}
        onOpenChange={() => setConfirmDelete(null)}
      >
        <DialogContent data-ocid="users.delete.dialog">
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this user? This cannot be undone.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDelete(null)}
              data-ocid="users.delete.cancel_button"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => confirmDelete && doDelete(confirmDelete)}
              data-ocid="users.delete.confirm_button"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Branch Confirm */}
      <Dialog
        open={!!confirmDeleteBranch}
        onOpenChange={() => setConfirmDeleteBranch(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Branch</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this branch?
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDeleteBranch(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                confirmDeleteBranch && doDeleteBranch(confirmDeleteBranch)
              }
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Identity Result Modal */}
      <Dialog
        open={!!identityResult}
        onOpenChange={() => setIdentityResult(null)}
      >
        <DialogContent className="max-w-md" data-ocid="users.identity.dialog">
          <DialogHeader>
            <DialogTitle className="text-green-700">
              ✓ User Created Successfully
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Share these credentials with the new user:
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
              data-ocid="users.identity.close_button"
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
