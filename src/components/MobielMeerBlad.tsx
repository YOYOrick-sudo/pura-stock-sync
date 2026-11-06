import { Check, ChevronDown, LogOut, MapPin } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Drawer, DrawerContent, DrawerTitle } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useUserLocation } from '@/contexts/UserLocationContext';
import { useAuthStatus } from '@/contexts/AuthContext';
import { ThemeToggle } from '@/components/ThemeToggle';
import { isNavActief, type allNavigationItems } from '@/hooks/useNavigatieItems';
import { supabase } from '@/integrations/supabase/client';
import { cn, getLocationDisplayName } from '@/lib/utils';
import { mobielNavLabel } from '@/lib/mobieleNavigatie';

type NavigatieItem = (typeof allNavigationItems)[number];
const GROEPEN = [
  { key: 'overzicht', label: 'Overzicht' },
  { key: 'keuken', label: 'Keuken' },
  { key: 'voorraad', label: 'Voorraad' },
  { key: 'beheer', label: 'Beheer' },
] as const;

export function MobielMeerBlad({ open, onOpenChange, items }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: NavigatieItem[];
}) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { userLocation, displayLocation, availableLocations, setActiveLocation } = useUserLocation();
  const { session } = useAuthStatus();
  const metadata = session?.user.user_metadata;
  const naam = metadata?.full_name || metadata?.name || [metadata?.first_name, metadata?.last_name].filter(Boolean).join(' ') || session?.user.email;
  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="bottom" shouldScaleBackground={false}>
      <DrawerContent aria-describedby={undefined} className="max-h-[85dvh] rounded-t-polar-2xl border-t border-border bg-card">
        <DrawerTitle className="sr-only">Meer</DrawerTitle>
        <div className="min-h-0 overflow-y-auto overscroll-contain px-[calc(1rem+var(--safe-left))] pb-[calc(1rem+var(--safe-bottom))] pr-[calc(1rem+var(--safe-right))] pt-4">
          <div className="flex min-w-0 items-center gap-2 border-b border-border pb-3">
            {availableLocations.length > 1 ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="touch" aria-label="Vestiging wisselen" className="min-w-0 max-w-[50%] gap-1.5 px-2">
                    <MapPin className="h-5 w-5 shrink-0" />
                    <span className="truncate">{displayLocation}</span>
                    <ChevronDown className="h-4 w-4 shrink-0" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {availableLocations.map(loc => (
                    <DropdownMenuItem key={loc} onSelect={() => setActiveLocation(loc)} className="min-h-11 gap-2">
                      <Check className={cn('h-4 w-4', loc === userLocation ? 'text-primary' : 'opacity-0')} />
                      {getLocationDisplayName(loc)}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex min-h-11 min-w-0 max-w-[50%] items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="h-5 w-5 shrink-0" /><span className="truncate">{displayLocation}</span>
              </div>
            )}
            <span className="min-w-0 flex-1 truncate text-sm font-medium">{naam}</span>
            <div className="flex min-h-11 shrink-0 items-center">
              <ThemeToggle compact />
            </div>
            <Button variant="ghost" size="touch-icon" onClick={handleLogout} aria-label="Uitloggen">
              <LogOut className="h-5 w-5 text-muted-foreground" />
            </Button>
          </div>
          <nav aria-label="Meer navigatie" className="space-y-4 pt-4">
            {GROEPEN.map(groep => {
              const groepItems = items.filter(item => item.group === groep.key);
              if (!groepItems.length) return null;
              return (
                <section key={groep.key}>
                  <h2 className="mb-2 text-xs font-medium text-muted-foreground">{groep.label}</h2>
                  <div className="grid grid-cols-3 gap-1">
                    {groepItems.map(item => {
                      const actief = isNavActief(pathname, item.url);
                      const Icon = item.icon;
                      return (
                        <Button key={item.url} variant="ghost" aria-current={actief ? 'page' : undefined}
                          onClick={() => { navigate(item.url); onOpenChange(false); }}
                          className={cn('h-auto min-h-16 min-w-11 flex-col gap-1 whitespace-normal px-1 py-2 text-center text-xs', actief ? 'text-primary' : 'text-muted-foreground')}>
                          <Icon className="h-5 w-5 shrink-0" strokeWidth={actief ? 2.25 : 1.75} />
                          <span className="w-full break-words">{mobielNavLabel(item)}</span>
                        </Button>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </nav>
        </div>
      </DrawerContent>
    </Drawer>
  );
}