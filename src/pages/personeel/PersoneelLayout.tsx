import { useState } from "react";
import { Outlet, NavLink } from "react-router-dom";
import { Plus } from "lucide-react";
import { SidebarLayout } from "@/components/SidebarLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PersonModal } from "@/components/personeel/PersonModal";
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
  const [codeInput, setCodeInput] = useState("");
  const [codeError, setCodeError] = useState("");

  const handleUnlock = () => {
    if (codeInput === PIN_CODE) {
      sessionStorage.setItem(PIN_KEY, "true");
      setUnlocked(true);
      setCodeError("");
      setCodeInput("");
    } else {
      setCodeError("Onjuiste code");
    }
  };

  if (!unlocked) {
    return (
      <SidebarLayout hideHeader>
        <div className="min-h-[60vh] flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-[20px] p-8 max-w-[420px] w-full shadow-lg">
            <h2 className="text-lg font-semibold text-foreground mb-2">
              Toegangscode vereist
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              Voer de toegangscode in om Planning te openen.
            </p>
            <Input
              type="password"
              inputMode="numeric"
              placeholder="Voer code in"
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
              className={`w-full rounded-2xl border-1.5 p-3 px-4 text-sm ${
                codeError ? "border-destructive" : ""
              }`}
              autoFocus
            />
            {codeError && (
              <p className="text-[13px] text-destructive mt-2">{codeError}</p>
            )}
            <Button
              onClick={handleUnlock}
              className="w-full mt-4 rounded-[14px]"
            >
              Bevestigen
            </Button>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout hideHeader>
      <div className="min-h-full bg-background -m-4 md:-m-6 lg:-mx-12 lg:-my-8 min-w-0 overflow-hidden">
        <div className="border-b border-border bg-card">
          <div className="px-4 md:px-6 pt-4">
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
        <div className="p-4 md:p-6 lg:px-12 lg:py-8 min-w-0">
          <Outlet />
        </div>

        {showNewModal && (
          <PersonModal open={showNewModal} onClose={() => setShowNewModal(false)} />
        )}
      </div>
    </SidebarLayout>
  );
}
