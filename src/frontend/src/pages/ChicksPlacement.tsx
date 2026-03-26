import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { logDelete } from "@/lib/auditHelper";
import { usePermissions } from "@/lib/permissions";
import { printRecord } from "@/lib/printRecord";
import { useCompanyScope } from "@/lib/roleFilter";
import { storage } from "@/lib/storage";
import {
  AlertCircle,
  Bird,
  CheckCircle2,
  Pencil,
  Printer,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

const today = () => new Date().toISOString().slice(0, 10);

type EditForm = {
  placementDate: string;
  hatcheryName: string;
  breedType: string;
  chicksQty: string;
  chicksRate: string;
  transportCost: string;
};

export default function ChicksPlacement() {
  const { farms } = useCompanyScope();
  const { currentUser } = useAuth();
  const perms = usePermissions();

  const [refreshKey, setRefreshKey] = useState(0);
  const allBatches = storage.getBatches();
  const farmIds = new Set(farms.map((f) => f.id));
  const batches = allBatches.filter((b) => farmIds.has(b.farmId));

  const [form, setForm] = useState({
    farmId: "",
    shedId: "",
    placementDate: today(),
    hatcheryName: "",
    breedType: "",
    chicksQty: "",
    chicksRate: "",
    transportCost: "",
  });
  const [validationError, setValidationError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Edit dialog state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({
    placementDate: "",
    hatcheryName: "",
    breedType: "",
    chicksQty: "",
    chicksRate: "",
    transportCost: "",
  });

  // Delete dialog state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredSheds = useMemo(
    () => storage.getSheds().filter((s) => s.farmId === form.farmId),
    [form.farmId],
  );

  const activeBatch = useMemo(() => {
    if (!form.shedId) return null;
    return storage.getActiveBatchByShed(form.shedId) ?? null;
  }, [form.shedId]);

  const selectedFarm = farms.find((f) => f.id === form.farmId);

  const remainingCapacity = useMemo(() => {
    if (!selectedFarm) return null;
    const alreadyPlaced = batches
      .filter(
        (b) =>
          b.farmId === form.farmId &&
          (b.status === "active" || b.status === "closed"),
      )
      .reduce((sum, b) => sum + (b.chicksQty || 0), 0);
    return Math.max(0, (selectedFarm.totalCapacity || 0) - alreadyPlaced);
  }, [form.farmId, selectedFarm, batches]);

  const totalCost =
    (Number.parseInt(form.chicksQty) || 0) *
      (Number.parseInt(form.chicksRate) || 0) +
    (Number.parseInt(form.transportCost) || 0);

  const handleFarmChange = (farmId: string) => {
    setForm((f) => ({ ...f, farmId, shedId: "" }));
    setValidationError("");
    setSuccessMsg("");
  };

  const handleShedChange = (shedId: string) => {
    setForm((f) => ({ ...f, shedId }));
    setValidationError("");
    setSuccessMsg("");
  };

  const handleClear = () => {
    setForm({
      farmId: "",
      shedId: "",
      placementDate: today(),
      hatcheryName: "",
      breedType: "",
      chicksQty: "",
      chicksRate: "",
      transportCost: "",
    });
    setValidationError("");
    setSuccessMsg("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError("");
    setSuccessMsg("");

    if (!form.farmId) {
      setValidationError("Please select a farm.");
      return;
    }
    if (!form.shedId) {
      setValidationError("Please select a shed.");
      return;
    }
    if (!activeBatch) {
      setValidationError("No active batch found for this shed.");
      return;
    }
    const qty = Number.parseInt(form.chicksQty);
    if (!form.chicksQty || Number.isNaN(qty) || qty <= 0) {
      setValidationError("Chicks quantity must be a number greater than zero.");
      return;
    }
    if (remainingCapacity !== null && qty > remainingCapacity) {
      setValidationError(
        `Chicks quantity exceeds remaining farm capacity. Remaining: ${remainingCapacity.toLocaleString()} birds.`,
      );
      return;
    }

    storage.updateBatch(activeBatch.id, {
      placementDate: form.placementDate,
      hatcheryName: form.hatcheryName,
      breedType: form.breedType,
      chicksQty: qty,
      chicksRate: Number.parseInt(form.chicksRate) || 0,
      transportCost: Number.parseInt(form.transportCost) || 0,
      totalPlacementCost: totalCost,
      birdsAlive: qty,
    });

    toast.success("Chicks placement recorded successfully.");
    setSuccessMsg(
      `Chicks placement saved under batch "${activeBatch.batchNumber}" for ${selectedFarm?.name}.`,
    );
    setRefreshKey((k) => k + 1);
    handleClear();
  };

  // ─── Edit handlers ────────────────────────────────────────────────────────
  const openEdit = (batchId: string) => {
    const b = batches.find((x) => x.id === batchId);
    if (!b) return;
    setEditForm({
      placementDate: b.placementDate || today(),
      hatcheryName: b.hatcheryName || "",
      breedType: b.breedType || "",
      chicksQty: b.chicksQty ? String(b.chicksQty) : "",
      chicksRate: b.chicksRate ? String(b.chicksRate) : "",
      transportCost: b.transportCost ? String(b.transportCost) : "",
    });
    setEditingId(batchId);
  };

  const saveEdit = () => {
    if (!editingId) return;
    const qty = Number.parseInt(editForm.chicksQty) || 0;
    const rate = Number.parseInt(editForm.chicksRate) || 0;
    const transport = Number.parseInt(editForm.transportCost) || 0;
    storage.updateBatch(editingId, {
      placementDate: editForm.placementDate,
      hatcheryName: editForm.hatcheryName,
      breedType: editForm.breedType,
      chicksQty: qty,
      chicksRate: rate,
      transportCost: transport,
      totalPlacementCost: qty * rate + transport,
      birdsAlive: qty,
    });
    toast.success("Batch updated successfully.");
    setEditingId(null);
    setRefreshKey((k) => k + 1);
  };

  // ─── Print handler ────────────────────────────────────────────────────────
  const handlePrint = (batchId: string) => {
    const b = batches.find((x) => x.id === batchId);
    if (!b) return;
    const farm = farms.find((f) => f.id === b.farmId);
    const shed = storage.getSheds().find((s) => s.id === b.shedId);
    const company = storage
      .getCompanies()
      .find((c) => c.id === (farm as any)?.companyId);
    printRecord({
      module: "Chicks Placement",
      companyName: company?.name,
      farmName: farm?.name,
      shedName: shed?.name,
      batchNumber: b.batchNumber,
      date: b.placementDate,
      generatedBy: currentUser?.name,
      entryDetails: {
        "Batch Number": b.batchNumber,
        "Placement Date": b.placementDate || "—",
        "Chicks Qty": b.chicksQty > 0 ? b.chicksQty.toLocaleString() : "—",
        "Chick Rate (₹)": b.chicksRate > 0 ? `₹ ${b.chicksRate}` : "—",
        "Transport Cost (₹)":
          b.transportCost > 0 ? `₹ ${b.transportCost}` : "—",
        "Total Cost (₹)":
          b.totalPlacementCost > 0
            ? `₹ ${b.totalPlacementCost.toLocaleString()}`
            : "—",
        Hatchery: b.hatcheryName || "—",
        Breed: b.breedType || "—",
        Status: b.status,
        "Birds Alive": b.birdsAlive > 0 ? b.birdsAlive.toLocaleString() : "—",
      },
    });
  };

  // ─── Delete handlers ──────────────────────────────────────────────────────
  const confirmDelete = () => {
    if (!deletingId) return;
    const b = batches.find((x) => x.id === deletingId);
    if (!b) return;
    logDelete({
      module: "Chicks Placement",
      recordId: deletingId,
      recordSummary: `Batch ${b.batchNumber}`,
      user: currentUser as any,
    });
    storage.deleteBatch(deletingId);
    toast.success("Batch deleted.");
    setDeletingId(null);
    setRefreshKey((k) => k + 1);
  };

  const deletingBatch = deletingId
    ? batches.find((b) => b.id === deletingId)
    : null;

  // suppress unused refreshKey lint
  void refreshKey;

  return (
    <div className="space-y-6" data-ocid="chicks.page">
      <div>
        <h2 className="text-2xl font-bold">Chick Placement</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Place chicks into the active batch linked to a farm shed.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Placement Form */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">New Chick Placement</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Farm */}
              <div>
                <Label>Farm *</Label>
                <select
                  data-ocid="chicks.farm.select"
                  value={form.farmId}
                  onChange={(e) => handleFarmChange(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm mt-1"
                >
                  <option value="">Select Farm...</option>
                  {farms.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
                {selectedFarm && remainingCapacity !== null && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Farm Capacity:{" "}
                    {selectedFarm.totalCapacity?.toLocaleString()} birds
                    &nbsp;|&nbsp; Remaining:{" "}
                    <span
                      className={
                        remainingCapacity === 0
                          ? "text-red-500 font-semibold"
                          : "text-emerald-600 font-semibold"
                      }
                    >
                      {remainingCapacity.toLocaleString()}
                    </span>{" "}
                    birds
                  </p>
                )}
              </div>

              {/* Shed */}
              <div>
                <Label>Shed *</Label>
                <select
                  data-ocid="chicks.shed.select"
                  value={form.shedId}
                  onChange={(e) => handleShedChange(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm mt-1"
                  disabled={!form.farmId}
                >
                  <option value="">Select Shed...</option>
                  {filteredSheds.length === 0 && form.farmId && (
                    <option disabled value="no-sheds">
                      No sheds available
                    </option>
                  )}
                  {filteredSheds.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Active Batch (read-only) */}
              {form.shedId && (
                <div>
                  <Label>Active Batch (Auto-detected)</Label>
                  {activeBatch ? (
                    <div className="mt-1 h-9 flex items-center px-3 rounded-md border border-emerald-200 bg-emerald-50 text-sm font-medium text-emerald-800">
                      <CheckCircle2
                        size={14}
                        className="mr-2 text-emerald-600"
                      />
                      {activeBatch.batchNumber}
                    </div>
                  ) : (
                    <div
                      className="mt-1 h-9 flex items-center px-3 rounded-md border border-red-200 bg-red-50 text-sm text-red-700"
                      data-ocid="chicks.error_state"
                    >
                      <AlertCircle size={14} className="mr-2" />
                      No active batch found for this shed.
                    </div>
                  )}
                </div>
              )}

              {/* Placement Details */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Placement Date</Label>
                  <Input
                    data-ocid="chicks.date.input"
                    type="date"
                    value={form.placementDate}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, placementDate: e.target.value }))
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Chicks Qty *</Label>
                  <Input
                    data-ocid="chicks.qty.input"
                    type="number"
                    min="1"
                    value={form.chicksQty}
                    onChange={(e) => {
                      setForm((f) => ({ ...f, chicksQty: e.target.value }));
                      setValidationError("");
                    }}
                    placeholder="Enter quantity"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Chick Rate (₹)</Label>
                  <Input
                    data-ocid="chicks.rate.input"
                    type="number"
                    value={form.chicksRate}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, chicksRate: e.target.value }))
                    }
                    placeholder="₹ per chick"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Transport Cost (₹)</Label>
                  <Input
                    data-ocid="chicks.transport.input"
                    type="number"
                    value={form.transportCost}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, transportCost: e.target.value }))
                    }
                    placeholder="Transport cost"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Hatchery Name</Label>
                  <Input
                    data-ocid="chicks.hatchery.input"
                    value={form.hatcheryName}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, hatcheryName: e.target.value }))
                    }
                    placeholder="Hatchery"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Breed Type</Label>
                  <Input
                    data-ocid="chicks.breed.input"
                    value={form.breedType}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, breedType: e.target.value }))
                    }
                    placeholder="Breed"
                    className="mt-1"
                  />
                </div>
              </div>

              {totalCost > 0 && (
                <div className="p-3 bg-muted/50 rounded text-sm">
                  Total Placement Cost:{" "}
                  <strong>₹ {totalCost.toLocaleString()}</strong>
                </div>
              )}

              {validationError && (
                <Alert variant="destructive" data-ocid="chicks.error_state">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{validationError}</AlertDescription>
                </Alert>
              )}

              {successMsg && (
                <Alert
                  className="border-emerald-200 bg-emerald-50 text-emerald-800"
                  data-ocid="chicks.success_state"
                >
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <AlertDescription>{successMsg}</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-3">
                <Button
                  type="submit"
                  className="flex-1"
                  data-ocid="chicks.submit_button"
                >
                  Submit
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={handleClear}
                  data-ocid="chicks.cancel_button"
                >
                  Clear
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Batches List */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              Placed Batches ({batches.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {batches.length === 0 ? (
              <div
                className="text-center text-muted-foreground py-8"
                data-ocid="chicks.empty_state"
              >
                <Bird size={40} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">No batches placed yet.</p>
                <p className="text-xs mt-1">
                  Create a farm and then place chicks here.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs" data-ocid="chicks.table">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Batch</th>
                      <th className="text-left p-2">Farm</th>
                      <th className="text-right p-2">Placed</th>
                      <th className="text-right p-2">Alive</th>
                      <th className="text-right p-2">Rate</th>
                      <th className="text-left p-2">Status</th>
                      {(perms.canUpdate ||
                        perms.canPrint ||
                        perms.canDelete) && (
                        <th className="text-center p-2">Actions</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {batches.map((b, i) => (
                      <tr
                        key={b.id}
                        className="border-b hover:bg-muted/30"
                        data-ocid={`chicks.row.${i + 1}`}
                      >
                        <td className="p-2 font-medium">{b.batchNumber}</td>
                        <td className="p-2 text-muted-foreground">
                          {farms.find((f) => f.id === b.farmId)?.name || "-"}
                        </td>
                        <td className="p-2 text-right">
                          {b.chicksQty > 0 ? (
                            b.chicksQty.toLocaleString()
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="p-2 text-right">
                          {b.birdsAlive > 0 ? (
                            b.birdsAlive.toLocaleString()
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="p-2 text-right">
                          {b.chicksRate > 0 ? (
                            `₹ ${b.chicksRate}`
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="p-2">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              b.status === "active"
                                ? "bg-emerald-100 text-emerald-700"
                                : b.status === "sold"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {b.status}
                          </span>
                        </td>
                        {(perms.canUpdate ||
                          perms.canPrint ||
                          perms.canDelete) && (
                          <td className="p-2">
                            <div className="flex items-center justify-center gap-1">
                              {perms.canUpdate && (
                                <button
                                  type="button"
                                  onClick={() => openEdit(b.id)}
                                  data-ocid={`chicks.edit_button.${i + 1}`}
                                  title="Update"
                                  className="p-1.5 rounded hover:bg-blue-50 text-blue-600 hover:text-blue-800 transition-colors"
                                >
                                  <Pencil size={13} />
                                </button>
                              )}
                              {perms.canPrint && (
                                <button
                                  type="button"
                                  onClick={() => handlePrint(b.id)}
                                  data-ocid={`chicks.print_button.${i + 1}`}
                                  title="Print"
                                  className="p-1.5 rounded hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors"
                                >
                                  <Printer size={13} />
                                </button>
                              )}
                              {perms.canDelete && (
                                <button
                                  type="button"
                                  onClick={() => setDeletingId(b.id)}
                                  data-ocid={`chicks.delete_button.${i + 1}`}
                                  title="Delete"
                                  className="p-1.5 rounded hover:bg-red-50 text-red-500 hover:text-red-700 transition-colors"
                                >
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ─── Edit Dialog ─────────────────────────────────────────────────── */}
      {editingId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          data-ocid="chicks.edit.dialog"
        >
          <div className="bg-background rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
            <h3 className="text-base font-semibold mb-4">Update Batch Entry</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Placement Date</Label>
                <Input
                  type="date"
                  value={editForm.placementDate}
                  onChange={(e) =>
                    setEditForm((f) => ({
                      ...f,
                      placementDate: e.target.value,
                    }))
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Chicks Qty</Label>
                <Input
                  type="number"
                  min="1"
                  value={editForm.chicksQty}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, chicksQty: e.target.value }))
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Chick Rate (₹)</Label>
                <Input
                  type="number"
                  value={editForm.chicksRate}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, chicksRate: e.target.value }))
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Transport Cost (₹)</Label>
                <Input
                  type="number"
                  value={editForm.transportCost}
                  onChange={(e) =>
                    setEditForm((f) => ({
                      ...f,
                      transportCost: e.target.value,
                    }))
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Hatchery Name</Label>
                <Input
                  value={editForm.hatcheryName}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, hatcheryName: e.target.value }))
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Breed Type</Label>
                <Input
                  value={editForm.breedType}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, breedType: e.target.value }))
                  }
                  className="mt-1"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <Button
                className="flex-1"
                onClick={saveEdit}
                data-ocid="chicks.edit.save_button"
              >
                Save Changes
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setEditingId(null)}
                data-ocid="chicks.edit.cancel_button"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Delete Confirmation Dialog ───────────────────────────────────── */}
      {deletingId && deletingBatch && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          data-ocid="chicks.delete.dialog"
        >
          <div className="bg-background rounded-lg shadow-xl w-full max-w-sm mx-4 p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <Trash2 size={16} className="text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Delete Batch Entry</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Are you sure you want to delete this entry?
                </p>
                <p className="text-xs font-medium mt-2 text-foreground">
                  Batch: {deletingBatch.batchNumber}
                </p>
                <p className="text-xs text-muted-foreground">
                  Farm:{" "}
                  {farms.find((f) => f.id === deletingBatch.farmId)?.name ||
                    "—"}
                </p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              This action cannot be undone and will be logged in the audit
              trail.
            </p>
            <div className="flex gap-3">
              <Button
                variant="destructive"
                className="flex-1"
                onClick={confirmDelete}
                data-ocid="chicks.delete.confirm_button"
              >
                Yes, Delete
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setDeletingId(null)}
                data-ocid="chicks.delete.cancel_button"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
