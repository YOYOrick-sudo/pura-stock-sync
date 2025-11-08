import { SidebarLayout } from '@/components/SidebarLayout';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import Kassa from './Kassa';
import KassatellingOverdag from './KassatellingOverdag';

export default function Kassatelling() {
  return (
    <SidebarLayout>
      <div className="space-y-4">

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
