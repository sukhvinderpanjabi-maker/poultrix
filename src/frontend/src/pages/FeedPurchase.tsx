import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
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
import { logDelete } from "@/lib/auditHelper";
import { usePermissions } from "@/lib/permissions";
import { printRecord } from "@/lib/printRecord";
import { useCompanyScope } from "@/lib/roleFilter";
import { type FeedPurchase as FP, storage } from "@/lib/storage";
import { Pencil, Plus, Printer, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

const today = () => new Date().toISOString().slice(0, 10);

const DEFAULT_FORM = {
  supplierIdRef: "",
  supplierName: "",
  feedType: "",
  unit: "bags" as "bags" | "kg",
  quantityBags: "",
  quantityKgInput: "",
  ratePerBag: "",
  discountAmount: "",
  purchaseDate: today(),
  challanNumber: "",
  branchId: "",
  receivingFarmId: "",
};

export default function FeedPurchase() {
  const { currentUser } = useAuth();
  const { canUpdate, canDelete, canPrint } = usePermissions();
  const {
    farms: allFarms,
    branches,
    feedTypes,
    feedSuppliers: suppliers,
  } = useCompanyScope();
  const [purchases, setPurchases] = useState<FP[]>(storage.getFeedPurchases());
  const [form, setForm] = useState(DEFAULT_FORM);
  const [quickAddSupplier, setQuickAddSupplier] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<FP | null>(null);
  const [editPurchase, setEditPurchase] = useState<FP | null>(null);

  const filteredFarms = useMemo(
    () =>
      form.branchId
        ? allFarms.filter((f) => f.branchId === form.branchId)
        : allFarms,
    [allFarms, form.branchId],
  );

  const bags =
    form.unit === "bags"
      ? Number(form.quantityBags) || 0
      : Math.round((Number(form.quantityKgInput) || 0) / 50);
  const kg =
    form.unit === "kg"
      ? Number(form.quantityKgInput) || 0
      : (Number(form.quantityBags) || 0) * 50;
  const totalAmount = Math.max(
    0,
    bags * (Number(form.ratePerBag) || 0) - (Number(form.discountAmount) || 0),
  );

  const refreshPurchases = () => setPurchases(storage.getFeedPurchases());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.feedType || bags === 0) return;
    const selectedSupplier = suppliers.find((s) => s.id === form.supplierIdRef);
    storage.addFeedPurchase({
      supplierName: selectedSupplier?.name || form.supplierName,
      supplierIdRef: form.supplierIdRef || undefined,
      feedType: form.feedType,
      quantityBags: bags,
      quantityKg: kg,
      ratePerBag: Number(form.ratePerBag) || 0,
      discountAmount: Number(form.discountAmount) || 0,
      totalAmount,
      purchaseDate: form.purchaseDate,
      challanNumber: form.challanNumber || undefined,
      branchId: form.branchId || undefined,
      receivingFarmId: form.receivingFarmId || undefined,
    });
    refreshPurchases();
    setForm(DEFAULT_FORM);
  };

  const handleAddSupplier = () => {
    if (!newSupplierName.trim()) return;
    const s = storage.addFeedSupplier({
      name: newSupplierName.trim(),
      contactName: "",
      phone: "",
    });
    setForm((f) => ({ ...f, supplierIdRef: s.id }));
    setNewSupplierName("");
    setQuickAddSupplier(false);
  };

  const confirmDeletePurchase = () => {
    if (!deleteTarget) return;
    logDelete({
      module: "Feed Purchase",
      recordId: deleteTarget.id,
      recordSummary: `${deleteTarget.feedType} | ${deleteTarget.purchaseDate}`,
      user: currentUser,
    });
    storage.deleteFeedPurchase(deleteTarget.id);
    refreshPurchases();
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-6" data-ocid="feed_purchase.page">
      <h2 className="text-2xl font-bold">Feed Purchase</h2>
      <Card>
        <CardContent className="p-6">
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            <div>
              <Label>Supplier / Feed Mill</Label>
              <div className="flex gap-2">
                <select
                  data-ocid="feed_purchase.supplier.select"
                  value={form.supplierIdRef}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, supplierIdRef: e.target.value }))
                  }
                  className="flex-1 h-9 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">Select Supplier...</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setQuickAddSupplier(true)}
                  data-ocid="feed_purchase.add_supplier.button"
                >
                  <Plus size={14} />
                </Button>
              </div>
            </div>
            <div>
              <Label>Feed Type *</Label>
              <select
                data-ocid="feed_purchase.feed_type.select"
                required
                value={form.feedType}
                onChange={(e) =>
                  setForm((f) => ({ ...f, feedType: e.target.value }))
                }
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">Select Type...</option>
                {feedTypes.map((t) => (
                  <option key={t.id} value={t.name}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Branch (Receiving)</Label>
              <select
                data-ocid="feed_purchase.branch.select"
                value={form.branchId}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    branchId: e.target.value,
                    receivingFarmId: "",
                  }))
                }
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">All / Central</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Receiving Farm</Label>
              <select
                data-ocid="feed_purchase.farm.select"
                value={form.receivingFarmId}
                onChange={(e) =>
                  setForm((f) => ({ ...f, receivingFarmId: e.target.value }))
                }
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">Not specified</option>
                {filteredFarms.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <Label>Quantity</Label>
              <div className="flex gap-3 items-start mt-1">
                <div className="flex rounded-md border border-input overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, unit: "bags" }))}
                    className={`px-3 py-1.5 text-sm font-medium transition-colors ${form.unit === "bags" ? "bg-primary text-primary-foreground" : "bg-background text-foreground hover:bg-muted"}`}
                    data-ocid="feed_purchase.unit_bags.toggle"
                  >
                    Bags
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, unit: "kg" }))}
                    className={`px-3 py-1.5 text-sm font-medium transition-colors ${form.unit === "kg" ? "bg-primary text-primary-foreground" : "bg-background text-foreground hover:bg-muted"}`}
                    data-ocid="feed_purchase.unit_kg.toggle"
                  >
                    KG
                  </button>
                </div>
                {form.unit === "bags" ? (
                  <Input
                    data-ocid="feed_purchase.qty_bags.input"
                    type="number"
                    min="0"
                    value={form.quantityBags}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, quantityBags: e.target.value }))
                    }
                    placeholder="Number of bags"
                  />
                ) : (
                  <Input
                    data-ocid="feed_purchase.qty_kg.input"
                    type="number"
                    min="0"
                    value={form.quantityKgInput}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        quantityKgInput: e.target.value,
                      }))
                    }
                    placeholder="Quantity in kg"
                  />
                )}
              </div>
            </div>
            <div>
              <Label>Rate per Bag (\u20B9)</Label>
              <Input
                data-ocid="feed_purchase.rate.input"
                type="number"
                value={form.ratePerBag}
                onChange={(e) =>
                  setForm((f) => ({ ...f, ratePerBag: e.target.value }))
                }
                placeholder="0"
              />
            </div>
            <div>
              <Label>Discount (\u20B9)</Label>
              <Input
                data-ocid="feed_purchase.discount.input"
                type="number"
                value={form.discountAmount}
                onChange={(e) =>
                  setForm((f) => ({ ...f, discountAmount: e.target.value }))
                }
                placeholder="0"
              />
            </div>
            <div>
              <Label>Purchase Date</Label>
              <Input
                data-ocid="feed_purchase.date.input"
                type="date"
                value={form.purchaseDate}
                onChange={(e) =>
                  setForm((f) => ({ ...f, purchaseDate: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>Delivery Challan No.</Label>
              <Input
                data-ocid="feed_purchase.challan.input"
                value={form.challanNumber}
                onChange={(e) =>
                  setForm((f) => ({ ...f, challanNumber: e.target.value }))
                }
                placeholder="Challan number"
              />
            </div>
            <div className="sm:col-span-2 flex items-center justify-between p-3 bg-muted rounded-lg">
              <span className="text-sm text-muted-foreground">
                Total Amount:
              </span>
              <span className="font-bold text-xl">
                \u20B9 {totalAmount.toLocaleString()}
              </span>
            </div>
            <div className="sm:col-span-2 flex justify-end">
              <Button type="submit" data-ocid="feed_purchase.submit.button">
                <Plus size={16} className="mr-1" />
                Save Purchase
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div>
        <h3 className="font-semibold mb-3">Purchase History</h3>
        {purchases.length === 0 ? (
          <Card data-ocid="feed_purchase.empty_state">
            <CardContent className="p-6 text-center text-muted-foreground">
              No purchases recorded.
            </CardContent>
          </Card>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" data-ocid="feed_purchase.table">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-2">Date</th>
                  <th className="text-left p-2">Supplier</th>
                  <th className="text-left p-2">Type</th>
                  <th className="text-left p-2">Challan</th>
                  <th className="text-right p-2">Bags</th>
                  <th className="text-right p-2">KG</th>
                  <th className="text-right p-2">Total</th>
                  <th className="p-2" />
                </tr>
              </thead>
              <tbody>
                {[...purchases].reverse().map((p, i) => (
                  <tr
                    key={p.id}
                    className="border-b hover:bg-muted/30"
                    data-ocid={`feed_purchase.row.${i + 1}`}
                  >
                    <td className="p-2">{p.purchaseDate}</td>
                    <td className="p-2">{p.supplierName}</td>
                    <td className="p-2">
                      <Badge variant="outline">{p.feedType}</Badge>
                    </td>
                    <td className="p-2 text-muted-foreground">
                      {p.challanNumber || "\u2014"}
                    </td>
                    <td className="p-2 text-right">{p.quantityBags}</td>
                    <td className="p-2 text-right text-muted-foreground">
                      {p.quantityKg ?? p.quantityBags * 50}
                    </td>
                    <td className="p-2 text-right font-medium">
                      \u20B9 {p.totalAmount.toLocaleString()}
                    </td>
                    <td className="p-2">
                      <div className="flex gap-1 justify-end">
                        {canUpdate && (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setEditPurchase({ ...p })}
                            data-ocid={`feed_purchase.edit_button.${i + 1}`}
                            title="Edit"
                          >
                            <Pencil size={13} className="text-blue-600" />
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setDeleteTarget(p)}
                            data-ocid={`feed_purchase.delete_button.${i + 1}`}
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
                              const farm = allFarms.find(
                                (f) => f.id === p.receivingFarmId,
                              );
                              printRecord({
                                farmName: farm?.name,
                                date: p.purchaseDate,
                                module: "Feed Purchase",
                                generatedBy: currentUser?.name,
                                entryDetails: {
                                  Supplier: p.supplierName,
                                  "Feed Type": p.feedType,
                                  "Qty (Bags)": p.quantityBags,
                                  "Qty (KG)":
                                    p.quantityKg ?? p.quantityBags * 50,
                                  "Rate/Bag": `\u20B9${p.ratePerBag}`,
                                  Total: `\u20B9${p.totalAmount}`,
                                  Challan: p.challanNumber,
                                  Date: p.purchaseDate,
                                },
                              });
                            }}
                            data-ocid={`feed_purchase.print_button.${i + 1}`}
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
      </div>

      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(v) => {
          if (!v) setDeleteTarget(null);
        }}
        onConfirm={confirmDeletePurchase}
        recordSummary={
          deleteTarget
            ? `${deleteTarget.feedType} | ${deleteTarget.purchaseDate}`
            : undefined
        }
      />

      {editPurchase && (
        <Dialog
          open={!!editPurchase}
          onOpenChange={(v) => {
            if (!v) setEditPurchase(null);
          }}
        >
          <DialogContent data-ocid="feed_purchase.edit.dialog">
            <DialogHeader>
              <DialogTitle>Edit Feed Purchase</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Supplier Name</Label>
                <Input
                  value={editPurchase.supplierName}
                  onChange={(e) =>
                    setEditPurchase((p) =>
                      p ? { ...p, supplierName: e.target.value } : p,
                    )
                  }
                />
              </div>
              <div>
                <Label>Feed Type</Label>
                <Input
                  value={editPurchase.feedType}
                  onChange={(e) =>
                    setEditPurchase((p) =>
                      p ? { ...p, feedType: e.target.value } : p,
                    )
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Qty (Bags)</Label>
                  <Input
                    type="number"
                    value={editPurchase.quantityBags}
                    onChange={(e) =>
                      setEditPurchase((p) =>
                        p ? { ...p, quantityBags: Number(e.target.value) } : p,
                      )
                    }
                  />
                </div>
                <div>
                  <Label>Rate/Bag (\u20B9)</Label>
                  <Input
                    type="number"
                    value={editPurchase.ratePerBag}
                    onChange={(e) =>
                      setEditPurchase((p) =>
                        p ? { ...p, ratePerBag: Number(e.target.value) } : p,
                      )
                    }
                  />
                </div>
                <div>
                  <Label>Purchase Date</Label>
                  <Input
                    type="date"
                    value={editPurchase.purchaseDate}
                    onChange={(e) =>
                      setEditPurchase((p) =>
                        p ? { ...p, purchaseDate: e.target.value } : p,
                      )
                    }
                  />
                </div>
                <div>
                  <Label>Challan No.</Label>
                  <Input
                    value={editPurchase.challanNumber || ""}
                    onChange={(e) =>
                      setEditPurchase((p) =>
                        p ? { ...p, challanNumber: e.target.value } : p,
                      )
                    }
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setEditPurchase(null)}
                data-ocid="feed_purchase.edit.cancel_button"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (!editPurchase) return;
                  storage.updateFeedPurchase(editPurchase.id, editPurchase);
                  refreshPurchases();
                  setEditPurchase(null);
                }}
                data-ocid="feed_purchase.edit.save_button"
              >
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <Dialog open={quickAddSupplier} onOpenChange={setQuickAddSupplier}>
        <DialogContent data-ocid="feed_purchase.quick_supplier.dialog">
          <DialogHeader>
            <DialogTitle>Add New Supplier</DialogTitle>
          </DialogHeader>
          <div>
            <Label>Supplier Name *</Label>
            <Input
              data-ocid="feed_purchase.quick_supplier.input"
              value={newSupplierName}
              onChange={(e) => setNewSupplierName(e.target.value)}
              placeholder="Supplier / Feed Mill name"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setQuickAddSupplier(false)}
              data-ocid="feed_purchase.quick_supplier.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddSupplier}
              data-ocid="feed_purchase.quick_supplier.save_button"
            >
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
