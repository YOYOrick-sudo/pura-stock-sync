import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Hourglass } from 'lucide-react';
import { DetailLade, KaartKop, LijstKaart } from '@/components/pura/patronen';
import { RijMenu, RijMeta } from '@/components/pura/lijst';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useOntvangstMutaties, type MandjeVraag } from '@/hooks/useOntvangstV2';
import { annuleerGeldig, kortDatum, mandjeRedenLabel, restSoortLabel, type OntvangstModus } from '@/lib/ontvangstV2';

const BRONNEN = [{ id: 'pakbon', naam: 'Pakbon' }, { id: 'mail', naam: 'Mail' }, { id: 'orderbevestiging', naam: 'Bevestiging' }];
const tijd = (d: string) => new Date(d).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Amsterdam' });

/** Bovenaan het mandje: restanten die een besluit vragen. */
export function MandjeVragen({ modus, vragen }: { modus: OntvangstModus; vragen: MandjeVraag[] }) {
  const { beslissen } = useOntvangstMutaties(modus);
  const [wacht, setWacht] = useState<MandjeVraag | null>(null);
  const [datum, setDatum] = useState('');
  const [annuleer, setAnnuleer] = useState<MandjeVraag | null>(null);
  if (!vragen.length) return null;

  const doe = (a: Parameters<typeof beslissen.mutate>[0], klaar: () => void) => beslissen.mutate(a, {
    onSuccess: () => { toast.success('Opgeslagen'); klaar(); },
    onError: (e) => toast.error(e?.message || 'Niet opgeslagen'),
  });

  return <>
    <LijstKaart kop={<KaartKop icoon={Hourglass} titel="Te beslissen" teller={vragen.length} />}>
      <div className="divide-y divide-border">{vragen.map((v) => <div key={v.regel_id} className="flex flex-wrap items-center gap-2 px-4 py-2">
        <div className="min-w-0 flex-1">
          <span className="flex min-w-0 items-center gap-1.5"><span className="truncate font-medium">{v.naam}</span><span className="rounded-full bg-muted px-2 text-sm font-semibold tabular-nums">{Number(v.aantal)}</span>{v.eenheid && <span className="text-xs text-muted-foreground">{v.eenheid}</span>}</span>
          <RijMeta altijd>
            <Badge variant={v.soort === 'mist' ? 'warning' : 'info'}>{v.soort === 'mist' ? `mist${v.sinds ? ` sinds ${kortDatum(v.sinds)}` : ''}` : restSoortLabel(v.soort).toLowerCase()}</Badge>
            <span>{v.reden === 'besteldeadline' && v.deadline ? `besteldeadline ${tijd(v.deadline)}` : mandjeRedenLabel(v.reden)}</span>
          </RijMeta>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="touch" className="px-3" disabled={beslissen.isPending} onClick={() => { setWacht(v); setDatum(''); }}>Nog verwachten</Button>
          <Button variant="outline" size="touch" className="px-3" disabled={beslissen.isPending} onClick={() => doe({ regelId: v.regel_id, keuze: 'opnieuw_bestellen' }, () => {})}>Opnieuw bestellen</Button>
          <RijMenu naam={v.naam} acties={[{ label: 'Geannuleerd door leverancier', gevaar: true, onClick: () => setAnnuleer(v) }]} />
        </div>
      </div>)}</div>
    </LijstKaart>

    <DetailLade open={!!wacht} onOpenChange={(o) => !o && setWacht(null)} titel={wacht?.naam}>
      <div className="space-y-4">
        <Input type="date" className="h-11 text-base" value={datum} onChange={(e) => setDatum(e.target.value)} aria-label="Verwacht op" />
        <Button className="h-12 w-full" disabled={beslissen.isPending} onClick={() => wacht && doe({ regelId: wacht.regel_id, keuze: 'nog_verwachten', controleOp: datum || null }, () => setWacht(null))}>Nog verwachten</Button>
      </div>
    </DetailLade>

    <AnnuleerLade modus={modus} regel={annuleer} onSluit={() => setAnnuleer(null)} />
  </>;
}

/** Geannuleerd door leverancier: bron + notitie (min. 3 tekens). Databasefout als toast. */
export function AnnuleerLade({ modus, regel, onSluit }: { modus: OntvangstModus; regel: { regel_id: string; naam: string } | null; onSluit: () => void }) {
  const { beslissen } = useOntvangstMutaties(modus);
  const [bron, setBron] = useState('');
  const [notitie, setNotitie] = useState('');
  useEffect(() => { setBron(''); setNotitie(''); }, [regel?.regel_id]);
  const kort = notitie.trim().length < 3;
  return <DetailLade open={!!regel} onOpenChange={(o) => !o && onSluit()} titel={regel?.naam}>
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Bron">{BRONNEN.map((b) => <Button key={b.id} type="button" role="radio" aria-checked={bron === b.id} variant={bron === b.id ? 'default' : 'outline'} className="h-11 px-2" onClick={() => setBron(b.id)}>{b.naam}</Button>)}</div>
      {!bron && <p className="text-xs text-muted-foreground">Kies een bron</p>}
      <div className="space-y-1">
        <Textarea className="text-base" placeholder="Notitie (verplicht)" value={notitie} onChange={(e) => setNotitie(e.target.value)} />
        {kort && <p className="text-xs text-muted-foreground">minstens 3 tekens</p>}
      </div>
      <Button variant="destructive" className="h-12 w-full" disabled={!annuleerGeldig(bron, notitie) || beslissen.isPending} onClick={() => regel && beslissen.mutate({ regelId: regel.regel_id, keuze: 'geannuleerd', bron, notitie: notitie.trim() }, { onSuccess: () => { toast.success('Opgeslagen'); onSluit(); }, onError: (e) => toast.error(e?.message || 'Niet opgeslagen') })}>Geannuleerd door leverancier</Button>
    </div>
  </DetailLade>;
}
