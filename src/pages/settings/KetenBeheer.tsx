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
      <div className="page-stack">
        <p className="text-sm text-muted-foreground">
          Artikelen per vestiging, leveranciers, interne leverdagen en de laatste invulpunten.
        </p>

        <Tabs defaultValue="artikelen">
          <div className="-mx-4 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0">
          <TabsList className="h-11 min-w-max justify-start">
            <TabsTrigger value="artikelen">Artikelen per vestiging</TabsTrigger>
            <TabsTrigger value="leveranciers">Leveranciers</TabsTrigger>
            <TabsTrigger value="leverdagen">Interne leverdagen</TabsTrigger>
            <TabsTrigger value="methodes">Methodes</TabsTrigger>
            <TabsTrigger value="fixlijst">Fixlijst</TabsTrigger>
          </TabsList>
          </div>

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
