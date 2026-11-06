import { AppSidebar } from '@/components/AppSidebar';
import { PolarHeader } from '@/components/polar';
import { useLocation } from 'react-router-dom';
import { useUserLocation } from '@/contexts/UserLocationContext';
import { getLocationDisplayName } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobielOnderbalk } from '@/components/MobielOnderbalk';

interface SidebarLayoutProps {
  children: React.ReactNode;
  hideHeader?: boolean;
}

export function SidebarLayout({
  children,
  hideHeader = false
}: SidebarLayoutProps) {
  const location = useLocation();
  const { userLocation, displayLocation, availableLocations, setActiveLocation } = useUserLocation();
  const isMobile = useIsMobile();
  
  const getPageTitle = (pathname: string) => {
    if (isMobile && pathname === '/kitchen/mep/beheer') return 'Mise-en-place beheren';
    if (isMobile && pathname === '/kitchen/mep/oud') return 'Mise-en-place';
    const titles: Record<string, string> = {
      '/dashboard': 'Dashboard',
      '/kassatelling': 'Kassatelling',
      '/kassatelling-overdag': 'Kassatelling Overdag',
      '/kassa': 'Kassa',
      '/taken-bediening': 'Taken Bediening',
      '/kitchen-menu': 'Keuken Menu',
      '/kitchen-tasks': 'Keuken Taken',
      '/recipes': 'Recepten',
      '/kitchen/recipes': 'Recepten',
      '/kitchen/recipes/nieuw': 'Nieuw recept',
      '/kitchen/ingredienten': 'Ingrediënten',
      '/kitchen/snel-printen': 'Stickers',
      '/kitchen/mep': 'Mise-en-place',
      '/kitchen/mep/week': 'Mise-en-place · week',
      '/kitchen/bestelbord': 'Bestellijst',
      '/settings/mep': 'Mise-en-place instellingen',
      '/settings/keten': 'Voorraadketen',
      '/settings/koelwerkbank': 'Koelwerkbank indelen',

      '/mep-planning': 'MEP Planning',
      '/voorraad': 'Bestellen',
      '/voorraad/onderweg': 'Onderweg',
      '/voorraad/stand': 'Voorraadstand',
      '/settings': 'Instellingen',
      '/cijfers': 'Cijfers',
      '/taken-analyse': 'Statistieken',
      '/taken/admin': 'Takenlijsten beheren',
      '/taken/beheer': 'Lijst bewerken',
      '/onderhoud': 'Onderhoud',
      '/mt-punt': 'MT-punten',
      '/kas-controle': 'Kas-controle',
      '/hr': 'HR',
      '/hr/applicants/new': 'Nieuwe kandidaat',
      '/hr/housing': 'Huisvesting',
      '/hr/housing/new': 'Nieuwe woning',
      '/personeel': 'Personeel',
      '/personeel/wonen': 'Personeel — Wonen',
      '/personeel/collegas': 'Collega\'s',
      '/personeel/settings': 'Personeel — Instellingen',
      '/style-guide': 'Style Guide',
      '/design-preview': 'Design Preview',
      '/design-system': 'Design System',
    };
    if (pathname === '/taken-bediening' && userLocation === 'West') return 'Taken';
    if (/^\/kitchen\/recipes\/[^/]+\/bewerken$/.test(pathname)) return 'Recept bewerken';
    if (/^\/kitchen\/recipes\/[^/]+$/.test(pathname)) return 'Recept';
    if (/^\/hr\/applicants\/[^/]+$/.test(pathname)) return 'Kandidaat';
    if (/^\/personeel\/wonen\/[^/]+$/.test(pathname)) return 'Woning';
    return titles[pathname] || 'Pura Vida';
  };

  return (
    <div className={isMobile ? 'flex min-h-dvh w-full overflow-x-clip' : 'flex min-h-dvh w-full'} style={{ backgroundColor: 'hsl(var(--app-canvas))' }}>
      {/* Desktop Sidebar - hidden on mobile */}
      {!isMobile && (
        <div style={{ position: 'sticky', top: 0, height: '100dvh', alignSelf: 'flex-start' }}>
          <AppSidebar />
        </div>
      )}

      
      <div className="flex flex-col flex-1 min-w-0 overflow-x-hidden">
        {!hideHeader && (
          <PolarHeader
            title={getPageTitle(location.pathname)} 
            showStatusIndicator={false} 
            location={displayLocation}
            locationOptions={isMobile ? undefined : availableLocations.map(loc => ({ value: loc, label: getLocationDisplayName(loc) }))}
            activeLocationValue={userLocation}
            onLocationChange={setActiveLocation}
            onMenuClick={undefined}
          />
        )}
        
        <main className="min-w-0 px-[calc(1rem+var(--safe-left))] pb-[calc(1.5rem+var(--onderbalk)+var(--safe-bottom))] pt-2 md:px-10 md:pb-8 md:pt-3 lg:px-16">
          {children}
        </main>
      </div>
      {isMobile && <MobielOnderbalk />}
    </div>
  );
}
