import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { useCompanyScope } from "@/lib/roleFilter";
import { type Branch, storage } from "@/lib/storage";
import { GitBranch, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

export default function Branches() {
  const { currentUser: _cu } = useAuth();
  const {
    branches: scopedBranches,
    zones: scopedZones,
    companyId: myCompanyId,
    isSuperAdmin,
  } = useCompanyScope();
  const [branches, setBranches] = useState<Branch[]>(scopedBranches);
  const companies = storage.getCompanies();
  const allZones = scopedZones;
  const [form, setForm] = useState({ companyId: "", zoneId: "", name: "" });

  const filteredZones = form.companyId
    ? allZones.filter((z) => z.companyId === form.companyId)
    : allZones;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.zoneId || !form.companyId) return;
    storage.addBranch({
      companyId: form.companyId,
      zoneId: form.zoneId,
      name: form.name.trim(),
    });
    setBranches(
      isSuperAdmin
        ? storage.getBranches()
        : storage.getBranchesByCompany(myCompanyId),
    );
    setForm({ ...form, name: "" });
  };

  const handleDelete = (id: string) => {
    storage.deleteBranch(id);
    setBranches(
      isSuperAdmin
        ? storage.getBranches()
        : storage.getBranchesByCompany(myCompanyId),
    );
  };

  return (
    <div className="space-y-6" data-ocid="branches.page">
      <h2 className="text-2xl font-bold">Branches</h2>

      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4">Add Branch</h3>
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 sm:grid-cols-4 gap-4"
          >
            <div>
              <Label>Company *</Label>
              <select
                data-ocid="branches.company.select"
                required
                value={form.companyId}
                onChange={(e) =>
                  setForm({ ...form, companyId: e.target.value, zoneId: "" })
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
            <div>
              <Label>Zone *</Label>
              <select
                data-ocid="branches.zone.select"
                required
                value={form.zoneId}
                onChange={(e) => setForm({ ...form, zoneId: e.target.value })}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                disabled={!form.companyId}
              >
                <option value="">Select Zone...</option>
                {filteredZones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Branch Name *</Label>
              <Input
                data-ocid="branches.name.input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Lahore Branch"
                required
              />
            </div>
            <div className="flex items-end">
              <Button type="submit" data-ocid="branches.submit.button">
                <Plus size={16} className="mr-1" />
                Add Branch
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {branches.length === 0 ? (
        <Card data-ocid="branches.empty_state">
          <CardContent className="p-8 text-center text-muted-foreground">
            <GitBranch size={40} className="mx-auto mb-2" />
            <p>No branches added yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm" data-ocid="branches.table">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-2">#</th>
                <th className="text-left p-2">Branch Name</th>
                <th className="text-left p-2">Zone</th>
                <th className="text-left p-2">Company</th>
                <th className="p-2" />
              </tr>
            </thead>
            <tbody>
              {branches.map((b, i) => (
                <tr
                  key={b.id}
                  className="border-b hover:bg-muted/30"
                  data-ocid={`branches.row.${i + 1}`}
                >
                  <td className="p-2 text-muted-foreground">{i + 1}</td>
                  <td className="p-2 font-medium">{b.name}</td>
                  <td className="p-2 text-muted-foreground">
                    {allZones.find((z) => z.id === b.zoneId)?.name || "-"}
                  </td>
                  <td className="p-2 text-muted-foreground">
                    {companies.find((c) => c.id === b.companyId)?.name || "-"}
                  </td>
                  <td className="p-2 text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleDelete(b.id)}
                      data-ocid={`branches.delete_button.${i + 1}`}
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
    </div>
  );
}
