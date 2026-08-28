import { Home, ListChecks, Settings, BookOpen, Package, Printer, Calculator, ClipboardList, LogOut, BarChart3, ChefHat } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useUserLocation } from '@/contexts/UserLocationContext';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

import { PolarSidebar } from '@/components/polar/Sidebar';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import puraVidaLogo from '@/assets/pura-vida-logo-sea-cropped.png';
import puraVidaLogoIcon from '@/assets/pura-vida-logo-sea-cropped.png';

const allNavigationItems = [
  { title: 'Dashboard', url: '/dashboard', icon: Home, group: 'overzicht' as const, locations: ['West', 'Midsland'], managerOnly: false, ownerOnly: false },
  { title: 'Taken Bediening', url: '/taken-bediening', icon: ListChecks, group: 'overzicht' as const, locations: ['West', 'Midsland'], managerOnly: false, ownerOnly: false },
  // Midsland komt erbij zodra de templates gevuld zijn.
  { title: 'Mise-en-place', url: '/kitchen/mep', icon: ChefHat, group: 'keuken' as const, locations: ['West', 'Midsland'], managerOnly: false, ownerOnly: false },
  { title: 'Stickers', url: '/kitchen/snel-printen', icon: Printer, group: 'keuken' as const, locations: ['West', 'Midsland'], managerOnly: false, ownerOnly: false },
  { title: 'Recepten', url: '/kitchen/recipes', icon: BookOpen, group: 'keuken' as const, locations: ['West', 'Midsland'], managerOnly: false, ownerOnly: false },
  { title: 'Ingrediënten', url: '/kitchen/ingredienten', icon: Package, group: 'keuken' as const, locations: ['West', 'Midsland'], managerOnly: false, ownerOnly: false },
  { title: 'Voorraad', url: '/voorraad', icon: Boxes, group: 'keuken' as const, locations: ['West', 'Midsland'], managerOnly: false, ownerOnly: false },
  { title: 'Bestelronde', url: '/bestelronde', icon: ClipboardList, group: 'keuken' as const, locations: ['West', 'Midsland'], managerOnly: false, ownerOnly: false },
  { title: 'Interne bestellingen', url: '/internal-orders', icon: Truck, group: 'keuken' as const, locations: ['West', 'Midsland'], managerOnly: false, ownerOnly: false },
  { title: 'Inkoopbestellingen', url: '/inkooporders', icon: Package, group: 'beheer' as const, locations: ['West', 'Midsland'], managerOnly: true, ownerOnly: false },
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

  const [collapsed, setCollapsed] = useState(false);
  const [isManager, setIsManager] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('is_active', true);
      const roles = (data ?? []).map(r => r.role as string);
      const owner = roles.some(r => ['owner', 'admin'].includes(r));
      const manager = owner || roles.includes('manager');
      if (!cancelled) { setIsManager(manager); setIsOwner(owner); }
    })();
    return () => { cancelled = true; };
  }, []);

  const navigationItems = (userLocation
    ? allNavigationItems.filter(item => item.locations.includes(userLocation))
    : allNavigationItems
  )
    .filter(item => !item.managerOnly || isManager)
    .filter(item => !item.ownerOnly || isOwner)
    .filter(item => !(userLocation === 'Midsland' && item.group === 'keuken' && item.url !== '/kitchen/mep'));

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
