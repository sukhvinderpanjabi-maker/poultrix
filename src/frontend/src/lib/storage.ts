import { generateSerialNumber } from "./identityGenerator";

export const UNASSIGNED_SENTINEL = "__UNASSIGNED__";

// ---- Environment Detection ----
export function getEnvironment(): "draft" | "live" | "local" {
  const host = window.location.hostname;
  if (host === "localhost" || host === "127.0.0.1") return "local";
  if (host.includes("caffeine.xyz") && !host.startsWith("poultrix-tqy"))
    return "draft";
  return "live";
}

// Log environment once on load
const _env = getEnvironment();
console.log(
  `[ENV] Poultrix running in "${_env}" environment | host: ${window.location.hostname} | storage: localStorage (browser-scoped)`,
);

export type Farm = {
  id: string;
  name: string;
  location: string;
  totalCapacity: number;
  companyId?: string;
  zoneId?: string;
  branchId?: string;
  farmerName?: string;
  farmerContact?: string;
  address?: string;
  supervisorId?: string;
  dealerId?: string;
};
export type Shed = {
  id: string;
  name: string;
  farmId: string;
  capacity: number;
  shedType?: "Open" | "Environment Controlled";
};
export type Batch = {
  id: string;
  batchNumber: string;
  farmId: string;
  shedId: string;
  placementDate: string;
  hatcheryName: string;
  breedType: string;
  chicksQty: number;
  chicksRate: number;
  transportCost: number;
  totalPlacementCost: number;
  birdsAlive: number;
  status: "active" | "sold" | "closed";
  initialBodyWeightGrams?: number;
};
export type DailyEntry = {
  id: string;
  batchId: string;
  entryDate: string;
  birdsAlive: number;
  mortalityCount: number;
  cullBirds: number;
  feedIntakeGrams: number;
  bodyWeightGrams: number;
  waterConsumptionLiters: number;
  fcr: number;
  mortalityPct: number;
  cumulativeFeed: number;
  medicineUsed?: string;
  vaccineUsed?: string;
  remarks?: string;
};
export type FeedType = {
  id: string;
  name: string;
  description: string;
  companyId?: string;
};
export type FeedSupplier = {
  id: string;
  name: string;
  contactName: string;
  phone: string;
  companyId?: string;
};
export type FeedPurchase = {
  id: string;
  supplierName: string;
  supplierIdRef?: string;
  feedType: string;
  quantityBags: number;
  quantityKg: number;
  ratePerBag: number;
  discountAmount: number;
  totalAmount: number;
  purchaseDate: string;
  challanNumber?: string;
  branchId?: string;
  receivingFarmId?: string;
};
export type FeedStock = {
  id: string;
  farmId: string;
  feedType: string;
  currentStockBags: number;
  alertThresholdBags: number;
  openingStockKg: number;
};
export type FeedIssue = {
  id: string;
  farmId: string;
  shedId: string;
  feedType: string;
  quantityBags: number;
  quantityKg: number;
  issueDate: string;
  zoneId?: string;
  branchId?: string;
};
export type BirdSale = {
  id: string;
  farmId: string;
  batchId: string;
  birdsQty: number;
  avgWeightKg: number;
  ratePerKg: number;
  totalWeightKg: number;
  totalAmount: number;
  traderName: string;
  vehicleNumber: string;
  dispatchDate: string;
};
export type User = {
  id: string;
  username: string;
  password: string;
  role:
    | "SuperAdmin"
    | "CompanyAdmin"
    | "Dealer"
    | "Farmer"
    | "Manager"
    | "Supervisor"
    | "Staff";
  companyId?: string;
  createdBy?: string;
  name: string;
  employeeId?: string;
  mobileNumber?: string;
  email?: string;
  assignedArea?: string;
  assignedFarmIds?: string[];
  assignedZoneIds?: string[];
  assignedBranchIds?: string[];
  assignedShedId?: string;
  active?: boolean;
  signupStatus?: "pending" | "approved" | "rejected";
  serialNumber?: string;
  passwordHistory?: string[];
  passwordLastChanged?: string;
  permissions?: {
    canUpdate?: boolean;
    canDelete?: boolean;
    canPrint?: boolean;
  };
};

export type SignupRequest = {
  id: string;
  fullName: string;
  mobileNumber: string;
  email: string;
  farmName: string;
  state: string;
  city: string;
  role: "Farmer" | "Dealer" | "Company";
  birdCapacity: number;
  password: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  userId?: string;
  rejectionReason?: string;
};
export type AuditLog = {
  id: string;
  module: string;
  action: "delete";
  recordId: string;
  recordSummary: string;
  deletedBy: string;
  deletedByRole: string;
  companyId?: string;
  date: string;
  time: string;
};
export type Company = {
  id: string;
  name: string;
  address: string;
  logoUrl?: string;
  contactNumber?: string;
  email?: string;
  subscriptionPlan?: "Basic" | "Standard" | "Premium";
  farmCapacityLimit?: number;
  codePrefix?: string;
};
export type Zone = {
  id: string;
  companyId: string;
  name: string;
};
export type Branch = {
  id: string;
  zoneId: string;
  companyId: string;
  name: string;
  branchCode?: string;
  address?: string;
  branchManagerId?: string;
  contactNumber?: string;
};
export type Medicine = {
  id: string;
  name: string;
};
export type Vaccine = {
  id: string;
  name: string;
};
export type Payment = {
  id: string;
  date: string;
  farmId: string;
  amount: number;
  paymentType: "Cash" | "Online";
  description: string;
  enteredBy: string;
};
export type Receipt = {
  id: string;
  date: string;
  farmId: string;
  amount: number;
  paymentType: "Cash" | "Online";
  notes: string;
  enteredBy: string;
};
export type GCScheme = {
  id: string;
  companyId: string;
  name: string;
  baseGCRate: number;
  standardFCR: number;
  standardMortalityPct: number;
  fcrBonusPerBird: number;
  mortalityPenaltyPerBird: number;
};
export type GCSettlement = {
  id: string;
  batchId: string;
  batchNumber: string;
  farmId: string;
  schemeId: string;
  birdsPlaced: number;
  birdsSold: number;
  mortalityCount: number;
  mortalityPct: number;
  totalFeedKg: number;
  avgBodyWeightKg: number;
  finalFCR: number;
  gcRatePerBird: number;
  fcrBonus: number;
  mortalityPenalty: number;
  totalGCPayable: number;
  closedAt: string;
  closedBy: string;
};

// ---- Subscription & Billing Types ----
export type SubscriptionRecord = {
  id: string;
  userId: string;
  userRole: "CompanyAdmin" | "Dealer" | "Farmer";
  trialStartDate: string;
  trialEndDate: string;
  status: "trial_active" | "trial_expired" | "active" | "pending" | "suspended";
  farmCapacity: number;
  perBirdRate: number;
  minSubscription: number;
  monthlyAmount: number;
  activatedAt?: string;
  suspendedAt?: string;
};

export type SubscriptionPaymentRecord = {
  id: string;
  subscriptionId: string;
  userId: string;
  paymentMethod:
    | "PhonePe"
    | "Google Pay"
    | "UPI"
    | "Net Banking"
    | "Debit Card"
    | "Credit Card"
    | "Cash";
  paymentReference: string;
  paymentDate: string;
  amount: number;
  status: "Pending" | "Paid" | "Failed";
  verifiedBy?: string;
  verifiedAt?: string;
  invoiceId?: string;
};

export type SubscriptionInvoice = {
  id: string;
  invoiceNumber: string;
  subscriptionId: string;
  userId: string;
  paymentId: string;
  invoiceDate: string;
  period: string;
  totalBirds: number;
  perBirdRate: number;
  calculatedAmount: number;
  minimumAmount: number;
  finalAmount: number;
  status: "paid";
};

export type SubscriptionNotification = {
  id: string;
  userId: string;
  type:
    | "trial_ending"
    | "payment_pending"
    | "invoice_generated"
    | "payment_failed"
    | "subscription_active";
  message: string;
  date: string;
  read: boolean;
};

// ---- General Notification Type ----
export type Notification = {
  id: string;
  userId: string; // recipient user id, or 'all' for broadcast
  companyId?: string;
  type:
    | "sub_user_assigned"
    | "expense_pending"
    | "settlement_pending"
    | "report_ready"
    | "trial_expiring"
    | "payment_pending"
    | "general";
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
};

function get<T>(key: string): T[] {
  try {
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch {
    return [];
  }
}
function set<T>(key: string, data: T[]) {
  localStorage.setItem(key, JSON.stringify(data));
}
const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

function padNum(n: number) {
  return String(n).padStart(3, "0");
}

// Seed default superadmin
function seedUsers() {
  const users = get<User>("px_users");
  if (users.length === 0) {
    set("px_users", [
      {
        id: "sa-1",
        username: "superadmin",
        password: "Admin@123",
        role: "SuperAdmin",
        name: "Super Admin",
        employeeId: "EMP-001",
        active: true,
      },
    ]);
  }
}
seedUsers();

// Seed demo user for testing — runs every load, ensures demo1990 always exists
function seedDemoUser() {
  // Ensure demo company exists
  const companies = get<Company>("px_companies");
  const demoCompanyId = "demo-company-001";
  if (!companies.find((c) => c.id === demoCompanyId)) {
    set("px_companies", [
      ...companies,
      {
        id: demoCompanyId,
        name: "Demo Poultry Pvt Ltd",
        address: "Demo Address, City",
        contactNumber: "9999999999",
        email: "demo@poultrix.com",
        subscriptionPlan: "Standard" as const,
      },
    ]);
  }

  const users = get<User>("px_users");
  const exists = users.find((u) => u.username === "demo1990");
  if (!exists) {
    set("px_users", [
      ...users,
      {
        id: "demo-1990",
        username: "demo1990",
        password: "demo@123",
        role: "CompanyAdmin" as const,
        name: "Demo User 1990",
        employeeId: "EMP-DEMO",
        companyId: demoCompanyId,
        active: true,
      },
    ]);
  } else if (!exists.companyId) {
    // Fix existing demo user that is missing companyId
    set(
      "px_users",
      users.map((u) =>
        u.username === "demo1990" ? { ...u, companyId: demoCompanyId } : u,
      ),
    );
  }
}
seedDemoUser();

// Seed default feed types
function seedFeedTypes() {
  const types = get<FeedType>("px_feed_types");
  if (types.length === 0) {
    set("px_feed_types", [
      { id: "ft-1", name: "Pre-Starter", description: "For chicks 1-7 days" },
      { id: "ft-2", name: "Starter", description: "For chicks 8-21 days" },
      { id: "ft-3", name: "Grower", description: "For birds 22-35 days" },
      {
        id: "ft-4",
        name: "Finisher",
        description: "For birds 35+ days before sale",
      },
    ]);
  }
}
seedFeedTypes();

// Seed default general notifications for superadmin
function seedNotifications() {
  const notifs = get<Notification>("px_notifications");
  if (notifs.length === 0) {
    const now = new Date().toISOString();
    set("px_notifications", [
      {
        id: "notif-1",
        userId: "sa-1",
        type: "general" as const,
        title: "Welcome to Poultrix",
        message:
          "Welcome to Poultrix Smart Poultry Farm Management Platform. Get started by setting up your company structure.",
        read: false,
        createdAt: now,
      },
      {
        id: "notif-2",
        userId: "sa-1",
        type: "trial_expiring" as const,
        title: "Trial Expires in 3 Days",
        message:
          "Your free trial period ends in 3 days. Please activate your subscription to continue using Poultrix.",
        read: false,
        createdAt: now,
      },
      {
        id: "notif-3",
        userId: "sa-1",
        type: "settlement_pending" as const,
        title: "New Settlement Pending Review",
        message:
          "A new Growing Charge settlement is awaiting your review and confirmation in the Finance module.",
        read: false,
        createdAt: now,
      },
    ]);
  }
}
seedNotifications();

// Seed test supervisor user created by demo Company Admin
function seedSupervisor01() {
  const users = get<User>("px_users");
  const exists = users.find((u) => u.username === "supervisor01");
  if (!exists) {
    set("px_users", [
      ...users,
      {
        id: "supervisor01-id",
        username: "supervisor01",
        password: "123456",
        role: "Supervisor" as const,
        name: "Test Supervisor",
        employeeId: "EMP-SUP01",
        companyId: "demo-company-001",
        createdBy: "demo-1990",
        active: true,
      },
    ]);
  }
}
seedSupervisor01();
// Seed sukhvinder9929 test user
function seedSukhvinder() {
  const users = get<User>("px_users");
  const exists = users.find(
    (u) => u.username.toLowerCase() === "sukhvinder9929",
  );
  if (!exists) {
    set("px_users", [
      ...users,
      {
        id: "sukhvinder-9929-id",
        username: "sukhvinder9929",
        password: "Sukh@123",
        role: "CompanyAdmin" as const,
        name: "Sukhvinder",
        employeeId: "ADM-0002",
        companyId: "demo-company-001",
        active: true,
      },
    ]);
  } else if (exists.password !== "Sukh@123") {
    set(
      "px_users",
      users.map((u) =>
        u.username.toLowerCase() === "sukhvinder9929"
          ? { ...u, password: "Sukh@123", active: true }
          : u,
      ),
    );
  }
}
seedSukhvinder();

// Seed second test company for isolation testing
function seedTestCompany2() {
  const companies = get<Company>("px_companies");
  const testCompanyId = "test-company-002";
  if (!companies.find((c) => c.id === testCompanyId)) {
    set("px_companies", [
      ...companies,
      {
        id: testCompanyId,
        name: "Test Agro Pvt Ltd",
        address: "Test Address, City",
        contactNumber: "8888888888",
        email: "testadmin@poultrix.com",
        subscriptionPlan: "Basic" as const,
      },
    ]);
  }
  const users = get<User>("px_users");
  const exists = users.find((u) => u.username === "testadmin");
  if (!exists) {
    set("px_users", [
      ...users,
      {
        id: "testadmin-002",
        username: "testadmin",
        password: "Test@123",
        role: "CompanyAdmin" as const,
        name: "Test Admin",
        employeeId: "ADM-TC002",
        companyId: testCompanyId,
        active: true,
      },
    ]);
  }
}
seedTestCompany2();

// Seed admin123 test user
function seedAdmin123() {
  const users = get<User>("px_users");
  const exists = users.find((u) => u.username === "admin123");
  if (!exists) {
    set("px_users", [
      ...users,
      {
        id: "admin123-id",
        username: "admin123",
        password: "123456",
        role: "CompanyAdmin" as const,
        name: "Admin User 123",
        employeeId: "ADM-0003",
        companyId: "demo-company-001",
        active: true,
      },
    ]);
  } else {
    // Ensure password and active status are correct
    if (
      exists.password !== "123456" ||
      exists.active === false ||
      !exists.companyId
    ) {
      set(
        "px_users",
        users.map((u) =>
          u.username === "admin123"
            ? {
                ...u,
                password: "123456",
                active: true,
                companyId: "demo-company-001",
              }
            : u,
        ),
      );
    }
  }
  // Also ensure sukhvinder9929 has companyId
  const allUsers = get<User>("px_users");
  const sukh = allUsers.find(
    (u) => u.username.toLowerCase() === "sukhvinder9929",
  );
  if (sukh && !sukh.companyId) {
    set(
      "px_users",
      allUsers.map((u) =>
        u.username.toLowerCase() === "sukhvinder9929"
          ? { ...u, companyId: "demo-company-001" }
          : u,
      ),
    );
  }
}
seedAdmin123();

export const storage = {
  // Users
  getUsers: () => get<User>("px_users"),
  addUser: (u: Omit<User, "id">) => {
    const d = get<User>("px_users");
    const empNum = d.length + 1;
    const employeeId = u.employeeId || `EMP-${padNum(empNum)}`;
    // Get company prefix if available
    const companies = get<Company>("px_companies");
    const company = companies.find((c: Company) => c.id === u.companyId);
    const companyPrefix = company?.codePrefix;
    // Generate serial number
    const serialNumber =
      u.serialNumber || generateSerialNumber(u.role, companyPrefix);
    const username = (u.username?.trim() || "").toLowerCase();
    const n = {
      ...u,
      id: uid(),
      employeeId,
      serialNumber,
      username,
    };
    set("px_users", [...d, n]);
    return n;
  },
  updateUser: (id: string, updates: Partial<User>) => {
    const normalizedUpdates = updates.username
      ? { ...updates, username: updates.username.trim().toLowerCase() }
      : updates;
    const d = get<User>("px_users").map((u) =>
      u.id === id ? { ...u, ...normalizedUpdates } : u,
    );
    set("px_users", d);
  },
  // Accepts username or email (case-insensitive)
  getUserByUsername: (input: string) => {
    const lower = input.trim().toLowerCase();
    return get<User>("px_users").find(
      (u) => u.username.toLowerCase() === lower,
    );
  },
  deleteUser: (id: string) =>
    set(
      "px_users",
      get<User>("px_users").filter((u) => u.id !== id),
    ),

  // Signup Requests
  getSignupRequests: () => get<SignupRequest>("px_signup_requests"),
  addSignupRequest: (
    req: Omit<SignupRequest, "id">,
  ): { success: boolean; error?: string; data?: SignupRequest } => {
    const d = get<SignupRequest>("px_signup_requests");
    const allUsers = get<User>("px_users");
    const emailLower = req.email.trim().toLowerCase();
    const mobileTrim = req.mobileNumber.trim();
    // Check duplicates in signup requests
    const dupReq = d.find(
      (r) =>
        r.email.toLowerCase() === emailLower ||
        r.mobileNumber.trim() === mobileTrim,
    );
    if (dupReq) {
      console.warn(
        "[SIGNUP] Duplicate found in signup requests:",
        dupReq.email,
        dupReq.mobileNumber,
      );
      return {
        success: false,
        error: "User already exists with this email or mobile number",
      };
    }
    // Check duplicates in active users
    const dupUser = allUsers.find(
      (u) =>
        (u.email && u.email.toLowerCase() === emailLower) ||
        (u.mobileNumber && u.mobileNumber.trim() === mobileTrim),
    );
    if (dupUser) {
      console.warn(
        "[SIGNUP] Duplicate found in users:",
        dupUser.email,
        dupUser.mobileNumber,
      );
      return {
        success: false,
        error: "User already exists with this email or mobile number",
      };
    }
    const n = { ...req, id: uid() };
    set("px_signup_requests", [...d, n]);
    console.log(
      "[SIGNUP] Request saved:",
      n.id,
      n.email,
      n.mobileNumber,
      "status:",
      n.status,
    );
    return { success: true, data: n };
  },
  updateSignupRequest: (id: string, updates: Partial<SignupRequest>) => {
    const d = get<SignupRequest>("px_signup_requests").map((r) =>
      r.id === id ? { ...r, ...updates } : r,
    );
    set("px_signup_requests", d);
  },
  generateUserId: (role: "Farmer" | "Dealer" | "Company"): string => {
    const requests = get<SignupRequest>("px_signup_requests").filter(
      (r) => r.role === role && r.status === "approved",
    );
    const num = String(requests.length + 1).padStart(3, "0");
    const prefix =
      role === "Farmer" ? "FARM" : role === "Dealer" ? "DEALER" : "ADM";
    return `${prefix}${num}`;
  },
  getUsersByCompanyId: (companyId: string): User[] =>
    get<User>("px_users").filter((u) => u.companyId === companyId),

  // General Notifications
  getNotifications: () => get<Notification>("px_notifications"),
  addNotification: (n: Omit<Notification, "id">) => {
    const d = get<Notification>("px_notifications");
    const newN = { ...n, id: uid() };
    set("px_notifications", [...d, newN]);
    return newN;
  },
  markNotificationRead: (id: string) => {
    // Mark in both general and subscription notifications
    const gd = get<Notification>("px_notifications").map((n) =>
      n.id === id ? { ...n, read: true } : n,
    );
    set("px_notifications", gd);
    const sd = get<SubscriptionNotification>("px_sub_notifications").map((n) =>
      n.id === id ? { ...n, read: true } : n,
    );
    set("px_sub_notifications", sd);
  },
  markAllNotificationsRead: (userId: string) => {
    const gd = get<Notification>("px_notifications").map((n) =>
      n.userId === userId || n.userId === "all" ? { ...n, read: true } : n,
    );
    set("px_notifications", gd);
    const sd = get<SubscriptionNotification>("px_sub_notifications").map((n) =>
      n.userId === userId ? { ...n, read: true } : n,
    );
    set("px_sub_notifications", sd);
  },

  // Companies
  getCompanies: () => get<Company>("px_companies"),
  addCompany: (c: Omit<Company, "id">) => {
    const d = get<Company>("px_companies");
    const n = { ...c, id: uid() };
    set("px_companies", [...d, n]);
    return n;
  },
  updateCompany: (id: string, updates: Partial<Company>) => {
    const d = get<Company>("px_companies").map((c) =>
      c.id === id ? { ...c, ...updates } : c,
    );
    set("px_companies", d);
  },
  deleteCompany: (id: string) =>
    set(
      "px_companies",
      get<Company>("px_companies").filter((c) => c.id !== id),
    ),

  // Zones
  getZones: () => get<Zone>("px_zones"),
  addZone: (z: Omit<Zone, "id">) => {
    const d = get<Zone>("px_zones");
    const n = { ...z, id: uid() };
    set("px_zones", [...d, n]);
    return n;
  },
  deleteZone: (id: string) =>
    set(
      "px_zones",
      get<Zone>("px_zones").filter((z) => z.id !== id),
    ),

  // Branches
  getBranches: () => get<Branch>("px_branches"),
  addBranch: (b: Omit<Branch, "id">) => {
    const d = get<Branch>("px_branches");
    const branchNum = d.length + 1;
    const branchCode = b.branchCode || `BR-${padNum(branchNum)}`;
    const n = { ...b, id: uid(), branchCode };
    set("px_branches", [...d, n]);
    return n;
  },
  updateBranch: (id: string, updates: Partial<Branch>) => {
    const d = get<Branch>("px_branches").map((b) =>
      b.id === id ? { ...b, ...updates } : b,
    );
    set("px_branches", d);
  },
  deleteBranch: (id: string) =>
    set(
      "px_branches",
      get<Branch>("px_branches").filter((b) => b.id !== id),
    ),

  // Medicines
  getMedicines: () => get<Medicine>("px_medicines"),
  addMedicine: (name: string) => {
    const d = get<Medicine>("px_medicines");
    const n: Medicine = { id: uid(), name };
    set("px_medicines", [...d, n]);
    return n;
  },

  // Vaccines
  getVaccines: () => get<Vaccine>("px_vaccines"),
  addVaccine: (name: string) => {
    const d = get<Vaccine>("px_vaccines");
    const n: Vaccine = { id: uid(), name };
    set("px_vaccines", [...d, n]);
    return n;
  },

  // Payments
  getPayments: () => get<Payment>("px_payments"),
  addPayment: (p: Omit<Payment, "id">) => {
    const d = get<Payment>("px_payments");
    const n = { ...p, id: uid() };
    set("px_payments", [...d, n]);
    return n;
  },
  deletePayment: (id: string) =>
    set(
      "px_payments",
      get<Payment>("px_payments").filter((p) => p.id !== id),
    ),

  // Receipts
  getReceipts: () => get<Receipt>("px_receipts"),
  addReceipt: (r: Omit<Receipt, "id">) => {
    const d = get<Receipt>("px_receipts");
    const n = { ...r, id: uid() };
    set("px_receipts", [...d, n]);
    return n;
  },
  deleteReceipt: (id: string) =>
    set(
      "px_receipts",
      get<Receipt>("px_receipts").filter((r) => r.id !== id),
    ),

  // Farms
  getFarms: () => get<Farm>("px_farms"),
  addFarm: (f: Omit<Farm, "id">) => {
    const d = get<Farm>("px_farms");
    const n = { ...f, id: uid() };
    set("px_farms", [...d, n]);
    return n;
  },
  updateFarm: (id: string, updates: Partial<Farm>) => {
    const d = get<Farm>("px_farms").map((f) =>
      f.id === id ? { ...f, ...updates } : f,
    );
    set("px_farms", d);
  },
  deleteFarm: (id: string) =>
    set(
      "px_farms",
      get<Farm>("px_farms").filter((f) => f.id !== id),
    ),

  // Sheds
  getSheds: () => get<Shed>("px_sheds"),
  addShed: (s: Omit<Shed, "id">) => {
    const d = get<Shed>("px_sheds");
    const n = { ...s, id: uid() };
    set("px_sheds", [...d, n]);
    return n;
  },
  updateShed: (id: string, updates: Partial<Shed>) => {
    const d = get<Shed>("px_sheds").map((s) =>
      s.id === id ? { ...s, ...updates } : s,
    );
    set("px_sheds", d);
  },
  getShedsByFarm: (farmId: string) =>
    get<Shed>("px_sheds").filter((s) => s.farmId === farmId),
  getActiveBatchByShed: (shedId: string) =>
    get<Batch>("px_batches").find(
      (b) => b.shedId === shedId && b.status === "active",
    ),

  // Batches
  getBatches: () => get<Batch>("px_batches"),
  addBatch: (b: Omit<Batch, "id">) => {
    const d = get<Batch>("px_batches");
    const n = { ...b, id: uid() };
    set("px_batches", [...d, n]);
    return n;
  },
  updateBatch: (id: string, updates: Partial<Batch>) => {
    const d = get<Batch>("px_batches").map((b) =>
      b.id === id ? { ...b, ...updates } : b,
    );
    set("px_batches", d);
  },

  // Daily Entries
  getDailyEntries: () => get<DailyEntry>("px_daily"),
  addDailyEntry: (e: Omit<DailyEntry, "id">) => {
    const d = get<DailyEntry>("px_daily");
    const n = { ...e, id: uid() };
    set("px_daily", [...d, n]);
    return n;
  },

  // Feed Types
  getFeedTypes: () => {
    const types = get<FeedType>("px_feed_types");
    if (types.length === 0) {
      seedFeedTypes();
      return get<FeedType>("px_feed_types");
    }
    return types;
  },
  addFeedType: (ft: Omit<FeedType, "id">) => {
    const d = get<FeedType>("px_feed_types");
    const n = { ...ft, id: uid() };
    set("px_feed_types", [...d, n]);
    return n;
  },
  updateFeedType: (id: string, updates: Partial<FeedType>) => {
    const d = get<FeedType>("px_feed_types").map((ft) =>
      ft.id === id ? { ...ft, ...updates } : ft,
    );
    set("px_feed_types", d);
  },
  deleteFeedType: (id: string) =>
    set(
      "px_feed_types",
      get<FeedType>("px_feed_types").filter((ft) => ft.id !== id),
    ),

  // Feed Suppliers
  getFeedSuppliers: () => get<FeedSupplier>("px_feed_suppliers"),
  addFeedSupplier: (s: Omit<FeedSupplier, "id">) => {
    const d = get<FeedSupplier>("px_feed_suppliers");
    const n = { ...s, id: uid() };
    set("px_feed_suppliers", [...d, n]);
    return n;
  },
  updateFeedSupplier: (id: string, updates: Partial<FeedSupplier>) => {
    const d = get<FeedSupplier>("px_feed_suppliers").map((s) =>
      s.id === id ? { ...s, ...updates } : s,
    );
    set("px_feed_suppliers", d);
  },
  deleteFeedSupplier: (id: string) =>
    set(
      "px_feed_suppliers",
      get<FeedSupplier>("px_feed_suppliers").filter((s) => s.id !== id),
    ),

  // Feed Purchases
  getFeedPurchases: () => get<FeedPurchase>("px_feed_purchases"),
  addFeedPurchase: (f: Omit<FeedPurchase, "id">) => {
    const qKg = f.quantityKg ?? f.quantityBags * 50;
    const d = get<FeedPurchase>("px_feed_purchases");
    const n = { ...f, id: uid(), quantityKg: qKg };
    set("px_feed_purchases", [...d, n]);
    const stocks = get<FeedStock>("px_feed_stock");
    const si = stocks.findIndex(
      (s) => s.farmId === "global" && s.feedType === f.feedType,
    );
    if (si >= 0) {
      stocks[si].currentStockBags += f.quantityBags;
    } else {
      stocks.push({
        id: uid(),
        farmId: "global",
        feedType: f.feedType,
        currentStockBags: f.quantityBags,
        alertThresholdBags: 10,
        openingStockKg: 0,
      });
    }
    set("px_feed_stock", stocks);
    return n;
  },

  // Feed Stock
  getFeedStocks: () => get<FeedStock>("px_feed_stock"),
  saveFeedStock: (s: FeedStock) => {
    const d = get<FeedStock>("px_feed_stock");
    const i = d.findIndex((x) => x.id === s.id);
    const item = { ...s, openingStockKg: s.openingStockKg ?? 0 };
    if (i >= 0) d[i] = item;
    else d.push(item);
    set("px_feed_stock", d);
  },

  // Feed Issue
  getFeedIssues: () => get<FeedIssue>("px_feed_issues"),
  addFeedIssue: (f: Omit<FeedIssue, "id">) => {
    const qKg = f.quantityKg ?? f.quantityBags * 50;
    const d = get<FeedIssue>("px_feed_issues");
    const n = { ...f, id: uid(), quantityKg: qKg };
    set("px_feed_issues", [...d, n]);
    const stocks = get<FeedStock>("px_feed_stock");
    const si = stocks.findIndex((s) => s.feedType === f.feedType);
    if (si >= 0) {
      stocks[si].currentStockBags = Math.max(
        0,
        stocks[si].currentStockBags - f.quantityBags,
      );
    }
    set("px_feed_stock", stocks);
    return n;
  },

  // Feed Stock Balance helper
  getFeedStockBalance: (feedType: string, farmId?: string) => {
    const stocks = get<FeedStock>("px_feed_stock");
    const stock = farmId
      ? stocks.find((s) => s.feedType === feedType && s.farmId === farmId)
      : stocks.find((s) => s.feedType === feedType && s.farmId === "global");
    const openingKg = stock?.openingStockKg ?? 0;
    const purchases = get<FeedPurchase>("px_feed_purchases");
    const receivedKg = purchases
      .filter(
        (p) =>
          p.feedType === feedType && (!farmId || p.receivingFarmId === farmId),
      )
      .reduce((sum, p) => sum + (p.quantityKg ?? p.quantityBags * 50), 0);
    const issues = get<FeedIssue>("px_feed_issues");
    const issuedKg = issues
      .filter(
        (i) => i.feedType === feedType && (!farmId || i.farmId === farmId),
      )
      .reduce((sum, i) => sum + (i.quantityKg ?? i.quantityBags * 50), 0);
    return {
      openingKg,
      receivedKg,
      issuedKg,
      balanceKg: openingKg + receivedKg - issuedKg,
    };
  },

  // Bird Sales
  getBirdSales: () => get<BirdSale>("px_sales"),
  addBirdSale: (s: Omit<BirdSale, "id">) => {
    const d = get<BirdSale>("px_sales");
    const n = { ...s, id: uid() };
    set("px_sales", [...d, n]);
    return n;
  },

  // GC Schemes
  getGCSchemes: () => get<GCScheme>("px_gc_schemes"),
  addGCScheme: (s: Omit<GCScheme, "id">) => {
    const d = get<GCScheme>("px_gc_schemes");
    const n = { ...s, id: uid() };
    set("px_gc_schemes", [...d, n]);
    return n;
  },
  deleteGCScheme: (id: string) =>
    set(
      "px_gc_schemes",
      get<GCScheme>("px_gc_schemes").filter((s) => s.id !== id),
    ),

  // GC Settlements
  getGCSettlements: () => get<GCSettlement>("px_gc_settlements"),
  addGCSettlement: (s: Omit<GCSettlement, "id">) => {
    const d = get<GCSettlement>("px_gc_settlements");
    const n = { ...s, id: uid() };
    set("px_gc_settlements", [...d, n]);
    return n;
  },

  // Pending Settlements (Finance Module)
  getPendingSettlements: () => get<PendingSettlement>("px_pending_settlements"),
  addPendingSettlement: (s: Omit<PendingSettlement, "id">) => {
    const d = get<PendingSettlement>("px_pending_settlements");
    const n = { ...s, id: uid() };
    set("px_pending_settlements", [...d, n]);
    return n;
  },
  confirmPendingSettlement: (id: string, confirmedBy: string) => {
    const d = get<PendingSettlement>("px_pending_settlements");
    set(
      "px_pending_settlements",
      d.map((s) =>
        s.id === id
          ? {
              ...s,
              status: "confirmed" as const,
              confirmedAt: new Date().toISOString(),
              confirmedBy,
            }
          : s,
      ),
    );
  },

  // Ledger Entries (Finance Module)
  getLedgerEntries: () => get<LedgerEntry>("px_ledger_entries"),
  addLedgerEntry: (e: Omit<LedgerEntry, "id">) => {
    const d = get<LedgerEntry>("px_ledger_entries");
    const n = { ...e, id: uid() };
    set("px_ledger_entries", [...d, n]);
    return n;
  },
  updateLedgerEntry: (id: string, e: Partial<LedgerEntry>) => {
    const d = get<LedgerEntry>("px_ledger_entries");
    set(
      "px_ledger_entries",
      d.map((item) => (item.id === id ? { ...item, ...e } : item)),
    );
  },

  // Expenses (Finance Module)
  getExpenses: () => get<Expense>("px_expenses"),
  addExpense: (e: Omit<Expense, "id">) => {
    const d = get<Expense>("px_expenses");
    const n = { ...e, id: uid() };
    set("px_expenses", [...d, n]);
    return n;
  },
  updateExpense: (id: string, e: Partial<Expense>) => {
    const d = get<Expense>("px_expenses");
    set(
      "px_expenses",
      d.map((item) => (item.id === id ? { ...item, ...e } : item)),
    );
  },
  deleteExpense: (id: string) => {
    set(
      "px_expenses",
      get<Expense>("px_expenses").filter((e) => e.id !== id),
    );
  },

  // Subscription Records
  getSubscriptions: () => get<SubscriptionRecord>("px_subscriptions"),
  addSubscription: (s: Omit<SubscriptionRecord, "id">) => {
    const d = get<SubscriptionRecord>("px_subscriptions");
    const n = { ...s, id: uid() };
    set("px_subscriptions", [...d, n]);
    return n;
  },
  updateSubscription: (id: string, updates: Partial<SubscriptionRecord>) => {
    const d = get<SubscriptionRecord>("px_subscriptions").map((s) =>
      s.id === id ? { ...s, ...updates } : s,
    );
    set("px_subscriptions", d);
  },
  getSubscriptionByUserId: (userId: string) =>
    get<SubscriptionRecord>("px_subscriptions").find(
      (s) => s.userId === userId,
    ),

  // Subscription Payments
  getSubscriptionPayments: () =>
    get<SubscriptionPaymentRecord>("px_sub_payments"),
  addSubscriptionPayment: (p: Omit<SubscriptionPaymentRecord, "id">) => {
    const d = get<SubscriptionPaymentRecord>("px_sub_payments");
    const n = { ...p, id: uid() };
    set("px_sub_payments", [...d, n]);
    return n;
  },
  updateSubscriptionPayment: (
    id: string,
    updates: Partial<SubscriptionPaymentRecord>,
  ) => {
    const d = get<SubscriptionPaymentRecord>("px_sub_payments").map((p) =>
      p.id === id ? { ...p, ...updates } : p,
    );
    set("px_sub_payments", d);
  },

  // Subscription Invoices
  getSubscriptionInvoices: () => get<SubscriptionInvoice>("px_sub_invoices"),
  addSubscriptionInvoice: (
    inv: Omit<SubscriptionInvoice, "id" | "invoiceNumber">,
  ) => {
    const d = get<SubscriptionInvoice>("px_sub_invoices");
    const invoiceNum = `INV-${String(d.length + 1).padStart(3, "0")}`;
    const n = { ...inv, id: uid(), invoiceNumber: invoiceNum };
    set("px_sub_invoices", [...d, n]);
    return n;
  },

  // Subscription Notifications
  getSubscriptionNotifications: () =>
    get<SubscriptionNotification>("px_sub_notifications"),
  addSubscriptionNotification: (n: Omit<SubscriptionNotification, "id">) => {
    const d = get<SubscriptionNotification>("px_sub_notifications");
    const newN = { ...n, id: uid() };
    set("px_sub_notifications", [...d, newN]);
    return newN;
  },
  // Company-scoped helpers for data isolation
  // SENTINEL: passing UNASSIGNED_SENTINEL means "user has no company → return empty"
  // passing undefined means "SuperAdmin → return all"
  getFarmsByCompany: (companyId?: string) => {
    if (companyId === UNASSIGNED_SENTINEL) return [];
    const all = get<Farm>("px_farms");
    if (!companyId) return all; // SuperAdmin sees all
    return all.filter((f) => f.companyId === companyId);
  },
  getZonesByCompany: (companyId?: string) => {
    if (companyId === UNASSIGNED_SENTINEL) return [];
    const all = get<Zone>("px_zones");
    if (!companyId) return all;
    return all.filter((z) => z.companyId === companyId);
  },
  getBranchesByCompany: (companyId?: string) => {
    if (companyId === UNASSIGNED_SENTINEL) return [];
    const all = get<Branch>("px_branches");
    if (!companyId) return all;
    return all.filter((b) => b.companyId === companyId);
  },
  getUsersByCompany: (companyId?: string) => {
    if (companyId === UNASSIGNED_SENTINEL) return [];
    const all = get<User>("px_users");
    if (!companyId) return all;
    return all.filter((u) => u.companyId === companyId);
  },
  getGCSchemesByCompany: (companyId?: string) => {
    if (companyId === UNASSIGNED_SENTINEL) return [];
    const all = get<GCScheme>("px_gc_schemes");
    if (!companyId) return all;
    return all.filter((s) => s.companyId === companyId);
  },
  getFeedTypesByCompany: (companyId?: string) => {
    if (companyId === UNASSIGNED_SENTINEL) return [];
    const all = get<FeedType>("px_feed_types");
    if (!companyId) return all;
    return all.filter((ft) => !ft.companyId || ft.companyId === companyId);
  },
  getFeedSuppliersByCompany: (companyId?: string) => {
    if (companyId === UNASSIGNED_SENTINEL) return [];
    const all = get<FeedSupplier>("px_feed_suppliers");
    if (!companyId) return all;
    return all.filter((s) => !s.companyId || s.companyId === companyId);
  },
  // Audit Logs
  getAuditLogs: () => get<AuditLog>("px_audit_logs"),
  addAuditLog: (log: Omit<AuditLog, "id">) => {
    const d = get<AuditLog>("px_audit_logs");
    const n = { ...log, id: uid() };
    set("px_audit_logs", [...d, n]);
    return n;
  },

  // Daily Entry CRUD
  updateDailyEntry: (id: string, updates: Partial<DailyEntry>) => {
    const d = get<DailyEntry>("px_daily").map((e) =>
      e.id === id ? { ...e, ...updates } : e,
    );
    set("px_daily", d);
  },
  deleteDailyEntry: (id: string) =>
    set(
      "px_daily",
      get<DailyEntry>("px_daily").filter((e) => e.id !== id),
    ),

  // Feed Issue CRUD
  updateFeedIssue: (id: string, updates: Partial<FeedIssue>) => {
    const d = get<FeedIssue>("px_feed_issues").map((e) =>
      e.id === id ? { ...e, ...updates } : e,
    );
    set("px_feed_issues", d);
  },
  deleteFeedIssue: (id: string) =>
    set(
      "px_feed_issues",
      get<FeedIssue>("px_feed_issues").filter((e) => e.id !== id),
    ),

  // Bird Sale CRUD
  updateBirdSale: (id: string, updates: Partial<BirdSale>) => {
    const d = get<BirdSale>("px_sales").map((e) =>
      e.id === id ? { ...e, ...updates } : e,
    );
    set("px_sales", d);
  },
  deleteBirdSale: (id: string) =>
    set(
      "px_sales",
      get<BirdSale>("px_sales").filter((e) => e.id !== id),
    ),

  // Feed Purchase CRUD
  updateFeedPurchase: (id: string, updates: Partial<FeedPurchase>) => {
    const d = get<FeedPurchase>("px_feed_purchases").map((e) =>
      e.id === id ? { ...e, ...updates } : e,
    );
    set("px_feed_purchases", d);
  },
  deleteFeedPurchase: (id: string) =>
    set(
      "px_feed_purchases",
      get<FeedPurchase>("px_feed_purchases").filter((e) => e.id !== id),
    ),

  // Batch delete
  deleteBatch: (id: string) =>
    set(
      "px_batches",
      get<Batch>("px_batches").filter((b) => b.id !== id),
    ),
};

// ---- Data Migration Helpers ----
const MIGRATION_KEYS = [
  "px_users",
  "px_companies",
  "px_farms",
  "px_sheds",
  "px_batches",
  "px_zones",
  "px_branches",
];

export function exportMigrationData(): string {
  const snapshot: Record<string, unknown[]> = {};
  for (const key of MIGRATION_KEYS) {
    try {
      snapshot[key] = JSON.parse(localStorage.getItem(key) || "[]");
    } catch {
      snapshot[key] = [];
    }
  }
  return JSON.stringify(
    { version: 1, exportedAt: new Date().toISOString(), data: snapshot },
    null,
    2,
  );
}

export function importMigrationData(
  json: string,
  mode: "merge" | "replace" = "merge",
): { imported: number; skipped: number; errors: string[] } {
  let parsed: { version: number; data: Record<string, unknown[]> };
  try {
    parsed = JSON.parse(json);
  } catch {
    return { imported: 0, skipped: 0, errors: ["Invalid JSON format"] };
  }
  if (!parsed.data)
    return {
      imported: 0,
      skipped: 0,
      errors: ["Missing data field in import file"],
    };

  let imported = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const key of MIGRATION_KEYS) {
    const incoming = parsed.data[key];
    if (!Array.isArray(incoming)) continue;

    if (mode === "replace") {
      localStorage.setItem(key, JSON.stringify(incoming));
      imported += incoming.length;
    } else {
      // Merge: add items not already present by id
      let existing: Array<{ id: string }> = [];
      try {
        existing = JSON.parse(localStorage.getItem(key) || "[]");
      } catch {
        existing = [];
      }
      const existingIds = new Set(existing.map((e) => e.id));
      const toAdd = (incoming as Array<{ id: string }>).filter((item) => {
        if (existingIds.has(item.id)) {
          skipped++;
          return false;
        }
        return true;
      });
      localStorage.setItem(key, JSON.stringify([...existing, ...toAdd]));
      imported += toAdd.length;
    }
  }

  console.log(
    `[MIGRATION] Import complete: ${imported} imported, ${skipped} skipped`,
  );
  return { imported, skipped, errors };
}

// ---- Finance Module Types ----
export type PendingSettlement = GCSettlement & {
  status: "pending" | "confirmed";
  confirmedAt?: string;
  confirmedBy?: string;
};

export type LedgerEntry = {
  id: string;
  farmerId: string;
  type:
    | "opening_balance"
    | "gc_earning"
    | "medicine_deduction"
    | "feed_deduction"
    | "manual_deduction";
  amount: number;
  description: string;
  date: string;
  batchId?: string;
  settlementId?: string;
};

export type Expense = {
  id: string;
  farmId: string;
  batchId?: string;
  type: "Medicine Cost" | "Transport" | "Labour" | "Maintenance" | "Other";
  amount: number;
  description: string;
  date: string;
  addedBy: string;
  addedByRole: string;
  status: "approved" | "pending_approval" | "rejected";
};
