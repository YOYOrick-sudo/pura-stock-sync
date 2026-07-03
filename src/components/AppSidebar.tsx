import { Home, ListChecks, Wallet, Settings, Wrench, BookOpen, Carrot, Printer } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useUserLocation } from '@/contexts/UserLocationContext';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

import { PolarSidebar } from '@/components/polar/Sidebar';
import { ThemeToggle } from '@/components/ThemeToggle';
import puraVidaLogo from '@/assets/pura-vida-logo-sea-cropped.png';

const allNavigationItems = [
  { title: 'Dashboard', url: '/dashboard', icon: Home, group: 'overzicht' as const, locations: ['West', 'Midsland'], managerOnly: false },
  { title: 'Taken Bediening', url: '/taken-bediening', icon: ListChecks, group: 'overzicht' as const, locations: ['West', 'Midsland'], managerOnly: false },
  { title: 'Stickers', url: '/kitchen/snel-printen', icon: Printer, group: 'keuken' as const, locations: ['West', 'Midsland'], managerOnly: false },
  { title: 'Recepten', url: '/kitchen/recipes', icon: BookOpen, group: 'keuken' as const, locations: ['West', 'Midsland'], managerOnly: false },
  { title: 'Ingrediënten', url: '/kitchen/ingredienten', icon: Carrot, group: 'keuken' as const, locations: ['West', 'Midsland'], managerOnly: false },
  { title: 'Kassatelling', url: '/kassatelling', icon: Wallet, group: 'beheer' as const, locations: ['West', 'Midsland'], managerOnly: false },
  { title: 'Onderhoud', url: '/onderhoud', icon: Wrench, group: 'beheer' as const, locations: ['West', 'Midsland'], managerOnly: false },
  { title: 'Settings', url: '/settings', icon: Settings, group: 'beheer' as const, locations: ['West', 'Midsland'], managerOnly: false },
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
      const allowed = (data ?? []).some(r => ['owner', 'manager', 'admin'].includes(r.role as string));
      if (!cancelled) setIsManager(allowed);
    })();
    return () => { cancelled = true; };
  }, []);

  const navigationItems = (userLocation
    ? allNavigationItems.filter(item => item.locations.includes(userLocation))
    : allNavigationItems
  ).filter(item => !item.managerOnly || isManager);

  const isActive = (url: string) =>
    location.pathname === url ||
    (url !== '/' && location.pathname.startsWith(url + '/'));

  const handleNavigation = (url: string) => {
    navigate(url);
    if (onNavigate) onNavigate();
  };

  return (
    <PolarSidebar
      logo={
        <img
          src={puraVidaLogo}
          alt="Pura Vida"
          className="h-[52px] w-auto max-w-full object-contain object-left"
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
    />
  );
}
