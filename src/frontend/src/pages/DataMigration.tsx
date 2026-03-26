import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import {
  exportMigrationData,
  getEnvironment,
  importMigrationData,
  storage,
} from "@/lib/storage";
import {
  AlertCircle,
  CheckCircle2,
  Database,
  Download,
  Info,
  Upload,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

export default function DataMigration() {
  const [importJson, setImportJson] = useState("");
  const [importMode, setImportMode] = useState<"merge" | "replace">("merge");
  const [importResult, setImportResult] = useState<{
    imported: number;
    skipped: number;
    errors: string[];
  } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const env = getEnvironment();
  const userCount = storage.getUsers().length;

  function handleExport() {
    const json = exportMigrationData();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `poultrix-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Export successful", {
      description:
        "Open the live site, go to Data Migration, and import this file.",
    });
    console.log("[MIGRATION] Exported data from", env, "environment");
  }

  function handleFileLoad(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setImportJson((ev.target?.result as string) || "");
    reader.readAsText(file);
  }

  function handleImport() {
    if (!importJson.trim()) {
      toast.error("No data to import", {
        description: "Paste JSON or load a file first.",
      });
      return;
    }
    const result = importMigrationData(importJson, importMode);
    setImportResult(result);
    if (result.errors.length > 0) {
      toast.error("Import failed", { description: result.errors[0] });
    } else {
      toast.success("Import complete", {
        description: `${result.imported} records imported, ${result.skipped} already existed.`,
      });
    }
    console.log("[MIGRATION] Import result on", env, ":", result);
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Data Migration</h1>
        <p className="text-muted-foreground mt-1">
          Export users and data from one environment and import them into
          another.
        </p>
      </div>

      {/* Environment Info */}
      <Alert className="border-blue-200 bg-blue-50">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertTitle className="text-blue-800">How this works</AlertTitle>
        <AlertDescription className="text-blue-700 space-y-1">
          <p>
            Poultrix stores data in your <strong>browser's localStorage</strong>
            . Each domain (draft vs live) has its own separate storage — users
            created in draft are{" "}
            <strong>not automatically available in live</strong>.
          </p>
          <p className="mt-1">
            <strong>Step 1:</strong> On the draft site, click{" "}
            <em>Export Data</em> to download a JSON file.
            <br />
            <strong>Step 2:</strong> On the live site, paste or upload that file
            and click <em>Import Data</em>.
          </p>
        </AlertDescription>
      </Alert>

      {/* Current Environment */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Database className="h-4 w-4" />
            Current Environment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Environment:</span>
            <Badge
              className={
                env === "live"
                  ? "bg-green-100 text-green-800 border-green-200"
                  : env === "draft"
                    ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                    : "bg-gray-100 text-gray-800 border-gray-200"
              }
            >
              {env.toUpperCase()}
            </Badge>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Host:</span>
            <code className="text-xs bg-muted px-2 py-0.5 rounded">
              {window.location.hostname}
            </code>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              Users in local storage:
            </span>
            <Badge variant="outline">{userCount}</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Export */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Data
          </CardTitle>
          <CardDescription>
            Download all users, companies, farms, sheds, batches, zones, and
            branches from this environment as a JSON file.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleExport} className="gap-2">
            <Download className="h-4 w-4" />
            Export Data ({userCount} users)
          </Button>
        </CardContent>
      </Card>

      {/* Import */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Import Data
          </CardTitle>
          <CardDescription>
            Import data exported from another environment. Use <em>Merge</em> to
            add new records without overwriting existing ones.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm font-medium mb-2 block">
              Import Mode
            </Label>
            <RadioGroup
              value={importMode}
              onValueChange={(v) => setImportMode(v as "merge" | "replace")}
              className="flex gap-4"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="merge" id="merge" />
                <Label htmlFor="merge" className="cursor-pointer">
                  Merge{" "}
                  <span className="text-muted-foreground text-xs">
                    (add new, keep existing)
                  </span>
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="replace" id="replace" />
                <Label htmlFor="replace" className="cursor-pointer">
                  Replace{" "}
                  <span className="text-muted-foreground text-xs">
                    (overwrite all data)
                  </span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Load from file</Label>
            <div>
              <input
                ref={fileRef}
                type="file"
                accept=".json"
                onChange={handleFileLoad}
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={() => fileRef.current?.click()}
                className="gap-2"
              >
                <Upload className="h-4 w-4" />
                Choose JSON File
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Or paste JSON directly
            </Label>
            <Textarea
              value={importJson}
              onChange={(e) => setImportJson(e.target.value)}
              placeholder="Paste exported JSON here..."
              className="font-mono text-xs h-32"
            />
          </div>

          <Button
            onClick={handleImport}
            disabled={!importJson.trim()}
            className="gap-2"
          >
            <Upload className="h-4 w-4" />
            Import Data
          </Button>

          {importResult && (
            <Alert
              className={
                importResult.errors.length > 0
                  ? "border-red-200 bg-red-50"
                  : "border-green-200 bg-green-50"
              }
            >
              {importResult.errors.length > 0 ? (
                <AlertCircle className="h-4 w-4 text-red-600" />
              ) : (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              )}
              <AlertTitle
                className={
                  importResult.errors.length > 0
                    ? "text-red-800"
                    : "text-green-800"
                }
              >
                {importResult.errors.length > 0
                  ? "Import Failed"
                  : "Import Successful"}
              </AlertTitle>
              <AlertDescription
                className={
                  importResult.errors.length > 0
                    ? "text-red-700"
                    : "text-green-700"
                }
              >
                {importResult.errors.length > 0 ? (
                  <ul>
                    {importResult.errors.map((e) => (
                      <li key={e}>{e}</li>
                    ))}
                  </ul>
                ) : (
                  <p>
                    {importResult.imported} records imported,{" "}
                    {importResult.skipped} already existed and were skipped.
                  </p>
                )}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Seeded Users Reference */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Built-in Test Credentials</CardTitle>
          <CardDescription>
            These users are always available in both draft and live environments
            (seeded on every page load).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 pr-4 font-medium">Username</th>
                  <th className="text-left py-2 pr-4 font-medium">Password</th>
                  <th className="text-left py-2 pr-4 font-medium">Role</th>
                  <th className="text-left py-2 font-medium">Company</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {[
                  {
                    username: "superadmin",
                    password: "Admin@123",
                    role: "SuperAdmin",
                    company: "—",
                  },
                  {
                    username: "demo1990",
                    password: "demo@123",
                    role: "CompanyAdmin",
                    company: "Demo Poultry Pvt Ltd",
                  },
                  {
                    username: "sukhvinder9929",
                    password: "Sukh@123",
                    role: "CompanyAdmin",
                    company: "Demo Poultry Pvt Ltd",
                  },
                  {
                    username: "supervisor01",
                    password: "123456",
                    role: "Supervisor",
                    company: "Demo Poultry Pvt Ltd",
                  },
                  {
                    username: "admin123",
                    password: "123456",
                    role: "CompanyAdmin",
                    company: "Demo Poultry Pvt Ltd",
                  },
                  {
                    username: "testadmin",
                    password: "Test@123",
                    role: "CompanyAdmin",
                    company: "Test Agro Pvt Ltd",
                  },
                ].map((u) => (
                  <tr key={u.username}>
                    <td className="py-2 pr-4 font-mono">{u.username}</td>
                    <td className="py-2 pr-4 font-mono">{u.password}</td>
                    <td className="py-2 pr-4">{u.role}</td>
                    <td className="py-2 text-muted-foreground">{u.company}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
