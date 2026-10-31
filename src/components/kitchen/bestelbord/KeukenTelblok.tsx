import { useState } from 'react';
import { Calculator } from 'lucide-react';
import { toast } from 'sonner';
import { Invoerbalk, KaartKop, LaadRijen, LijstKaart } from '@/components/pura';
import { EmptyState } from '@/components/pura/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { KeukenStandRegel } from '@/hooks/useOntvangstV2';
import { kortDatum, telInvoer } from '@/lib/ontvangstV2';

type Props = {
  regels: KeukenStandRegel[];
  laden: boolean;
  onOpslaan: (telartikelId: string, aantal: number) => Promise<unknown>;
  bezig: boolean;
};

export function KeukenTelblok({ regels, laden, onOpslaan, bezig }: Props) {
  const [invoer, setInvoer] = useState<Record<string, string>>({});

  async function opslaan(r: KeukenStandRegel) {
    const aantal = telInvoer(invoer[r.telartikel_id] ?? '');
    if (aantal === null || bezig) return;
    try {
      await onOpslaan(r.telartikel_id, aantal);
      toast.success(`${r.naam}: ${aantal}${r.basis_eenheid ? ` ${r.basis_eenheid}` : ''} geteld`);
      setInvoer((vorig) => ({ ...vorig, [r.telartikel_id]: '' }));
    } catch (fout) {
      const bericht = fout instanceof Error ? fout.message : String(fout);
      toast.error('Niet opgeslagen: ' + bericht);
    }
  }

  return <LijstKaart kop={<KaartKop titel="Tellen" icoon={Calculator} teller={regels.length} />}>
    {laden ? <LaadRijen /> : !regels.length ? <EmptyState icon={Calculator} title="Nog geen telartikelen" description="" className="border-0 shadow-none" /> :
      <div className="divide-y divide-border">
        {regels.map((r) => <div key={r.telartikel_id} className="grid min-w-0 grid-cols-2 items-center gap-2 px-4 py-2 lg:px-6 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{r.naam}</p>
            <p className="text-xs text-muted-foreground">{r.laatste_telling ? `laatst geteld ${kortDatum(r.laatste_telling)}` : 'nog niet geteld'}</p>
          </div>
          <span className="text-right text-sm tabular-nums">{r.stand === null ? 'onbekend' : `${r.stand}${r.basis_eenheid ? ` ${r.basis_eenheid}` : ''}`}</span>
          <div className="col-span-2 min-w-0 sm:col-span-1">
            <Invoerbalk>
              <Input inputMode="decimal" min={0} aria-label={`Aantal ${r.naam}`} placeholder="Aantal" value={invoer[r.telartikel_id] ?? ''} disabled={bezig}
                onChange={(e) => setInvoer((vorig) => ({ ...vorig, [r.telartikel_id]: e.target.value }))}
                className="h-11 min-w-0 flex-1 basis-0 text-base sm:w-24" />
              <Button type="button" variant="outline" size="touch" disabled={bezig || telInvoer(invoer[r.telartikel_id] ?? '') === null} onClick={() => opslaan(r)}>Opslaan</Button>
            </Invoerbalk>
          </div>
        </div>)}
      </div>}
  </LijstKaart>;
}