import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";
import { logDelete } from "@/lib/auditHelper";
import { usePermissions } from "@/lib/permissions";
import { printRecord } from "@/lib/printRecord";
import { useCompanyScope } from "@/lib/roleFilter";
import { type Expense, storage } from "@/lib/storage";
import { Check, Pencil, Plus, Printer, Receipt, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

const EXPENSE_TYPES: Expense["type"][] = [
  "Medicine Cost",
  "Transport",
  "Labour",
  "Maintenance",
  "Other",
];

type ExpenseForm = {
  farmId: string;
  batchId: string;
  type: Expense["type"];
  amount: string;
  description: string;
  date: string;
};

export default function ExpenseManagement() {
  const { currentUser } = useAuth();
  const { canDelete, canPrint } = usePermissions();
  const { farms } = useCompanyScope();
  const isAdmin =
    currentUser?.role === "SuperAdmin" || currentUser?.role === "CompanyAdmin";
  const isManager = currentUser?.role === "Manager";
  const isSupervisor = currentUser?.role === "Supervisor";

  const [expenses, setExpenses] = useState<Expense[]>(() =>
    storage.getExpenses().filter((e) => farms.some((f) => f.id === e.farmId)),
  );
  const [showDialog, setShowDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null);
  const [filterFarm, setFilterFarm] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [form, setForm] = useState<ExpenseForm>({
    farmId: "",
    batchId: "",
    type: "Medicine Cost",
    amount: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
  });

  const batches = useMemo(
    () =>
      form.farmId
        ? storage.getBatches().filter((b) => b.farmId === form.farmId)
        : [],
    [form.farmId],
  );

  const refreshExpenses = () =>
    setExpenses(
      storage.getExpenses().filter((e) => farms.some((f) => f.id === e.farmId)),
    );

  const visibleExpenses = useMemo(() => {
    let list = expenses.filter((e) => farms.some((f) => f.id === e.farmId));
    if (filterFarm !== "all")
      list = list.filter((e) => e.farmId === filterFarm);
    if (filterStatus !== "all")
      list = list.filter((e) => e.status === filterStatus);
    return list;
  }, [expenses, filterFarm, filterStatus, farms]);

  const pendingExpenses = useMemo(
    () =>
      expenses.filter(
        (e) =>
          e.status === "pending_approval" &&
          farms.some((f) => f.id === e.farmId),
      ),
    [expenses, farms],
  );

  const handleAdd = () => {
    if (!form.farmId || !form.amount || !form.description) {
      toast.error("Farm, amount, and description are required.");
      return;
    }
    const status: Expense["status"] = isSupervisor
      ? "pending_approval"
      : "approved";
    storage.addExpense({
      farmId: form.farmId,
      batchId: form.batchId || undefined,
      type: form.type,
      amount: Number.parseFloat(form.amount),
      description: form.description,
      date: form.date,
      addedBy: currentUser?.name || "Unknown",
      addedByRole: currentUser?.role || "Unknown",
      status,
    });
    refreshExpenses();
    setShowDialog(false);
    toast.success(
      isSupervisor ? "Expense submitted for approval." : "Expense added.",
    );
  };

  const handleApprove = (id: string) => {
    storage.updateExpense(id, { status: "approved" });
    refreshExpenses();
    toast.success("Expense approved.");
  };

  const handleReject = (id: string) => {
    storage.updateExpense(id, { status: "rejected" });
    refreshExpenses();
    toast.success("Expense rejected.");
  };

  const confirmDeleteExpense = () => {
    if (!deleteTarget) return;
    logDelete({
      module: "Expenses",
      recordId: deleteTarget.id,
      recordSummary: `${deleteTarget.type} | ${deleteTarget.date}`,
      user: currentUser,
    });
    storage.deleteExpense(deleteTarget.id);
    refreshExpenses();
    setDeleteTarget(null);
    toast.success("Expense deleted.");
  };

  const getFarmName = (farmId: string) =>
    farms.find((f) => f.id === farmId)?.name || farmId;

  const statusBadge = (s: Expense["status"]) => {
    if (s === "approved")
      return (
        <Badge className="bg-green-100 text-green-700 border-green-200">
          Approved
        </Badge>
      );
    if (s === "rejected")
      return (
        <Badge className="bg-red-100 text-red-700 border-red-200">
          Rejected
        </Badge>
      );
    return (
      <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">
        Pending Approval
      </Badge>
    );
  };

  return (
    <div data-ocid="expenses.page" className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Receipt size={20} className="text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Expense Management</h1>
            <p className="text-sm text-muted-foreground">
              Track and manage farm expenses
            </p>
          </div>
        </div>
        {(isAdmin || isManager || isSupervisor) && (
          <Button
            data-ocid="expenses.add_button"
            onClick={() => setShowDialog(true)}
            className="gap-2"
          >
            <Plus size={16} /> Add Expense
          </Button>
        )}
      </div>

      <Tabs defaultValue="all">
        <TabsList data-ocid="expenses.tab">
          <TabsTrigger value="all">All Expenses</TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="pending">
              Pending Approval{" "}
              {pendingExpenses.length > 0 && `(${pendingExpenses.length})`}
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex flex-wrap gap-3">
                <Select value={filterFarm} onValueChange={setFilterFarm}>
                  <SelectTrigger
                    className="w-44"
                    data-ocid="expenses.farm_filter.select"
                  >
                    <SelectValue placeholder="All Farms" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Farms</SelectItem>
                    {farms.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger
                    className="w-44"
                    data-ocid="expenses.status_filter.select"
                  >
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="pending_approval">Pending</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              {visibleExpenses.length === 0 ? (
                <div
                  data-ocid="expenses.empty_state"
                  className="py-12 text-center text-muted-foreground text-sm"
                >
                  No expenses found.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table data-ocid="expenses.table">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Farm</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Amount (₹)</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Added By</TableHead>
                        {isAdmin && (
                          <TableHead className="text-right">Action</TableHead>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {visibleExpenses.map((e, idx) => (
                        <TableRow
                          key={e.id}
                          data-ocid={`expenses.row.${idx + 1}`}
                        >
                          <TableCell>{e.date}</TableCell>
                          <TableCell>{getFarmName(e.farmId)}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{e.type}</Badge>
                          </TableCell>
                          <TableCell>{e.description}</TableCell>
                          <TableCell className="text-right font-medium">
                            ₹
                            {e.amount.toLocaleString("en-IN", {
                              maximumFractionDigits: 2,
                            })}
                          </TableCell>
                          <TableCell>{statusBadge(e.status)}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {e.addedBy}
                          </TableCell>
                          {isAdmin && (
                            <TableCell className="text-right">
                              <div className="flex gap-1 justify-end">
                                {canPrint && (
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    data-ocid={`expenses.print_button.${idx + 1}`}
                                    onClick={() => {
                                      const farm = farms.find(
                                        (f) => f.id === e.farmId,
                                      );
                                      printRecord({
                                        farmName: farm?.name,
                                        date: e.date,
                                        module: "Expense Management",
                                        generatedBy: currentUser?.name,
                                        entryDetails: {
                                          Date: e.date,
                                          Type: e.type,
                                          Description: e.description,
                                          Amount: String(e.amount),
                                          Status: e.status,
                                          "Added By": e.addedBy,
                                        },
                                      });
                                    }}
                                  >
                                    <Printer
                                      size={14}
                                      className="text-green-600"
                                    />
                                  </Button>
                                )}
                                {canDelete && (
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    data-ocid={`expenses.delete_button.${idx + 1}`}
                                    onClick={() => setDeleteTarget(e)}
                                  >
                                    <Trash2
                                      size={14}
                                      className="text-red-500"
                                    />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {isAdmin && (
          <TabsContent value="pending">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Pending Approval</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {pendingExpenses.length === 0 ? (
                  <div className="py-12 text-center text-muted-foreground text-sm">
                    No pending expenses.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Farm</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead className="text-right">
                            Amount (₹)
                          </TableHead>
                          <TableHead>Submitted By</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pendingExpenses.map((e, idx) => (
                          <TableRow key={e.id}>
                            <TableCell>{e.date}</TableCell>
                            <TableCell>{getFarmName(e.farmId)}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{e.type}</Badge>
                            </TableCell>
                            <TableCell>{e.description}</TableCell>
                            <TableCell className="text-right font-medium">
                              ₹{e.amount.toFixed(2)}
                            </TableCell>
                            <TableCell>{e.addedBy}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex gap-1 justify-end">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  data-ocid={`expenses.approve_button.${idx + 1}`}
                                  onClick={() => handleApprove(e.id)}
                                >
                                  <Check size={14} className="text-green-600" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  data-ocid={`expenses.reject_button.${idx + 1}`}
                                  onClick={() => handleReject(e.id)}
                                >
                                  <X size={14} className="text-red-500" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Expense</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 col-span-2">
                <Label>Farm *</Label>
                <Select
                  value={form.farmId}
                  onValueChange={(v) =>
                    setForm((p) => ({ ...p, farmId: v, batchId: "" }))
                  }
                >
                  <SelectTrigger data-ocid="expenses.farm.select">
                    <SelectValue placeholder="Select Farm" />
                  </SelectTrigger>
                  <SelectContent>
                    {farms.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Batch (Optional)</Label>
                <Select
                  value={form.batchId}
                  onValueChange={(v) => setForm((p) => ({ ...p, batchId: v }))}
                >
                  <SelectTrigger data-ocid="expenses.batch.select">
                    <SelectValue placeholder="All batches" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {batches.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.batchNumber}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Expense Type</Label>
                <Select
                  value={form.type}
                  onValueChange={(v) =>
                    setForm((p) => ({ ...p, type: v as Expense["type"] }))
                  }
                >
                  <SelectTrigger data-ocid="expenses.type.select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPENSE_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Amount (₹) *</Label>
                <Input
                  type="number"
                  data-ocid="expenses.amount.input"
                  value={form.amount}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, amount: e.target.value }))
                  }
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Date</Label>
                <Input
                  type="date"
                  data-ocid="expenses.date.input"
                  value={form.date}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, date: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label>Description *</Label>
                <Input
                  data-ocid="expenses.description.input"
                  value={form.description}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, description: e.target.value }))
                  }
                  placeholder="Expense description"
                />
              </div>
            </div>
            {isSupervisor && (
              <p className="text-xs text-yellow-600 bg-yellow-50 rounded p-2">
                Your expense will be submitted for Company Admin approval.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              data-ocid="expenses.cancel_button"
              onClick={() => setShowDialog(false)}
            >
              Cancel
            </Button>
            <Button data-ocid="expenses.submit_button" onClick={handleAdd}>
              Submit Expense
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(v) => {
          if (!v) setDeleteTarget(null);
        }}
        onConfirm={confirmDeleteExpense}
        recordSummary={
          deleteTarget
            ? `${deleteTarget.type} | ${deleteTarget.date}`
            : undefined
        }
      />
    </div>
  );
}
