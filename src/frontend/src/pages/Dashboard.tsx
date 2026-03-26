import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCompanyScope } from "@/lib/roleFilter";
import { storage } from "@/lib/storage";
import {
  AlertTriangle,
  BarChart3,
  Bird,
  DollarSign,
  Receipt,
  TrendingDown,
  Weight,
  Wheat,
} from "lucide-react";
import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export default function Dashboard() {
  const { farms, zones, branches } = useCompanyScope();

  const allBatches = storage.getBatches();
  const allDailyEntries = storage.getDailyEntries();
  const allFeedStocks = storage.getFeedStocks();
  const allSales = storage.getBirdSales();
  const allPayments = storage.getPayments();
  const allReceipts = storage.getReceipts();
  const farmIds = new Set(farms.map((f) => f.id));
  const batches = allBatches.filter((b) => farmIds.has(b.farmId));
  const batchIds = new Set(batches.map((b) => b.id));
  const dailyEntries = allDailyEntries.filter((e) => batchIds.has(e.batchId));
  const sales = allSales.filter((s) => farmIds.has(s.farmId));
  const payments = allPayments.filter((p) => farmIds.has(p.farmId));
  const receipts = allReceipts.filter((r) => farmIds.has(r.farmId));
  const feedStocks = allFeedStocks.filter((s) => farmIds.has(s.farmId));

  const totalBirds = useMemo(
    () =>
      batches
        .filter((b) => b.status === "active")
        .reduce((s, b) => s + b.birdsAlive, 0),
    [batches],
  );
  const totalSales = useMemo(
    () => sales.reduce((s, x) => s + x.totalAmount, 0),
    [sales],
  );
  const totalFeed = useMemo(
    () => dailyEntries.reduce((s, e) => s + e.feedIntakeGrams, 0),
    [dailyEntries],
  );
  const avgWeight = useMemo(() => {
    const recent = dailyEntries.filter((e) => e.bodyWeightGrams > 0);
    return recent.length
      ? (
          recent.reduce((s, e) => s + e.bodyWeightGrams, 0) /
          recent.length /
          1000
        ).toFixed(2)
      : "0.00";
  }, [dailyEntries]);
  const avgFCR = useMemo(() => {
    const valid = dailyEntries.filter((e) => e.fcr > 0);
    return valid.length
      ? (valid.reduce((s, e) => s + e.fcr, 0) / valid.length).toFixed(2)
      : "0.00";
  }, [dailyEntries]);
  const mortalityPct = useMemo(() => {
    const allInitial = batches.reduce((s, b) => s + b.chicksQty, 0);
    const allDead = batches.reduce(
      (s, b) => s + (b.chicksQty - b.birdsAlive),
      0,
    );
    return allInitial ? ((allDead / allInitial) * 100).toFixed(1) : "0.0";
  }, [batches]);

  const totalPayments = useMemo(
    () => payments.reduce((s, p) => s + p.amount, 0),
    [payments],
  );
  const totalReceipts = useMemo(
    () => receipts.reduce((s, r) => s + r.amount, 0),
    [receipts],
  );

  const last7 = useMemo(() => {
    const days: { date: string; mortality: number; feed: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().slice(0, 10);
      const ents = dailyEntries.filter((e) => e.entryDate === ds);
      days.push({
        date: ds.slice(5),
        mortality: ents.reduce((s, e) => s + e.mortalityCount, 0),
        feed: ents.reduce((s, e) => s + e.feedIntakeGrams, 0),
      });
    }
    return days;
  }, [dailyEntries]);

  const farmPerformance = useMemo(
    () =>
      farms.map((f) => ({
        name: f.name,
        birdsAlive: batches
          .filter((b) => b.farmId === f.id && b.status === "active")
          .reduce((s, b) => s + b.birdsAlive, 0),
      })),
    [farms, batches],
  );

  const zonePerformance = useMemo(
    () =>
      zones.map((z) => {
        const zoneFarms = farms.filter((f) => f.zoneId === z.id);
        const birds = zoneFarms.reduce(
          (s, f) =>
            s +
            batches
              .filter((b) => b.farmId === f.id && b.status === "active")
              .reduce((bs, b) => bs + b.birdsAlive, 0),
          0,
        );
        return { name: z.name, birdsAlive: birds };
      }),
    [zones, farms, batches],
  );

  const branchPerformance = useMemo(
    () =>
      branches.map((br) => {
        const brFarms = farms.filter((f) => f.branchId === br.id);
        const birds = brFarms.reduce(
          (s, f) =>
            s +
            batches
              .filter((b) => b.farmId === f.id && b.status === "active")
              .reduce((bs, b) => bs + b.birdsAlive, 0),
          0,
        );
        return { name: br.name, birdsAlive: birds };
      }),
    [branches, farms, batches],
  );

  const lowStockAlerts = feedStocks.filter(
    (s) => s.currentStockBags <= s.alertThresholdBags,
  );
  const highMortality = Number.parseFloat(mortalityPct) > 5;
  const poorFCR = Number.parseFloat(avgFCR) > 2.5;

  const kpis = [
    {
      label: "Total Birds",
      value: totalBirds.toLocaleString(),
      icon: Bird,
      color: "text-emerald-600",
    },
    {
      label: "Mortality %",
      value: `${mortalityPct}%`,
      icon: TrendingDown,
      color: highMortality ? "text-red-500" : "text-orange-500",
    },
    {
      label: "Avg Weight",
      value: `${avgWeight} kg`,
      icon: Weight,
      color: "text-blue-600",
    },
    {
      label: "FCR",
      value: avgFCR,
      icon: BarChart3,
      color: poorFCR ? "text-red-500" : "text-indigo-600",
    },
    {
      label: "Feed Consumed",
      value: `${(totalFeed / 1000).toFixed(0)} kg`,
      icon: Wheat,
      color: "text-amber-600",
    },
    {
      label: "Total Sales",
      value: `₹ ${totalSales.toLocaleString()}`,
      icon: DollarSign,
      color: "text-green-600",
    },
    {
      label: "Total Payments",
      value: `₹ ${totalPayments.toLocaleString()}`,
      icon: DollarSign,
      color: "text-rose-600",
    },
    {
      label: "Total Receipts",
      value: `₹ ${totalReceipts.toLocaleString()}`,
      icon: Receipt,
      color: "text-cyan-600",
    },
  ];

  return (
    <div className="space-y-6" data-ocid="dashboard.page">
      <div>
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <p className="text-muted-foreground text-sm">
          Farm operations overview
        </p>
      </div>

      {/* Alerts */}
      {(lowStockAlerts.length > 0 || highMortality || poorFCR) && (
        <div className="space-y-2" data-ocid="dashboard.alerts.section">
          {lowStockAlerts.map((s, i) => (
            <div
              key={s.id}
              className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700"
              data-ocid={`dashboard.alert.item.${i + 1}`}
            >
              <AlertTriangle size={16} />
              <span>
                LOW STOCK: {s.feedType} feed — only {s.currentStockBags} bags
                remaining (threshold: {s.alertThresholdBags})
              </span>
            </div>
          ))}
          {highMortality && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <AlertTriangle size={16} />
              <span>
                HIGH MORTALITY: {mortalityPct}% mortality rate exceeds 5%
                threshold
              </span>
            </div>
          )}
          {poorFCR && (
            <div className="flex items-center gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg text-sm text-orange-700">
              <AlertTriangle size={16} />
              <span>
                POOR FCR: Average FCR of {avgFCR} exceeds 2.5 threshold
              </span>
            </div>
          )}
        </div>
      )}

      {/* KPI Cards */}
      <div
        className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-3"
        data-ocid="dashboard.kpi.section"
      >
        {kpis.map((k, i) => (
          <Card key={k.label} data-ocid={`dashboard.kpi.card.${i + 1}`}>
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <k.icon size={16} className={k.color} />
                <span className="text-xs text-muted-foreground leading-tight">
                  {k.label}
                </span>
              </div>
              <p className="text-lg font-bold">{k.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">7-Day Mortality Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={last7}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="mortality"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">
              Farm Performance (Birds Alive)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={farmPerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="birdsAlive" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {zonePerformance.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Zone Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={zonePerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="birdsAlive" fill="#6366f1" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {branchPerformance.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Branch Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={branchPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="birdsAlive" fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Active Farms Summary */}
      {farms.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">
              Active Farms ({farms.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {farms.map((f) => {
                const activeBatches = batches.filter(
                  (b) => b.farmId === f.id && b.status === "active",
                );
                const birds = activeBatches.reduce(
                  (s, b) => s + b.birdsAlive,
                  0,
                );
                return (
                  <Badge key={f.id} variant="outline" className="gap-1">
                    <Bird size={12} />
                    {f.name}: {birds.toLocaleString()} birds
                  </Badge>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
