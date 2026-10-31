import { useState } from 'react';
import { Calculator, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { Invoerbalk, KaartKop, LaadRijen, LijstKaart } from '@/components/pura';
import { EmptyState } from '@/components/pura/EmptyState';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { KeukenStandRegel, KeukenTelpoolRegel } from '@/hooks/useOntvangstV2';
import { kortDatum, splitsTelpool, telInvoer } from '@/lib/ontvangstV2';

type Rij = KeukenStandRegel & { pool?: KeukenTelpoolRegel };

type Props = {
  regels: KeukenStandRegel[];
  pool?: KeukenTelpoolRegel[];
  laden: boolean;
  onOpslaan: (telartikelId: string, aantal: number) => Promise<unknown>;
  bezig: boolean;
};

export function KeukenTelblok({ regels, pool, laden, onOpslaan, bezig }: Props) {
  const [invoer, setInvoer] = useState<Record<string, string>>({});
  const { vandaag, overig } = splitsTelpool(regels, pool);

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

  const rij = (r: Rij) => <div key={r.telartikel_id} className="grid min-w-0 grid-cols-2 items-center gap-2 px-4 py-2 lg:px-6 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
    <div className="min-w-0">
      <div className="flex min-w-0 items-center gap-1.5">
        <p className="truncate text-sm font-medium">{r.naam}</p>
        {r.pool?.geteld_vandaag && <Badge variant="secondary" className="shrink-0">geteld</Badge>}
      </div>
      <p className="text-xs text-muted-foreground">{r.laatste_telling ? `laatst geteld ${kortDatum(r.laatste_telling)}` : 'nog niet geteld'}</p>
      {r.pool?.reden && <p className="truncate text-xs text-muted-foreground">{r.pool.reden}</p>}
      {r.pool?.tel_label && <p className="truncate text-xs text-muted-foreground">{`tel in: ${r.pool.tel_label}`}</p>}
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
  </div>;

  return <LijstKaart kop={<KaartKop titel="Tellen" icoon={Calculator} teller={vandaag.length} />}>
    {pool?.length && vandaag.length > 0 ? (
      <p className="px-4 pb-1 text-xs text-muted-foreground lg:px-6">{`Vanavond tellen: deze ${vandaag.length} artikelen. Morgen kiest de app weer andere.`}</p>
    ) : null}
    {laden ? <LaadRijen /> : !regels.length ? <EmptyState icon={Calculator} title="Nog geen telartikelen" description="" className="border-0 shadow-none" /> : <>
      <div className="divide-y divide-border">{vandaag.map(rij)}</div>
      {overig.length > 0 && <Collapsible className="border-t border-border">
        <CollapsibleTrigger asChild>
          <Button type="button" variant="ghost" className="flex w-full items-center justify-between px-4 lg:px-6">
            <span>{`Ook iets anders tellen (${overig.length})`}</span>
            <ChevronDown className="size-4 text-muted-foreground" />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="divide-y divide-border">{overig.map(rij)}</div>
        </CollapsibleContent>
      </Collapsible>}
    </>}
  </LijstKaart>;
}
