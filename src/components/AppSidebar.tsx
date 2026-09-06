import { Home, ListChecks, Settings, BookOpen, Printer, Calculator, ClipboardList, LogOut, BarChart3, ChefHat, Cookie } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useUserLocation } from '@/contexts/UserLocationContext';
import { useState } from 'react';
import { useRole } from '@/hooks/useRole';
import { supabase } from '@/integrations/supabase/client';

import { PolarSidebar } from '@/components/polar/Sidebar';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import puraVidaLogo from '@/assets/pura-vida-logo-sea-cropped.png';
import puraVidaLogoIcon from '@/assets/pura-vida-logo-sea-cropped.png';

const allNavigationItems = [
  { title: 'Dashboard', url: '/dashboard', icon: Home, group: 'overzicht' as const, locations: ['West', 'Midsland'], managerOnly: false, ownerOnly: false },
  { title: 'Taken Bediening', url: '/taken-bediening', icon: ListChecks, group: 'overzicht' as const, locations: ['West', 'Midsland'], managerOnly: false, ownerOnly: false },
  // MEP is alleen actief voor West (Daily); niet relevant voor Midsland.
  { title: 'Mise-en-place', url: '/kitchen/mep', icon: ChefHat, group: 'keuken' as const, locations: ['West'], managerOnly: false, ownerOnly: false },
  { title: 'Stickers', url: '/kitchen/snel-printen', icon: Printer, group: 'keuken' as const, locations: ['West', 'Midsland'], managerOnly: false, ownerOnly: false },
  { title: 'Recepten', url: '/kitchen/recipes', icon: BookOpen, group: 'keuken' as const, locations: ['West', 'Midsland'], managerOnly: false, ownerOnly: false },
  { title: 'Gerechten', url: '/kitchen/gerechten', icon: Cookie, group: 'keuken' as const, locations: ['West', 'Midsland'], managerOnly: false, ownerOnly: false },
  // Bestellen is voorlopig verborgen voor beide vestigingen (module nog niet in gebruik).
  { title: 'Bestellen', url: '/voorraad', icon: ClipboardList, group: 'voorraad' as const, locations: [] as string[], managerOnly: false, ownerOnly: false },

  { title: 'Voorraadketen', url: '/settings/keten', icon: Settings, group: 'beheer' as const, locations: ['West', 'Midsland'], managerOnly: true, ownerOnly: false },
  { title: 'Cijfers', url: '/cijfers', icon: BarChart3, group: 'beheer' as const, locations: ['West', 'Midsland'], managerOnly: false, ownerOnly: true },
  { title: 'Kassatelling', url: '/kassatelling', icon: Calculator, group: 'beheer' as const, locations: ['West', 'Midsland'], managerOnly: false, ownerOnly: false },
  { title: 'Onderhoud', url: '/onderhoud', icon: ClipboardList, group: 'beheer' as const, locations: ['West', 'Midsland'], managerOnly: false, ownerOnly: false },
  { title: 'Settings', url: '/settings', icon: Settings, group: 'beheer' as const, locations: ['West', 'Midsland'], managerOnly: false, ownerOnly: true },
];

interface AppSidebarProps {
  onNavigate?: () => void;
}

export function AppSidebar({ onNavigate }: AppSidebarProps = {}) {
  const location = useLocation();
  const navigate = useNavigate();
  const { userLocation } = useUserLocation();
  const { isManager, isOwner } = useRole();

  const [collapsed, setCollapsed] = useState(false);


  const navigationItems = (userLocation
    ? allNavigationItems.filter(item => item.locations.includes(userLocation))
    : allNavigationItems
  )
    .filter(item => !item.managerOnly || isManager)
    .filter(item => !item.ownerOnly || isOwner)
    .filter(item => !(
      userLocation === 'Midsland' &&
      item.group === 'keuken' &&
      !['/kitchen/mep', '/kitchen/gerechten'].includes(item.url)
    ));

  const isActive = (url: string) =>
    location.pathname === url ||
    (url !== '/' && location.pathname.startsWith(url + '/'));

  const handleNavigation = (url: string) => {
    navigate(url);
    if (onNavigate) onNavigate();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <PolarSidebar
      logo={
        <img
          src={puraVidaLogo}
          alt="Pura Vida"
          className="h-[54px] w-auto max-w-full object-contain object-left"
        />
      }
      collapsedLogo={
        <img
          src={puraVidaLogoIcon}
          alt="Pura Vida"
          className="h-full w-full object-contain"
        />
      }
      items={navigationItems.map(item => ({
        title: item.url === '/taken-bediening' && userLocation === 'West' ? 'Taken' : item.title,
        icon: item.icon,
        url: item.url,
        active: isActive(item.url),
        group: item.group,
        onClick: () => handleNavigation(item.url),
      }))}
      collapsed={collapsed}
      onToggle={() => setCollapsed(!collapsed)}
      footerSlot={!collapsed ? <ThemeToggle /> : undefined}
      logoutSlot={
        <Button
          variant="ghost"
          size="icon"
          onClick={handleLogout}
          aria-label="Uitloggen"
          className="h-9 w-9 rounded-md hover:bg-muted"
        >
          <LogOut className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
        </Button>
      }
    />
  );
}
