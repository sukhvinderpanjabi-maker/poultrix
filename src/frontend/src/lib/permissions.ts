import { useAuth } from "@/context/AuthContext";

export type PermissionSet = {
  canUpdate: boolean;
  canDelete: boolean;
  canPrint: boolean;
};

const ROLE_DEFAULTS: Record<string, PermissionSet> = {
  SuperAdmin: { canUpdate: true, canDelete: true, canPrint: true },
  CompanyAdmin: { canUpdate: true, canDelete: true, canPrint: true },
  Dealer: { canUpdate: true, canDelete: true, canPrint: true },
  Farmer: { canUpdate: true, canDelete: true, canPrint: true },
  Manager: { canUpdate: true, canDelete: false, canPrint: true },
  Supervisor: { canUpdate: false, canDelete: false, canPrint: true },
  Staff: { canUpdate: true, canDelete: false, canPrint: false },
};

export function usePermissions(): PermissionSet {
  const { currentUser } = useAuth();
  if (!currentUser)
    return { canUpdate: false, canDelete: false, canPrint: false };
  const roleDefaults = ROLE_DEFAULTS[currentUser.role] ?? {
    canUpdate: false,
    canDelete: false,
    canPrint: false,
  };
  const overrides = currentUser.permissions ?? {};
  return {
    canUpdate:
      overrides.canUpdate !== undefined
        ? overrides.canUpdate
        : roleDefaults.canUpdate,
    canDelete:
      overrides.canDelete !== undefined
        ? overrides.canDelete
        : roleDefaults.canDelete,
    canPrint:
      overrides.canPrint !== undefined
        ? overrides.canPrint
        : roleDefaults.canPrint,
  };
}

export function getRoleDefaults(role: string): PermissionSet {
  return (
    ROLE_DEFAULTS[role] ?? {
      canUpdate: false,
      canDelete: false,
      canPrint: false,
    }
  );
}
