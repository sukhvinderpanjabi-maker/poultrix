import { storage } from "./storage";
import type { User } from "./storage";

export function logDelete(opts: {
  module: string;
  recordId: string;
  recordSummary: string;
  user: User | null;
}) {
  const now = new Date();
  storage.addAuditLog({
    module: opts.module,
    action: "delete",
    recordId: opts.recordId,
    recordSummary: opts.recordSummary,
    deletedBy: opts.user?.name || "Unknown",
    deletedByRole: opts.user?.role || "Unknown",
    companyId: opts.user?.companyId,
    date: now.toISOString().slice(0, 10),
    time: now.toTimeString().slice(0, 8),
  });
}
