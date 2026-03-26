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
import { storage } from "@/lib/storage";
import {
  calculateMonthlyAmount,
  checkTrialStatus,
  getOrCreateSubscription,
  getStatusBadgeColor,
  getStatusLabel,
  isBilledRole,
} from "@/lib/subscriptionUtils";
import { RefreshCw, Settings, Shield, UserCheck, UserX } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function SubscriptionManagement() {
  const { currentUser: _cu } = useAuth();
  const { users: companyUsers, isSuperAdmin } = useCompanyScope();
  const [_refresh, setRefresh] = useState(0);
  const [statusFilter, setStatusFilter] = useState("all");
  const [overrideDialogOpen, setOverrideDialogOpen] = useState(false);
  const [selectedSubId, setSelectedSubId] = useState<string | null>(null);
  const [overrideRate, setOverrideRate] = useState("");
  const [overrideMin, setOverrideMin] = useState("");

  const allUsers = isSuperAdmin ? storage.getUsers() : companyUsers;
  const allSubsFull = storage.getSubscriptions();
  let subs = isSuperAdmin
    ? allSubsFull
    : allSubsFull.filter((s) => allUsers.some((u) => u.id === s.userId));

  if (statusFilter !== "all") {
    subs = subs.filter((s) => checkTrialStatus(s) === statusFilter);
  }

  const eligibleUsers = allUsers.filter((u) => isBilledRole(u.role));
  const usersWithoutSub = eligibleUsers.filter(
    (u) => !storage.getSubscriptionByUserId(u.id),
  );

  function handleCheckAllTrials() {
    const all = storage.getSubscriptions();
    let updated = 0;
    for (const sub of all) {
      const newStatus = checkTrialStatus(sub);
      if (newStatus !== sub.status) {
        storage.updateSubscription(sub.id, { status: newStatus });
        if (newStatus === "trial_expired") {
          storage.addSubscriptionNotification({
            userId: sub.userId,
            type: "payment_pending",
            message:
              "Your free trial has expired. Please make a payment to continue using Poultrix.",
            date: new Date().toISOString().slice(0, 10),
            read: false,
          });
        }
        updated++;
      }
    }
    toast.success(`Checked all trials. ${updated} subscriptions updated.`);
    setRefresh((r) => r + 1);
  }

  function handleActivateTrial(userId: string) {
    getOrCreateSubscription(userId);
    toast.success("Trial subscription created.");
    setRefresh((r) => r + 1);
  }

  function handleSuspend(subId: string) {
    storage.updateSubscription(subId, {
      status: "suspended",
      suspendedAt: new Date().toISOString().slice(0, 10),
    });
    toast.success("Subscription suspended.");
    setRefresh((r) => r + 1);
  }

  function handleActivate(subId: string) {
    storage.updateSubscription(subId, {
      status: "active",
      activatedAt: new Date().toISOString().slice(0, 10),
    });
    toast.success("Subscription activated.");
    setRefresh((r) => r + 1);
  }

  function openOverride(subId: string) {
    const sub = storage.getSubscriptions().find((s) => s.id === subId);
    if (sub) {
      setOverrideRate(String(sub.perBirdRate));
      setOverrideMin(String(sub.minSubscription));
    }
    setSelectedSubId(subId);
    setOverrideDialogOpen(true);
  }

  function handleOverrideSave() {
    if (!selectedSubId) return;
    const rate = Number.parseFloat(overrideRate);
    const min = Number.parseFloat(overrideMin);
    if (Number.isNaN(rate) || Number.isNaN(min)) {
      toast.error("Please enter valid numbers.");
      return;
    }
    const sub = storage.getSubscriptions().find((s) => s.id === selectedSubId);
    if (!sub) return;
    const newAmount = calculateMonthlyAmount(sub.farmCapacity, rate, min);
    storage.updateSubscription(selectedSubId, {
      perBirdRate: rate,
      minSubscription: min,
      monthlyAmount: newAmount,
    });
    toast.success("Subscription rates updated.");
    setOverrideDialogOpen(false);
    setRefresh((r) => r + 1);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Manage Subscriptions</h1>
          <p className="text-sm text-muted-foreground">
            Override rates, manage status, and check trials
          </p>
        </div>
        <Button
          variant="outline"
          className="gap-2"
          data-ocid="billing.check_trials.button"
          onClick={handleCheckAllTrials}
        >
          <RefreshCw size={16} />
          Check All Trials
        </Button>
      </div>

      {/* Users without subscription */}
      {usersWithoutSub.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Eligible Users Without Subscription
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usersWithoutSub.map((u, idx) => (
                  <TableRow
                    key={u.id}
                    data-ocid={`billing.nosub.item.${idx + 1}`}
                  >
                    <TableCell className="font-medium">{u.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{u.role}</Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        data-ocid={`billing.activate_trial.button.${idx + 1}`}
                        onClick={() => handleActivateTrial(u.id)}
                      >
                        Activate Trial
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Label className="text-sm">Filter by status:</Label>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger
            className="w-48"
            data-ocid="billing.status_filter.select"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="trial_active">Free Trial</SelectItem>
            <SelectItem value="trial_expired">Trial Expired</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Subscriptions table */}
      <Card>
        <CardContent className="p-0">
          <Table data-ocid="billing.manage.table">
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Trial End</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead>Rate (₹/bird)</TableHead>
                <TableHead>Min (₹)</TableHead>
                <TableHead>Monthly (₹)</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subs.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="text-center py-10 text-muted-foreground"
                  >
                    No subscriptions found.
                  </TableCell>
                </TableRow>
              ) : (
                subs.map((sub, idx) => {
                  const user = allUsers.find((u) => u.id === sub.userId);
                  const status = checkTrialStatus(sub);
                  return (
                    <TableRow
                      key={sub.id}
                      data-ocid={`billing.manage.item.${idx + 1}`}
                    >
                      <TableCell className="font-medium">
                        {user?.name ?? "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{sub.userRole}</Badge>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusBadgeColor(status)}`}
                        >
                          {getStatusLabel(status)}
                        </span>
                      </TableCell>
                      <TableCell>{sub.trialEndDate}</TableCell>
                      <TableCell>{sub.farmCapacity.toLocaleString()}</TableCell>
                      <TableCell>₹{sub.perBirdRate.toFixed(2)}</TableCell>
                      <TableCell>₹{sub.minSubscription}</TableCell>
                      <TableCell>₹{sub.monthlyAmount.toFixed(2)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            data-ocid={`billing.manage.override.button.${idx + 1}`}
                            onClick={() => openOverride(sub.id)}
                            title="Override Rate"
                          >
                            <Settings size={14} />
                          </Button>
                          {status !== "active" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-700 border-green-200"
                              data-ocid={`billing.manage.activate.button.${idx + 1}`}
                              onClick={() => handleActivate(sub.id)}
                              title="Activate"
                            >
                              <UserCheck size={14} />
                            </Button>
                          )}
                          {status !== "suspended" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-700 border-red-200"
                              data-ocid={`billing.manage.suspend.button.${idx + 1}`}
                              onClick={() => handleSuspend(sub.id)}
                              title="Suspend"
                            >
                              <UserX size={14} />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Override Dialog */}
      <Dialog open={overrideDialogOpen} onOpenChange={setOverrideDialogOpen}>
        <DialogContent data-ocid="billing.override.dialog">
          <DialogHeader>
            <DialogTitle>Override Subscription Rates</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>Per Bird Rate (₹)</Label>
              <Input
                type="number"
                step="0.01"
                value={overrideRate}
                onChange={(e) => setOverrideRate(e.target.value)}
                data-ocid="billing.override.rate.input"
              />
            </div>
            <div className="space-y-1">
              <Label>Minimum Subscription (₹)</Label>
              <Input
                type="number"
                value={overrideMin}
                onChange={(e) => setOverrideMin(e.target.value)}
                data-ocid="billing.override.min.input"
              />
            </div>
            {overrideRate &&
              overrideMin &&
              (() => {
                const sub = selectedSubId
                  ? storage
                      .getSubscriptions()
                      .find((s) => s.id === selectedSubId)
                  : null;
                if (!sub) return null;
                const preview = calculateMonthlyAmount(
                  sub.farmCapacity,
                  Number.parseFloat(overrideRate) || 0,
                  Number.parseFloat(overrideMin) || 0,
                );
                return (
                  <p className="text-sm text-muted-foreground">
                    Calculated monthly amount:{" "}
                    <strong>₹{preview.toFixed(2)}</strong>
                  </p>
                );
              })()}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              data-ocid="billing.override.cancel.button"
              onClick={() => setOverrideDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              data-ocid="billing.override.save.button"
              onClick={handleOverrideSave}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
