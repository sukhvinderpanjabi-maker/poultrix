import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCompanyScope } from "@/lib/roleFilter";
import { type Receipt, storage } from "@/lib/storage";
import { Plus, Receipt as ReceiptIcon, Trash2 } from "lucide-react";
import { useState } from "react";

const today = () => new Date().toISOString().slice(0, 10);

export default function Receipts() {
  const { farms } = useCompanyScope();
  const farmIds = new Set(farms.map((f) => f.id));
  const allReceipts = storage.getReceipts();
  const [receipts, setReceipts] = useState<Receipt[]>(
    allReceipts.filter((r) => farmIds.has(r.farmId)),
  );
  const [form, setForm] = useState({
    date: today(),
    farmId: "",
    amount: "",
    paymentType: "Cash" as "Cash" | "Online",
    notes: "",
    enteredBy: "",
  });

  const totalReceipts = receipts.reduce((s, r) => s + r.amount, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.farmId || !form.amount) return;
    storage.addReceipt({
      date: form.date,
      farmId: form.farmId,
      amount: Number.parseFloat(form.amount) || 0,
      paymentType: form.paymentType,
      notes: form.notes,
      enteredBy: form.enteredBy,
    });
    setReceipts(
      storage.getReceipts().filter((r) => farms.some((f) => f.id === r.farmId)),
    );
    setForm({
      date: today(),
      farmId: "",
      amount: "",
      paymentType: "Cash",
      notes: "",
      enteredBy: "",
    });
  };

  const handleDelete = (id: string) => {
    storage.deleteReceipt(id);
    setReceipts(
      storage.getReceipts().filter((r) => farms.some((f) => f.id === r.farmId)),
    );
  };

  return (
    <div className="space-y-6" data-ocid="receipts.page">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Receipts</h2>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <ReceiptIcon size={16} />
          Total: <strong>₹ {totalReceipts.toLocaleString()}</strong>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-2 md:grid-cols-3 gap-4"
          >
            <div>
              <Label>Date</Label>
              <Input
                data-ocid="receipts.date.input"
                type="date"
                value={form.date}
                onChange={(e) =>
                  setForm((f) => ({ ...f, date: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>Farm *</Label>
              <select
                data-ocid="receipts.farm.select"
                value={form.farmId}
                onChange={(e) =>
                  setForm((f) => ({ ...f, farmId: e.target.value }))
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
              <Label>Amount (₹) *</Label>
              <Input
                data-ocid="receipts.amount.input"
                type="number"
                value={form.amount}
                onChange={(e) =>
                  setForm((f) => ({ ...f, amount: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>Payment Type</Label>
              <select
                data-ocid="receipts.type.select"
                value={form.paymentType}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    paymentType: e.target.value as "Cash" | "Online",
                  }))
                }
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="Cash">Cash</option>
                <option value="Online">Online</option>
              </select>
            </div>
            <div>
              <Label>Notes</Label>
              <Input
                data-ocid="receipts.notes.input"
                value={form.notes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, notes: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>Entered By</Label>
              <Input
                data-ocid="receipts.entered_by.input"
                value={form.enteredBy}
                onChange={(e) =>
                  setForm((f) => ({ ...f, enteredBy: e.target.value }))
                }
              />
            </div>
            <div className="col-span-2 md:col-span-3">
              <Button type="submit" data-ocid="receipts.submit_button">
                <Plus size={16} className="mr-1" /> Add Receipt
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {receipts.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm" data-ocid="receipts.table">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-2">Date</th>
                <th className="text-left p-2">Farm</th>
                <th className="text-right p-2">Amount (₹)</th>
                <th className="text-left p-2">Type</th>
                <th className="text-left p-2">Notes</th>
                <th className="p-2" />
              </tr>
            </thead>
            <tbody>
              {receipts.map((r, i) => (
                <tr
                  key={r.id}
                  className="border-b hover:bg-muted/30"
                  data-ocid={`receipts.row.${i + 1}`}
                >
                  <td className="p-2">{r.date}</td>
                  <td className="p-2">
                    {farms.find((f) => f.id === r.farmId)?.name || "-"}
                  </td>
                  <td className="p-2 text-right font-medium">
                    {r.amount.toLocaleString()}
                  </td>
                  <td className="p-2">{r.paymentType}</td>
                  <td className="p-2 text-muted-foreground">
                    {r.notes || "-"}
                  </td>
                  <td className="p-2 text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-600"
                      onClick={() => handleDelete(r.id)}
                      data-ocid={`receipts.delete_button.${i + 1}`}
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
