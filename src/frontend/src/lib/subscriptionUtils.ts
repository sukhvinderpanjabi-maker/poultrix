import { type SubscriptionRecord, storage } from "./storage";

const BILLED_ROLES = ["CompanyAdmin", "Dealer", "Farmer"] as const;

export function isBilledRole(role: string): boolean {
  return BILLED_ROLES.includes(role as (typeof BILLED_ROLES)[number]);
}

export function calculateMonthlyAmount(
  farmCapacity: number,
  perBirdRate: number,
  minSubscription: number,
): number {
  return Math.max(farmCapacity * perBirdRate, minSubscription);
}

export function getOrCreateSubscription(
  userId: string,
): SubscriptionRecord | null {
  const user = storage.getUsers().find((u) => u.id === userId);
  if (!user || !isBilledRole(user.role)) return null;

  const existing = storage.getSubscriptionByUserId(userId);
  if (existing) return existing;

  const farms = storage.getFarms();
  let userFarms = farms;
  if (user.assignedFarmIds && user.assignedFarmIds.length > 0) {
    userFarms = farms.filter((f) => user.assignedFarmIds!.includes(f.id));
  }
  const totalCapacity = userFarms.reduce(
    (sum, f) => sum + (f.totalCapacity || 0),
    0,
  );

  const today = new Date();
  const trialEnd = new Date(today);
  trialEnd.setDate(trialEnd.getDate() + 15);

  const record = storage.addSubscription({
    userId,
    userRole: user.role as SubscriptionRecord["userRole"],
    trialStartDate: today.toISOString().slice(0, 10),
    trialEndDate: trialEnd.toISOString().slice(0, 10),
    status: "trial_active",
    farmCapacity: totalCapacity,
    perBirdRate: 0.5,
    minSubscription: 499,
    monthlyAmount: calculateMonthlyAmount(totalCapacity, 0.5, 499),
  });

  storage.addSubscriptionNotification({
    userId,
    type: "trial_ending",
    message: `Your 15-day free trial started. It will expire on ${trialEnd.toISOString().slice(0, 10)}.`,
    date: today.toISOString().slice(0, 10),
    read: false,
  });

  return record;
}

export function checkTrialStatus(
  sub: SubscriptionRecord,
): SubscriptionRecord["status"] {
  if (sub.status !== "trial_active") return sub.status;
  const today = new Date().toISOString().slice(0, 10);
  if (today > sub.trialEndDate) return "trial_expired";
  return "trial_active";
}

export function getDaysUntilTrialEnd(sub: SubscriptionRecord): number {
  const today = new Date();
  const end = new Date(sub.trialEndDate);
  const diff = Math.ceil(
    (end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );
  return Math.max(0, diff);
}

export function getStatusBadgeColor(
  status: SubscriptionRecord["status"],
): string {
  switch (status) {
    case "trial_active":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "trial_expired":
      return "bg-orange-100 text-orange-700 border-orange-200";
    case "active":
      return "bg-green-100 text-green-700 border-green-200";
    case "pending":
      return "bg-yellow-100 text-yellow-700 border-yellow-200";
    case "suspended":
      return "bg-red-100 text-red-700 border-red-200";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
}

export function getStatusLabel(status: SubscriptionRecord["status"]): string {
  switch (status) {
    case "trial_active":
      return "Free Trial";
    case "trial_expired":
      return "Trial Expired";
    case "active":
      return "Active";
    case "pending":
      return "Payment Pending";
    case "suspended":
      return "Suspended";
    default:
      return status;
  }
}
