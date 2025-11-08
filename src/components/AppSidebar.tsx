import { Home, Calendar, CheckSquare, Calculator, ChefHat, Settings } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
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

  const isActive = (url: string) => location.pathname === url;

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b p-0 flex items-center">
        <img 
          src={puraVidaLogo} 
          alt="Pura Vida" 
          className="h-[52px] w-auto object-contain object-left"
        />
      </SidebarHeader>
      <SidebarContent className="bg-background">
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
                      {item.icon && <item.icon className="h-4 w-4" />}
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
