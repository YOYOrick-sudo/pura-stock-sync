import { SidebarLayout } from '@/components/SidebarLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FixlijstTab } from '@/components/keten/FixlijstTab';
import { MethodesTab } from '@/components/keten/MethodesTab';
import { LeveranciersTab } from '@/components/keten/LeveranciersTab';
import { LeverdagenTab } from '@/components/keten/LeverdagenTab';
import { ArtikelLocatiesTab } from '@/components/keten/ArtikelLocatiesTab';
import { useIsMobile } from '@/hooks/use-mobile';

export default function KetenBeheer() {
  const isMobile = useIsMobile();
  return (
    <SidebarLayout>
      <div className={isMobile ? 'page-stack min-w-0 max-w-full [&_button]:min-h-11 [&_button]:min-w-11 [&_input]:min-h-11 [&_input]:min-w-0 [&_input]:text-base [&_.overflow-x-auto]:min-w-0 [&_.overflow-x-auto]:max-w-full [&_table]:min-w-[52rem] [&_tr>th:first-child]:sticky [&_tr>th:first-child]:left-0 [&_tr>th:first-child]:z-10 [&_tr>th:first-child]:bg-card [&_tr>td:first-child]:sticky [&_tr>td:first-child]:left-0 [&_tr>td:first-child]:z-10 [&_tr>td:first-child]:bg-card [&_tr>td:first-child]:max-w-48 [&_tr>td:first-child]:break-words [&_.flex-1]:min-w-0 [&_.justify-between]:flex-wrap [&_.justify-between]:gap-2' : 'page-stack'}>
        <p className="text-sm text-muted-foreground">
          Artikelen per vestiging, leveranciers, interne leverdagen en de laatste invulpunten.
        </p>

        <Tabs defaultValue="artikelen">
          <div className={isMobile ? 'min-w-0 max-w-full overflow-x-auto pb-1 md:mx-0 md:px-0' : '-mx-4 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0'}>
          <TabsList className={isMobile ? 'h-auto min-w-max justify-start flex-nowrap [&>button]:shrink-0 [&>button]:whitespace-nowrap' : 'h-11 min-w-max justify-start'}>
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
