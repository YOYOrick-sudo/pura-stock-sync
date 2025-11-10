import { Home, Calendar, CheckSquare, Calculator, Package, Settings, BarChart3 } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useUserLocation } from '@/contexts/UserLocationContext';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
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
import puraVidaLogo from '@/assets/pura-vida-logo-header.png';

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
  const { state } = useSidebar();
  const [showCodeDialog, setShowCodeDialog] = useState(false);
  const [codeInput, setCodeInput] = useState('');
  const [codeError, setCodeError] = useState('');
  const [pendingUrl, setPendingUrl] = useState('');

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
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b px-4 py-4 flex flex-row items-center justify-between">
        {state === "expanded" ? (
          <>
            <img 
              src={puraVidaLogo} 
              alt="Pura Vida" 
              className="h-[70px] w-auto object-contain object-left"
            />
            <div className="flex items-center gap-2 pr-4">
              <NotificationsDropdown />
              <SidebarTrigger className="h-10 w-10" />
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 w-full">
            <SidebarTrigger className="h-10 w-10" />
          </div>
        )}
      </SidebarHeader>
      <SidebarContent className="bg-background pt-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-3">
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild={!item.requiresCode}
                    tooltip={item.title}
                    isActive={isActive(item.url)}
                    size="lg"
                    className={cn(
                      isActive(item.url) && "bg-[#D1E3CD] shadow-sm",
                      state === "collapsed" && "justify-center"
                    )}
                    onClick={item.requiresCode ? (e) => handleProtectedClick(e, item.url) : undefined}
                  >
                    {item.requiresCode ? (
                      <div className="flex items-center gap-3 cursor-pointer">
                        {item.icon && (
                          <item.icon 
                            className={state === "collapsed" ? "h-8 w-8" : "h-6 w-6"} 
                          />
                        )}
                        {state === "expanded" && <span className="text-lg">{item.title}</span>}
                      </div>
                    ) : (
                      <Link to={item.url} className="flex items-center gap-3">
                        {item.icon && (
                          <item.icon 
                            className={state === "collapsed" ? "h-8 w-8" : "h-6 w-6"} 
                          />
                        )}
                        {state === "expanded" && <span className="text-lg">{item.title}</span>}
                      </Link>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

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
    </Sidebar>
  );
}
