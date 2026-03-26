import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { type Company, storage } from "@/lib/storage";
import { Building2, Pencil, Plus, Trash2 } from "lucide-react";
import { useRef, useState } from "react";

type FormState = {
  name: string;
  address: string;
  contactNumber: string;
  email: string;
  subscriptionPlan: "" | "Basic" | "Standard" | "Premium";
  farmCapacityLimit: string;
  logoUrl: string;
};

const emptyForm = (): FormState => ({
  name: "",
  address: "",
  contactNumber: "",
  email: "",
  subscriptionPlan: "",
  farmCapacityLimit: "",
  logoUrl: "",
});

export default function Companies() {
  const { currentUser } = useAuth();
  const [companies, setCompanies] = useState<Company[]>(storage.getCompanies());
  const [dialog, setDialog] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Only SuperAdmin can access this page
  if (currentUser?.role !== "SuperAdmin") {
    return (
      <div
        className="flex items-center justify-center h-64"
        data-ocid="companies.access_denied.panel"
      >
        <div className="text-center">
          <p className="text-lg font-semibold text-muted-foreground">
            Access Denied
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Only Super Admin can view all companies.
          </p>
        </div>
      </div>
    );
  }

  const openAdd = () => {
    setEditId(null);
    setForm(emptyForm());
    setDialog(true);
  };

  const openEdit = (c: Company) => {
    setEditId(c.id);
    setForm({
      name: c.name,
      address: c.address || "",
      contactNumber: c.contactNumber || "",
      email: c.email || "",
      subscriptionPlan: c.subscriptionPlan || "",
      farmCapacityLimit: c.farmCapacityLimit ? String(c.farmCapacityLimit) : "",
      logoUrl: c.logoUrl || "",
    });
    setDialog(true);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setForm((f) => ({ ...f, logoUrl: ev.target?.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const save = () => {
    if (!form.name.trim()) return;
    const data = {
      name: form.name.trim(),
      address: form.address.trim(),
      contactNumber: form.contactNumber || undefined,
      email: form.email || undefined,
      subscriptionPlan: (form.subscriptionPlan ||
        undefined) as Company["subscriptionPlan"],
      farmCapacityLimit: form.farmCapacityLimit
        ? Number(form.farmCapacityLimit)
        : undefined,
      logoUrl: form.logoUrl || undefined,
    };
    if (editId) {
      storage.updateCompany(editId, data);
    } else {
      storage.addCompany(data);
    }
    setCompanies(storage.getCompanies());
    setDialog(false);
  };

  const handleDelete = (id: string) => {
    storage.deleteCompany(id);
    setCompanies(storage.getCompanies());
    setConfirmDelete(null);
  };

  const planColor: Record<string, string> = {
    Basic: "bg-gray-100 text-gray-700",
    Standard: "bg-blue-100 text-blue-700",
    Premium: "bg-purple-100 text-purple-700",
  };

  return (
    <div className="space-y-6" data-ocid="companies.page">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Companies</h2>
        <Button onClick={openAdd} data-ocid="companies.add.button">
          <Plus size={16} className="mr-1" /> Add Company
        </Button>
      </div>

      {companies.length === 0 ? (
        <Card data-ocid="companies.empty_state">
          <CardContent className="p-8 text-center text-muted-foreground">
            <Building2 size={40} className="mx-auto mb-2" />
            <p>No companies added yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm" data-ocid="companies.table">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-2">#</th>
                <th className="text-left p-2">Logo</th>
                <th className="text-left p-2">Company Name</th>
                <th className="text-left p-2">Address</th>
                <th className="text-left p-2">Contact</th>
                <th className="text-left p-2">Plan</th>
                <th className="text-left p-2">Capacity</th>
                <th className="p-2" />
              </tr>
            </thead>
            <tbody>
              {companies.map((c, i) => (
                <tr
                  key={c.id}
                  className="border-b hover:bg-muted/30"
                  data-ocid={`companies.row.${i + 1}`}
                >
                  <td className="p-2 text-muted-foreground">{i + 1}</td>
                  <td className="p-2">
                    {c.logoUrl ? (
                      <img
                        src={c.logoUrl}
                        alt="logo"
                        className="w-8 h-8 object-contain rounded border"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded border bg-muted/40 flex items-center justify-center">
                        <Building2
                          size={14}
                          className="text-muted-foreground"
                        />
                      </div>
                    )}
                  </td>
                  <td className="p-2 font-medium">{c.name}</td>
                  <td className="p-2 text-muted-foreground">
                    {c.address || "-"}
                  </td>
                  <td className="p-2 text-xs text-muted-foreground">
                    {c.contactNumber || "-"}
                  </td>
                  <td className="p-2">
                    {c.subscriptionPlan ? (
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${planColor[c.subscriptionPlan] || ""}`}
                      >
                        {c.subscriptionPlan}
                      </span>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="p-2 text-xs text-muted-foreground">
                    {c.farmCapacityLimit
                      ? c.farmCapacityLimit.toLocaleString()
                      : "-"}
                  </td>
                  <td className="p-2 text-right space-x-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openEdit(c)}
                      data-ocid={`companies.edit_button.${i + 1}`}
                    >
                      <Pencil size={14} />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => setConfirmDelete(c.id)}
                      data-ocid={`companies.delete_button.${i + 1}`}
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

      {/* Add/Edit Dialog */}
      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? "Edit Company" : "Add Company"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {/* Logo Upload */}
            <div>
              <Label>Company Logo</Label>
              <div className="flex items-center gap-3 mt-1">
                {form.logoUrl ? (
                  <img
                    src={form.logoUrl}
                    alt="preview"
                    className="w-14 h-14 object-contain rounded-lg border bg-white p-1"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-lg border bg-muted/40 flex items-center justify-center">
                    <Building2 size={20} className="text-muted-foreground" />
                  </div>
                )}
                <div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => logoInputRef.current?.click()}
                    data-ocid="companies.logo.upload_button"
                  >
                    Upload Logo
                  </Button>
                  {form.logoUrl && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="ml-2 text-muted-foreground"
                      onClick={() => setForm((f) => ({ ...f, logoUrl: "" }))}
                    >
                      Remove
                    </Button>
                  )}
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoUpload}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    PNG, JPG, SVG up to 2MB
                  </p>
                </div>
              </div>
            </div>
            <div>
              <Label>Company Name *</Label>
              <Input
                data-ocid="companies.name.input"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="e.g. Al-Baraka Poultry"
              />
            </div>
            <div>
              <Label>Address</Label>
              <Input
                data-ocid="companies.address.input"
                value={form.address}
                onChange={(e) =>
                  setForm((f) => ({ ...f, address: e.target.value }))
                }
                placeholder="City / Address"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Contact Number</Label>
                <Input
                  data-ocid="companies.contact.input"
                  value={form.contactNumber}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, contactNumber: e.target.value }))
                  }
                  placeholder="+91 XXXXX XXXXX"
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  data-ocid="companies.email.input"
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, email: e.target.value }))
                  }
                  placeholder="company@email.com"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Subscription Plan</Label>
                <select
                  data-ocid="companies.subscription.select"
                  value={form.subscriptionPlan}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      subscriptionPlan: e.target
                        .value as FormState["subscriptionPlan"],
                    }))
                  }
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">Select Plan...</option>
                  <option value="Basic">Basic</option>
                  <option value="Standard">Standard</option>
                  <option value="Premium">Premium</option>
                </select>
              </div>
              <div>
                <Label>Farm Capacity Limit</Label>
                <Input
                  type="number"
                  value={form.farmCapacityLimit}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      farmCapacityLimit: e.target.value,
                    }))
                  }
                  placeholder="e.g. 100000"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(false)}>
              Cancel
            </Button>
            <Button onClick={save} data-ocid="companies.submit.button">
              {editId ? "Save Changes" : "Add Company"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog
        open={!!confirmDelete}
        onOpenChange={() => setConfirmDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Company</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure? This cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => confirmDelete && handleDelete(confirmDelete)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
