import { SidebarLayout } from '@/components/SidebarLayout';
import OrderDashboard from '@/components/OrderDashboard';
import { useUserLocation } from '@/contexts/UserLocationContext';

export default function Voorraad() {
  const { userLocation } = useUserLocation();

  return (
    <SidebarLayout>
      <div className="max-w-7xl mx-auto px-6 space-y-10 pt-12">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Telling & Bestelling</h1>
          <p className="text-sm text-muted-foreground">Bestel bij Pura Midsland</p>
        </div>
        
        <OrderDashboard />
      </div>
    </SidebarLayout>
  );
}
