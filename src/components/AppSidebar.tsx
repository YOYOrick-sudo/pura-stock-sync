import { Home, Calendar, CheckSquare, Calculator, Package, Settings, Bell } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
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

const allNavigationItems = [
  {
    title: 'Dashboard',
    url: '/home',
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
    title: 'Voorraad',
    url: '/voorraad',
    icon: Package,
    locations: ['West'],
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
  const [hasNotifications, setHasNotifications] = useState(true);
  const [userLocation, setUserLocation] = useState<string>('');

  useEffect(() => {
    const fetchLocation = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('user_roles')
          .select('location')
          .eq('user_id', user.id)
          .maybeSingle();
        setUserLocation(data?.location || '');
      }
    };
    fetchLocation();
  }, []);

  const navigationItems = userLocation 
    ? allNavigationItems.filter(item => item.locations.includes(userLocation))
    : allNavigationItems;

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
                      {item.icon && <item.icon className="h-5 w-5" />}
                      <span className="text-base">{item.title}</span>
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
