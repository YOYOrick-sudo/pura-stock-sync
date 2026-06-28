import { AppSidebar } from '@/components/AppSidebar';
import { PolarHeader } from '@/components/polar';
import { useLocation } from 'react-router-dom';
import { useUserLocation } from '@/contexts/UserLocationContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { useState } from 'react';

interface SidebarLayoutProps {
  children: React.ReactNode;
  hideHeader?: boolean;
}

export function SidebarLayout({
  children,
  hideHeader = false
}: SidebarLayoutProps) {
  const location = useLocation();
  const { userLocation, displayLocation } = useUserLocation();
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const getPageTitle = (pathname: string) => {
    const titles: Record<string, string> = {
      '/dashboard': 'Dashboard',
      '/kassatelling': 'Kassatelling',
      '/kassatelling-overdag': 'Kassatelling Overdag',
      '/kassa': 'Kassa',
      '/taken-bediening': 'Taken Bediening',
      '/internal-orders': 'Interne Bestellingen',
      '/midsland-bestellingen': 'Bestellingen van Daily',
      '/kitchen-menu': 'Keuken Menu',
      '/kitchen-tasks': 'Keuken Taken',
      '/recipes': 'Recepten',
      '/mep-planning': 'MEP Planning',
      '/voorraad': 'Voorraad',
      '/settings': 'Instellingen',
      '/taken-analyse': 'Statistieken',
      '/onderhoud': 'Onderhoud',
      '/kas-controle': 'Kas-controle',
    };
    if (pathname === '/taken-bediening' && userLocation === 'West') return 'Taken';
    return titles[pathname] || 'Pura Vida';
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Desktop Sidebar - hidden on mobile */}
      {!isMobile && (
        <div style={{ position: 'sticky', top: 0, height: '100vh', alignSelf: 'flex-start' }}>
          <AppSidebar />
        </div>
      )}

      {/* Mobile Menu Sheet */}
      {isMobile && (
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetContent side="left" className="w-[280px] p-0 bg-card">
            <div style={{ paddingTop: '16px' }}>
              <AppSidebar onNavigate={() => setMobileMenuOpen(false)} />
            </div>
          </SheetContent>
        </Sheet>
      )}
      
      <div className="flex flex-col flex-1 min-w-0 overflow-x-hidden">
        {!hideHeader && (
          <PolarHeader
            title={getPageTitle(location.pathname)} 
            showStatusIndicator={false} 
            location={displayLocation}
            onMenuClick={isMobile ? () => setMobileMenuOpen(true) : undefined}
          />
        )}
        
        <main className="px-6 md:px-10 lg:px-16 pt-2 md:pt-3 pb-6 md:pb-8 bg-background min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
