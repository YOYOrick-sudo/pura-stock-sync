import { useState } from 'react';
import { Home, Calendar, ListChecks, FileText, User } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PolarSidebar } from '@/components/polar/Sidebar';
import puraVidaLogo from '@/assets/pura-vida-logo-dark.png';

const navigationItems = [
  { title: 'Mijn Dashboard', url: '/mijn/dashboard', icon: Home },
  { title: 'Mijn Rooster', url: '/mijn/rooster', icon: Calendar },
  { title: 'Mijn Taken', url: '/mijn/taken', icon: ListChecks },
  { title: 'Documenten', url: '/mijn/documenten', icon: FileText },
  { title: 'Mijn Profiel', url: '/mijn/profiel', icon: User },
];

interface EmployeeSidebarProps {
  onNavigate?: () => void;
}

export function EmployeeSidebar({ onNavigate }: EmployeeSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (url: string) => location.pathname === url;

  return (
    <PolarSidebar
      logo={
        <img
          src={puraVidaLogo}
          alt="Pura Vida"
          className="h-[92px] w-auto"
        />
      }
      items={navigationItems.map(item => ({
        title: item.title,
        icon: item.icon,
        url: item.url,
        active: isActive(item.url),
        onClick: onNavigate ? () => {
          navigate(item.url);
          onNavigate();
        } : undefined,
      }))}
      collapsed={collapsed}
      onToggle={() => setCollapsed(!collapsed)}
    />
  );
}
