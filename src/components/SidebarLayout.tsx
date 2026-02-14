import { AppSidebar } from '@/components/AppSidebar';
import { PolarHeader } from '@/components/polar';
import { useLocation } from 'react-router-dom';
import { useUserLocation } from '@/contexts/UserLocationContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { useState } from 'react';

interface SidebarLayoutProps {
  children: React.ReactNode;
}

export function SidebarLayout({
  children
}: SidebarLayoutProps) {
  const location = useLocation();
  const { userLocation } = useUserLocation();
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
      '/midsland-bestellingen': 'Bestellingen van West',
      '/kitchen-menu': 'Keuken Menu',
      '/kitchen-tasks': 'Keuken Taken',
      '/recipes': 'Recepten',
      '/mep-planning': 'MEP Planning',
      '/voorraad': 'Voorraad',
      '/settings': 'Instellingen',
      '/taken-analyse': 'Statistieken'
    };
    return titles[pathname] || 'Pura Vida';
  };

  return (
    <div className="flex min-h-screen w-full" style={{
      backgroundColor: '#F8F9FA'
    }}>
      {/* Desktop Sidebar - hidden on mobile */}
      {!isMobile && (
        <div style={{ 
          backgroundColor: '#FFF7ED',
          paddingTop: '16px',
        }}>
          <AppSidebar />
        </div>
      )}

      {/* Mobile Menu Sheet */}
      {isMobile && (
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetContent side="left" className="w-[280px] p-0" style={{ backgroundColor: '#FFF7ED' }}>
            <div style={{ paddingTop: '16px' }}>
              <AppSidebar onNavigate={() => setMobileMenuOpen(false)} />
            </div>
          </SheetContent>
        </Sheet>
      )}
      
      <div className="flex flex-col flex-1">
        <PolarHeader
          title={getPageTitle(location.pathname)} 
          showStatusIndicator={false} 
          location={userLocation}
          onMenuClick={isMobile ? () => setMobileMenuOpen(true) : undefined}
        />
        
        <main className="p-4 md:p-6 lg:px-12 lg:py-8" style={{
          backgroundColor: '#F8F9FA'
        }}>
          {children}
        </main>
      </div>
    </div>
  );
}