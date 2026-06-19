import { Home, ListChecks, Wallet, Settings, BarChart3, Wrench, Users, ShieldCheck } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useUserLocation } from '@/contexts/UserLocationContext';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
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
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { NotificationsDropdown } from '@/components/NotificationsDropdown';
import { PolarSidebar } from '@/components/polar/Sidebar';
import { ThemeToggle } from '@/components/ThemeToggle';
import { PincodeNumpad } from '@/components/PincodeNumpad';
import puraVidaLogo from '@/assets/pura-vida-logo-sea-cropped.png';

const allNavigationItems = [
  { title: 'Dashboard', url: '/dashboard', icon: Home, locations: ['West', 'Midsland'], managerOnly: false },
  { title: 'Taken Bediening', url: '/taken-bediening', icon: ListChecks, locations: ['West', 'Midsland'], managerOnly: false },
  { title: 'Kassatelling', url: '/kassatelling', icon: Wallet, locations: ['West', 'Midsland'], managerOnly: false },

  { title: 'Onderhoud', url: '/onderhoud', icon: Wrench, locations: ['West', 'Midsland'], managerOnly: false },
  { title: 'Planning', url: '/personeel', icon: Users, locations: ['West', 'Midsland'], requiresCode: true, codeKey: 'personeel', expectedCode: '0000', managerOnly: false },
  { title: 'Settings', url: '/settings', icon: Settings, locations: ['West', 'Midsland'], managerOnly: false },
  { title: 'Statistieken', url: '/taken-analyse', icon: BarChart3, locations: ['West', 'Midsland'], requiresCode: true, codeKey: 'stats', expectedCode: 'boom', managerOnly: false },
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

  const isActive = (url: string) => location.pathname === url;

  const handleNavigation = (url: string) => {
    navigate(url);
    if (onNavigate) onNavigate();
  };

  const handleProtectedClick = (e: React.MouseEvent, url: string, codeKey: string) => {
    e.preventDefault();
    const isUnlocked = sessionStorage.getItem(`${codeKey}_unlocked`) === 'true';
    if (isUnlocked) {
      navigate(url);
      if (onNavigate) onNavigate();
    } else {
      setPendingUrl(url);
      setShowCodeDialog(true);
      setCodeError('');
      setCodeInput('');
    }
  };

  const handleCodeSubmit = () => {
    const item = allNavigationItems.find(i => i.url === pendingUrl);
    const expected = item?.expectedCode ?? '';
    const codeKey = item?.codeKey ?? '';
    const matches = codeKey === 'stats'
      ? codeInput.toLowerCase() === expected
      : codeInput === expected;
    if (matches) {
      sessionStorage.setItem(`${codeKey}_unlocked`, 'true');
      setShowCodeDialog(false);
      navigate(pendingUrl);
      if (onNavigate) onNavigate();
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
            className="h-[53px] w-auto max-w-full object-contain object-left ml-2"
          />
        }
        items={navigationItems.map(item => ({
          title: item.title,
          icon: item.icon,
          url: item.url,
          active: isActive(item.url),
          requiresCode: item.requiresCode,
          onClick: item.requiresCode 
            ? (e) => handleProtectedClick(e, item.url, item.codeKey!)
            : () => handleNavigation(item.url),
        }))}
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
        headerSlot={<NotificationsDropdown />}
        footerSlot={!collapsed ? <ThemeToggle /> : undefined}
      />

      {/* Numpad dialog for Planning (numeric pin) */}
      <Dialog
        open={showCodeDialog && allNavigationItems.find(i => i.url === pendingUrl)?.codeKey === 'personeel'}
        onOpenChange={(open) => {
          if (!open) {
            setShowCodeDialog(false);
            setCodeInput('');
            setCodeError('');
          }
        }}
      >
        <DialogContent className="bg-card rounded-[24px] border border-border p-8 max-w-[420px] shadow-lg">
          <PincodeNumpad
            title="Planning"
            onSubmit={(pin) => {
              const item = allNavigationItems.find(i => i.url === pendingUrl);
              const expected = item?.expectedCode ?? '';
              const codeKey = item?.codeKey ?? '';
              if (pin === expected) {
                sessionStorage.setItem(`${codeKey}_unlocked`, 'true');
                setShowCodeDialog(false);
                navigate(pendingUrl);
                if (onNavigate) onNavigate();
                return true;
              }
              return false;
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Text-input dialog for other protected items (e.g. Statistieken) */}
      <AlertDialog
        open={showCodeDialog && allNavigationItems.find(i => i.url === pendingUrl)?.codeKey !== 'personeel'}
        onOpenChange={setShowCodeDialog}
      >
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
