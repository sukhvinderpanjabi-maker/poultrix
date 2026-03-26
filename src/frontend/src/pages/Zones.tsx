import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { useCompanyScope } from "@/lib/roleFilter";
import { type Zone, storage } from "@/lib/storage";
import { Globe, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

export default function Zones() {
  const { currentUser: _currentUser } = useAuth();
  const {
    zones: scopedZones,
    companyId: myCompanyId,
    isSuperAdmin,
  } = useCompanyScope();
  const [zones, setZones] = useState<Zone[]>(scopedZones);
  const companies = storage.getCompanies();
  const [form, setForm] = useState({ companyId: myCompanyId || "", name: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const zoneCompanyId = isSuperAdmin
      ? form.companyId
      : myCompanyId || form.companyId;
    if (!form.name.trim() || !zoneCompanyId) return;
    storage.addZone({ companyId: zoneCompanyId, name: form.name.trim() });
    setZones(
      isSuperAdmin
        ? storage.getZones()
        : storage.getZonesByCompany(myCompanyId),
    );
    setForm({ ...form, name: "" });
  };

  const handleDelete = (id: string) => {
    storage.deleteZone(id);
    setZones(
      isSuperAdmin
        ? storage.getZones()
        : storage.getZonesByCompany(myCompanyId),
    );
  };

  return (
    <div className="space-y-6" data-ocid="zones.page">
      <h2 className="text-2xl font-bold">Zones</h2>

      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4">Add Zone</h3>
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4"
          >
            {isSuperAdmin && (
              <div>
                <Label>Company *</Label>
                <select
                  data-ocid="zones.company.select"
                  required
                  value={form.companyId}
                  onChange={(e) =>
                    setForm({ ...form, companyId: e.target.value })
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
              <Label>Zone Name *</Label>
              <Input
                data-ocid="zones.name.input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. North Zone"
                required
              />
            </div>
            <div className="flex items-end">
              <Button type="submit" data-ocid="zones.submit.button">
                <Plus size={16} className="mr-1" />
                Add Zone
              </Button>
            </div>
          </form>
          {companies.length === 0 && (
            <p className="text-sm text-amber-600 mt-2">
              Please add a company first before creating zones.
            </p>
          )}
        </CardContent>
      </Card>

      {zones.length === 0 ? (
        <Card data-ocid="zones.empty_state">
          <CardContent className="p-8 text-center text-muted-foreground">
            <Globe size={40} className="mx-auto mb-2" />
            <p>No zones added yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm" data-ocid="zones.table">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-2">#</th>
                <th className="text-left p-2">Zone Name</th>
                <th className="text-left p-2">Company</th>
                <th className="p-2" />
              </tr>
            </thead>
            <tbody>
              {zones.map((z, i) => (
                <tr
                  key={z.id}
                  className="border-b hover:bg-muted/30"
                  data-ocid={`zones.row.${i + 1}`}
                >
                  <td className="p-2 text-muted-foreground">{i + 1}</td>
                  <td className="p-2 font-medium">{z.name}</td>
                  <td className="p-2 text-muted-foreground">
                    {companies.find((c) => c.id === z.companyId)?.name || "-"}
                  </td>
                  <td className="p-2 text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleDelete(z.id)}
                      data-ocid={`zones.delete_button.${i + 1}`}
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
