import { Home, ListChecks, Wallet, Package, Settings, BarChart3, Palette, Users, CalendarDays } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useUserLocation } from '@/contexts/UserLocationContext';
import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { NotificationsDropdown } from '@/components/NotificationsDropdown';
import { PolarSidebar } from '@/components/polar/Sidebar';
import puraVidaLogo from '@/assets/pura-vida-logo-dark.png';

const allNavigationItems = [
  {
    title: 'Dashboard',
    url: '/dashboard',
    icon: Home,
    locations: ['West', 'Midsland'],
  },
  {
    title: 'Taken Bediening',
    url: '/taken-bediening',
    icon: ListChecks,
    locations: ['West', 'Midsland'],
  },
  {
    title: 'Kassatelling',
    url: '/kassatelling',
    icon: Wallet,
    locations: ['West', 'Midsland'],
  },
  {
    title: 'Interne Bestellingen',
    url: '/internal-orders',
    icon: Package,
    locations: ['West'],
  },
  {
    title: 'Bestellingen van West',
    url: '/midsland-bestellingen',
    icon: Package,
    locations: ['Midsland'],
  },
  {
    title: 'Rooster',
    url: '/rooster',
    icon: CalendarDays,
    locations: ['West', 'Midsland'],
  },
  {
    title: 'HR Inbox',
    url: '/hr',
    icon: Users,
    locations: ['West', 'Midsland'],
  },
  {
    title: 'Settings',
    url: '/settings',
    icon: Settings,
    locations: ['West', 'Midsland'],
  },
  {
    title: 'Statistieken',
    url: '/taken-analyse',
    icon: BarChart3,
    locations: ['West', 'Midsland'],
    requiresCode: true,
  },
  {
    title: 'Design System',
    url: '/design-system',
    icon: Palette,
    locations: ['West', 'Midsland'],
  },
];

interface AppSidebarProps {
  onNavigate?: () => void;
}

export function AppSidebar({ onNavigate }: AppSidebarProps = {}) {
  const location = useLocation();
  const navigate = useNavigate();
  const { userLocation } = useUserLocation();
  const [showCodeDialog, setShowCodeDialog] = useState(false);
  const [codeInput, setCodeInput] = useState('');
  const [codeError, setCodeError] = useState('');
  const [pendingUrl, setPendingUrl] = useState('');
  const [collapsed, setCollapsed] = useState(false);

  const navigationItems = userLocation 
    ? allNavigationItems.filter(item => item.locations.includes(userLocation))
    : allNavigationItems;

  const isActive = (url: string) => location.pathname === url;

  const handleNavigation = (url: string) => {
    navigate(url);
    if (onNavigate) {
      onNavigate();
    }
  };

  const handleProtectedClick = (e: React.MouseEvent, url: string) => {
    e.preventDefault();
    const isUnlocked = sessionStorage.getItem('stats_unlocked') === 'true';
    
    if (isUnlocked) {
      navigate(url);
    } else {
      setPendingUrl(url);
      setShowCodeDialog(true);
      setCodeError('');
      setCodeInput('');
    }
  };

  const handleCodeSubmit = () => {
    if (codeInput.toLowerCase() === 'boom') {
      sessionStorage.setItem('stats_unlocked', 'true');
      setShowCodeDialog(false);
      navigate(pendingUrl);
      setCodeInput('');
      setCodeError('');
    } else {
      setCodeError('Onjuiste code');
    }
  };

  return (
    <>
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
          requiresCode: item.requiresCode,
          onClick: item.requiresCode 
            ? (e) => handleProtectedClick(e, item.url)
            : () => handleNavigation(item.url),
        }))}
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
        headerSlot={<NotificationsDropdown />}
      />

      <AlertDialog open={showCodeDialog} onOpenChange={setShowCodeDialog}>
        <AlertDialogContent style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '24px',
          border: '1px solid #D5D8E0',
          padding: '32px',
          maxWidth: '480px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        }}>
          <AlertDialogHeader>
            <AlertDialogTitle style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '18px',
              fontWeight: 600,
              color: '#282E3A',
              marginBottom: '8px',
            }}>
              Toegangscode vereist
            </AlertDialogTitle>
            <AlertDialogDescription style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '14px',
              fontWeight: 400,
              color: '#636878',
              marginBottom: '24px',
            }}>
              Voer de toegangscode in om toegang te krijgen tot Statistieken.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Input
              type="text"
              placeholder="Voer code in"
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCodeSubmit()}
              className="w-full"
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '16px',
                border: `1px solid ${codeError ? '#EF4444' : '#C1C5CF'}`,
                padding: '12px 16px',
                fontFamily: 'Inter, sans-serif',
                fontSize: '14px',
                color: '#282E3A',
              }}
            />
            {codeError && (
              <p style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '13px',
                color: '#EF4444',
                marginTop: '8px',
              }}>
                {codeError}
              </p>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => {
                setCodeInput('');
                setCodeError('');
              }}
              style={{
                backgroundColor: 'transparent',
                color: '#282E3A',
                borderRadius: '14px',
                border: '1px solid #C1C5CF',
                fontFamily: 'Inter, sans-serif',
                fontSize: '14px',
                fontWeight: 500,
              }}
            >
              Annuleren
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleCodeSubmit}
              style={{
                backgroundColor: '#E27726',
                color: '#FFFFFF',
                borderRadius: '14px',
                fontFamily: 'Inter, sans-serif',
                fontSize: '14px',
                fontWeight: 500,
              }}
            >
              Bevestigen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
