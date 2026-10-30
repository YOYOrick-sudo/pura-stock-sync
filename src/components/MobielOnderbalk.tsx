import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Menu, type LucideIcon } from 'lucide-react';
import { useNavigatieItems, isNavActief } from '@/hooks/useNavigatieItems';
import { cn } from '@/lib/utils';
import { useHeeftRol } from '@/hooks/useHeeftRol';
import { useIsMtLid } from '@/hooks/useIsMtLid';
import { mobielNavLabel, verdeelMobieleNavigatie } from '@/lib/mobieleNavigatie';
import { MobielMeerBlad } from '@/components/MobielMeerBlad';
import { Button } from '@/components/ui/button';

/** Hoogte van de balk zonder safe area; via --onderbalk blijven sticky balken erboven. */
const HOOGTE = '64px';

export function MobielOnderbalk() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const items = useNavigatieItems();
  const { heeftRol } = useHeeftRol();
  const { isMtLid } = useIsMtLid();
  const { balk: vakken, meer } = verdeelMobieleNavigatie(items, heeftRol === false && isMtLid);
  const [meerOpen, setMeerOpen] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--onderbalk', HOOGTE);
    return () => { root.style.removeProperty('--onderbalk'); };
  }, []);

  const vak = (key: string, label: string, Icon: LucideIcon, actief: boolean, onClick: () => void) => (
    <Button
      key={key}
      variant="ghost"
      type="button"
      onClick={onClick}
      aria-current={actief ? 'page' : undefined}
      className={cn(
        'flex h-auto min-h-11 min-w-11 flex-1 flex-col items-center justify-center gap-0.5 rounded-none px-1 text-xs font-medium transition-colors',
        actief ? 'text-primary' : 'text-muted-foreground'
      )}
    >
      <Icon className="h-5 w-5" strokeWidth={actief ? 2.25 : 1.75} />
      {label}
    </Button>
  );

  return (
    <>
    <nav
      aria-label="Hoofdmenu"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card pb-[var(--safe-bottom)] pl-[var(--safe-left)] pr-[var(--safe-right)]"
    >
      <div className="flex h-16 items-stretch px-1">
        {vakken.map(v => vak(v.url, mobielNavLabel(v), v.icon, isNavActief(pathname, v.url), () => navigate(v.url)))}
        {vak('meer', 'Meer', Menu, meer.some(item => isNavActief(pathname, item.url)), () => setMeerOpen(true))}
      </div>
    </nav>
    <MobielMeerBlad open={meerOpen} onOpenChange={setMeerOpen} items={meer} />
    </>
  );
}
