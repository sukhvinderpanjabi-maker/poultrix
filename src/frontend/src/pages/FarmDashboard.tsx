import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { useNavigate, useParams } from "@/lib/react-router-compat";
import { useCompanyScope } from "@/lib/roleFilter";
import { storage } from "@/lib/storage";
import {
  Activity,
  ArrowLeft,
  Bird,
  ClipboardList,
  Layers,
  MapPin,
  Phone,
  TrendingUp,
  User,
  Wheat,
} from "lucide-react";
import { useMemo } from "react";

function daysBetween(from: string, to: string) {
  const d1 = new Date(from);
  const d2 = new Date(to);
  return Math.max(
    0,
    Math.floor((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)),
  );
}

function fmt(n: number, decimals = 0) {
  return n.toLocaleString("en-IN", { maximumFractionDigits: decimals });
}

export default function FarmDashboard() {
  const { farmId } = useParams<{ farmId: string }>();
  const navigate = useNavigate();
  const { currentUser: _currentUser } = useAuth();
  const {
    farms: scopedFarms,
    zones: allZones,
    branches: allBranches,
    users: allUsers,
    isSuperAdmin,
  } = useCompanyScope();

  const farm = useMemo(
    () =>
      scopedFarms.find((f) => f.id === farmId) ||
      (isSuperAdmin
        ? storage.getFarms().find((f) => f.id === farmId)
        : undefined),
    [farmId, scopedFarms, isSuperAdmin],
  );

  // Access control - farm must be in scoped list
  const hasAccess = useMemo(() => {
    if (!farm) return false;
    if (isSuperAdmin) return true;
    return scopedFarms.some((f) => f.id === farmId);
  }, [farm, scopedFarms, farmId, isSuperAdmin]);

  const companies = storage.getCompanies();
  const sheds = storage.getShedsByFarm(farmId || "");
  const allBatches = storage.getBatches();
  const allDailyEntries = storage.getDailyEntries();

  const farmBatches = allBatches.filter((b) => b.farmId === farmId);
  const activeBatches = farmBatches.filter((b) => b.status === "active");

  const today = new Date().toISOString().slice(0, 10);

  // KPI computations
  const kpis = useMemo(() => {
    const totalBirds = activeBatches.reduce((s, b) => s + b.birdsAlive, 0);

    const totalChicksPlaced = activeBatches.reduce(
      (s, b) => s + b.chicksQty,
      0,
    );
    const totalMortality = totalChicksPlaced - totalBirds;
    const mortalityPct =
      totalChicksPlaced > 0 ? (totalMortality / totalChicksPlaced) * 100 : 0;

    // Per active batch: get latest daily entry
    let totalFeedG = 0;
    let fcrSum = 0;
    let fcrCount = 0;

    for (const batch of activeBatches) {
      const entries = allDailyEntries
        .filter((e) => e.batchId === batch.id)
        .sort((a, b) => b.entryDate.localeCompare(a.entryDate));
      const latest = entries[0];
      if (latest) {
        totalFeedG += latest.cumulativeFeed;
        if (latest.fcr > 0) {
          fcrSum += latest.fcr;
          fcrCount++;
        }
      }
    }

    const avgFCR = fcrCount > 0 ? fcrSum / fcrCount : 0;
    return {
      totalBirds,
      mortalityPct,
      totalFeedG,
      avgFCR,
      activeBatchCount: activeBatches.length,
    };
  }, [activeBatches, allDailyEntries]);

  const getCompanyName = (id?: string) =>
    companies.find((c) => c.id === id)?.name;
  const getZoneName = (id?: string) => allZones.find((z) => z.id === id)?.name;
  const getBranchName = (id?: string) =>
    allBranches.find((b) => b.id === id)?.name;
  const getUserName = (id?: string) => allUsers.find((u) => u.id === id)?.name;

  const isShedActive = (shedId: string) =>
    allBatches.some((b) => b.shedId === shedId && b.status === "active");
  const getActiveBatchNo = (shedId: string) =>
    allBatches.find((b) => b.shedId === shedId && b.status === "active")
      ?.batchNumber;

  if (!farm || !hasAccess) {
    return (
      <div className="p-8 text-center" data-ocid="farm_dashboard.error_state">
        <Bird size={48} className="mx-auto mb-3 text-muted-foreground" />
        <p className="text-muted-foreground">
          Farm not found or you don't have access.
        </p>
        <Button
          className="mt-4"
          variant="outline"
          onClick={() => navigate("/farms")}
          data-ocid="farm_dashboard.back.button"
        >
          Back to Farms
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-ocid="farm_dashboard.page">
      {/* Header */}
      <div className="flex items-start gap-4 flex-wrap">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate("/farms")}
          data-ocid="farm_dashboard.back.button"
        >
          <ArrowLeft size={14} className="mr-1" />
          Back to Farms
        </Button>
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Bird size={24} className="text-primary" />
            {farm.name}
          </h2>
          <div className="flex flex-wrap gap-2 mt-2">
            {farm.companyId && (
              <Badge variant="outline">{getCompanyName(farm.companyId)}</Badge>
            )}
            {farm.zoneId && (
              <Badge variant="secondary">{getZoneName(farm.zoneId)}</Badge>
            )}
            {farm.branchId && <Badge>{getBranchName(farm.branchId)}</Badge>}
          </div>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => navigate("/daily-entry")}
          data-ocid="farm_dashboard.daily_entry.button"
        >
          <ClipboardList size={14} className="mr-1" />
          Daily Entry
        </Button>
      </div>

      {/* Farm Info */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            {farm.farmerName && (
              <div className="flex items-center gap-2">
                <User size={16} className="text-muted-foreground shrink-0" />
                <div>
                  <div className="text-xs text-muted-foreground">Farmer</div>
                  <div className="font-medium">{farm.farmerName}</div>
                </div>
              </div>
            )}
            {farm.farmerContact && (
              <div className="flex items-center gap-2">
                <Phone size={16} className="text-muted-foreground shrink-0" />
                <div>
                  <div className="text-xs text-muted-foreground">Contact</div>
                  <div className="font-medium">{farm.farmerContact}</div>
                </div>
              </div>
            )}
            {(farm.address || farm.location) && (
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-muted-foreground shrink-0" />
                <div>
                  <div className="text-xs text-muted-foreground">Location</div>
                  <div className="font-medium">
                    {farm.address || farm.location}
                  </div>
                </div>
              </div>
            )}
            {farm.supervisorId && (
              <div className="flex items-center gap-2">
                <User size={16} className="text-muted-foreground shrink-0" />
                <div>
                  <div className="text-xs text-muted-foreground">
                    Supervisor
                  </div>
                  <div className="font-medium">
                    {getUserName(farm.supervisorId) || "-"}
                  </div>
                </div>
              </div>
            )}
            {farm.dealerId && (
              <div className="flex items-center gap-2">
                <User size={16} className="text-muted-foreground shrink-0" />
                <div>
                  <div className="text-xs text-muted-foreground">Dealer</div>
                  <div className="font-medium">
                    {getUserName(farm.dealerId) || "-"}
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card data-ocid="farm_dashboard.active_batches.card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Layers size={18} className="text-primary" />
              <span className="text-xs text-muted-foreground">
                Active Batches
              </span>
            </div>
            <div className="text-2xl font-bold">{kpis.activeBatchCount}</div>
          </CardContent>
        </Card>
        <Card data-ocid="farm_dashboard.total_birds.card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Bird size={18} className="text-green-600" />
              <span className="text-xs text-muted-foreground">Total Birds</span>
            </div>
            <div className="text-2xl font-bold text-green-700">
              {fmt(kpis.totalBirds)}
            </div>
          </CardContent>
        </Card>
        <Card data-ocid="farm_dashboard.fcr.card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={18} className="text-blue-600" />
              <span className="text-xs text-muted-foreground">Avg FCR</span>
            </div>
            <div
              className={`text-2xl font-bold ${
                kpis.avgFCR === 0
                  ? "text-muted-foreground"
                  : kpis.avgFCR < 1.8
                    ? "text-green-700"
                    : kpis.avgFCR < 2.2
                      ? "text-amber-600"
                      : "text-red-600"
              }`}
            >
              {kpis.avgFCR === 0 ? "-" : kpis.avgFCR.toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card data-ocid="farm_dashboard.mortality.card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity size={18} className="text-red-500" />
              <span className="text-xs text-muted-foreground">Mortality %</span>
            </div>
            <div
              className={`text-2xl font-bold ${
                kpis.mortalityPct === 0
                  ? "text-muted-foreground"
                  : kpis.mortalityPct < 3
                    ? "text-green-700"
                    : kpis.mortalityPct < 5
                      ? "text-amber-600"
                      : "text-red-600"
              }`}
            >
              {kpis.mortalityPct.toFixed(2)}%
            </div>
          </CardContent>
        </Card>
        <Card data-ocid="farm_dashboard.feed.card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Wheat size={18} className="text-amber-600" />
              <span className="text-xs text-muted-foreground">
                Total Feed (g)
              </span>
            </div>
            <div className="text-2xl font-bold text-amber-700">
              {fmt(kpis.totalFeedG)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Batches Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Active Batches</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {activeBatches.length === 0 ? (
            <div
              className="p-8 text-center text-muted-foreground"
              data-ocid="farm_dashboard.batches.empty_state"
            >
              <Bird size={36} className="mx-auto mb-2" />
              <p>No active batches.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table
                className="w-full text-sm"
                data-ocid="farm_dashboard.batches.table"
              >
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3">Batch No</th>
                    <th className="text-left p-3">Shed</th>
                    <th className="text-left p-3">Placement Date</th>
                    <th className="text-right p-3">Age (days)</th>
                    <th className="text-right p-3">Chicks Placed</th>
                    <th className="text-right p-3">Birds Alive</th>
                    <th className="text-right p-3">Mortality %</th>
                    <th className="text-right p-3">Avg Body Wt (g)</th>
                    <th className="text-right p-3">FCR</th>
                    <th className="text-left p-3">Status</th>
                    <th className="p-3" />
                  </tr>
                </thead>
                <tbody>
                  {activeBatches.map((b, i) => {
                    const shed = storage
                      .getSheds()
                      .find((s) => s.id === b.shedId);
                    const age = daysBetween(b.placementDate, today);
                    const entries = allDailyEntries
                      .filter((e) => e.batchId === b.id)
                      .sort((a, ev) => ev.entryDate.localeCompare(a.entryDate));
                    const latest = entries[0];
                    const mortalityPct =
                      b.chicksQty > 0
                        ? (
                            ((b.chicksQty - b.birdsAlive) / b.chicksQty) *
                            100
                          ).toFixed(2)
                        : "0.00";
                    return (
                      <tr
                        key={b.id}
                        className="border-b hover:bg-muted/30"
                        data-ocid={`farm_dashboard.batch.row.${i + 1}`}
                      >
                        <td className="p-3 font-medium">{b.batchNumber}</td>
                        <td className="p-3">{shed?.name || "-"}</td>
                        <td className="p-3">{b.placementDate}</td>
                        <td className="p-3 text-right">{age}</td>
                        <td className="p-3 text-right">
                          {b.chicksQty.toLocaleString()}
                        </td>
                        <td className="p-3 text-right text-green-700 font-medium">
                          {b.birdsAlive.toLocaleString()}
                        </td>
                        <td
                          className={`p-3 text-right font-medium ${
                            Number(mortalityPct) < 3
                              ? "text-green-700"
                              : Number(mortalityPct) < 5
                                ? "text-amber-600"
                                : "text-red-600"
                          }`}
                        >
                          {mortalityPct}%
                        </td>
                        <td className="p-3 text-right">
                          {latest?.bodyWeightGrams
                            ? latest.bodyWeightGrams.toLocaleString()
                            : "-"}
                        </td>
                        <td
                          className={`p-3 text-right font-medium ${
                            !latest || latest.fcr === 0
                              ? "text-muted-foreground"
                              : latest.fcr < 1.8
                                ? "text-green-700"
                                : latest.fcr < 2.2
                                  ? "text-amber-600"
                                  : "text-red-600"
                          }`}
                        >
                          {latest && latest.fcr > 0
                            ? latest.fcr.toFixed(2)
                            : "-"}
                        </td>
                        <td className="p-3">
                          <Badge className="bg-green-100 text-green-700 border-green-200">
                            Active
                          </Badge>
                        </td>
                        <td className="p-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate("/daily-entry")}
                            data-ocid={`farm_dashboard.daily_entry.button.${i + 1}`}
                          >
                            <ClipboardList size={12} className="mr-1" />
                            Entry
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sheds Summary */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Sheds Summary</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {sheds.length === 0 ? (
            <div
              className="p-8 text-center text-muted-foreground"
              data-ocid="farm_dashboard.sheds.empty_state"
            >
              <Layers size={36} className="mx-auto mb-2" />
              <p>No sheds configured for this farm.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table
                className="w-full text-sm"
                data-ocid="farm_dashboard.sheds.table"
              >
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3">Shed Name</th>
                    <th className="text-left p-3">Type</th>
                    <th className="text-right p-3">Capacity</th>
                    <th className="text-left p-3">Status</th>
                    <th className="text-left p-3">Active Batch</th>
                  </tr>
                </thead>
                <tbody>
                  {sheds.map((s, i) => {
                    const active = isShedActive(s.id);
                    const activeBatchNo = getActiveBatchNo(s.id);
                    return (
                      <tr
                        key={s.id}
                        className="border-b hover:bg-muted/30"
                        data-ocid={`farm_dashboard.shed.row.${i + 1}`}
                      >
                        <td className="p-3 font-medium">{s.name}</td>
                        <td className="p-3 text-muted-foreground">
                          {s.shedType || "Open"}
                        </td>
                        <td className="p-3 text-right">
                          {s.capacity.toLocaleString()}
                        </td>
                        <td className="p-3">
                          {active ? (
                            <Badge className="bg-green-100 text-green-700 border-green-200">
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Empty</Badge>
                          )}
                        </td>
                        <td className="p-3 text-muted-foreground">
                          {activeBatchNo || "-"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
