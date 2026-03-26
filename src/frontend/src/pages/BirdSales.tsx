import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
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
import { logDelete } from "@/lib/auditHelper";
import { usePermissions } from "@/lib/permissions";
import { printRecord } from "@/lib/printRecord";
import { useCompanyScope } from "@/lib/roleFilter";
import { type BirdSale, storage } from "@/lib/storage";
import { Pencil, Plus, Printer, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

const today = () => new Date().toISOString().slice(0, 10);

export default function BirdSales() {
  const { currentUser } = useAuth();
  const { canUpdate, canDelete, canPrint } = usePermissions();
  const { farms } = useCompanyScope();
  const farmIds = new Set(farms.map((f) => f.id));
  const allBatches = storage.getBatches().filter((b) => farmIds.has(b.farmId));

  const [sales, setSales] = useState<BirdSale[]>(
    storage.getBirdSales().filter((s) => farmIds.has(s.farmId)),
  );
  const [deleteTarget, setDeleteTarget] = useState<BirdSale | null>(null);
  const [editSale, setEditSale] = useState<BirdSale | null>(null);
  const [form, setForm] = useState({
    farmId: "",
    batchId: "",
    birdsQty: "",
    avgWeightKg: "",
    ratePerKg: "",
    traderName: "",
    vehicleNumber: "",
    dispatchDate: today(),
  });

  const filteredBatches = useMemo(
    () =>
      form.farmId ? allBatches.filter((b) => b.farmId === form.farmId) : [],
    [form.farmId, allBatches],
  );

  const totalWeight =
    (Number(form.birdsQty) || 0) * (Number(form.avgWeightKg) || 0);
  const totalAmount = totalWeight * (Number(form.ratePerKg) || 0);

  const refreshSales = () =>
    setSales(storage.getBirdSales().filter((s) => farmIds.has(s.farmId)));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.farmId || !form.birdsQty) return;
    storage.addBirdSale({
      farmId: form.farmId,
      batchId: form.batchId,
      birdsQty: Number(form.birdsQty),
      avgWeightKg: Number(form.avgWeightKg),
      ratePerKg: Number(form.ratePerKg),
      totalWeightKg: totalWeight,
      totalAmount,
      traderName: form.traderName,
      vehicleNumber: form.vehicleNumber,
      dispatchDate: form.dispatchDate,
    });
    refreshSales();
    setForm({
      farmId: "",
      batchId: "",
      birdsQty: "",
      avgWeightKg: "",
      ratePerKg: "",
      traderName: "",
      vehicleNumber: "",
      dispatchDate: today(),
    });
  };

  const confirmDeleteSale = () => {
    if (!deleteTarget) return;
    logDelete({
      module: "Bird Sales",
      recordId: deleteTarget.id,
      recordSummary: `${deleteTarget.birdsQty} birds | ${deleteTarget.dispatchDate}`,
      user: currentUser,
    });
    storage.deleteBirdSale(deleteTarget.id);
    refreshSales();
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-6" data-ocid="bird_sales.page">
      <h2 className="text-2xl font-bold">Bird Sales</h2>
      <Card>
        <CardContent className="p-6">
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            <div>
              <Label>Farm *</Label>
              <select
                data-ocid="bird_sales.farm.select"
                required
                value={form.farmId}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    farmId: e.target.value,
                    batchId: "",
                  }))
                }
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">Select Farm...</option>
                {farms.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Batch</Label>
              <select
                data-ocid="bird_sales.batch.select"
                value={form.batchId}
                onChange={(e) =>
                  setForm((f) => ({ ...f, batchId: e.target.value }))
                }
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                disabled={!form.farmId}
              >
                <option value="">Select Batch...</option>
                {filteredBatches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.batchNumber}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Birds Qty *</Label>
              <Input
                data-ocid="bird_sales.qty.input"
                type="number"
                required
                value={form.birdsQty}
                onChange={(e) =>
                  setForm((f) => ({ ...f, birdsQty: e.target.value }))
                }
                placeholder="Number of birds"
              />
            </div>
            <div>
              <Label>Avg Weight (kg)</Label>
              <Input
                data-ocid="bird_sales.weight.input"
                type="number"
                step="0.01"
                value={form.avgWeightKg}
                onChange={(e) =>
                  setForm((f) => ({ ...f, avgWeightKg: e.target.value }))
                }
                placeholder="kg per bird"
              />
            </div>
            <div>
              <Label>Rate per KG (\u20B9)</Label>
              <Input
                data-ocid="bird_sales.rate.input"
                type="number"
                step="0.01"
                value={form.ratePerKg}
                onChange={(e) =>
                  setForm((f) => ({ ...f, ratePerKg: e.target.value }))
                }
                placeholder="\u20B9/kg"
              />
            </div>
            <div>
              <Label>Trader Name</Label>
              <Input
                data-ocid="bird_sales.trader.input"
                value={form.traderName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, traderName: e.target.value }))
                }
                placeholder="Trader / buyer name"
              />
            </div>
            <div>
              <Label>Vehicle Number</Label>
              <Input
                data-ocid="bird_sales.vehicle.input"
                value={form.vehicleNumber}
                onChange={(e) =>
                  setForm((f) => ({ ...f, vehicleNumber: e.target.value }))
                }
                placeholder="Vehicle reg. no."
              />
            </div>
            <div>
              <Label>Dispatch Date</Label>
              <Input
                data-ocid="bird_sales.date.input"
                type="date"
                value={form.dispatchDate}
                onChange={(e) =>
                  setForm((f) => ({ ...f, dispatchDate: e.target.value }))
                }
              />
            </div>
            {totalAmount > 0 && (
              <div className="sm:col-span-2 flex items-center justify-between p-3 bg-muted rounded-lg">
                <span className="text-sm text-muted-foreground">
                  Total: {totalWeight.toFixed(2)} kg
                </span>
                <span className="font-bold text-xl">
                  \u20B9 {totalAmount.toLocaleString()}
                </span>
              </div>
            )}
            <div className="sm:col-span-2 flex justify-end">
              <Button type="submit" data-ocid="bird_sales.submit_button">
                <Plus size={16} className="mr-1" />
                Save Sale
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {sales.length === 0 ? (
        <Card data-ocid="bird_sales.empty_state">
          <CardContent className="p-6 text-center text-muted-foreground">
            No sales recorded yet.
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm" data-ocid="bird_sales.table">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-2">Date</th>
                <th className="text-left p-2">Farm</th>
                <th className="text-right p-2">Birds</th>
                <th className="text-right p-2">Avg Wt (kg)</th>
                <th className="text-right p-2">Rate/kg</th>
                <th className="text-right p-2">Total Wt</th>
                <th className="text-right p-2">Amount</th>
                <th className="text-left p-2">Trader</th>
                <th className="text-left p-2">Vehicle</th>
                <th className="p-2" />
              </tr>
            </thead>
            <tbody>
              {[...sales].reverse().map((s, i) => (
                <tr
                  key={s.id}
                  className="border-b hover:bg-muted/30"
                  data-ocid={`bird_sales.row.${i + 1}`}
                >
                  <td className="p-2">{s.dispatchDate}</td>
                  <td className="p-2">
                    {farms.find((f) => f.id === s.farmId)?.name || "-"}
                  </td>
                  <td className="p-2 text-right">
                    {s.birdsQty.toLocaleString()}
                  </td>
                  <td className="p-2 text-right">{s.avgWeightKg}</td>
                  <td className="p-2 text-right">\u20B9{s.ratePerKg}</td>
                  <td className="p-2 text-right">
                    {s.totalWeightKg.toFixed(2)} kg
                  </td>
                  <td className="p-2 text-right font-medium">
                    \u20B9{s.totalAmount.toLocaleString()}
                  </td>
                  <td className="p-2">{s.traderName}</td>
                  <td className="p-2 text-muted-foreground">
                    {s.vehicleNumber}
                  </td>
                  <td className="p-2">
                    <div className="flex gap-1 justify-end">
                      {canUpdate && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setEditSale({ ...s })}
                          data-ocid={`bird_sales.edit_button.${i + 1}`}
                          title="Edit"
                        >
                          <Pencil size={13} className="text-blue-600" />
                        </Button>
                      )}
                      {canDelete && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setDeleteTarget(s)}
                          data-ocid={`bird_sales.delete_button.${i + 1}`}
                          title="Delete"
                        >
                          <Trash2 size={13} className="text-red-600" />
                        </Button>
                      )}
                      {canPrint && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            const farm = farms.find((f) => f.id === s.farmId);
                            printRecord({
                              farmName: farm?.name,
                              date: s.dispatchDate,
                              module: "Bird Sales",
                              generatedBy: currentUser?.name,
                              entryDetails: {
                                "Dispatch Date": s.dispatchDate,
                                "Birds Qty": s.birdsQty,
                                "Avg Weight (kg)": s.avgWeightKg,
                                "Rate/kg": `\u20B9${s.ratePerKg}`,
                                "Total Weight": `${s.totalWeightKg.toFixed(2)} kg`,
                                "Total Amount": `\u20B9${s.totalAmount}`,
                                Trader: s.traderName,
                                Vehicle: s.vehicleNumber,
                              },
                            });
                          }}
                          data-ocid={`bird_sales.print_button.${i + 1}`}
                          title="Print"
                        >
                          <Printer size={13} className="text-green-600" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(v) => {
          if (!v) setDeleteTarget(null);
        }}
        onConfirm={confirmDeleteSale}
        recordSummary={
          deleteTarget
            ? `${deleteTarget.birdsQty} birds | ${deleteTarget.dispatchDate}`
            : undefined
        }
      />

      {editSale && (
        <Dialog
          open={!!editSale}
          onOpenChange={(v) => {
            if (!v) setEditSale(null);
          }}
        >
          <DialogContent data-ocid="bird_sales.edit.dialog">
            <DialogHeader>
              <DialogTitle>Edit Bird Sale</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Birds Qty</Label>
                  <Input
                    type="number"
                    value={editSale.birdsQty}
                    onChange={(e) =>
                      setEditSale((p) =>
                        p ? { ...p, birdsQty: Number(e.target.value) } : p,
                      )
                    }
                  />
                </div>
                <div>
                  <Label>Avg Weight (kg)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editSale.avgWeightKg}
                    onChange={(e) =>
                      setEditSale((p) =>
                        p ? { ...p, avgWeightKg: Number(e.target.value) } : p,
                      )
                    }
                  />
                </div>
                <div>
                  <Label>Rate/kg (\u20B9)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editSale.ratePerKg}
                    onChange={(e) =>
                      setEditSale((p) =>
                        p ? { ...p, ratePerKg: Number(e.target.value) } : p,
                      )
                    }
                  />
                </div>
                <div>
                  <Label>Dispatch Date</Label>
                  <Input
                    type="date"
                    value={editSale.dispatchDate}
                    onChange={(e) =>
                      setEditSale((p) =>
                        p ? { ...p, dispatchDate: e.target.value } : p,
                      )
                    }
                  />
                </div>
                <div>
                  <Label>Trader Name</Label>
                  <Input
                    value={editSale.traderName}
                    onChange={(e) =>
                      setEditSale((p) =>
                        p ? { ...p, traderName: e.target.value } : p,
                      )
                    }
                  />
                </div>
                <div>
                  <Label>Vehicle Number</Label>
                  <Input
                    value={editSale.vehicleNumber}
                    onChange={(e) =>
                      setEditSale((p) =>
                        p ? { ...p, vehicleNumber: e.target.value } : p,
                      )
                    }
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setEditSale(null)}
                data-ocid="bird_sales.edit.cancel_button"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (!editSale) return;
                  const tw = editSale.birdsQty * editSale.avgWeightKg;
                  const ta = tw * editSale.ratePerKg;
                  storage.updateBirdSale(editSale.id, {
                    ...editSale,
                    totalWeightKg: tw,
                    totalAmount: ta,
                  });
                  refreshSales();
                  setEditSale(null);
                }}
                data-ocid="bird_sales.edit.save_button"
              >
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
