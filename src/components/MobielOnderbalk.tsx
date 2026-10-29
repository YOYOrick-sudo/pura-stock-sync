import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, ListChecks, ChefHat, ClipboardList, Menu, type LucideIcon } from 'lucide-react';
import { useNavigatieItems, isNavActief } from '@/hooks/useNavigatieItems';
import { cn } from '@/lib/utils';

const VAKKEN: { url: string; label: string; icon: LucideIcon }[] = [
  { url: '/dashboard', label: 'Start', icon: Home },
  { url: '/taken-bediening', label: 'Taken', icon: ListChecks },
  { url: '/kitchen/mep', label: 'MEP', icon: ChefHat },
  { url: '/kitchen/bestelbord', label: 'Bestellen', icon: ClipboardList },
];

/** Hoogte van de balk zonder safe area; via --onderbalk blijven sticky balken erboven. */
const HOOGTE = '64px';

export function MobielOnderbalk({ onMeer }: { onMeer: () => void }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const zichtbaar = new Set(useNavigatieItems().map(i => i.url));
  const vakken = VAKKEN.filter(v => zichtbaar.has(v.url));

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--onderbalk', HOOGTE);
    return () => { root.style.removeProperty('--onderbalk'); };
  }, []);

  const vak = (key: string, label: string, Icon: LucideIcon, actief: boolean, onClick: () => void) => (
    <button
      key={key}
      type="button"
      onClick={onClick}
      aria-current={actief ? 'page' : undefined}
      className={cn(
        'flex min-h-11 min-w-11 flex-1 flex-col items-center justify-center gap-0.5 text-xs font-medium transition-colors',
        actief ? 'text-primary' : 'text-muted-foreground'
      )}
    >
      <Icon className="h-5 w-5" strokeWidth={actief ? 2.25 : 1.75} />
      {label}
    </button>
  );

  return (
    <nav
      aria-label="Hoofdmenu"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card pb-[var(--safe-bottom)] pl-[var(--safe-left)] pr-[var(--safe-right)]"
    >
      <div className="flex h-16 items-stretch px-1">
        {vakken.map(v => vak(v.url, v.label, v.icon, isNavActief(pathname, v.url), () => navigate(v.url)))}
        {vak('meer', 'Meer', Menu, false, onMeer)}
      </div>
    </nav>
  );
}
