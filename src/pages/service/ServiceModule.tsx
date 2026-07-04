import { KitchenLayout } from '@/components/kitchen/KitchenLayout';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ServiceTasks } from '@/components/service/ServiceTasks';
import { ServiceStaff } from '@/components/service/ServiceStaff';

export default function ServiceModule() {
  return (
    <KitchenLayout title="Bediening" subtitle="Taken & Medewerkers - Foodbar">
      <Tabs defaultValue="tasks" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 bg-card">
          <TabsTrigger value="tasks">Taken</TabsTrigger>
          <TabsTrigger value="staff">Medewerkers</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks">
          <ServiceTasks />
        </TabsContent>

        <TabsContent value="staff">
          <ServiceStaff />
        </TabsContent>
      </Tabs>
    </KitchenLayout>
  );
}