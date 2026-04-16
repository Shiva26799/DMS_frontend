import { useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { usePermissions } from "./useSettings";

export const useRBAC = () => {
  const { role } = useAuth();
  const { data: allPermissions, isLoading } = usePermissions();

  const userPermissions = useMemo(() => {
    if (!role || !allPermissions) return null;
    return allPermissions.find((p: any) => p.role === role)?.permissions;
  }, [role, allPermissions]);

  const checkPermission = (module: string, action: string): boolean | string => {
    // Super Admin bypasses everything
    if (role === "Super Admin") return true;
    
    if (!userPermissions) return false;
    
    const perm = userPermissions[module]?.[action];
    return perm ?? false;
  };

  return {
    checkPermission,
    isLoading,
    permissions: userPermissions,
  };
};
