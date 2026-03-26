import ProtectedRoute from "@/components/ProtectedRoute";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/context/AuthContext";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "@/lib/react-router-compat";
import { ErrorBoundary } from "./components/ErrorBoundary";
import Layout from "./components/layout/Layout";
import AuditLog from "./pages/AuditLog";
import BirdSales from "./pages/BirdSales";
import Branches from "./pages/Branches";
import ChangePassword from "./pages/ChangePassword";
import ChicksPlacement from "./pages/ChicksPlacement";
import Companies from "./pages/Companies";
import DailyEntry from "./pages/DailyEntry";
import Dashboard from "./pages/Dashboard";
import DataMigration from "./pages/DataMigration";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import ExpenseManagement from "./pages/ExpenseManagement";
import FarmDashboard from "./pages/FarmDashboard";
import FarmerLedger from "./pages/FarmerLedger";
import FarmerSettlementReport from "./pages/FarmerSettlementReport";
import Farms from "./pages/Farms";
import FeedIssue from "./pages/FeedIssue";
import FeedPurchase from "./pages/FeedPurchase";
import FeedStock from "./pages/FeedStock";
import FeedStockReports from "./pages/FeedStockReports";
import FeedSuppliers from "./pages/FeedSuppliers";
import FeedTypes from "./pages/FeedTypes";
import FinanceDashboard from "./pages/FinanceDashboard";
import GCProduction from "./pages/GCProduction";
import GCSchemes from "./pages/GCSchemes";
import GCSettlementReport from "./pages/GCSettlementReport";
import Login from "./pages/Login";
import MyTeam from "./pages/MyTeam";
import Payments from "./pages/Payments";
import PerformanceReport from "./pages/PerformanceReport";
import ProductionSettlements from "./pages/ProductionSettlements";
import Receipts from "./pages/Receipts";
import Reports from "./pages/Reports";
import SignupRequests from "./pages/SignupRequests";
import SubscriptionDashboard from "./pages/SubscriptionDashboard";
import SubscriptionInvoices from "./pages/SubscriptionInvoices";
import SubscriptionManagement from "./pages/SubscriptionManagement";
import SubscriptionPayments from "./pages/SubscriptionPayments";
import UserManagement from "./pages/UserManagement";
import Zones from "./pages/Zones";

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route
                index
                element={<Navigate to="/employee-dashboard" replace />}
              />
              <Route
                path="employee-dashboard"
                element={<EmployeeDashboard />}
              />
              <Route path="dashboard" element={<Dashboard />} />
              <Route
                path="my-team"
                element={
                  <ProtectedRoute roles={["CompanyAdmin", "Dealer", "Farmer"]}>
                    <ErrorBoundary>
                      <MyTeam />
                    </ErrorBoundary>
                  </ProtectedRoute>
                }
              />
              <Route path="farms" element={<Farms />} />
              <Route
                path="farm-dashboard/:farmId"
                element={
                  <ProtectedRoute>
                    <FarmDashboard />
                  </ProtectedRoute>
                }
              />
              <Route path="chicks" element={<ChicksPlacement />} />
              <Route path="daily-entry" element={<DailyEntry />} />
              <Route path="feed/purchase" element={<FeedPurchase />} />
              <Route path="feed/stock" element={<FeedStock />} />
              <Route path="feed/issue" element={<FeedIssue />} />
              <Route
                path="feed/types"
                element={
                  <ProtectedRoute roles={["SuperAdmin", "CompanyAdmin"]}>
                    <FeedTypes />
                  </ProtectedRoute>
                }
              />
              <Route
                path="feed/suppliers"
                element={
                  <ProtectedRoute roles={["SuperAdmin", "CompanyAdmin"]}>
                    <FeedSuppliers />
                  </ProtectedRoute>
                }
              />
              <Route
                path="feed/reports"
                element={
                  <ProtectedRoute
                    roles={[
                      "SuperAdmin",
                      "CompanyAdmin",
                      "Manager",
                      "Supervisor",
                      "Farmer",
                      "Dealer",
                    ]}
                  >
                    <FeedStockReports />
                  </ProtectedRoute>
                }
              />
              <Route path="sales" element={<BirdSales />} />
              <Route path="reports" element={<Reports />} />
              <Route
                path="performance-report"
                element={
                  <ProtectedRoute
                    roles={[
                      "SuperAdmin",
                      "CompanyAdmin",
                      "Manager",
                      "Supervisor",
                      "Farmer",
                      "Dealer",
                    ]}
                  >
                    <PerformanceReport />
                  </ProtectedRoute>
                }
              />
              <Route
                path="users"
                element={
                  <ProtectedRoute roles={["SuperAdmin", "CompanyAdmin"]}>
                    <UserManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="companies"
                element={
                  <ProtectedRoute roles={["SuperAdmin"]}>
                    <Companies />
                  </ProtectedRoute>
                }
              />
              <Route
                path="zones"
                element={
                  <ProtectedRoute roles={["SuperAdmin", "CompanyAdmin"]}>
                    <Zones />
                  </ProtectedRoute>
                }
              />
              <Route
                path="branches"
                element={
                  <ProtectedRoute roles={["SuperAdmin", "CompanyAdmin"]}>
                    <Branches />
                  </ProtectedRoute>
                }
              />
              <Route
                path="finance/dashboard"
                element={
                  <ProtectedRoute
                    roles={[
                      "SuperAdmin",
                      "CompanyAdmin",
                      "Manager",
                      "Supervisor",
                      "Farmer",
                    ]}
                  >
                    <FinanceDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="finance/settlements"
                element={
                  <ProtectedRoute
                    roles={[
                      "SuperAdmin",
                      "CompanyAdmin",
                      "Manager",
                      "Supervisor",
                      "Farmer",
                    ]}
                  >
                    <ProductionSettlements />
                  </ProtectedRoute>
                }
              />
              <Route
                path="finance/ledger"
                element={
                  <ProtectedRoute
                    roles={["SuperAdmin", "CompanyAdmin", "Farmer"]}
                  >
                    <FarmerLedger />
                  </ProtectedRoute>
                }
              />
              <Route
                path="finance/expenses"
                element={
                  <ProtectedRoute
                    roles={[
                      "SuperAdmin",
                      "CompanyAdmin",
                      "Manager",
                      "Supervisor",
                    ]}
                  >
                    <ExpenseManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="finance/settlement-report"
                element={
                  <ProtectedRoute
                    roles={["SuperAdmin", "CompanyAdmin", "Manager", "Farmer"]}
                  >
                    <FarmerSettlementReport />
                  </ProtectedRoute>
                }
              />
              <Route
                path="finance/payments"
                element={
                  <ProtectedRoute
                    roles={["SuperAdmin", "CompanyAdmin", "Manager"]}
                  >
                    <Payments />
                  </ProtectedRoute>
                }
              />
              <Route
                path="finance/receipts"
                element={
                  <ProtectedRoute
                    roles={["SuperAdmin", "CompanyAdmin", "Manager"]}
                  >
                    <Receipts />
                  </ProtectedRoute>
                }
              />
              <Route
                path="gc/schemes"
                element={
                  <ProtectedRoute roles={["SuperAdmin", "CompanyAdmin"]}>
                    <GCSchemes />
                  </ProtectedRoute>
                }
              />
              <Route
                path="gc/production"
                element={
                  <ProtectedRoute
                    roles={[
                      "SuperAdmin",
                      "CompanyAdmin",
                      "Manager",
                      "Supervisor",
                    ]}
                  >
                    <GCProduction />
                  </ProtectedRoute>
                }
              />
              <Route
                path="gc/settlement-report"
                element={
                  <ProtectedRoute
                    roles={[
                      "SuperAdmin",
                      "CompanyAdmin",
                      "Manager",
                      "Supervisor",
                      "Farmer",
                    ]}
                  >
                    <GCSettlementReport />
                  </ProtectedRoute>
                }
              />
              {/* Subscription & Billing Routes */}
              <Route
                path="billing/dashboard"
                element={<SubscriptionDashboard />}
              />
              <Route
                path="billing/manage"
                element={
                  <ProtectedRoute roles={["SuperAdmin", "CompanyAdmin"]}>
                    <SubscriptionManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="billing/invoices"
                element={
                  <ProtectedRoute
                    roles={[
                      "SuperAdmin",
                      "CompanyAdmin",
                      "Manager",
                      "Supervisor",
                      "Farmer",
                      "Dealer",
                    ]}
                  >
                    <SubscriptionInvoices />
                  </ProtectedRoute>
                }
              />
              <Route
                path="billing/payments"
                element={
                  <ProtectedRoute
                    roles={["SuperAdmin", "CompanyAdmin", "Farmer", "Dealer"]}
                  >
                    <SubscriptionPayments />
                  </ProtectedRoute>
                }
              />
              <Route
                path="change-password"
                element={
                  <ProtectedRoute roles={["SuperAdmin"]}>
                    <ChangePassword />
                  </ProtectedRoute>
                }
              />
              <Route
                path="audit-log"
                element={
                  <ProtectedRoute roles={["SuperAdmin", "CompanyAdmin"]}>
                    <AuditLog />
                  </ProtectedRoute>
                }
              />
              <Route
                path="signup-requests"
                element={
                  <ProtectedRoute roles={["SuperAdmin"]}>
                    <SignupRequests />
                  </ProtectedRoute>
                }
              />
              <Route
                path="data-migration"
                element={
                  <ProtectedRoute roles={["SuperAdmin"]}>
                    <DataMigration />
                  </ProtectedRoute>
                }
              />
            </Route>
          </Routes>
          <Toaster richColors position="top-right" />
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}
