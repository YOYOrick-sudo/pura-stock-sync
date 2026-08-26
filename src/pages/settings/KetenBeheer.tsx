import { SidebarLayout } from '@/components/SidebarLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FixlijstTab } from '@/components/keten/FixlijstTab';
import { MethodesTab } from '@/components/keten/MethodesTab';
import { LeveranciersTab } from '@/components/keten/LeveranciersTab';
import { LeverdagenTab } from '@/components/keten/LeverdagenTab';
import { ArtikelLocatiesTab } from '@/components/keten/ArtikelLocatiesTab';

export default function KetenBeheer() {
  return (
    <SidebarLayout>
      <div className="max-w-7xl mx-auto space-y-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Voorraadketen</h1>
          <p className="text-sm text-muted-foreground">
            Artikelen per vestiging, leveranciers, interne leverdagen en de laatste invulpunten.
          </p>
        </div>

        <Tabs defaultValue="artikelen">
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="artikelen">Artikelen per vestiging</TabsTrigger>
            <TabsTrigger value="leveranciers">Leveranciers</TabsTrigger>
            <TabsTrigger value="leverdagen">Interne leverdagen</TabsTrigger>
            <TabsTrigger value="methodes">Methodes</TabsTrigger>
            <TabsTrigger value="fixlijst">Fixlijst</TabsTrigger>
          </TabsList>

          <TabsContent value="artikelen" className="mt-4"><ArtikelLocatiesTab /></TabsContent>
          <TabsContent value="leveranciers" className="mt-4"><LeveranciersTab /></TabsContent>
          <TabsContent value="leverdagen" className="mt-4"><LeverdagenTab /></TabsContent>
          <TabsContent value="methodes" className="mt-4"><MethodesTab /></TabsContent>
          <TabsContent value="fixlijst" className="mt-4"><FixlijstTab /></TabsContent>
        </Tabs>
      </div>
    </SidebarLayout>
  );
}
