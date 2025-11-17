import { FohTasks } from '@/components/foh/FohTasks';
import { SidebarLayout } from '@/components/SidebarLayout';
import { useUserLocation } from '@/contexts/UserLocationContext';

export default function FohModule() {
  const { userLocation } = useUserLocation();

  return (
    <SidebarLayout>
      <div className="max-w-7xl mx-auto px-6 space-y-6">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Taken Bediening</h1>
          <p className="text-sm text-muted-foreground">{userLocation}</p>
        </div>
        <FohTasks />
      </div>
    </SidebarLayout>
  );
}
