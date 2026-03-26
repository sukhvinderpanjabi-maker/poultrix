import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/context/AuthContext";
import { storage } from "@/lib/storage";
import { ShieldAlert } from "lucide-react";
import { useMemo } from "react";

export default function AuditLog() {
  const { currentUser } = useAuth();
  const isSuperAdmin = currentUser?.role === "SuperAdmin";
  const isAdmin = isSuperAdmin || currentUser?.role === "CompanyAdmin";

  const logs = useMemo(() => {
    const all = storage.getAuditLogs();
    if (isSuperAdmin) return all;
    return all.filter((l) => l.companyId === currentUser?.companyId);
  }, [isSuperAdmin, currentUser]);

  if (!isAdmin) {
    return (
      <div
        data-ocid="audit_log.page"
        className="flex flex-col items-center justify-center h-64 gap-3 text-muted-foreground"
      >
        <ShieldAlert size={40} />
        <p className="font-medium">Access Denied</p>
      </div>
    );
  }

  return (
    <div data-ocid="audit_log.page" className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
          <ShieldAlert size={20} className="text-destructive" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Audit Log</h1>
          <p className="text-sm text-muted-foreground">
            Record of all deleted entries
          </p>
        </div>
      </div>
      <Card>
        <CardContent className="p-0">
          {logs.length === 0 ? (
            <div
              data-ocid="audit_log.empty_state"
              className="py-12 text-center text-muted-foreground text-sm"
            >
              No deletion records found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table data-ocid="audit_log.table">
                <TableHeader>
                  <TableRow>
                    <TableHead>Module</TableHead>
                    <TableHead>Record</TableHead>
                    <TableHead>Deleted By</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...logs].reverse().map((log, idx) => (
                    <TableRow
                      key={log.id}
                      data-ocid={`audit_log.row.${idx + 1}`}
                    >
                      <TableCell>
                        <Badge variant="outline">{log.module}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {log.recordSummary}
                      </TableCell>
                      <TableCell>{log.deletedBy}</TableCell>
                      <TableCell>
                        <Badge className="bg-red-100 text-red-700 border-red-200">
                          {log.deletedByRole}
                        </Badge>
                      </TableCell>
                      <TableCell>{log.date}</TableCell>
                      <TableCell>{log.time}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
