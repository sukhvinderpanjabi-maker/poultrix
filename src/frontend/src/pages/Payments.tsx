import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCompanyScope } from "@/lib/roleFilter";
import { type Payment, storage } from "@/lib/storage";
import { DollarSign, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

const today = () => new Date().toISOString().slice(0, 10);

export default function Payments() {
  const { farms } = useCompanyScope();
  const farmIds = new Set(farms.map((f) => f.id));
  const allPayments = storage.getPayments();
  const [payments, setPayments] = useState<Payment[]>(
    allPayments.filter((p) => farmIds.has(p.farmId)),
  );
  const [form, setForm] = useState({
    date: today(),
    farmId: "",
    amount: "",
    paymentType: "Cash" as "Cash" | "Online",
    description: "",
    enteredBy: "",
  });

  const totalPayments = payments.reduce((s, p) => s + p.amount, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.farmId || !form.amount) return;
    storage.addPayment({
      date: form.date,
      farmId: form.farmId,
      amount: Number.parseFloat(form.amount) || 0,
      paymentType: form.paymentType,
      description: form.description,
      enteredBy: form.enteredBy,
    });
    setPayments(
      storage.getPayments().filter((p) => farms.some((f) => f.id === p.farmId)),
    );
    setForm({
      date: today(),
      farmId: "",
      amount: "",
      paymentType: "Cash",
      description: "",
      enteredBy: "",
    });
  };

  const handleDelete = (id: string) => {
    storage.deletePayment(id);
    setPayments(
      storage.getPayments().filter((p) => farms.some((f) => f.id === p.farmId)),
    );
  };

  return (
    <div className="space-y-6" data-ocid="payments.page">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Payments</h2>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <DollarSign size={16} />
          Total: <strong>₹ {totalPayments.toLocaleString()}</strong>
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
                data-ocid="payments.date.input"
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
                data-ocid="payments.farm.select"
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
                data-ocid="payments.amount.input"
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
                data-ocid="payments.type.select"
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
              <Label>Description</Label>
              <Input
                data-ocid="payments.description.input"
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>Entered By</Label>
              <Input
                data-ocid="payments.entered_by.input"
                value={form.enteredBy}
                onChange={(e) =>
                  setForm((f) => ({ ...f, enteredBy: e.target.value }))
                }
              />
            </div>
            <div className="col-span-2 md:col-span-3">
              <Button type="submit" data-ocid="payments.submit_button">
                <Plus size={16} className="mr-1" /> Add Payment
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {payments.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm" data-ocid="payments.table">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-2">Date</th>
                <th className="text-left p-2">Farm</th>
                <th className="text-right p-2">Amount (₹)</th>
                <th className="text-left p-2">Type</th>
                <th className="text-left p-2">Description</th>
                <th className="p-2" />
              </tr>
            </thead>
            <tbody>
              {payments.map((p, i) => (
                <tr
                  key={p.id}
                  className="border-b hover:bg-muted/30"
                  data-ocid={`payments.row.${i + 1}`}
                >
                  <td className="p-2">{p.date}</td>
                  <td className="p-2">
                    {farms.find((f) => f.id === p.farmId)?.name || "-"}
                  </td>
                  <td className="p-2 text-right font-medium">
                    {p.amount.toLocaleString()}
                  </td>
                  <td className="p-2">{p.paymentType}</td>
                  <td className="p-2 text-muted-foreground">
                    {p.description || "-"}
                  </td>
                  <td className="p-2 text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-600"
                      onClick={() => handleDelete(p.id)}
                      data-ocid={`payments.delete_button.${i + 1}`}
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
