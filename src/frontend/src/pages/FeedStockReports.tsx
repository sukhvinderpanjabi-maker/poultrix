import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { useCompanyScope } from "@/lib/roleFilter";
import { storage } from "@/lib/storage";
import { BarChart3, Download, FileSpreadsheet, Filter, X } from "lucide-react";
import { useMemo, useState } from "react";

type ReportRow = {
  feedType: string;
  openingKg: number;
  receivedKg: number;
  issuedKg: number;
  balanceKg: number;
};

export default function FeedStockReports() {
  const { currentUser } = useAuth();

  const companies = storage.getCompanies();
  const allZones = storage.getZones();
  const allBranches = storage.getBranches();
  const allFarms = storage.getFarms();
  const feedTypes = storage.getFeedTypes();

  const canSeeCompany =
    currentUser?.role === "SuperAdmin" ||
    (currentUser?.role === "CompanyAdmin" && companies.length > 1);

  const accessibleFarms = allFarms;

  const [filters, setFilters] = useState({
    companyId: "",
    zoneId: "",
    branchId: "",
    farmId: "",
  });
  const [reportData, setReportData] = useState<ReportRow[] | null>(null);
  const [activeFilters, setActiveFilters] = useState<
    { label: string; key: string }[]
  >([]);

  const filteredZones = useMemo(
    () =>
      filters.companyId
        ? allZones.filter((z) => z.companyId === filters.companyId)
        : allZones,
    [allZones, filters.companyId],
  );

  const filteredBranches = useMemo(
    () =>
      filters.zoneId
        ? allBranches.filter((b) => b.zoneId === filters.zoneId)
        : filters.companyId
          ? allBranches.filter((b) => b.companyId === filters.companyId)
          : allBranches,
    [allBranches, filters.zoneId, filters.companyId],
  );

  const filteredFarms = useMemo(() => {
    let farms = accessibleFarms;
    if (filters.branchId)
      farms = farms.filter((f) => f.branchId === filters.branchId);
    else if (filters.zoneId)
      farms = farms.filter((f) => f.zoneId === filters.zoneId);
    else if (filters.companyId)
      farms = farms.filter((f) => f.companyId === filters.companyId);
    return farms;
  }, [accessibleFarms, filters]);

  const generateReport = () => {
    const targetFarms = filters.farmId
      ? filteredFarms.filter((f) => f.id === filters.farmId)
      : filteredFarms;

    const rows: ReportRow[] = feedTypes.map((ft) => {
      let openingKg = 0;
      let receivedKg = 0;
      let issuedKg = 0;

      if (targetFarms.length > 0) {
        for (const farm of targetFarms) {
          const bal = storage.getFeedStockBalance(ft.name, farm.id);
          openingKg += bal.openingKg;
          receivedKg += bal.receivedKg;
          issuedKg += bal.issuedKg;
        }
        // Also include global stock if no specific farm selected
        if (!filters.farmId) {
          const globalBal = storage.getFeedStockBalance(ft.name);
          openingKg += globalBal.openingKg;
          receivedKg += globalBal.receivedKg;
          issuedKg += globalBal.issuedKg;
        }
      } else {
        const bal = storage.getFeedStockBalance(ft.name);
        openingKg = bal.openingKg;
        receivedKg = bal.receivedKg;
        issuedKg = bal.issuedKg;
      }

      return {
        feedType: ft.name,
        openingKg,
        receivedKg,
        issuedKg,
        balanceKg: openingKg + receivedKg - issuedKg,
      };
    });

    setReportData(rows);

    // Build active filter chips
    const chips: { label: string; key: string }[] = [];
    if (filters.companyId) {
      const c = companies.find((x) => x.id === filters.companyId);
      if (c) chips.push({ label: `Company: ${c.name}`, key: "companyId" });
    }
    if (filters.zoneId) {
      const z = allZones.find((x) => x.id === filters.zoneId);
      if (z) chips.push({ label: `Zone: ${z.name}`, key: "zoneId" });
    }
    if (filters.branchId) {
      const b = allBranches.find((x) => x.id === filters.branchId);
      if (b) chips.push({ label: `Branch: ${b.name}`, key: "branchId" });
    }
    if (filters.farmId) {
      const f = allFarms.find((x) => x.id === filters.farmId);
      if (f) chips.push({ label: `Farm: ${f.name}`, key: "farmId" });
    }
    setActiveFilters(chips);
  };

  const removeFilter = (key: string) => {
    setFilters((f) => ({ ...f, [key]: "" }));
    setReportData(null);
  };

  const totals = useMemo(() => {
    if (!reportData) return null;
    return reportData.reduce(
      (acc, r) => ({
        openingKg: acc.openingKg + r.openingKg,
        receivedKg: acc.receivedKg + r.receivedKg,
        issuedKg: acc.issuedKg + r.issuedKg,
        balanceKg: acc.balanceKg + r.balanceKg,
      }),
      { openingKg: 0, receivedKg: 0, issuedKg: 0, balanceKg: 0 },
    );
  }, [reportData]);

  const kgBags = (kg: number) =>
    `${kg.toLocaleString()} kg (${Math.round(kg / 50)} bags)`;

  const exportExcel = () => {
    if (!reportData) return;
    import("@/lib/exportUtils").then(({ downloadExcel: nativeXLSX }) => {
      nativeXLSX(
        reportData as unknown as Record<string, unknown>[],
        "feed_stock_report.csv",
      );
    });
  };

  const exportPDF = () => {
    if (!reportData) return;
    import("@/lib/exportUtils").then(({ printAsPDF: nativePDF }) => {
      const pdfRows = reportData.map((r) => ({
        "Feed Type": r.feedType,
        "Opening (kg)": r.openingKg.toLocaleString(),
        "Received (kg)": r.receivedKg.toLocaleString(),
        "Issued (kg)": r.issuedKg.toLocaleString(),
        "Balance (kg)": r.balanceKg.toLocaleString(),
        "Balance (bags)": Math.round(r.balanceKg / 50),
      }));
      nativePDF(pdfRows as Record<string, unknown>[], "Feed Stock Report");
    });
  };

  return (
    <div className="space-y-6" data-ocid="feed_reports.page">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Feed Stock Reports</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Generate zone-wise, branch-wise, and farm-wise feed stock summaries.
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Filter size={16} /> Report Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {canSeeCompany && (
              <div>
                <Label htmlFor="rep-company">Company</Label>
                <select
                  id="rep-company"
                  data-ocid="feed_reports.company.select"
                  value={filters.companyId}
                  onChange={(e) =>
                    setFilters((f) => ({
                      ...f,
                      companyId: e.target.value,
                      zoneId: "",
                      branchId: "",
                      farmId: "",
                    }))
                  }
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">All Companies</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <Label htmlFor="rep-zone">Zone</Label>
              <select
                id="rep-zone"
                data-ocid="feed_reports.zone.select"
                value={filters.zoneId}
                onChange={(e) =>
                  setFilters((f) => ({
                    ...f,
                    zoneId: e.target.value,
                    branchId: "",
                    farmId: "",
                  }))
                }
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">All Zones</option>
                {filteredZones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="rep-branch">Branch</Label>
              <select
                id="rep-branch"
                data-ocid="feed_reports.branch.select"
                value={filters.branchId}
                onChange={(e) =>
                  setFilters((f) => ({
                    ...f,
                    branchId: e.target.value,
                    farmId: "",
                  }))
                }
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">All Branches</option>
                {filteredBranches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="rep-farm">Farm</Label>
              <select
                id="rep-farm"
                data-ocid="feed_reports.farm.select"
                value={filters.farmId}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, farmId: e.target.value }))
                }
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">All Farms</option>
                {filteredFarms.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button
              onClick={generateReport}
              data-ocid="feed_reports.generate.button"
            >
              <BarChart3 size={16} className="mr-2" /> Generate Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Active filter chips */}
      {activeFilters.length > 0 && (
        <div
          className="flex flex-wrap gap-2"
          data-ocid="feed_reports.filters.section"
        >
          {activeFilters.map((chip) => (
            <Badge
              key={chip.key}
              variant="secondary"
              className="flex items-center gap-1 pr-1"
            >
              {chip.label}
              <button
                type="button"
                onClick={() => removeFilter(chip.key)}
                className="ml-1 hover:text-destructive"
                data-ocid="feed_reports.filter_remove.button"
              >
                <X size={12} />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Report results */}
      {reportData === null ? (
        <Card data-ocid="feed_reports.empty_state">
          <CardContent className="p-12 text-center text-muted-foreground">
            <BarChart3 size={48} className="mx-auto mb-4 opacity-30" />
            <p className="font-medium text-base">No report generated yet</p>
            <p className="text-sm mt-1">
              Select your filters above and click &quot;Generate Report&quot; to
              view feed stock data.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={exportExcel}
              data-ocid="feed_reports.excel.button"
            >
              <FileSpreadsheet size={15} className="mr-1" /> Excel
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportPDF}
              data-ocid="feed_reports.pdf.button"
            >
              <Download size={15} className="mr-1" /> PDF
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm" data-ocid="feed_reports.table">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3">Feed Type</th>
                  <th className="text-right p-3">Opening Stock</th>
                  <th className="text-right p-3">Total Received</th>
                  <th className="text-right p-3">Total Issued</th>
                  <th className="text-right p-3">Current Balance</th>
                  <th className="text-right p-3">Balance (Bags)</th>
                </tr>
              </thead>
              <tbody>
                {reportData.map((r, i) => (
                  <tr
                    key={r.feedType}
                    className="border-b hover:bg-muted/30"
                    data-ocid={`feed_reports.row.${i + 1}`}
                  >
                    <td className="p-3 font-medium">
                      <Badge variant="outline">{r.feedType}</Badge>
                    </td>
                    <td className="p-3 text-right text-muted-foreground">
                      {kgBags(r.openingKg)}
                    </td>
                    <td className="p-3 text-right">{kgBags(r.receivedKg)}</td>
                    <td className="p-3 text-right text-orange-600">
                      {kgBags(r.issuedKg)}
                    </td>
                    <td
                      className={`p-3 text-right font-semibold ${
                        r.balanceKg <= 0 ? "text-destructive" : "text-green-600"
                      }`}
                    >
                      {kgBags(r.balanceKg)}
                    </td>
                    <td className="p-3 text-right text-muted-foreground">
                      {Math.round(r.balanceKg / 50)}
                    </td>
                  </tr>
                ))}
                {/* Summary row */}
                {totals && (
                  <tr
                    className="border-t-2 bg-muted/70 font-bold"
                    data-ocid="feed_reports.summary.row"
                  >
                    <td className="p-3">TOTAL</td>
                    <td className="p-3 text-right">
                      {kgBags(totals.openingKg)}
                    </td>
                    <td className="p-3 text-right">
                      {kgBags(totals.receivedKg)}
                    </td>
                    <td className="p-3 text-right">
                      {kgBags(totals.issuedKg)}
                    </td>
                    <td
                      className={`p-3 text-right ${
                        totals.balanceKg <= 0
                          ? "text-destructive"
                          : "text-green-600"
                      }`}
                    >
                      {kgBags(totals.balanceKg)}
                    </td>
                    <td className="p-3 text-right">
                      {Math.round(totals.balanceKg / 50)}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
