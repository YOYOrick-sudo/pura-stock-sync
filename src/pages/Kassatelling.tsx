import { SidebarLayout } from '@/components/SidebarLayout';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useUserLocation } from '@/contexts/UserLocationContext';
import Kassa from './Kassa';
import KassatellingOverdag from './KassatellingOverdag';

export default function Kassatelling() {
  const { userLocation } = useUserLocation();

  return (
    <SidebarLayout>
      <div className="max-w-7xl mx-auto px-6 space-y-10 pt-12">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Kassatelling</h1>
          <p className="text-sm text-muted-foreground">{userLocation}</p>
        </div>

        <Tabs defaultValue="avond" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 bg-white">
            <TabsTrigger value="overdag">Overdag</TabsTrigger>
            <TabsTrigger value="avond">Avond</TabsTrigger>
          </TabsList>

          <TabsContent value="overdag" className="space-y-4">
            <KassatellingOverdag />
          </TabsContent>

          <TabsContent value="avond" className="space-y-4">
            <Kassa />
          </TabsContent>
        </Tabs>
      </div>
    </SidebarLayout>
  );
}
