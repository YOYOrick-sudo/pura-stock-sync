import { Home, Calendar, CheckSquare, Calculator, Package, Settings, BarChart3, Palette } from 'lucide-react';
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
    icon: CheckSquare,
    locations: ['West', 'Midsland'],
  },
  {
    title: 'Kassatelling',
    url: '/kassatelling',
    icon: Calculator,
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
];

export function AppSidebar() {
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
            : undefined,
        }))}
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
        headerSlot={<NotificationsDropdown />}
      />

      <AlertDialog open={showCodeDialog} onOpenChange={setShowCodeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Toegangscode vereist</AlertDialogTitle>
            <AlertDialogDescription>
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
            />
            {codeError && (
              <p className="text-sm text-destructive mt-2">{codeError}</p>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setCodeInput('');
              setCodeError('');
            }}>
              Annuleren
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleCodeSubmit}>
              Bevestigen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
