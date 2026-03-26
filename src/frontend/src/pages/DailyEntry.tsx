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
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import { logDelete } from "@/lib/auditHelper";
import { usePermissions } from "@/lib/permissions";
import { printRecord } from "@/lib/printRecord";
import { useCompanyScope } from "@/lib/roleFilter";
import { type DailyEntry as DE, storage } from "@/lib/storage";
import { Pencil, Plus, Printer, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

const today = () => new Date().toISOString().slice(0, 10);

function daysBetween(from: string, to: string) {
  const d1 = new Date(from);
  const d2 = new Date(to);
  return Math.max(
    0,
    Math.floor((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)),
  );
}

export default function DailyEntry() {
  const { currentUser } = useAuth();
  const { canUpdate, canDelete, canPrint } = usePermissions();
  const { farms } = useCompanyScope();
  const farmIds = new Set(farms.map((f) => f.id));
  const allBatches = storage.getBatches().filter((b) => b.status === "active");
  const batches = allBatches.filter((b) => farmIds.has(b.farmId));
  const scopedBatchIds = new Set(batches.map((b) => b.id));
  const [entries, setEntries] = useState<DE[]>(() =>
    storage.getDailyEntries().filter((e) => scopedBatchIds.has(e.batchId)),
  );
  const [medicines, setMedicines] = useState(storage.getMedicines());
  const [vaccines, setVaccines] = useState(storage.getVaccines());
  const [newMedicine, setNewMedicine] = useState("");
  const [newVaccine, setNewVaccine] = useState("");
  const [showAddMedicine, setShowAddMedicine] = useState(false);
  const [showAddVaccine, setShowAddVaccine] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DE | null>(null);
  const [editEntry, setEditEntry] = useState<DE | null>(null);

  const [form, setForm] = useState({
    batchId: "",
    entryDate: today(),
    mortalityCount: "",
    cullBirds: "",
    feedIntakeGrams: "",
    bodyWeightGrams: "",
    waterConsumptionLiters: "",
    medicineUsed: "",
    vaccineUsed: "",
    remarks: "",
  });

  const selBatch = batches.find((b) => b.id === form.batchId);
  const prevEntries = useMemo(
    () => entries.filter((e) => e.batchId === form.batchId),
    [entries, form.batchId],
  );
  const cumulativeFeed =
    prevEntries.reduce((s, e) => s + e.feedIntakeGrams, 0) +
    (Number.parseInt(form.feedIntakeGrams) || 0);
  const fcr =
    (Number.parseInt(form.bodyWeightGrams) || 0) > 0
      ? Number.parseFloat(
          (
            cumulativeFeed / (Number.parseInt(form.bodyWeightGrams) || 1)
          ).toFixed(2),
        )
      : 0;
  const mortalityPct =
    selBatch && selBatch.chicksQty > 0
      ? Number.parseFloat(
          (
            ((Number.parseInt(form.mortalityCount) || 0) / selBatch.chicksQty) *
            100
          ).toFixed(2),
        )
      : 0;

  const batchAge = selBatch
    ? daysBetween(selBatch.placementDate, form.entryDate)
    : null;

  // Auto-calculate birds alive from chicks qty minus all mortality and culls
  const cumulativeMortality = prevEntries.reduce(
    (s, e) => s + e.mortalityCount,
    0,
  );
  const cumulativeCull = prevEntries.reduce(
    (s, e) => s + (e.cullBirds || 0),
    0,
  );
  const todayMortality = Number.parseInt(form.mortalityCount) || 0;
  const todayCull = Number.parseInt(form.cullBirds) || 0;
  const calculatedBirdsAlive = selBatch
    ? Math.max(
        0,
        selBatch.chicksQty -
          cumulativeMortality -
          todayMortality -
          cumulativeCull -
          todayCull,
      )
    : 0;

  // Birds balance = calculated alive (same formula for batch info panel)
  const birdsBalance = calculatedBirdsAlive;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.batchId) return;
    storage.addDailyEntry({
      batchId: form.batchId,
      entryDate: form.entryDate,
      birdsAlive: calculatedBirdsAlive,
      mortalityCount: todayMortality,
      cullBirds: todayCull,
      feedIntakeGrams: Number.parseInt(form.feedIntakeGrams) || 0,
      bodyWeightGrams: Number.parseInt(form.bodyWeightGrams) || 0,
      waterConsumptionLiters:
        Number.parseFloat(form.waterConsumptionLiters) || 0,
      fcr,
      mortalityPct,
      cumulativeFeed,
      medicineUsed: form.medicineUsed || undefined,
      vaccineUsed: form.vaccineUsed || undefined,
      remarks: form.remarks || undefined,
    });
    // Update the batch's birdsAlive with the calculated value
    storage.updateBatch(form.batchId, {
      birdsAlive: calculatedBirdsAlive,
    });
    setEntries(storage.getDailyEntries());
    setForm({
      batchId: form.batchId,
      entryDate: today(),
      mortalityCount: "",
      cullBirds: "",
      feedIntakeGrams: "",
      bodyWeightGrams: "",
      waterConsumptionLiters: "",
      medicineUsed: "",
      vaccineUsed: "",
      remarks: "",
    });
  };

  const addMedicine = () => {
    if (!newMedicine.trim()) return;
    storage.addMedicine(newMedicine.trim());
    setMedicines(storage.getMedicines());
    setForm((f) => ({ ...f, medicineUsed: newMedicine.trim() }));
    setNewMedicine("");
    setShowAddMedicine(false);
  };

  const addVaccine = () => {
    if (!newVaccine.trim()) return;
    storage.addVaccine(newVaccine.trim());
    setVaccines(storage.getVaccines());
    setForm((f) => ({ ...f, vaccineUsed: newVaccine.trim() }));
    setNewVaccine("");
    setShowAddVaccine(false);
  };

  const confirmDeleteEntry = () => {
    if (!deleteTarget) return;
    logDelete({
      module: "Daily Entry",
      recordId: deleteTarget.id,
      recordSummary: `Batch ${deleteTarget.batchId} | ${deleteTarget.entryDate}`,
      user: currentUser,
    });
    storage.deleteDailyEntry(deleteTarget.id);
    setEntries(storage.getDailyEntries());
    setDeleteTarget(null);
  };

  const batchEntries = entries
    .filter((e) => e.batchId === form.batchId)
    .sort((a, b) => b.entryDate.localeCompare(a.entryDate))
    .slice(0, 10);

  return (
    <div className="space-y-6" data-ocid="daily_entry.page">
      <h2 className="text-2xl font-bold">Daily Farm Entry</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Select Batch *</Label>
                <select
                  data-ocid="daily_entry.batch.select"
                  value={form.batchId}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, batchId: e.target.value }))
                  }
                  className="w-full border rounded px-2 py-1.5 text-sm bg-background"
                >
                  <option value="">-- Select Active Batch --</option>
                  {batches.map((b) => {
                    const farm = farms.find((f) => f.id === b.farmId);
                    return (
                      <option key={b.id} value={b.id}>
                        {b.batchNumber} – {farm?.name || "?"}
                      </option>
                    );
                  })}
                </select>
              </div>

              {selBatch && (
                <div className="p-3 bg-muted/50 rounded text-xs text-muted-foreground space-y-1">
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    <span>
                      Batch: <strong>{selBatch.batchNumber}</strong>
                    </span>
                    <span>
                      Chicks Placed:{" "}
                      <strong>{selBatch.chicksQty.toLocaleString()}</strong>
                    </span>
                    {batchAge !== null && (
                      <span>
                        Age:{" "}
                        <strong className="text-primary">
                          {batchAge} days
                        </strong>
                      </span>
                    )}
                    <span>
                      Birds Balance:{" "}
                      <strong className="text-green-700">
                        {birdsBalance.toLocaleString()}
                      </strong>
                    </span>
                  </div>
                </div>
              )}

              {/* Auto-calculated Birds Alive display */}
              {selBatch && (
                <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded">
                  <div className="flex-1">
                    <p className="text-xs text-green-700 font-medium mb-0.5">
                      Birds Alive (Auto)
                    </p>
                    <p
                      className="text-2xl font-bold text-green-700"
                      data-ocid="daily_entry.birds_alive.success_state"
                    >
                      {calculatedBirdsAlive.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-xs text-green-600 text-right">
                    <p>{selBatch.chicksQty.toLocaleString()} placed</p>
                    <p>− {cumulativeMortality + todayMortality} mortality</p>
                    <p>− {cumulativeCull + todayCull} culls</p>
                  </div>
                </div>
              )}

              <div>
                <Label>Date *</Label>
                <Input
                  data-ocid="daily_entry.date.input"
                  type="date"
                  value={form.entryDate}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, entryDate: e.target.value }))
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Mortality Count</Label>
                  <Input
                    data-ocid="daily_entry.mortality.input"
                    type="number"
                    value={form.mortalityCount}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, mortalityCount: e.target.value }))
                    }
                    placeholder="Dead birds today"
                  />
                </div>
                <div>
                  <Label>Cull Birds</Label>
                  <Input
                    data-ocid="daily_entry.cull.input"
                    type="number"
                    value={form.cullBirds}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, cullBirds: e.target.value }))
                    }
                    placeholder="Culled today"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Feed Intake (g)</Label>
                  <Input
                    data-ocid="daily_entry.feed.input"
                    type="number"
                    value={form.feedIntakeGrams}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        feedIntakeGrams: e.target.value,
                      }))
                    }
                    placeholder="Grams today"
                  />
                </div>
                <div>
                  <Label>Avg Body Weight (g)</Label>
                  <Input
                    data-ocid="daily_entry.weight.input"
                    type="number"
                    value={form.bodyWeightGrams}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        bodyWeightGrams: e.target.value,
                      }))
                    }
                    placeholder="Grams per bird"
                  />
                </div>
              </div>

              <div>
                <Label>Water Consumption (L)</Label>
                <Input
                  data-ocid="daily_entry.water.input"
                  type="number"
                  value={form.waterConsumptionLiters}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      waterConsumptionLiters: e.target.value,
                    }))
                  }
                  placeholder="Liters"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label>Medicine Used</Label>
                  <button
                    type="button"
                    onClick={() => setShowAddMedicine(!showAddMedicine)}
                    className="text-xs text-primary hover:underline"
                    data-ocid="daily_entry.add_medicine.button"
                  >
                    + Add New
                  </button>
                </div>
                {showAddMedicine && (
                  <div className="flex gap-2 mb-2">
                    <Input
                      data-ocid="daily_entry.new_medicine.input"
                      value={newMedicine}
                      onChange={(e) => setNewMedicine(e.target.value)}
                      placeholder="Medicine name"
                      className="text-sm"
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={addMedicine}
                      data-ocid="daily_entry.save_medicine.button"
                    >
                      Add
                    </Button>
                  </div>
                )}
                <select
                  data-ocid="daily_entry.medicine.select"
                  value={form.medicineUsed}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, medicineUsed: e.target.value }))
                  }
                  className="w-full border rounded px-2 py-1.5 text-sm bg-background"
                >
                  <option value="">-- None --</option>
                  {medicines.map((m) => (
                    <option key={m.id} value={m.name}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label>Vaccine Used</Label>
                  <button
                    type="button"
                    onClick={() => setShowAddVaccine(!showAddVaccine)}
                    className="text-xs text-primary hover:underline"
                    data-ocid="daily_entry.add_vaccine.button"
                  >
                    + Add New
                  </button>
                </div>
                {showAddVaccine && (
                  <div className="flex gap-2 mb-2">
                    <Input
                      data-ocid="daily_entry.new_vaccine.input"
                      value={newVaccine}
                      onChange={(e) => setNewVaccine(e.target.value)}
                      placeholder="Vaccine name"
                      className="text-sm"
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={addVaccine}
                      data-ocid="daily_entry.save_vaccine.button"
                    >
                      Add
                    </Button>
                  </div>
                )}
                <select
                  data-ocid="daily_entry.vaccine.select"
                  value={form.vaccineUsed}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, vaccineUsed: e.target.value }))
                  }
                  className="w-full border rounded px-2 py-1.5 text-sm bg-background"
                >
                  <option value="">-- None --</option>
                  {vaccines.map((v) => (
                    <option key={v.id} value={v.name}>
                      {v.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label>Remarks</Label>
                <Textarea
                  data-ocid="daily_entry.remarks.textarea"
                  value={form.remarks}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, remarks: e.target.value }))
                  }
                  placeholder="Any observations..."
                  rows={2}
                />
              </div>

              <div className="bg-muted/30 p-3 rounded text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cumulative Feed</span>
                  <span className="font-medium">
                    {cumulativeFeed.toLocaleString()} g
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mortality %</span>
                  <span className="font-medium">{mortalityPct}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">FCR</span>
                  <span className="font-medium">{fcr}</span>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={!form.batchId}
                data-ocid="daily_entry.submit_button"
              >
                <Plus size={16} className="mr-1" /> Save Daily Entry
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">
              Recent Entries
              {form.batchId && (
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  (last 10)
                </span>
              )}
            </h3>
            {batchEntries.length === 0 ? (
              <p
                className="text-center text-muted-foreground py-8"
                data-ocid="daily_entry.entries.empty_state"
              >
                Select a batch to see entries.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table
                  className="w-full text-xs"
                  data-ocid="daily_entry.entries.table"
                >
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-1">Date</th>
                      <th className="text-right p-1">Alive</th>
                      <th className="text-right p-1">Mort.</th>
                      <th className="text-right p-1">Feed (g)</th>
                      <th className="text-right p-1">Wt (g)</th>
                      <th className="text-right p-1">FCR</th>
                      <th className="p-1" />
                    </tr>
                  </thead>
                  <tbody>
                    {batchEntries.map((e, i) => (
                      <tr
                        key={e.id}
                        className="border-b"
                        data-ocid={`daily_entry.entry.row.${i + 1}`}
                      >
                        <td className="p-1">{e.entryDate}</td>
                        <td className="p-1 text-right text-green-700 font-medium">
                          {e.birdsAlive}
                        </td>
                        <td className="p-1 text-right">{e.mortalityCount}</td>
                        <td className="p-1 text-right">
                          {e.feedIntakeGrams.toLocaleString()}
                        </td>
                        <td className="p-1 text-right">{e.bodyWeightGrams}</td>
                        <td className="p-1 text-right">{e.fcr}</td>
                        <td className="p-1">
                          <div className="flex gap-0.5">
                            {canUpdate && (
                              <button
                                type="button"
                                onClick={() => setEditEntry({ ...e })}
                                data-ocid={`daily_entry.edit_button.${i + 1}`}
                                className="p-1 hover:bg-muted rounded"
                                title="Edit"
                              >
                                <Pencil size={11} className="text-blue-600" />
                              </button>
                            )}
                            {canDelete && (
                              <button
                                type="button"
                                onClick={() => setDeleteTarget(e)}
                                data-ocid={`daily_entry.delete_button.${i + 1}`}
                                className="p-1 hover:bg-muted rounded"
                                title="Delete"
                              >
                                <Trash2 size={11} className="text-red-600" />
                              </button>
                            )}
                            {canPrint && (
                              <button
                                type="button"
                                onClick={() => {
                                  const batch = batches.find(
                                    (b) => b.id === e.batchId,
                                  );
                                  const farm = farms.find(
                                    (f) => f.id === batch?.farmId,
                                  );
                                  printRecord({
                                    farmName: farm?.name,
                                    batchNumber: batch?.batchNumber,
                                    date: e.entryDate,
                                    module: "Daily Farm Entry",
                                    generatedBy: currentUser?.name,
                                    entryDetails: {
                                      Date: e.entryDate,
                                      "Birds Alive": e.birdsAlive,
                                      Mortality: e.mortalityCount,
                                      "Cull Birds": e.cullBirds,
                                      "Feed Intake (g)": e.feedIntakeGrams,
                                      "Body Weight (g)": e.bodyWeightGrams,
                                      "Water (L)": e.waterConsumptionLiters,
                                      FCR: e.fcr,
                                      "Mortality %": e.mortalityPct,
                                      Medicine: e.medicineUsed,
                                      Vaccine: e.vaccineUsed,
                                      Remarks: e.remarks,
                                    },
                                  });
                                }}
                                data-ocid={`daily_entry.print_button.${i + 1}`}
                                className="p-1 hover:bg-muted rounded"
                                title="Print"
                              >
                                <Printer size={11} className="text-green-600" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(v) => {
          if (!v) setDeleteTarget(null);
        }}
        onConfirm={confirmDeleteEntry}
        recordSummary={deleteTarget ? `${deleteTarget.entryDate}` : undefined}
      />

      {editEntry && (
        <Dialog
          open={!!editEntry}
          onOpenChange={(v) => {
            if (!v) setEditEntry(null);
          }}
        >
          <DialogContent data-ocid="daily_entry.edit.dialog">
            <DialogHeader>
              <DialogTitle>Edit Daily Entry</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={editEntry.entryDate}
                    onChange={(e) =>
                      setEditEntry((prev) =>
                        prev ? { ...prev, entryDate: e.target.value } : prev,
                      )
                    }
                  />
                </div>
                <div>
                  <Label>Mortality</Label>
                  <Input
                    type="number"
                    value={editEntry.mortalityCount}
                    onChange={(e) =>
                      setEditEntry((prev) =>
                        prev
                          ? { ...prev, mortalityCount: Number(e.target.value) }
                          : prev,
                      )
                    }
                  />
                </div>
                <div>
                  <Label>Feed Intake (g)</Label>
                  <Input
                    type="number"
                    value={editEntry.feedIntakeGrams}
                    onChange={(e) =>
                      setEditEntry((prev) =>
                        prev
                          ? { ...prev, feedIntakeGrams: Number(e.target.value) }
                          : prev,
                      )
                    }
                  />
                </div>
                <div>
                  <Label>Body Weight (g)</Label>
                  <Input
                    type="number"
                    value={editEntry.bodyWeightGrams}
                    onChange={(e) =>
                      setEditEntry((prev) =>
                        prev
                          ? { ...prev, bodyWeightGrams: Number(e.target.value) }
                          : prev,
                      )
                    }
                  />
                </div>
                <div>
                  <Label>Water (L)</Label>
                  <Input
                    type="number"
                    value={editEntry.waterConsumptionLiters}
                    onChange={(e) =>
                      setEditEntry((prev) =>
                        prev
                          ? {
                              ...prev,
                              waterConsumptionLiters: Number(e.target.value),
                            }
                          : prev,
                      )
                    }
                  />
                </div>
              </div>
              <div>
                <Label>Remarks</Label>
                <Textarea
                  value={editEntry.remarks || ""}
                  onChange={(e) =>
                    setEditEntry((prev) =>
                      prev ? { ...prev, remarks: e.target.value } : prev,
                    )
                  }
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setEditEntry(null)}
                data-ocid="daily_entry.edit.cancel_button"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (!editEntry) return;
                  storage.updateDailyEntry(editEntry.id, editEntry);
                  setEntries(storage.getDailyEntries());
                  setEditEntry(null);
                }}
                data-ocid="daily_entry.edit.save_button"
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
