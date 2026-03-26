// Role prefix map
const ROLE_PREFIX: Record<string, string> = {
  SuperAdmin: "ADM",
  CompanyAdmin: "ADM",
  Dealer: "DLR",
  Farmer: "FAR",
  Manager: "MGR",
  Supervisor: "SUP",
  Staff: "STF",
};

// Counter stored in localStorage per prefix key
// Key: px_id_counter_{prefix} e.g. px_id_counter_ADM
// Value: last used number (integer)

export function generateSerialNumber(
  role: string,
  companyPrefix?: string,
): string {
  const roleCode = ROLE_PREFIX[role] ?? "USR";
  const prefix = companyPrefix ? `${companyPrefix}-${roleCode}` : roleCode;
  const counterKey = `px_id_counter_${prefix}`;
  const last = Number.parseInt(localStorage.getItem(counterKey) ?? "0", 10);
  const next = last + 1;
  localStorage.setItem(counterKey, String(next));
  return `${prefix}-${String(next).padStart(4, "0")}`;
}

export function generateUsername(
  name: string,
  mobile: string,
  existingUsernames: string[],
): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0] ?? "User";
  const last = parts.length > 1 ? parts.slice(1).join("") : "";
  const last4 =
    mobile?.replace(/\D/g, "").slice(-4) ||
    String(Math.floor(1000 + Math.random() * 9000));
  const base = `${first}${last}${last4}`;

  const lowerExisting = existingUsernames.map((u) => u.toLowerCase());
  if (!lowerExisting.includes(base.toLowerCase())) return base;

  // Append random 2-digit suffix until unique
  let candidate = base;
  let attempts = 0;
  while (lowerExisting.includes(candidate.toLowerCase()) && attempts < 100) {
    const suffix = String(Math.floor(10 + Math.random() * 90));
    candidate = `${base}_${suffix}`;
    attempts++;
  }
  return candidate;
}
