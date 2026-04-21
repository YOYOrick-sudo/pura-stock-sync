import { useEffect } from "react";
import { Outlet, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useIsManager } from "@/hooks/personeel";
import { Skeleton } from "@/components/ui/skeleton";
import { copy } from "@/lib/personeel-copy";

const TABS = [
  { to: "/personeel", label: copy.mijnPlanning, end: true, managerOnly: false },
  { to: "/personeel/vandaag", label: copy.vandaag, managerOnly: false },
  { to: "/personeel/tijdlijn", label: copy.tijdlijn, managerOnly: false },
  { to: "/personeel/wonen", label: copy.wonen, managerOnly: false },
  { to: "/personeel/collegas", label: copy.collegas, managerOnly: false },
  { to: "/personeel/settings", label: copy.settings, managerOnly: true },
];

export default function PersoneelLayout() {
  const { data: isManager, isLoading } = useIsManager();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && isManager && pathname === "/personeel") {
      navigate("/personeel/tijdlijn", { replace: true });
    }
  }, [isLoading, isManager, pathname, navigate]);

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  const visibleTabs = TABS.filter(t => !t.managerOnly || isManager);

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card">
        <div className="px-4 md:px-6 pt-4">
          <h1 className="text-2xl font-semibold mb-3">{copy.module}</h1>
          <nav className="flex gap-1 overflow-x-auto">
            {visibleTabs.map(t => (
              <NavLink
                key={t.to}
                to={t.to}
                end={t.end}
                className={({ isActive }) =>
                  `px-4 py-2 rounded-t-[12px] text-sm font-medium whitespace-nowrap transition ${
                    isActive
                      ? "bg-background text-foreground border-b-2 border-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`
                }
              >
                {t.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>
      <div className="p-4 md:p-6">
        <Outlet />
      </div>
    </div>
  );
}
