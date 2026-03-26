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
import { useCompanyScope } from "@/lib/roleFilter";
import { type FeedStock as FS, storage } from "@/lib/storage";
import { AlertTriangle, Package, Plus } from "lucide-react";
import { useState } from "react";

export default function FeedStock() {
  const { farms, feedTypes } = useCompanyScope();
  const farmIds = new Set(farms.map((f) => f.id));

  const allStocks = storage.getFeedStocks();
  const [stocks, setStocks] = useState<FS[]>(
    allStocks.filter((s) => s.farmId === "global" || farmIds.has(s.farmId)),
  );
  const [dialog, setDialog] = useState(false);
  const [editItem, setEditItem] = useState<FS | null>(null);
  const [form, setForm] = useState({
    farmId: "",
    feedType: "",
    currentStockBags: "",
    alertThresholdBags: "10",
    openingStockKg: "0",
  });

  const lowStock = stocks.filter(
    (s) => s.currentStockBags <= s.alertThresholdBags,
  );

  const openEdit = (s: FS) => {
    setEditItem(s);
    setForm({
      farmId: s.farmId,
      feedType: s.feedType,
      currentStockBags: String(s.currentStockBags),
      alertThresholdBags: String(s.alertThresholdBags),
      openingStockKg: String(s.openingStockKg ?? 0),
    });
    setDialog(true);
  };
  const openNew = () => {
    setEditItem(null);
    setForm({
      farmId: "",
      feedType: "",
      currentStockBags: "",
      alertThresholdBags: "10",
      openingStockKg: "0",
    });
    setDialog(true);
  };

  const save = () => {
    if (!form.feedType) return;
    const item: FS = {
      id: editItem?.id || `${Date.now()}`,
      farmId: form.farmId || "global",
      feedType: form.feedType,
      currentStockBags: Number(form.currentStockBags) || 0,
      alertThresholdBags: Number(form.alertThresholdBags) || 10,
      openingStockKg: Number(form.openingStockKg) || 0,
    };
    storage.saveFeedStock(item);
    const updated = storage.getFeedStocks();
    setStocks(
      updated.filter((s) => s.farmId === "global" || farmIds.has(s.farmId)),
    );
    setDialog(false);
  };

  const kgToBagsDisplay = (kg: number) =>
    `${kg.toLocaleString()} kg / ${Math.round(kg / 50)} bags`;

  return (
    <div className="space-y-6" data-ocid="feed_stock.page">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Feed Stock</h2>
        <Button onClick={openNew} data-ocid="feed_stock.add.button">
          <Plus size={16} className="mr-1" /> Add Stock Entry
        </Button>
      </div>

      {lowStock.length > 0 && (
        <div className="space-y-2" data-ocid="feed_stock.alerts.section">
          {lowStock.map((s, i) => (
            <div
              key={s.id}
              className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700"
              data-ocid={`feed_stock.alert.item.${i + 1}`}
            >
              <AlertTriangle size={16} />
              LOW STOCK: {s.feedType} —{" "}
              {kgToBagsDisplay(s.currentStockBags * 50)} (threshold:{" "}
              {s.alertThresholdBags} bags)
            </div>
          ))}
        </div>
      )}

      {stocks.length === 0 ? (
        <Card data-ocid="feed_stock.empty_state">
          <CardContent className="p-8 text-center text-muted-foreground">
            <Package size={40} className="mx-auto mb-2" />
            <p>No stock records yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm" data-ocid="feed_stock.table">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-2">Farm</th>
                <th className="text-left p-2">Feed Type</th>
                <th className="text-right p-2">Opening (kg)</th>
                <th className="text-right p-2">Stock (Bags / kg)</th>
                <th className="text-right p-2">Alert At</th>
                <th className="text-left p-2">Status</th>
                <th className="p-2" />
              </tr>
            </thead>
            <tbody>
              {stocks.map((s, i) => (
                <tr
                  key={s.id}
                  className="border-b hover:bg-muted/30"
                  data-ocid={`feed_stock.row.${i + 1}`}
                >
                  <td className="p-2 text-muted-foreground">
                    {s.farmId === "global"
                      ? "Global"
                      : farms.find((f) => f.id === s.farmId)?.name || s.farmId}
                  </td>
                  <td className="p-2">
                    <Badge variant="outline">{s.feedType}</Badge>
                  </td>
                  <td className="p-2 text-right text-muted-foreground">
                    {(s.openingStockKg ?? 0).toLocaleString()} kg
                  </td>
                  <td className="p-2 text-right font-medium">
                    {s.currentStockBags} bags
                    <br />
                    <span className="text-xs text-muted-foreground font-normal">
                      {(s.currentStockBags * 50).toLocaleString()} kg
                    </span>
                  </td>
                  <td className="p-2 text-right text-muted-foreground">
                    {s.alertThresholdBags} bags
                  </td>
                  <td className="p-2">
                    <Badge
                      variant={
                        s.currentStockBags <= s.alertThresholdBags
                          ? "destructive"
                          : "default"
                      }
                    >
                      {s.currentStockBags <= s.alertThresholdBags
                        ? "Low"
                        : "OK"}
                    </Badge>
                  </td>
                  <td className="p-2 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEdit(s)}
                      data-ocid={`feed_stock.edit_button.${i + 1}`}
                    >
                      Edit
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent data-ocid="feed_stock.stock.dialog">
          <DialogHeader>
            <DialogTitle>
              {editItem ? "Edit Stock" : "Add Stock Entry"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Farm (optional)</Label>
              <select
                data-ocid="feed_stock.farm.select"
                value={form.farmId}
                onChange={(e) =>
                  setForm((f) => ({ ...f, farmId: e.target.value }))
                }
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">Global</option>
                {farms.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Feed Type *</Label>
              <select
                data-ocid="feed_stock.type.select"
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
              <Label>Opening Stock (kg)</Label>
              <Input
                data-ocid="feed_stock.opening_kg.input"
                type="number"
                value={form.openingStockKg}
                onChange={(e) =>
                  setForm((f) => ({ ...f, openingStockKg: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>Current Stock (Bags)</Label>
              <Input
                data-ocid="feed_stock.qty.input"
                type="number"
                value={form.currentStockBags}
                onChange={(e) =>
                  setForm((f) => ({ ...f, currentStockBags: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>Alert Threshold (Bags)</Label>
              <Input
                data-ocid="feed_stock.threshold.input"
                type="number"
                value={form.alertThresholdBags}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    alertThresholdBags: e.target.value,
                  }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialog(false)}
              data-ocid="feed_stock.stock.cancel_button"
            >
              Cancel
            </Button>
            <Button onClick={save} data-ocid="feed_stock.stock.submit_button">
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
