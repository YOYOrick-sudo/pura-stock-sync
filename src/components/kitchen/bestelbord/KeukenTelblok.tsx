import { useState } from 'react';
import { Calculator, ChevronDown, ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Invoerbalk, KaartKop, LaadRijen, LijstKaart } from '@/components/pura';
import { EmptyState } from '@/components/pura/EmptyState';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { KeukenStandRegel, KeukenTelpoolRegel } from '@/hooks/useOntvangstV2';
import { formatTelHoeveelheid, kortDatum, splitsTelpool, telEenheidKort, telInvoer, telKopTekst, type TelInfo } from '@/lib/ontvangstV2';

type Rij = KeukenStandRegel & { pool?: KeukenTelpoolRegel };

type Props = {
  regels: KeukenStandRegel[];
  pool?: KeukenTelpoolRegel[];
  telinfo?: Record<string, TelInfo>;
  laden: boolean;
  onOpslaan: (telartikelId: string, aantal: number) => Promise<unknown>;
  bezig: boolean;
};

export function KeukenTelblok({ regels, pool, telinfo, laden, onOpslaan, bezig }: Props) {
  const [invoer, setInvoer] = useState<Record<string, string>>({});
  const { vandaag, overig } = splitsTelpool(regels, pool);
  const controles = vandaag.filter((r) => r.pool?.controle).length;

  async function opslaan(r: KeukenStandRegel) {
    const aantal = telInvoer(invoer[r.telartikel_id] ?? '');
    if (aantal === null || bezig) return;
    try {
      await onOpslaan(r.telartikel_id, aantal);
      const info = telinfo?.[r.telartikel_id] ?? { tel_label: null, tel_factor: 1, basis_eenheid: r.basis_eenheid };
      toast.success(`${r.naam}: ${formatTelHoeveelheid(aantal * (info.tel_factor ?? 1), info) ?? aantal} geteld`);
      setInvoer((vorig) => ({ ...vorig, [r.telartikel_id]: '' }));
    } catch (fout) {
      const bericht = fout instanceof Error ? fout.message : String(fout);
      toast.error('Niet opgeslagen: ' + bericht);
    }
  }

  const rij = (r: Rij) => {
    const info = telinfo?.[r.telartikel_id] ?? { tel_label: null, tel_factor: 1, basis_eenheid: r.basis_eenheid };
    const kort = telEenheidKort(info.tel_label) ?? r.basis_eenheid;
    return <div key={r.telartikel_id} className="grid min-w-0 grid-cols-2 items-center gap-2 px-4 py-2 lg:px-6 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
    <div className="min-w-0">
      <div className="flex min-w-0 items-center gap-1.5">
        <p className="truncate text-sm font-medium">{r.naam}</p>
        {r.pool?.geteld_vandaag && <Badge variant="secondary" className="shrink-0">geteld</Badge>}
        {r.pool?.controle && <Badge variant="outline" className="shrink-0">controle</Badge>}
      </div>
      <p className="text-xs text-muted-foreground">{r.laatste_telling ? `laatst geteld ${kortDatum(r.laatste_telling)}` : 'nog niet geteld'}</p>
      {(r.pool?.controle || r.pool?.reden) && <p className="truncate text-xs text-muted-foreground">{r.pool?.controle ? 'controletelling: gisteren week de telling sterk af van het verwachte verbruik' : r.pool?.reden}</p>}
      {r.pool?.tel_label && <p className="truncate text-xs text-muted-foreground">{`tel in: ${r.pool.tel_label}`}</p>}
    </div>
    <span className="text-right text-sm tabular-nums">{formatTelHoeveelheid(r.stand, info) ?? 'onbekend'}</span>
    <div className="col-span-2 min-w-0 sm:col-span-1">
      <Invoerbalk>
        <label htmlFor={`keuken-telling-${r.telartikel_id}`} className="sr-only">Aantal</label>
        <Input id={`keuken-telling-${r.telartikel_id}`} inputMode="decimal" min={0} aria-label={`Aantal ${r.naam} in ${kort ?? ''}`} placeholder="Aantal" value={invoer[r.telartikel_id] ?? ''} disabled={bezig}
          onChange={(e) => setInvoer((vorig) => ({ ...vorig, [r.telartikel_id]: e.target.value }))}
          className="h-11 w-24 min-w-[6rem] flex-1 basis-0 text-base" />
        <span className="whitespace-nowrap text-sm text-muted-foreground">{kort}</span>
        <Button type="button" variant="outline" size="touch" disabled={bezig || telInvoer(invoer[r.telartikel_id] ?? '') === null} onClick={() => opslaan(r)}>Opslaan</Button>
      </Invoerbalk>
    </div>
  </div>;
  };

  return <LijstKaart kop={<KaartKop titel="Tellen" icoon={Calculator} teller={vandaag.length} />}>
    {pool?.length ? (
      <p className="px-4 pb-1 text-xs text-muted-foreground lg:px-6">{telKopTekst(vandaag.length, controles)}</p>
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
