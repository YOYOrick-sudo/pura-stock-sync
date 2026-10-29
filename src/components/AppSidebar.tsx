import { LogOut } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useUserLocation } from '@/contexts/UserLocationContext';
import { useState } from 'react';
import { useNavigatieItems, isNavActief } from '@/hooks/useNavigatieItems';
import { supabase } from '@/integrations/supabase/client';

import { PolarSidebar } from '@/components/polar/Sidebar';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import puraVidaLogo from '@/assets/pura-vida-logo-sea-cropped.png';
import puraVidaLogoIcon from '@/assets/pura-vida-logo-sea-cropped.png';

interface AppSidebarProps {
  onNavigate?: () => void;
  mobile?: boolean;
}

export function AppSidebar({ onNavigate, mobile = false }: AppSidebarProps = {}) {
  const location = useLocation();
  const navigate = useNavigate();
  const { userLocation } = useUserLocation();

  const [collapsedState, setCollapsedState] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('sidebar-collapsed');
      if (saved !== null) return saved === '1';
    } catch { /* ignore */ }
    return typeof window !== 'undefined' && window.innerWidth < 900;
  });
  const collapsed = !mobile && collapsedState;
  const setCollapsed = (v: boolean) => {
    setCollapsedState(v);
    try { localStorage.setItem('sidebar-collapsed', v ? '1' : '0'); } catch { /* ignore */ }
  };


  const navigationItems = useNavigatieItems();
  const isActive = (url: string) => isNavActief(location.pathname, url);

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
      allowCollapse={!mobile}
      mobile={mobile}
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
