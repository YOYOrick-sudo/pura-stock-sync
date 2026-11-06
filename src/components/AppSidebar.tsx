import { LogOut } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useUserLocation } from '@/contexts/UserLocationContext';
import { useAuthStatus } from '@/contexts/AuthContext';
import { allNavigationItems, isNavActief, useNavigatieItems } from '@/hooks/useNavigatieItems';
import { supabase } from '@/integrations/supabase/client';
import { getLocationDisplayName } from '@/lib/utils';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import puraVidaLogo from '@/assets/pura-vida-logo-sea-cropped.png';

const GROEPEN = [
  { key: 'overzicht', label: 'Overzicht' },
  { key: 'keuken', label: 'Keuken' },
  { key: 'voorraad', label: 'Voorraad' },
  { key: 'beheer', label: 'Beheer' },
] as const;

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { state } = useSidebar();
  const { userLocation, displayLocation, availableLocations, setActiveLocation } = useUserLocation();
  const { session } = useAuthStatus();
  const items = useNavigatieItems();
  const metadata = session?.user.user_metadata;
  const naam = metadata?.full_name || metadata?.name || [metadata?.first_name, metadata?.last_name].filter(Boolean).join(' ') || session?.user.email || 'Account';
  const ingeklapt = state === 'collapsed';

  const uitloggen = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const wissel = (volgende: string) => {
    if (volgende === userLocation) return;
    const bron = allNavigationItems.find((item) => isNavActief(location.pathname, item.url));
    setActiveLocation(volgende);
    if (bron && !bron.locations.includes(volgende)) navigate('/dashboard');
  };

  const merk = (
    <>
      <img src={puraVidaLogo} alt="" className="h-8 w-8 shrink-0 object-contain" />
      {!ingeklapt && <span className="truncate text-sm font-medium">{displayLocation}</span>}
    </>
  );

  return (
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarHeader className="p-2">
        {availableLocations.length > 1 ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="ghost" className="h-12 w-full justify-start gap-2 px-2" aria-label={`Vestiging, nu ${displayLocation}`}>
                {merk}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-52">
              {availableLocations.map((loc) => (
                <DropdownMenuItem key={loc} className="min-h-11" onSelect={() => wissel(loc)}>
                  {getLocationDisplayName(loc)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="flex h-12 items-center gap-2 px-2" aria-label={`Vestiging, nu ${displayLocation}`}>
            {merk}
          </div>
        )}
      </SidebarHeader>
      <SidebarContent>
        {GROEPEN.map((groep) => {
          const groepItems = items.filter((item) => item.group === groep.key);
          if (!groepItems.length) return null;
          return (
            <SidebarGroup key={groep.key}>
              <SidebarGroupLabel className="text-xs font-normal text-muted-foreground">{groep.label}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {groepItems.map((item) => {
                    const titel = item.url === '/taken-bediening' && userLocation === 'West' ? 'Taken' : item.title;
                    const Icon = item.icon;
                    const actief = isNavActief(location.pathname, item.url);
                    return (
                      <SidebarMenuItem key={item.url}>
                        <SidebarMenuButton
                          size="lg"
                          isActive={actief}
                          tooltip={titel}
                          aria-current={actief ? 'page' : undefined}
                          aria-label={titel}
                          onClick={() => navigate(item.url)}
                        >
                          <Icon className="h-4 w-4" strokeWidth={2} />
                          <span>{titel}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>
      <SidebarFooter className="border-t border-border p-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="ghost" className="h-12 w-full justify-start gap-2 px-2" aria-label={naam}>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-polar-md bg-muted text-sm font-medium">
                {naam.slice(0, 1).toUpperCase()}
              </span>
              {!ingeklapt && (
                <span className="min-w-0 text-left">
                  <span className="block truncate text-sm font-medium">{naam}</span>
                  {session?.user.email && naam !== session.user.email && (
                    <span className="block truncate text-xs text-muted-foreground">{session.user.email}</span>
                  )}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-52">
            <div className="px-2 py-2"><ThemeToggle /></div>
            <DropdownMenuItem className="min-h-11" onSelect={() => void uitloggen()}>
              <LogOut className="h-4 w-4" />
              Uitloggen
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
