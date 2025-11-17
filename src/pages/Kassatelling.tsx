import { SidebarLayout } from '@/components/SidebarLayout';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useUserLocation } from '@/contexts/UserLocationContext';
import Kassa from './Kassa';
import KassatellingOverdag from './KassatellingOverdag';

export default function Kassatelling() {
  const { userLocation } = useUserLocation();

  return (
    <SidebarLayout>
      <div className="max-w-7xl mx-auto px-6 space-y-6">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Kassatelling</h1>
          <p className="text-sm text-muted-foreground">{userLocation}</p>
        </div>

        <Tabs defaultValue="avond" className="space-y-4">
          <TabsList className="inline-flex h-10 items-center justify-start rounded-lg bg-muted/50 p-1">
            <TabsTrigger 
              value="overdag"
              className="rounded-md px-4 py-2 text-sm font-medium text-muted-foreground transition-all hover:text-foreground data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              Overdag
            </TabsTrigger>
            <TabsTrigger 
              value="avond"
              className="rounded-md px-4 py-2 text-sm font-medium text-muted-foreground transition-all hover:text-foreground data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              Avond
            </TabsTrigger>
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
