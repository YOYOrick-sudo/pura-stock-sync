import { useState } from "react";
import { Outlet, NavLink } from "react-router-dom";
import { Plus } from "lucide-react";
import { SidebarLayout } from "@/components/SidebarLayout";
import { Button } from "@/components/ui/button";
import { PersonModal } from "@/components/personeel/PersonModal";
import { PincodeNumpad } from "@/components/PincodeNumpad";
import { copy } from "@/lib/personeel-copy";

const TABS = [
  { to: "/personeel", label: copy.tijdlijn, end: true },
  { to: "/personeel/wonen", label: copy.wonen },
  { to: "/personeel/collegas", label: copy.collegas },
  { to: "/personeel/settings", label: copy.settings },
];

const PIN_CODE = "0000";
const PIN_KEY = "personeel_unlocked";

export default function PersoneelLayout() {
  const [showNewModal, setShowNewModal] = useState(false);
  const [unlocked, setUnlocked] = useState(
    () => typeof window !== "undefined" && sessionStorage.getItem(PIN_KEY) === "true"
  );

  const handlePin = (pin: string): boolean => {
    if (pin === PIN_CODE) {
      sessionStorage.setItem(PIN_KEY, "true");
      setUnlocked(true);
      return true;
    }
    return false;
  };

  if (!unlocked) {
    return (
      <SidebarLayout hideHeader>
        <div className="min-h-[70vh] flex items-center justify-center p-4 animate-fade-in">
          <PincodeNumpad title="Planning" onSubmit={handlePin} />
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout hideHeader>
      <div className="min-h-full bg-background -m-6 md:-mx-10 md:-my-8 lg:-mx-16 lg:-my-8 min-w-0 overflow-hidden">
        <div className="border-b border-border bg-card">
          <div className="px-6 md:px-10 lg:px-16 pt-4">
            <div className="flex items-center justify-between mb-3 gap-3">
              <h1 className="text-2xl font-semibold">{copy.module}</h1>
              <Button
                size="sm"
                onClick={() => setShowNewModal(true)}
                className="rounded-[14px]"
              >
                <Plus className="h-4 w-4 mr-2" />
                {copy.nieuweCollega}
              </Button>
            </div>
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
        <div className="px-6 md:px-10 lg:px-16 py-6 md:py-8 min-w-0">
          <Outlet />
        </div>

        {showNewModal && (
          <PersonModal open={showNewModal} onClose={() => setShowNewModal(false)} />
        )}
      </div>
    </SidebarLayout>
  );
}
