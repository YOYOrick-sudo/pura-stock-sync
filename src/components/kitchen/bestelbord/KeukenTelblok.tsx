import { useState } from 'react';
import { Calculator, Check, CheckCircle, ChevronDown, ImageIcon, Info, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { KaartKop, LaadRijen, LijstKaart } from '@/components/pura';
import { EmptyState } from '@/components/pura/EmptyState';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { KeukenStandRegel, KeukenTelpoolRegel } from '@/hooks/useOntvangstV2';
import { formatTelHoeveelheid, kortDatum, splitsTelpool, telEenheidKort, telInvoer, type TelInfo } from '@/lib/ontvangstV2';

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
  const dicht = !!pool?.length && vandaag.length === 0 && overig.every((r) => r.pool?.reden === 'vestiging dicht: schuift door');

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
    return <div key={r.telartikel_id} className="flex min-w-0 items-center gap-1 px-4 py-2 lg:gap-2 lg:px-6">
    <div className="flex min-w-0 flex-1 items-center gap-1">
      <p className="min-w-0 flex-1 truncate whitespace-nowrap text-sm font-medium">{r.naam}</p>
      {r.pool?.geteld_vandaag && <CheckCircle role="img" aria-label="geteld vandaag" className="size-4 shrink-0 text-muted-foreground" />}
      {r.pool?.controle && <Popover>
        <PopoverTrigger asChild>
          <Button type="button" variant="ghost" size="touch-icon" className="w-4 shrink-0 text-warning" aria-label={`Controletelling ${r.naam}`}><RefreshCw /></Button>
        </PopoverTrigger>
        <PopoverContent className="text-sm">Controletelling: de vorige telling week sterk af van het verwachte verbruik.</PopoverContent>
      </Popover>}
      {info.tel_hint && <Badge variant="secondary" className="max-w-24 shrink-0 whitespace-nowrap px-1"><span className="truncate">{info.tel_hint}</span></Badge>}
      {info.tel_afbeelding && (
        <Dialog>
          <DialogTrigger asChild>
            <Button type="button" variant="ghost" size="touch-icon" className="w-4 shrink-0 text-muted-foreground" aria-label={`Plaatje ${r.naam}`}><ImageIcon /></Button>
          </DialogTrigger>
          <DialogContent className="max-w-sm">
            <DialogTitle className="sr-only">{r.naam}</DialogTitle>
            <img src={info.tel_afbeelding} alt={r.naam} className="h-auto w-full" />
          </DialogContent>
        </Dialog>
      )}
      <Popover>
        <PopoverTrigger asChild>
          <Button type="button" variant="ghost" size="touch-icon" className="w-4 shrink-0 text-muted-foreground" aria-label={`Info ${r.naam}`}><Info /></Button>
        </PopoverTrigger>
        <PopoverContent className="space-y-1 text-sm">
          <p className="font-medium">{r.naam}</p>
          <p>{r.laatste_telling ? `laatst geteld ${kortDatum(r.laatste_telling)}` : 'nog niet geteld'}</p>
          {r.pool?.reden && <p>{r.pool.reden}</p>}
          <p>{`tel in: ${r.pool?.tel_label ?? info.tel_label ?? kort ?? 'onbekend'}`}</p>
          <p>{`Verwachte stand: ${formatTelHoeveelheid(r.stand, info) ?? 'onbekend'}`}</p>
          {info.tel_hint && <p>{info.tel_hint}</p>}
        </PopoverContent>
      </Popover>
    </div>
        <label htmlFor={`keuken-telling-${r.telartikel_id}`} className="sr-only">Aantal</label>
        <Input id={`keuken-telling-${r.telartikel_id}`} inputMode="decimal" min={0} aria-label={`Aantal ${r.naam} in ${kort ?? ''}`} placeholder="Aantal" value={invoer[r.telartikel_id] ?? ''} disabled={bezig}
          onChange={(e) => setInvoer((vorig) => ({ ...vorig, [r.telartikel_id]: e.target.value }))}
          className="h-11 w-16 shrink-0 text-base tabular-nums sm:w-24" />
        <span className="shrink-0 whitespace-nowrap text-sm text-muted-foreground">{kort}</span>
        <Button type="button" variant="outline" size="touch-icon" className="shrink-0" aria-label={`Opslaan ${r.naam}`} disabled={bezig || telInvoer(invoer[r.telartikel_id] ?? '') === null} onClick={() => opslaan(r)}><Check /></Button>
  </div>;
  };

  return <LijstKaart kop={<KaartKop titel={dicht ? 'Vanavond dicht' : 'Vanavond tellen'} icoon={Calculator} teller={dicht ? undefined : vandaag.length} rechts={dicht ? <Popover>
    <PopoverTrigger asChild><Button type="button" variant="ghost" size="touch-icon" className="text-muted-foreground" aria-label="Info vanavond dicht"><Info /></Button></PopoverTrigger>
    <PopoverContent className="text-sm">Niemand tellen. Wat aan de beurt was schuift door naar de volgende open avond.</PopoverContent>
  </Popover> : undefined} />}>
    {laden ? <LaadRijen /> : !regels.length ? <EmptyState icon={Calculator} title="Nog geen telartikelen" description="" className="border-0 shadow-none" /> : <>
      <div className="divide-y divide-border">{vandaag.map(rij)}</div>
      {overig.length > 0 && <Collapsible className="border-t border-border">
        <CollapsibleTrigger asChild>
          <Button type="button" variant="ghost" size="touch" className="flex w-full items-center justify-between px-4 lg:px-6">
            <span className="truncate whitespace-nowrap">{`Ook iets anders tellen (${overig.length})`}</span>
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
