import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "@/lib/react-router-compat";
import { storage } from "@/lib/storage";
import {
  checkTrialStatus,
  getDaysUntilTrialEnd,
  getOrCreateSubscription,
  getStatusBadgeColor,
  getStatusLabel,
  isBilledRole,
} from "@/lib/subscriptionUtils";
import {
  AlertCircle,
  Bell,
  CheckCircle2,
  Clock,
  CreditCard,
  TrendingUp,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";

export default function SubscriptionDashboard() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [_refresh, setRefresh] = useState(0);

  useEffect(() => {
    if (currentUser && isBilledRole(currentUser.role)) {
      getOrCreateSubscription(currentUser.id);
      setRefresh((r) => r + 1);
    }
  }, [currentUser]);

  const allUsers = storage.getUsers();
  const allSubs = storage.getSubscriptions();
  const notifications = currentUser
    ? storage
        .getSubscriptionNotifications()
        .filter((n) => n.userId === currentUser.id && !n.read)
    : [];

  const isAdmin =
    currentUser?.role === "SuperAdmin" || currentUser?.role === "CompanyAdmin";
  const isManagerSupervisor =
    currentUser?.role === "Manager" || currentUser?.role === "Supervisor";

  // Build subscription rows visible to current user
  let visibleSubs = allSubs;
  if (!isAdmin) {
    if (isManagerSupervisor) {
      const myFarmIds = currentUser?.assignedFarmIds ?? [];
      const farmUsers = allUsers.filter(
        (u) =>
          isBilledRole(u.role) &&
          u.assignedFarmIds?.some((fid) => myFarmIds.includes(fid)),
      );
      const farmUserIds = new Set(farmUsers.map((u) => u.id));
      visibleSubs = allSubs.filter((s) => farmUserIds.has(s.userId));
    } else {
      visibleSubs = allSubs.filter((s) => s.userId === currentUser?.id);
    }
  }

  // KPI counts
  const totalSubs = visibleSubs.length;
  const activeTrials = visibleSubs.filter(
    (s) => checkTrialStatus(s) === "trial_active",
  ).length;
  const activePaid = visibleSubs.filter((s) => s.status === "active").length;
  const pendingPayment = visibleSubs.filter(
    (s) => s.status === "pending" || s.status === "trial_expired",
  ).length;

  // For Farmer/Dealer: own card
  const ownSub = currentUser
    ? allSubs.find((s) => s.userId === currentUser.id)
    : null;
  const ownStatus = ownSub ? checkTrialStatus(ownSub) : null;
  const daysLeft = ownSub ? getDaysUntilTrialEnd(ownSub) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Billing Dashboard
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Subscription & payment overview
          </p>
        </div>
        {isAdmin && (
          <Button
            data-ocid="billing.record_payment.button"
            onClick={() => navigate("/billing/payments")}
            className="gap-2"
          >
            <CreditCard size={16} />
            Record Payment
          </Button>
        )}
      </div>

      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="space-y-2" data-ocid="billing.notifications.panel">
          {notifications.map((n) => (
            <div
              key={n.id}
              className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm"
            >
              <Bell size={16} className="text-yellow-600 mt-0.5 shrink-0" />
              <span className="text-yellow-800">{n.message}</span>
              <button
                type="button"
                className="ml-auto text-yellow-600 hover:text-yellow-800 text-xs underline shrink-0"
                onClick={() => {
                  storage.markNotificationRead(n.id);
                  setRefresh((r) => r + 1);
                }}
              >
                Dismiss
              </button>
            </div>
          ))}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Total Subscribers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users size={20} className="text-primary" />
              <span className="text-2xl font-bold">{totalSubs}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Active Trials
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock size={20} className="text-blue-500" />
              <span className="text-2xl font-bold">{activeTrials}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Active Paid
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={20} className="text-green-500" />
              <span className="text-2xl font-bold">{activePaid}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Pending Payment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertCircle size={20} className="text-yellow-500" />
              <span className="text-2xl font-bold">{pendingPayment}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Own subscription card for Farmer/Dealer */}
      {(currentUser?.role === "Farmer" || currentUser?.role === "Dealer") &&
        ownSub && (
          <Card data-ocid="billing.own_subscription.card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp size={18} className="text-primary" />
                My Subscription
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <span
                    className={`mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadgeColor(
                      ownStatus ?? ownSub.status,
                    )}`}
                  >
                    {getStatusLabel(ownStatus ?? ownSub.status)}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Farm Capacity</p>
                  <p className="text-lg font-semibold">
                    {ownSub.farmCapacity.toLocaleString()} birds
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    Monthly Amount
                  </p>
                  <p className="text-lg font-semibold">
                    ₹{ownSub.monthlyAmount.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    {ownSub.status === "trial_active"
                      ? "Trial Ends"
                      : "Trial Period"}
                  </p>
                  <p className="text-lg font-semibold">
                    {ownSub.status === "trial_active"
                      ? `${daysLeft} days left`
                      : ownSub.trialEndDate}
                  </p>
                </div>
              </div>
              {(ownStatus === "trial_expired" ||
                ownSub.status === "pending") && (
                <div className="flex items-center gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <AlertCircle size={16} className="text-orange-600" />
                  <p className="text-sm text-orange-800">
                    Your trial has expired. Please make a payment to activate
                    your subscription.
                  </p>
                  <Button
                    size="sm"
                    className="ml-auto"
                    data-ocid="billing.make_payment.button"
                    onClick={() => navigate("/billing/payments")}
                  >
                    Pay Now
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

      {/* Subscriptions table — admins / managers */}
      {(isAdmin || isManagerSupervisor) && (
        <Card>
          <CardHeader>
            <CardTitle>Client Subscriptions</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {visibleSubs.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center py-12 text-muted-foreground"
                data-ocid="billing.subscriptions.empty_state"
              >
                <Users size={36} className="mb-2 opacity-30" />
                <p>No subscriptions found.</p>
              </div>
            ) : (
              <Table data-ocid="billing.subscriptions.table">
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Trial End</TableHead>
                    <TableHead>Capacity (birds)</TableHead>
                    <TableHead>Monthly (₹)</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleSubs.map((sub, idx) => {
                    const user = allUsers.find((u) => u.id === sub.userId);
                    const computedStatus = checkTrialStatus(sub);
                    return (
                      <TableRow
                        key={sub.id}
                        data-ocid={`billing.subscription.item.${idx + 1}`}
                      >
                        <TableCell className="font-medium">
                          {user?.name ?? "Unknown"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{sub.userRole}</Badge>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusBadgeColor(
                              computedStatus,
                            )}`}
                          >
                            {getStatusLabel(computedStatus)}
                          </span>
                        </TableCell>
                        <TableCell>{sub.trialEndDate}</TableCell>
                        <TableCell>
                          {sub.farmCapacity.toLocaleString()}
                        </TableCell>
                        <TableCell>₹{sub.monthlyAmount.toFixed(2)}</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            data-ocid={`billing.subscription.edit_button.${idx + 1}`}
                            onClick={() => navigate("/billing/manage")}
                          >
                            Manage
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
