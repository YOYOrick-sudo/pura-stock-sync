import { Home, Calendar, CheckSquare, Calculator, ChefHat, Settings, Bell } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
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
import { Button } from '@/components/ui/button';
import puraVidaLogo from '@/assets/pura-vida-logo-header.png';

const navigationItems = [
  {
    title: 'Dashboard',
    url: '/home',
    icon: Home,
  },
  {
    title: 'Reserveringen',
    url: '/reservations-demo',
    icon: Calendar,
  },
  {
    title: 'Taken Bediening',
    url: '/taken-bediening',
    icon: CheckSquare,
  },
  {
    title: 'Kassatelling',
    url: '/kassatelling-overdag',
    icon: Calculator,
  },
  {
    title: 'MEP Taken',
    url: '/kitchen/mep',
    icon: ChefHat,
  },
  {
    title: 'Halffabricaten',
    url: '/kitchen/recipes',
    icon: ChefHat,
  },
  {
    title: 'Interne Bestellingen',
    url: '/kitchen/orders',
    icon: ChefHat,
  },
  {
    title: 'Recepten',
    url: '/kitchen/recipes',
    icon: ChefHat,
  },
  {
    title: 'Settings',
    url: '/settings',
    icon: Settings,
  },
];

export function AppSidebar() {
  const location = useLocation();
  const [hasNotifications, setHasNotifications] = useState(true);

  const isActive = (url: string) => location.pathname === url;

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b !p-0 flex flex-row items-center justify-between">
        <img 
          src={puraVidaLogo} 
          alt="Pura Vida" 
          className="h-[89px] w-auto object-contain object-left pl-[10px] py-[10px]"
        />
        <div className="flex items-center gap-2 pr-4">
          <Button
            variant="ghost"
            size="icon"
            className="relative h-9 w-9"
            onClick={() => setHasNotifications(false)}
          >
            <Bell className="h-5 w-5" />
            {hasNotifications && (
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-notification-badge" />
            )}
          </Button>
          <SidebarTrigger />
        </div>
      </SidebarHeader>
      <SidebarContent className="bg-background pt-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    isActive={isActive(item.url)}
                  >
                    <Link to={item.url}>
                      {item.icon && <item.icon className="h-[18px] w-[18px]" />}
                      <span>{item.title}</span>
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
