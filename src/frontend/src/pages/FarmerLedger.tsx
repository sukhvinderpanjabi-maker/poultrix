import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { type LedgerEntry, type User, storage } from "@/lib/storage";
import { BookOpen, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

type EntryForm = {
  type: LedgerEntry["type"];
  amount: string;
  description: string;
  date: string;
};

export default function FarmerLedger() {
  const { currentUser } = useAuth();
  const isAdmin =
    currentUser?.role === "SuperAdmin" || currentUser?.role === "CompanyAdmin";

  const { users: companyUsers } = useCompanyScope();
  const farmers = useMemo(
    () => companyUsers.filter((u) => u.role === "Farmer"),
    [companyUsers],
  );

  const [selectedFarmerId, setSelectedFarmerId] = useState<string>(() => {
    if (!isAdmin) return currentUser?.id || "";
    return farmers[0]?.id || "";
  });

  const [entries, setEntries] = useState<LedgerEntry[]>(() =>
    storage.getLedgerEntries(),
  );
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState<EntryForm>({
    type: "manual_deduction",
    amount: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
  });

  const selectedFarmer = useMemo<User | undefined>(
    () => companyUsers.find((u) => u.id === selectedFarmerId),
    [selectedFarmerId, companyUsers],
  );

  const farmerEntries = useMemo(() => {
    return entries
      .filter((e) => e.farmerId === selectedFarmerId)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [entries, selectedFarmerId]);

  const runningBalance = useMemo(() => {
    let bal = 0;
    return farmerEntries.map((e) => {
      if (e.type === "opening_balance" || e.type === "gc_earning")
        bal += e.amount;
      else bal -= e.amount;
      return { ...e, runningBal: bal };
    });
  }, [farmerEntries]);

  const finalBalance =
    runningBalance.length > 0
      ? runningBalance[runningBalance.length - 1].runningBal
      : 0;

  const handleAdd = () => {
    if (!selectedFarmerId || !form.amount || !form.description) {
      toast.error("Fill all fields.");
      return;
    }
    storage.addLedgerEntry({
      farmerId: selectedFarmerId,
      type: form.type,
      amount: Number.parseFloat(form.amount),
      description: form.description,
      date: form.date,
    });
    setEntries(storage.getLedgerEntries());
    setShowDialog(false);
    toast.success("Ledger entry added.");
  };

  const labelMap: Record<LedgerEntry["type"], string> = {
    opening_balance: "Opening Balance",
    gc_earning: "GC Earning",
    medicine_deduction: "Medicine Deduction",
    feed_deduction: "Feed Deduction",
    manual_deduction: "Manual Deduction",
  };

  return (
    <div data-ocid="ledger.page" className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <BookOpen size={20} className="text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Farmer Payment Ledger</h1>
          <p className="text-sm text-muted-foreground">
            Track farmer earnings and deductions
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 items-end">
        {isAdmin && (
          <div className="w-64">
            <p className="text-xs font-medium text-muted-foreground mb-1">
              Select Farmer
            </p>
            <Select
              value={selectedFarmerId}
              onValueChange={setSelectedFarmerId}
            >
              <SelectTrigger data-ocid="ledger.farmer.select">
                <SelectValue placeholder="Select farmer" />
              </SelectTrigger>
              <SelectContent>
                {farmers.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        {isAdmin && (
          <Button
            data-ocid="ledger.add_button"
            onClick={() => setShowDialog(true)}
            className="gap-2"
          >
            <Plus size={16} /> Add Entry
          </Button>
        )}
      </div>

      {selectedFarmer && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">
              Ledger — {selectedFarmer.name}
            </CardTitle>
            <Badge
              className={
                finalBalance >= 0
                  ? "bg-green-100 text-green-700 border-green-200"
                  : "bg-red-100 text-red-700 border-red-200"
              }
            >
              Final Payable: ₹
              {finalBalance.toLocaleString("en-IN", {
                maximumFractionDigits: 2,
              })}
            </Badge>
          </CardHeader>
          <CardContent className="p-0">
            {runningBalance.length === 0 ? (
              <div
                data-ocid="ledger.empty_state"
                className="py-12 text-center text-muted-foreground text-sm"
              >
                No ledger entries found for this farmer.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table data-ocid="ledger.table">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Credit (₹)</TableHead>
                      <TableHead className="text-right">Debit (₹)</TableHead>
                      <TableHead className="text-right">Balance (₹)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {runningBalance.map((e, idx) => {
                      const isCredit =
                        e.type === "opening_balance" || e.type === "gc_earning";
                      return (
                        <TableRow
                          key={e.id}
                          data-ocid={`ledger.row.${idx + 1}`}
                        >
                          <TableCell>{e.date}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{labelMap[e.type]}</Badge>
                          </TableCell>
                          <TableCell>{e.description}</TableCell>
                          <TableCell className="text-right text-green-600">
                            {isCredit ? `₹${e.amount.toFixed(2)}` : "-"}
                          </TableCell>
                          <TableCell className="text-right text-red-600">
                            {!isCredit ? `₹${e.amount.toFixed(2)}` : "-"}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            ₹{e.runningBal.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Ledger Entry</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Entry Type</Label>
              <Select
                value={form.type}
                onValueChange={(v) =>
                  setForm((p) => ({ ...p, type: v as LedgerEntry["type"] }))
                }
              >
                <SelectTrigger data-ocid="ledger.type.select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="opening_balance">
                    Opening Balance
                  </SelectItem>
                  <SelectItem value="manual_deduction">
                    Manual Deduction
                  </SelectItem>
                  <SelectItem value="medicine_deduction">
                    Medicine Deduction
                  </SelectItem>
                  <SelectItem value="feed_deduction">Feed Deduction</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Amount (₹)</Label>
              <Input
                type="number"
                data-ocid="ledger.amount.input"
                value={form.amount}
                onChange={(e) =>
                  setForm((p) => ({ ...p, amount: e.target.value }))
                }
                placeholder="0.00"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Input
                data-ocid="ledger.description.input"
                value={form.description}
                onChange={(e) =>
                  setForm((p) => ({ ...p, description: e.target.value }))
                }
                placeholder="Description"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Date</Label>
              <Input
                type="date"
                data-ocid="ledger.date.input"
                value={form.date}
                onChange={(e) =>
                  setForm((p) => ({ ...p, date: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              data-ocid="ledger.cancel_button"
              onClick={() => setShowDialog(false)}
            >
              Cancel
            </Button>
            <Button data-ocid="ledger.submit_button" onClick={handleAdd}>
              Add Entry
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
