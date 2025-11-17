import { AppSidebar } from '@/components/AppSidebar';
import { PolarHeader } from '@/components/polar';
import { useLocation } from 'react-router-dom';
interface SidebarLayoutProps {
  children: React.ReactNode;
}
export function SidebarLayout({
  children
}: SidebarLayoutProps) {
  const location = useLocation();
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
  return <div className="flex min-h-screen w-full" style={{
    backgroundColor: '#FEFFF1'
  }}>
      <AppSidebar />
      
      <div className="flex flex-col flex-1">
        <PolarHeader title={getPageTitle(location.pathname)} showStatusIndicator={false} />
        
        <main style={{
        padding: '32px 48px',
        backgroundColor: '#FEFFF1'
      }}>
          {children}
        </main>
      </div>
    </div>;
}