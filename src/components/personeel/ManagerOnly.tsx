import { useIsManager } from "@/hooks/personeel";

export function ManagerOnly({ children, fallback = null }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  const { data: isManager } = useIsManager();
  return isManager ? <>{children}</> : <>{fallback}</>;
}
