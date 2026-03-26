import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/context/AuthContext";
import { useCompanyScope } from "@/lib/roleFilter";
import { storage } from "@/lib/storage";
import {
  Bird,
  DollarSign,
  LayoutDashboard,
  Receipt,
  TrendingUp,
} from "lucide-react";
import { useMemo, useState } from "react";

export default function FinanceDashboard() {
  const { currentUser } = useAuth();
  const { farms, zones, branches } = useCompanyScope();

  const [selectedZone, setSelectedZone] = useState("all");
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [selectedFarm, setSelectedFarm] = useState("all");

  const filteredBranches = useMemo(
    () =>
      selectedZone === "all"
        ? branches
        : branches.filter((b) => b.zoneId === selectedZone),
    [selectedZone, branches],
  );
  const filteredFarms = useMemo(() => {
    let f = farms;
    if (selectedZone !== "all")
      f = f.filter((farm) => farm.zoneId === selectedZone);
    if (selectedBranch !== "all")
      f = f.filter((farm) => farm.branchId === selectedBranch);
    return f;
  }, [selectedZone, selectedBranch, farms]);

  const activeFarmIds = useMemo(() => {
    if (selectedFarm !== "all") return [selectedFarm];
    return filteredFarms.map((f) => f.id);
  }, [selectedFarm, filteredFarms]);

  const settlements = useMemo(() => {
    const all = storage.getPendingSettlements();
    return all.filter(
      (s) => s.status === "confirmed" && activeFarmIds.includes(s.farmId),
    );
  }, [activeFarmIds]);

  const expenses = useMemo(() => {
    const all = storage.getExpenses();
    return all.filter(
      (e) => e.status === "approved" && activeFarmIds.includes(e.farmId),
    );
  }, [activeFarmIds]);

  const totalGCPayable = useMemo(
    () => settlements.reduce((a, s) => a + s.totalGCPayable, 0),
    [settlements],
  );
  const totalExpenses = useMemo(
    () => expenses.reduce((a, e) => a + e.amount, 0),
    [expenses],
  );
  const netOperationalCost = totalExpenses - totalGCPayable;
  const totalBirdsSold = useMemo(
    () => settlements.reduce((a, s) => a + s.birdsSold, 0),
    [settlements],
  );
  const costPerBird =
    totalBirdsSold > 0 ? netOperationalCost / totalBirdsSold : 0;

  const showFilters =
    currentUser?.role === "SuperAdmin" ||
    currentUser?.role === "CompanyAdmin" ||
    currentUser?.role === "Manager";

  return (
    <div data-ocid="finance_dashboard.page" className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <LayoutDashboard size={20} className="text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Finance Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            Company-wide financial overview
          </p>
        </div>
      </div>

      {showFilters && (
        <Card>
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  Zone
                </p>
                <Select
                  value={selectedZone}
                  onValueChange={(v) => {
                    setSelectedZone(v);
                    setSelectedBranch("all");
                    setSelectedFarm("all");
                  }}
                >
                  <SelectTrigger data-ocid="finance_dashboard.zone.select">
                    <SelectValue placeholder="All Zones" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Zones</SelectItem>
                    {zones.map((z) => (
                      <SelectItem key={z.id} value={z.id}>
                        {z.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  Branch
                </p>
                <Select
                  value={selectedBranch}
                  onValueChange={(v) => {
                    setSelectedBranch(v);
                    setSelectedFarm("all");
                  }}
                >
                  <SelectTrigger data-ocid="finance_dashboard.branch.select">
                    <SelectValue placeholder="All Branches" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Branches</SelectItem>
                    {filteredBranches.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  Farm
                </p>
                <Select value={selectedFarm} onValueChange={setSelectedFarm}>
                  <SelectTrigger data-ocid="finance_dashboard.farm.select">
                    <SelectValue placeholder="All Farms" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Farms</SelectItem>
                    {filteredFarms.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp size={16} className="text-green-600" /> Total GC
              Payable
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              ₹
              {totalGCPayable.toLocaleString("en-IN", {
                maximumFractionDigits: 0,
              })}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {settlements.length} confirmed settlements
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Receipt size={16} className="text-red-500" /> Total Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-500">
              ₹
              {totalExpenses.toLocaleString("en-IN", {
                maximumFractionDigits: 0,
              })}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {expenses.length} approved expenses
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign size={16} className="text-blue-600" /> Net Operational
              Cost
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className={`text-2xl font-bold ${netOperationalCost >= 0 ? "text-blue-600" : "text-green-600"}`}
            >
              ₹
              {Math.abs(netOperationalCost).toLocaleString("en-IN", {
                maximumFractionDigits: 0,
              })}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {netOperationalCost >= 0 ? "Net cost" : "Net surplus"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Bird size={16} className="text-purple-600" /> Cost Per Bird
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-purple-600">
              ₹{Math.abs(costPerBird).toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {totalBirdsSold.toLocaleString()} birds sold
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Expense Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              "Medicine Cost",
              "Transport",
              "Labour",
              "Maintenance",
              "Other",
            ].map((type) => {
              const amt = expenses
                .filter((e) => e.type === type)
                .reduce((a, e) => a + e.amount, 0);
              return (
                <div key={type} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{type}</span>
                  <span className="font-medium">
                    ₹{amt.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                  </span>
                </div>
              );
            })}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Recent Settlements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {settlements.slice(0, 5).map((s) => {
              const farm = farms.find((f) => f.id === s.farmId);
              return (
                <div key={s.id} className="flex justify-between text-sm">
                  <div>
                    <p className="font-medium">{farm?.name || s.farmId}</p>
                    <p className="text-xs text-muted-foreground">
                      Batch {s.batchNumber}
                    </p>
                  </div>
                  <span className="font-medium text-green-600">
                    ₹
                    {s.totalGCPayable.toLocaleString("en-IN", {
                      maximumFractionDigits: 0,
                    })}
                  </span>
                </div>
              );
            })}
            {settlements.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No confirmed settlements yet.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
