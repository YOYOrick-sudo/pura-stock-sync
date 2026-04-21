import { Outlet, NavLink } from "react-router-dom";
import { copy } from "@/lib/personeel-copy";

const TABS = [
  { to: "/personeel", label: copy.tijdlijn, end: true },
  { to: "/personeel/vandaag", label: copy.vandaag },
  { to: "/personeel/mijn", label: copy.mijnPlanning },
  { to: "/personeel/wonen", label: copy.wonen },
  { to: "/personeel/collegas", label: copy.collegas },
  { to: "/personeel/settings", label: copy.settings },
];

export default function PersoneelLayout() {
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card">
        <div className="px-4 md:px-6 pt-4">
          <h1 className="text-2xl font-semibold mb-3">{copy.module}</h1>
          <nav className="flex gap-1 overflow-x-auto">
            {TABS.map(t => (
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
