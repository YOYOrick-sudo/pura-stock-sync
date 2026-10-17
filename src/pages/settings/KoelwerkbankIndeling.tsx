import { SidebarLayout } from '@/components/SidebarLayout';
import { LadeGrid } from '@/components/voorraad/LadeGrid';
import { BakmaatUitleg } from '@/components/voorraad/BakmaatUitleg';
import { PlekItemsBeheer } from '@/components/voorraad/PlekItemsBeheer';
import { KetenPerProduct } from '@/components/voorraad/KetenPerProduct';
import { useUserLocation } from '@/contexts/UserLocationContext';

export default function KoelwerkbankIndeling() {
  const { userLocation } = useUserLocation();
  const vestiging = userLocation || 'West';

  return (
    <SidebarLayout>
      <div className="page-stack max-w-5xl">
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
