import { Home, ListChecks, Wallet, Package, Settings, BarChart3, Wrench } from 'lucide-react';
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
import { ThemeToggle } from '@/components/ThemeToggle';
import { useTheme } from '@/contexts/ThemeContext';
import puraVidaLogoDark from '@/assets/pura-vida-logo-dark.png';
import puraVidaLogoLight from '@/assets/pura-vida-logo.png';

const allNavigationItems = [
  { title: 'Dashboard', url: '/dashboard', icon: Home, locations: ['West', 'Midsland'] },
  { title: 'Taken Bediening', url: '/taken-bediening', icon: ListChecks, locations: ['West', 'Midsland'] },
  { title: 'Kassatelling', url: '/kassatelling', icon: Wallet, locations: ['West', 'Midsland'] },
  { title: 'Interne Bestellingen', url: '/internal-orders', icon: Package, locations: ['West'] },
  { title: 'Bestellingen van West', url: '/midsland-bestellingen', icon: Package, locations: ['Midsland'] },
  { title: 'Onderhoud', url: '/onderhoud', icon: Wrench, locations: ['West', 'Midsland'] },
  { title: 'Settings', url: '/settings', icon: Settings, locations: ['West', 'Midsland'] },
  { title: 'Statistieken', url: '/taken-analyse', icon: BarChart3, locations: ['West', 'Midsland'], requiresCode: true },
];

interface AppSidebarProps {
  onNavigate?: () => void;
}

export function AppSidebar({ onNavigate }: AppSidebarProps = {}) {
  const location = useLocation();
  const navigate = useNavigate();
  const { userLocation } = useUserLocation();
  const { isDark } = useTheme();
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
    if (onNavigate) onNavigate();
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
            src={isDark ? puraVidaLogoLight : puraVidaLogoDark} 
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
        footerSlot={!collapsed ? <ThemeToggle /> : undefined}
      />

      <AlertDialog open={showCodeDialog} onOpenChange={setShowCodeDialog}>
        <AlertDialogContent className="bg-card rounded-[20px] border border-border p-8 max-w-[480px] shadow-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-semibold text-foreground mb-2">
              Toegangscode vereist
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground mb-6">
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
              className={`w-full rounded-2xl border-1.5 p-3 px-4 text-sm ${codeError ? 'border-destructive' : ''}`}
            />
            {codeError && (
              <p className="text-[13px] text-destructive mt-2">{codeError}</p>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => { setCodeInput(''); setCodeError(''); }}
              className="rounded-[20px] border-1.5"
            >
              Annuleren
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCodeSubmit}
              className="rounded-[20px] bg-primary text-primary-foreground"
            >
              Bevestigen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
