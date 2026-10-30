import { SidebarLayout } from '@/components/SidebarLayout';
import { LadeGrid } from '@/components/voorraad/LadeGrid';
import { BakmaatUitleg } from '@/components/voorraad/BakmaatUitleg';
import { PlekItemsBeheer } from '@/components/voorraad/PlekItemsBeheer';
import { KetenPerProduct } from '@/components/voorraad/KetenPerProduct';
import { useUserLocation } from '@/contexts/UserLocationContext';
import { useIsMobile } from '@/hooks/use-mobile';

export default function KoelwerkbankIndeling() {
  const isMobile = useIsMobile();
  const { userLocation } = useUserLocation();
  const vestiging = userLocation || 'West';

  return (
    <SidebarLayout>
      <div className={isMobile ? 'page-stack min-w-0 max-w-full [&_button]:min-h-11 [&_button]:min-w-11 [&_input]:min-h-11 [&_input]:min-w-0 [&_input]:text-base [&_.grid]:min-w-0 [&_.grid>div]:min-w-0 [&_.grid-cols-6]:!grid-cols-1 [&_.grid-cols-6>div]:!col-span-1 [&_.touch-none]:min-h-11 [&_.touch-none]:min-w-11' : 'page-stack max-w-5xl'}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">
              Sleep producten naar de lade waarin ze liggen. De voorraadronde telt daarna per lade,
              zodat je precies checkt wat er in de lade ligt die je open hebt.
            </p>
          </div>
          <BakmaatUitleg />
        </div>

        <LadeGrid vestiging={vestiging} />
        <KetenPerProduct vestiging={vestiging} />
        <PlekItemsBeheer vestiging={vestiging} />
      </div>
    </SidebarLayout>
  );
}
