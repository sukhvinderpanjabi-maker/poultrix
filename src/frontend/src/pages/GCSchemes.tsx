import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/context/AuthContext";
import { useCompanyScope } from "@/lib/roleFilter";
import { type GCScheme, storage } from "@/lib/storage";
import { Trash2, TrendingUp } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function GCSchemes() {
  const { currentUser } = useAuth();
  const {
    gcSchemes: scopedSchemes,
    companyId: myCompanyId,
    isSuperAdmin,
  } = useCompanyScope();
  const [schemes, setSchemes] = useState<GCScheme[]>(() => scopedSchemes);
  const [form, setForm] = useState({
    name: "",
    baseGCRate: "",
    standardFCR: "",
    standardMortalityPct: "",
    fcrBonusPerBird: "",
    mortalityPenaltyPerBird: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.baseGCRate) {
      toast.error("Scheme name and base GC rate are required.");
      return;
    }
    storage.addGCScheme({
      companyId: myCompanyId || currentUser?.companyId || "",
      name: form.name,
      baseGCRate: Number.parseFloat(form.baseGCRate) || 0,
      standardFCR: Number.parseFloat(form.standardFCR) || 0,
      standardMortalityPct: Number.parseFloat(form.standardMortalityPct) || 0,
      fcrBonusPerBird: Number.parseFloat(form.fcrBonusPerBird) || 0,
      mortalityPenaltyPerBird:
        Number.parseFloat(form.mortalityPenaltyPerBird) || 0,
    });
    setSchemes(
      isSuperAdmin
        ? storage.getGCSchemes()
        : storage.getGCSchemesByCompany(myCompanyId),
    );
    setForm({
      name: "",
      baseGCRate: "",
      standardFCR: "",
      standardMortalityPct: "",
      fcrBonusPerBird: "",
      mortalityPenaltyPerBird: "",
    });
    toast.success("GC Scheme created successfully.");
  };

  const handleDelete = (id: string) => {
    storage.deleteGCScheme(id);
    setSchemes(
      isSuperAdmin
        ? storage.getGCSchemes()
        : storage.getGCSchemesByCompany(myCompanyId),
    );
    toast.success("Scheme deleted.");
  };

  return (
    <div data-ocid="gc_schemes.page" className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <TrendingUp size={20} className="text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">GC Schemes</h1>
          <p className="text-sm text-muted-foreground">
            Define Growing Charge schemes with bonus and penalty rules
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Create New GC Scheme</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="gc-name">Scheme Name</Label>
                <Input
                  id="gc-name"
                  data-ocid="gc_schemes.name.input"
                  placeholder="e.g. Standard GC 2024"
                  value={form.name}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, name: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="gc-rate">Base GC Rate (₹/bird)</Label>
                <Input
                  id="gc-rate"
                  data-ocid="gc_schemes.base_rate.input"
                  type="number"
                  placeholder="e.g. 12"
                  value={form.baseGCRate}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, baseGCRate: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="gc-fcr">Standard FCR Limit</Label>
                <Input
                  id="gc-fcr"
                  data-ocid="gc_schemes.fcr.input"
                  type="number"
                  step="0.01"
                  placeholder="e.g. 1.8"
                  value={form.standardFCR}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, standardFCR: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="gc-mortality">Standard Mortality %</Label>
                <Input
                  id="gc-mortality"
                  data-ocid="gc_schemes.mortality.input"
                  type="number"
                  step="0.1"
                  placeholder="e.g. 5"
                  value={form.standardMortalityPct}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      standardMortalityPct: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="gc-bonus">FCR Bonus (₹/bird)</Label>
                <Input
                  id="gc-bonus"
                  data-ocid="gc_schemes.bonus.input"
                  type="number"
                  step="0.5"
                  placeholder="e.g. 2"
                  value={form.fcrBonusPerBird}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, fcrBonusPerBird: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="gc-penalty">Mortality Penalty (₹/bird)</Label>
                <Input
                  id="gc-penalty"
                  data-ocid="gc_schemes.penalty.input"
                  type="number"
                  step="0.5"
                  placeholder="e.g. 1.5"
                  value={form.mortalityPenaltyPerBird}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      mortalityPenaltyPerBird: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <Button type="submit" data-ocid="gc_schemes.submit_button">
              Create Scheme
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Existing GC Schemes</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {schemes.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-sm">
              No GC schemes yet. Create one above.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table data-ocid="gc_schemes.table">
                <TableHeader>
                  <TableRow>
                    <TableHead>Scheme Name</TableHead>
                    <TableHead>Base Rate (₹)</TableHead>
                    <TableHead>Std FCR</TableHead>
                    <TableHead>Std Mortality %</TableHead>
                    <TableHead>FCR Bonus (₹)</TableHead>
                    <TableHead>Mortality Penalty (₹)</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schemes.map((scheme, idx) => (
                    <TableRow key={scheme.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{scheme.name}</Badge>
                        </div>
                      </TableCell>
                      <TableCell>₹{scheme.baseGCRate.toFixed(2)}</TableCell>
                      <TableCell>{scheme.standardFCR}</TableCell>
                      <TableCell>{scheme.standardMortalityPct}%</TableCell>
                      <TableCell className="text-green-600">
                        ₹{scheme.fcrBonusPerBird.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-red-600">
                        ₹{scheme.mortalityPenaltyPerBird.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          data-ocid={`gc_schemes.delete_button.${idx + 1}`}
                          onClick={() => handleDelete(scheme.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
