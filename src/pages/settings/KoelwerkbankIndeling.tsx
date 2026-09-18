import { SidebarLayout } from '@/components/SidebarLayout';
import { LadeGrid } from '@/components/voorraad/LadeGrid';
import { BakmaatUitleg } from '@/components/voorraad/BakmaatUitleg';
import { useUserLocation } from '@/contexts/UserLocationContext';

export default function KoelwerkbankIndeling() {
  const { userLocation } = useUserLocation();
  const vestiging = userLocation || 'West';

  return (
    <SidebarLayout>
      <div className="mx-auto max-w-5xl space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Koelwerkbank indelen</h1>
            <p className="text-sm text-muted-foreground">
              Sleep producten naar de lade waarin ze liggen. De voorraadronde telt daarna per lade,
              zodat je precies checkt wat er in de lade ligt die je open hebt.
            </p>
          </div>
          <BakmaatUitleg />
        </div>

        <LadeGrid vestiging={vestiging} />
      </div>
    </SidebarLayout>
  );
}
