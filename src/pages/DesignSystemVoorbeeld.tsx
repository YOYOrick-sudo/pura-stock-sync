import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ShadcnVergelijking, type VoorbeeldToon } from '@/pages/design-system/ShadcnVoorbeeld';

function toonVan(waarde: string | null): VoorbeeldToon {
  if (waarde === 'nieuw' || waarde === 'huidig') return waarde;
  return 'beide';
}

/** Losse pagina zodat het voorbeeld op 390, 834 en 1280 te meten is. */
export default function DesignSystemVoorbeeld() {
  const [params] = useSearchParams();
  const toon = toonVan(params.get('toon'));
  const alleenNieuw = toon === 'nieuw';
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex h-12 max-w-[1200px] items-center justify-between gap-2 px-4 lg:px-6">
          <p className="truncate text-xs text-muted-foreground">Shadcn-voorbeeld</p>
          <Button variant="ghost" size="touch" asChild><a href="/design-system#shadcn-voorbeeld">Naslag</a></Button>
        </div>
      </header>
      <main className={`mx-auto space-y-6 px-4 py-6 lg:px-6 ${alleenNieuw ? 'max-w-[1040px]' : 'max-w-[1200px]'}`}>
        {alleenNieuw ? null : <p className="text-sm text-muted-foreground">De tokens staan app-breed. Links de oude opbouw, rechts de nieuwe.</p>}
        <ShadcnVergelijking toon={toon} tokens />
      </main>
    </div>
  );
}
