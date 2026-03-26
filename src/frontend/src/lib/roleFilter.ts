import { useAuth } from "@/context/AuthContext";
import { UNASSIGNED_SENTINEL, storage } from "@/lib/storage";
import { useMemo } from "react";

// Returns null = access all farms (SuperAdmin), [] = no farms, [ids] = specific farms
export function useAccessibleFarmIds(): string[] | null {
  const { currentUser } = useAuth();

  return useMemo(() => {
    if (!currentUser) return [];
    const allFarms = storage.getFarms();
    if (currentUser.role === "SuperAdmin") return null;

    // Non-SuperAdmin without companyId → no access to any farm
    if (!currentUser.companyId) return [];

    // For all non-SuperAdmin roles, first filter farms by companyId if present
    const companyFarms = allFarms.filter(
      (f) => f.companyId === currentUser.companyId,
    );

    if (currentUser.role === "CompanyAdmin") {
      return companyFarms.map((f) => f.id);
    }
    if (currentUser.role === "Manager") {
      const zoneFarmIds = companyFarms
        .filter(
          (f) => f.zoneId && currentUser.assignedZoneIds?.includes(f.zoneId),
        )
        .map((f) => f.id);
      const branchFarmIds = companyFarms
        .filter(
          (f) =>
            f.branchId && currentUser.assignedBranchIds?.includes(f.branchId),
        )
        .map((f) => f.id);
      const fromAssignment = (currentUser.assignedFarmIds || []).filter((id) =>
        companyFarms.some((f) => f.id === id),
      );
      return [
        ...new Set([...zoneFarmIds, ...branchFarmIds, ...fromAssignment]),
      ];
    }
    if (
      currentUser.role === "Supervisor" ||
      currentUser.role === "Dealer" ||
      currentUser.role === "Farmer"
    ) {
      const assigned = currentUser.assignedFarmIds || [];
      return assigned.filter((id) => companyFarms.some((f) => f.id === id));
    }
    if (currentUser.role === "Staff") {
      if (currentUser.assignedShedId) {
        const shed = storage
          .getSheds()
          .find((s) => s.id === currentUser.assignedShedId);
        if (shed) {
          const farm = companyFarms.find((f) => f.id === shed.farmId);
          return farm ? [farm.id] : [];
        }
      }
      const assigned = currentUser.assignedFarmIds || [];
      return assigned.filter((id) => companyFarms.some((f) => f.id === id));
    }
    return [];
  }, [currentUser]);
}

export function filterByFarms<T extends { farmId: string }>(
  items: T[],
  accessibleFarmIds: string[] | null,
): T[] {
  if (accessibleFarmIds === null) return items;
  return items.filter((item) => accessibleFarmIds.includes(item.farmId));
}

/**
 * Returns company-scoped data for the current user.
 * SuperAdmin sees all data (companyId = undefined).
 * All others see only their own company's data, further filtered by role assignment.
 */
export function useCompanyScope() {
  const { currentUser } = useAuth();
  const accessibleFarmIds = useAccessibleFarmIds();

  return useMemo(() => {
    const isSuperAdmin = currentUser?.role === "SuperAdmin";
    // Use sentinel for non-SuperAdmin users without a company → they see zero data
    const companyId = isSuperAdmin
      ? undefined
      : currentUser?.companyId || UNASSIGNED_SENTINEL;

    const farms = isSuperAdmin
      ? storage.getFarms()
      : storage
          .getFarmsByCompany(companyId)
          .filter(
            (f) =>
              accessibleFarmIds === null || accessibleFarmIds.includes(f.id),
          );

    const zones = storage.getZonesByCompany(companyId);
    const branches = storage.getBranchesByCompany(companyId);
    const users = storage.getUsersByCompany(companyId);
    const gcSchemes = storage.getGCSchemesByCompany(companyId);
    const feedTypes = storage.getFeedTypesByCompany(companyId);
    const feedSuppliers = storage.getFeedSuppliersByCompany(companyId);

    return {
      farms,
      zones,
      branches,
      users,
      gcSchemes,
      feedTypes,
      feedSuppliers,
      companyId,
      isSuperAdmin,
    };
  }, [currentUser, accessibleFarmIds]);
}
