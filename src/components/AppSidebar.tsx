import { Home, Calendar, CheckSquare, Calculator, Package, Settings, BarChart3 } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useUserLocation } from '@/contexts/UserLocationContext';
import { cn } from '@/lib/utils';
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
    title: 'Statistieken',
    url: '/taken-analyse',
    icon: BarChart3,
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
];

export function AppSidebar() {
  const location = useLocation();
  const { userLocation } = useUserLocation();
  const { state } = useSidebar();

  const navigationItems = userLocation 
    ? allNavigationItems.filter(item => item.locations.includes(userLocation))
    : allNavigationItems;

  const isActive = (url: string) => location.pathname === url;

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
                    asChild
                    tooltip={item.title}
                    isActive={isActive(item.url)}
                    size="lg"
                    className={cn(
                      isActive(item.url) && "bg-[#D1E3CD] shadow-sm",
                      state === "collapsed" && "justify-center"
                    )}
                  >
                    <Link to={item.url} className="flex items-center gap-3">
                      {item.icon && (
                        <item.icon 
                          className={state === "collapsed" ? "h-8 w-8" : "h-6 w-6"} 
                        />
                      )}
                      {state === "expanded" && <span className="text-lg">{item.title}</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
