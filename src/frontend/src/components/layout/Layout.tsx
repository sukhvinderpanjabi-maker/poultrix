import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAuth } from "@/context/AuthContext";
import {
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "@/lib/react-router-compat";
import { storage } from "@/lib/storage";
import type { User } from "@/lib/storage";
import { cn } from "@/lib/utils";
import {
  ArrowRightLeft,
  BarChart3,
  Bell,
  Bird,
  BookOpen,
  Building2,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  CreditCard,
  DollarSign,
  FileBarChart,
  FileText,
  GitBranch,
  Globe,
  IdCard,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Receipt,
  Settings,
  ShieldAlert,
  ShoppingCart,
  TrendingUp,
  Truck,
  User as UserIcon,
  UserPlus,
  Users,
  Wheat,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";

type NavChild = {
  label: string;
  to: string;
  icon: React.ElementType;
  roles?: string[];
};
type NavItem = {
  label: string;
  icon: React.ElementType;
  to?: string;
  children?: NavChild[];
  roles?: User["role"][];
  hideForStaff?: boolean;
};

const STAFF_ALLOWED_ROUTES = [
  "/employee-dashboard",
  "/dashboard",
  "/daily-entry",
  "/feed/issue",
];

const navItems: NavItem[] = [
  { label: "My Profile", to: "/employee-dashboard", icon: IdCard },
  { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
  {
    label: "My Team",
    to: "/my-team",
    icon: Users,
    roles: ["CompanyAdmin", "Dealer", "Farmer"],
  },
  {
    label: "Company Structure",
    icon: Globe,
    roles: ["SuperAdmin", "CompanyAdmin"],
    children: [
      {
        label: "Companies",
        to: "/companies",
        icon: Building2,
        roles: ["SuperAdmin"],
      },
      { label: "Zones", to: "/zones", icon: Globe },
      { label: "Branches", to: "/branches", icon: GitBranch },
    ],
  },
  {
    label: "Farm Management",
    icon: Building2,
    children: [
      {
        label: "Farms & Sheds",
        to: "/farms",
        icon: Building2,
        roles: [
          "SuperAdmin",
          "CompanyAdmin",
          "Manager",
          "Supervisor",
          "Farmer",
          "Dealer",
        ],
      },
      {
        label: "Chick Placement",
        to: "/chicks",
        icon: Bird,
        roles: [
          "SuperAdmin",
          "CompanyAdmin",
          "Manager",
          "Supervisor",
          "Farmer",
        ],
      },
      { label: "Daily Entry", to: "/daily-entry", icon: ClipboardList },
    ],
  },
  {
    label: "Feed Management",
    icon: Package,
    roles: [
      "SuperAdmin",
      "CompanyAdmin",
      "Manager",
      "Supervisor",
      "Farmer",
      "Dealer",
      "Staff",
    ],
    children: [
      {
        label: "Feed Types",
        to: "/feed/types",
        icon: Wheat,
        roles: ["SuperAdmin", "CompanyAdmin"],
      },
      {
        label: "Feed Suppliers",
        to: "/feed/suppliers",
        icon: Truck,
        roles: ["SuperAdmin", "CompanyAdmin"],
      },
      {
        label: "Feed Purchase",
        to: "/feed/purchase",
        icon: ShoppingCart,
        roles: [
          "SuperAdmin",
          "CompanyAdmin",
          "Manager",
          "Supervisor",
          "Farmer",
          "Dealer",
        ],
      },
      {
        label: "Feed Stock",
        to: "/feed/stock",
        icon: Package,
        roles: [
          "SuperAdmin",
          "CompanyAdmin",
          "Manager",
          "Supervisor",
          "Farmer",
          "Dealer",
        ],
      },
      { label: "Feed Issue", to: "/feed/issue", icon: ArrowRightLeft },
      {
        label: "Feed Stock Reports",
        to: "/feed/reports",
        icon: FileBarChart,
        roles: [
          "SuperAdmin",
          "CompanyAdmin",
          "Manager",
          "Supervisor",
          "Farmer",
          "Dealer",
        ],
      },
    ],
  },
  {
    label: "Finance",
    icon: DollarSign,
    roles: ["SuperAdmin", "CompanyAdmin", "Manager", "Supervisor", "Farmer"],
    children: [
      {
        label: "Finance Dashboard",
        to: "/finance/dashboard",
        icon: LayoutDashboard,
      },
      { label: "Settlements", to: "/finance/settlements", icon: CheckSquare },
      { label: "Farmer Ledger", to: "/finance/ledger", icon: BookOpen },
      { label: "Expenses", to: "/finance/expenses", icon: Receipt },
      {
        label: "Settlement Report",
        to: "/finance/settlement-report",
        icon: FileText,
      },
      { label: "Payments", to: "/finance/payments", icon: DollarSign },
      { label: "Receipts", to: "/finance/receipts", icon: Receipt },
    ],
  },
  {
    label: "Bird Sales",
    to: "/sales",
    icon: DollarSign,
    roles: [
      "SuperAdmin",
      "CompanyAdmin",
      "Manager",
      "Supervisor",
      "Farmer",
      "Dealer",
    ],
  },
  {
    label: "Reports",
    to: "/reports",
    icon: FileBarChart,
    roles: [
      "SuperAdmin",
      "CompanyAdmin",
      "Manager",
      "Supervisor",
      "Farmer",
      "Dealer",
    ],
  },
  {
    label: "Performance Report",
    to: "/performance-report",
    icon: BarChart3,
    roles: [
      "SuperAdmin",
      "CompanyAdmin",
      "Manager",
      "Supervisor",
      "Farmer",
      "Dealer",
    ],
  },
  {
    label: "Growing Charge",
    icon: TrendingUp,
    roles: ["SuperAdmin", "CompanyAdmin", "Manager", "Supervisor", "Farmer"],
    children: [
      { label: "GC Schemes", to: "/gc/schemes", icon: TrendingUp },
      { label: "Production Book", to: "/gc/production", icon: BookOpen },
      {
        label: "GC Settlement Report",
        to: "/gc/settlement-report",
        icon: Receipt,
      },
    ],
  },
  {
    label: "Subscription & Billing",
    icon: CreditCard,
    roles: ["SuperAdmin"],
    children: [
      {
        label: "Billing Dashboard",
        to: "/billing/dashboard",
        icon: LayoutDashboard,
      },
      {
        label: "Manage Subscriptions",
        to: "/billing/manage",
        icon: Settings,
        roles: ["SuperAdmin", "CompanyAdmin"],
      },
      { label: "Invoices", to: "/billing/invoices", icon: FileText },
      { label: "Payments", to: "/billing/payments", icon: CreditCard },
    ],
  },
  {
    label: "User Management",
    to: "/users",
    icon: Users,
    roles: ["SuperAdmin"],
  },
  {
    label: "Signup Requests",
    to: "/signup-requests",
    icon: UserPlus,
    roles: ["SuperAdmin"],
  },
  {
    label: "Audit Log",
    to: "/audit-log",
    icon: ShieldAlert,
    roles: ["SuperAdmin", "CompanyAdmin"],
  },
  {
    label: "Change Password",
    to: "/change-password",
    icon: KeyRound,
    roles: ["SuperAdmin"],
  },
  {
    label: "Data Migration",
    to: "/data-migration",
    icon: ArrowRightLeft,
    roles: ["SuperAdmin"],
  },
];

function NavGroup({
  item,
  role,
  onClose,
}: {
  item: NavItem;
  role: User["role"] | undefined;
  onClose: () => void;
}) {
  const location = useLocation();
  const isActive = item.children?.some((c) =>
    location.pathname.startsWith(c.to),
  );
  const [open, setOpen] = useState(isActive ?? false);

  if (item.roles && role && !item.roles.includes(role)) return null;

  // Staff only sees specific routes
  if (role === "Staff" && item.to && !STAFF_ALLOWED_ROUTES.includes(item.to))
    return null;

  if (!item.children) {
    return (
      <NavLink
        to={item.to!}
        onClick={onClose}
        data-ocid={`nav.${item.label.toLowerCase().replace(/\s+/g, "_")}.link`}
        className={({ isActive: a }) =>
          cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
            a
              ? "bg-primary text-primary-foreground"
              : "text-sidebar-foreground hover:bg-sidebar-accent",
          )
        }
      >
        <item.icon size={18} />
        {item.label}
      </NavLink>
    );
  }

  // Filter children for Staff and role-based access
  const visibleChildren = item.children.filter((c) => {
    if (c.roles && role && !c.roles.includes(role)) return false;
    if (role === "Staff" && !STAFF_ALLOWED_ROUTES.includes(c.to)) return false;
    return true;
  });

  if (visibleChildren.length === 0) return null;

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
          isActive
            ? "text-primary"
            : "text-sidebar-foreground hover:bg-sidebar-accent",
        )}
      >
        <item.icon size={18} />
        <span className="flex-1 text-left">{item.label}</span>
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
      </button>
      {open && (
        <div className="ml-4 mt-1 space-y-1">
          {visibleChildren.map((c) => (
            <NavLink
              key={c.to}
              to={c.to}
              onClick={onClose}
              data-ocid={`nav.${c.label.toLowerCase().replace(/\s+/g, "_").replace(/\//g, "_")}.link`}
              className={({ isActive: a }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                  a
                    ? "bg-primary text-primary-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent",
                )
              }
            >
              <c.icon size={16} />
              {c.label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}

function NotificationBell({
  userId,
  companyId,
}: { userId: string; companyId?: string }) {
  const [open, setOpen] = useState(false);
  const [tick, setTick] = useState(0);

  // Combine general notifications and subscription notifications
  const generalNotifs = storage
    .getNotifications()
    .filter(
      (n) =>
        (n.userId === userId || n.userId === "all") &&
        (!n.companyId || !companyId || n.companyId === companyId),
    );

  const subNotifs = storage
    .getSubscriptionNotifications()
    .filter((n) => n.userId === userId);

  const allUnread = [
    ...generalNotifs
      .filter((n) => !n.read)
      .map((n) => ({
        id: n.id,
        title: n.title,
        message: n.message,
        time: new Date(n.createdAt).toLocaleDateString(),
        read: n.read,
        source: "general" as const,
      })),
    ...subNotifs
      .filter((n) => !n.read)
      .map((n) => ({
        id: n.id,
        title: "Subscription",
        message: n.message,
        time: n.date,
        read: n.read,
        source: "sub" as const,
      })),
  ];

  const unreadCount = allUnread.length;

  function handleMarkAll() {
    storage.markAllNotificationsRead(userId);
    setTick((t) => t + 1);
  }

  function handleMarkOne(id: string) {
    storage.markNotificationRead(id);
    setTick((t) => t + 1);
  }

  // Re-read on tick change for reactivity
  const _ = tick;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="relative p-1.5 rounded-lg hover:bg-muted transition-colors"
          data-ocid="notifications.bell_button"
          aria-label="Notifications"
        >
          <Bell size={18} className="text-muted-foreground" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-80 p-0"
        data-ocid="notifications.panel"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <p className="font-semibold text-sm">Notifications</p>
          {unreadCount > 0 && (
            <button
              type="button"
              className="text-xs text-primary hover:underline"
              onClick={handleMarkAll}
              data-ocid="notifications.mark_all_button"
            >
              Mark all as read
            </button>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto">
          {allUnread.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No new notifications
            </p>
          ) : (
            allUnread.map((n, idx) => (
              <button
                key={n.id}
                type="button"
                className="w-full text-left px-4 py-3 border-b last:border-0 hover:bg-muted/40"
                onClick={() => handleMarkOne(n.id)}
                data-ocid={`notifications.item.${idx + 1}`}
              >
                <div className="flex items-start gap-2">
                  <span className="mt-1.5 w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{n.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {n.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {n.time}
                    </p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Determine firm name to show in header based on role
  const firmLabel = useMemo(() => {
    if (!currentUser) return null;
    if (currentUser.role === "SuperAdmin") return null;
    if (currentUser.companyId) {
      const company = storage
        .getCompanies()
        .find((c) => c.id === currentUser.companyId);
      if (company) {
        if (currentUser.role === "CompanyAdmin")
          return { label: "Company", name: company.name, warning: false };
        if (currentUser.role === "Dealer")
          return { label: "Dealer", name: company.name, warning: false };
        if (currentUser.role === "Farmer") {
          const farm = storage
            .getFarms()
            .find(
              (f) =>
                f.companyId === currentUser.companyId &&
                currentUser.assignedFarmIds?.[0] === f.id,
            );
          return {
            label: "Farm",
            name: farm?.name ?? company.name,
            warning: false,
          };
        }
        return { label: "Company", name: company.name, warning: false };
      }
    }
    // Non-SuperAdmin user without a valid company assignment
    return { label: "", name: "", warning: true };
  }, [currentUser]);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          onKeyDown={(e) => e.key === "Escape" && setSidebarOpen(false)}
          role="button"
          tabIndex={0}
          aria-label="Close sidebar"
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 w-64 bg-sidebar border-r border-sidebar-border flex flex-col transition-transform duration-200",
          "lg:translate-x-0 lg:static lg:z-auto",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between px-4 py-4 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Bird size={18} className="text-primary-foreground" />
            </div>
            <span className="font-bold text-lg text-sidebar-foreground">
              Poultrix
            </span>
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1"
            data-ocid="nav.close.button"
          >
            <X size={20} />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {navItems.map((item) => (
            <NavGroup
              key={item.label}
              item={item}
              role={currentUser?.role}
              onClose={() => setSidebarOpen(false)}
            />
          ))}
        </nav>
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <UserIcon size={16} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {currentUser?.name}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {currentUser?.role}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            data-ocid="nav.logout.button"
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-14 border-b bg-card flex items-center px-4 gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-1"
            data-ocid="nav.menu.button"
          >
            <Menu size={22} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold text-foreground leading-tight">
              Poultrix Dashboard
            </h1>
            {firmLabel && !firmLabel.warning && (
              <p className="text-xs text-muted-foreground leading-tight truncate">
                {firmLabel.label}:{" "}
                <span className="font-bold text-base text-primary">
                  {firmLabel.name}
                </span>
                &nbsp;|&nbsp;{currentUser?.name} ({currentUser?.role})
              </p>
            )}
            {firmLabel?.warning && (
              <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                ⚠ No Company Assigned
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {currentUser && (
              <NotificationBell
                userId={currentUser.id}
                companyId={currentUser.companyId}
              />
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  data-ocid="nav.user.dropdown_menu"
                >
                  <UserIcon size={14} />
                  <span>{currentUser?.name}</span>
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                    {currentUser?.role}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {currentUser?.role === "SuperAdmin" && (
                  <DropdownMenuItem
                    onClick={() => navigate("/change-password")}
                    data-ocid="nav.change_password.button"
                  >
                    <KeyRound size={14} className="mr-2" />
                    Change Password
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-red-600 focus:text-red-600"
                  data-ocid="nav.logout.button"
                >
                  <LogOut size={14} className="mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
