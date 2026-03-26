import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { storage } from "@/lib/storage";
import { isBilledRole } from "@/lib/subscriptionUtils";
import { CheckCircle2, PlusCircle, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const PAYMENT_METHODS = [
  "PhonePe",
  "Google Pay",
  "UPI",
  "Net Banking",
  "Debit Card",
  "Credit Card",
  "Cash",
] as const;

function statusBadge(status: string) {
  if (status === "Paid") return "bg-green-100 text-green-700 border-green-200";
  if (status === "Failed") return "bg-red-100 text-red-700 border-red-200";
  return "bg-yellow-100 text-yellow-700 border-yellow-200";
}

export default function SubscriptionPayments() {
  const { currentUser } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("All");
  const [_refresh, setRefresh] = useState(0);

  const [formClient, setFormClient] = useState("");
  const [formMethod, setFormMethod] = useState("");
  const [formRef, setFormRef] = useState("");
  const [formDate, setFormDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [formAmount, setFormAmount] = useState("");

  const isAdmin =
    currentUser?.role === "SuperAdmin" || currentUser?.role === "CompanyAdmin";
  const allUsers = storage.getUsers();
  const eligibleUsers = allUsers.filter((u) => isBilledRole(u.role));

  let payments = storage.getSubscriptionPayments();
  if (!isAdmin && currentUser) {
    payments = payments.filter((p) => p.userId === currentUser.id);
  }
  if (statusFilter !== "All") {
    payments = payments.filter((p) => p.status === statusFilter);
  }

  function handleClientChange(userId: string) {
    setFormClient(userId);
    const sub = storage.getSubscriptionByUserId(userId);
    if (sub) setFormAmount(String(sub.monthlyAmount));
  }

  function handleRecordPayment() {
    if (!formClient || !formMethod || !formRef || !formDate || !formAmount) {
      toast.error("Please fill all fields.");
      return;
    }
    const sub = storage.getSubscriptionByUserId(formClient);
    storage.addSubscriptionPayment({
      subscriptionId: sub?.id ?? "",
      userId: formClient,
      paymentMethod: formMethod as (typeof PAYMENT_METHODS)[number],
      paymentReference: formRef,
      paymentDate: formDate,
      amount: Number.parseFloat(formAmount),
      status: "Pending",
    });
    toast.success("Payment recorded as Pending. Admin verification required.");
    setDialogOpen(false);
    setFormClient("");
    setFormMethod("");
    setFormRef("");
    setFormAmount("");
    setRefresh((r) => r + 1);
  }

  function handleVerifyAndActivate(paymentId: string) {
    const payment = storage
      .getSubscriptionPayments()
      .find((p) => p.id === paymentId);
    if (!payment) return;

    // Mark payment as Paid
    storage.updateSubscriptionPayment(paymentId, {
      status: "Paid",
      verifiedBy: currentUser?.id,
      verifiedAt: new Date().toISOString().slice(0, 10),
    });

    // Activate subscription
    const sub = storage.getSubscriptionByUserId(payment.userId);
    if (sub) {
      storage.updateSubscription(sub.id, {
        status: "active",
        activatedAt: new Date().toISOString().slice(0, 10),
      });
    }

    // Generate invoice
    const now = new Date();
    const period = now.toLocaleString("en-IN", {
      month: "long",
      year: "numeric",
    });
    const invoice = storage.addSubscriptionInvoice({
      subscriptionId: sub?.id ?? "",
      userId: payment.userId,
      paymentId,
      invoiceDate: now.toISOString().slice(0, 10),
      period,
      totalBirds: sub?.farmCapacity ?? 0,
      perBirdRate: sub?.perBirdRate ?? 0.5,
      calculatedAmount: (sub?.farmCapacity ?? 0) * (sub?.perBirdRate ?? 0.5),
      minimumAmount: sub?.minSubscription ?? 499,
      finalAmount: payment.amount,
      status: "paid",
    });

    // Link invoice to payment
    storage.updateSubscriptionPayment(paymentId, { invoiceId: invoice.id });

    // Notification
    storage.addSubscriptionNotification({
      userId: payment.userId,
      type: "invoice_generated",
      message: `Invoice ${invoice.invoiceNumber} has been generated for your subscription payment of ₹${payment.amount.toFixed(2)}.`,
      date: now.toISOString().slice(0, 10),
      read: false,
    });
    storage.addSubscriptionNotification({
      userId: payment.userId,
      type: "subscription_active",
      message: "Your subscription is now active. Thank you for your payment!",
      date: now.toISOString().slice(0, 10),
      read: false,
    });

    toast.success(
      "Payment verified, subscription activated, invoice generated.",
    );
    setRefresh((r) => r + 1);
  }

  function handleMarkFailed(paymentId: string) {
    storage.updateSubscriptionPayment(paymentId, { status: "Failed" });
    const payment = storage
      .getSubscriptionPayments()
      .find((p) => p.id === paymentId);
    if (payment) {
      storage.addSubscriptionNotification({
        userId: payment.userId,
        type: "payment_failed",
        message:
          "Your payment could not be verified and was marked as failed. Please retry or contact support.",
        date: new Date().toISOString().slice(0, 10),
        read: false,
      });
    }
    toast.error("Payment marked as failed.");
    setRefresh((r) => r + 1);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Payments</h1>
          <p className="text-sm text-muted-foreground">
            Record and verify subscription payments
          </p>
        </div>
        {isAdmin && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button
                className="gap-2"
                data-ocid="billing.payments.open_modal_button"
              >
                <PlusCircle size={16} />
                Record New Payment
              </Button>
            </DialogTrigger>
            <DialogContent data-ocid="billing.payments.dialog">
              <DialogHeader>
                <DialogTitle>Record New Payment</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-1">
                  <Label>Client</Label>
                  <Select value={formClient} onValueChange={handleClientChange}>
                    <SelectTrigger data-ocid="billing.payments.client.select">
                      <SelectValue placeholder="Select client" />
                    </SelectTrigger>
                    <SelectContent>
                      {eligibleUsers.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.name} ({u.role})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Payment Method</Label>
                  <Select value={formMethod} onValueChange={setFormMethod}>
                    <SelectTrigger data-ocid="billing.payments.method.select">
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_METHODS.map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Payment Reference</Label>
                  <Input
                    value={formRef}
                    onChange={(e) => setFormRef(e.target.value)}
                    placeholder="UTR / Transaction ID"
                    data-ocid="billing.payments.reference.input"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Payment Date</Label>
                  <Input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    data-ocid="billing.payments.date.input"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Amount (₹)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    data-ocid="billing.payments.amount.input"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  data-ocid="billing.payments.cancel.button"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  data-ocid="billing.payments.submit.button"
                  onClick={handleRecordPayment}
                >
                  Record Payment
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Label className="text-sm">Filter:</Label>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger
            className="w-40"
            data-ocid="billing.payments.filter.select"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Paid">Paid</SelectItem>
            <SelectItem value="Failed">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {payments.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-16 text-muted-foreground"
              data-ocid="billing.payments.empty_state"
            >
              <CheckCircle2 size={40} className="mb-3 opacity-30" />
              <p>No payments recorded yet.</p>
            </div>
          ) : (
            <Table data-ocid="billing.payments.table">
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount (₹)</TableHead>
                  <TableHead>Status</TableHead>
                  {isAdmin && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((pmt, idx) => {
                  const user = allUsers.find((u) => u.id === pmt.userId);
                  return (
                    <TableRow
                      key={pmt.id}
                      data-ocid={`billing.payments.item.${idx + 1}`}
                    >
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">
                            {user?.name ?? "—"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {user?.role}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{pmt.paymentMethod}</TableCell>
                      <TableCell className="font-mono text-sm">
                        {pmt.paymentReference}
                      </TableCell>
                      <TableCell>{pmt.paymentDate}</TableCell>
                      <TableCell className="font-semibold">
                        ₹{pmt.amount.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${statusBadge(pmt.status)}`}
                        >
                          {pmt.status}
                        </span>
                      </TableCell>
                      {isAdmin && (
                        <TableCell>
                          {pmt.status === "Pending" && (
                            <div className="flex items-center gap-1">
                              <Button
                                size="sm"
                                className="gap-1 text-green-700"
                                variant="outline"
                                data-ocid={`billing.payments.verify.button.${idx + 1}`}
                                onClick={() => handleVerifyAndActivate(pmt.id)}
                              >
                                <CheckCircle2 size={13} />
                                Verify
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="gap-1 text-red-600"
                                data-ocid={`billing.payments.failed.button.${idx + 1}`}
                                onClick={() => handleMarkFailed(pmt.id)}
                              >
                                <XCircle size={13} />
                                Failed
                              </Button>
                            </div>
                          )}
                          {pmt.status !== "Pending" && (
                            <span className="text-xs text-muted-foreground">
                              {pmt.status === "Paid"
                                ? `Verified ${pmt.verifiedAt ?? ""}`
                                : "—"}
                            </span>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
