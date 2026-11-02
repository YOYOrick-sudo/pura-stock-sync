import { useState, type ReactNode } from 'react';
import { Warehouse } from 'lucide-react';
import { toast } from 'sonner';
import { useFase2VlagAan } from '@/hooks/useOntvangstV2';
import { InklapGroep, KaartKop, LijstKaart } from '@/components/pura/patronen';
import { RijMenu } from '@/components/pura/lijst';
import { StatusBadge } from '@/components/pura/StatusBadge';
import { Button } from '@/components/ui/button';
import { AantalStapper } from '@/components/kitchen/AantalStapper';
import { getal } from '@/lib/hoeveelheid';
import {
  alsGetal, foutTekst, inhoudTotaal, maxGeleverdAantal, mepDagKort, mepKaartTitel,
  useInterneGeleverd, useInterneMep,
  type InterneMepRegel,
} from '@/hooks/useInterneLevering';

function regelTekst(r: InterneMepRegel) {
  const aantal = alsGetal(r.aantal) ?? 0;
  const inhoud = inhoudTotaal(aantal, r.inhoud_per_eenheid, r.inhoud_eenheid);
  return [`${getal(aantal)} ${r.eenheid}`, inhoud, mepDagKort(r.mep_datum)].filter(Boolean).join(' · ');
}

function MepRij({ r, actie }: { r: InterneMepRegel; actie?: ReactNode }) {
  return (
    <div className="space-y-2 px-4 py-3 lg:px-6">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="break-words font-medium text-foreground">{r.naam}</span>
            {r.te_laat && <StatusBadge tone="warning">te laat</StatusBadge>}
          </div>
          <p className="text-sm text-muted-foreground">{regelTekst(r)}</p>
          {r.notitie && <p className="text-xs text-muted-foreground">{r.notitie}</p>}
        </div>
        {actie}
      </div>
    </div>
  );
}

/** Open bestellingen voor de makende vestiging. Bestaande MEP-taken blijven de Klaar-flow. */
export function MepVoorWest({ vestiging }: { vestiging: string }) {
  const aan = useFase2VlagAan(vestiging || null, 'interne_levering');
  const q = useInterneMep(aan ? vestiging : null);
  const geleverdMut = useInterneGeleverd();
  const [ander, setAnder] = useState<{ id: string; aantal: number } | null>(null);
  const regels = q.data ?? [];
  const open = regels.filter((r) => r.status === 'besteld');
  const meegegeven = regels.filter((r) => r.status === 'geleverd' || r.status === 'ontvangen');

  const geleverd = async (r: InterneMepRegel, aantal: number | null) => {
    try {
      await geleverdMut.mutateAsync({ id: r.bestelling_id, aantal });
      setAnder((huidig) => huidig?.id === r.bestelling_id ? null : huidig);
      toast.success(`${r.naam} meegegeven`);
    } catch (e) {
      toast.error(foutTekst(e));
    }
  };

  if (!aan || q.data == null || regels.length === 0) return null;

  return (
    <LijstKaart kop={<KaartKop icoon={Warehouse} titel={mepKaartTitel(regels)} teller={open.length} />}>
      {open.length > 0 && (
        <div className="divide-y divide-border">
          {open.map((r) => {
            const openAnder = ander?.id === r.bestelling_id;
            return (
              <div key={r.bestelling_id}>
                <MepRij
                  r={r}
                  actie={<>
                    {!openAnder && (
                      <Button type="button" size="touch" className="shrink-0" aria-label={`Geleverd ${r.naam}`} disabled={geleverdMut.isPending} onClick={() => geleverd(r, null)}>
                        Geleverd
                      </Button>
                    )}
                    <RijMenu naam={r.naam} acties={[{ label: 'Ander aantal geleverd', onClick: () => setAnder({ id: r.bestelling_id, aantal: Math.max(1, alsGetal(r.aantal) ?? 1) }) }]} />
                  </>}
                />
                {openAnder && (
                  <div className="flex flex-wrap items-center gap-2 px-4 pb-3 lg:px-6">
                    <AantalStapper waarde={ander.aantal} min={1} max={maxGeleverdAantal(r.aantal)} eenheid={r.eenheid} label={`Geleverd aantal ${r.naam}`} onChange={(n) => setAnder({ id: r.bestelling_id, aantal: n })} />
                    <Button type="button" size="touch" aria-label={`Geleverd ${r.naam} ander aantal`} disabled={geleverdMut.isPending} onClick={() => geleverd(r, ander.aantal)}>
                      Geleverd
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      {meegegeven.length > 0 && (
        <InklapGroep titel="Meegegeven" aantal={meegegeven.length}>
          <div className="divide-y divide-border border-t border-border">
            {meegegeven.map((r) => <MepRij key={r.bestelling_id} r={r} />)}
          </div>
        </InklapGroep>
      )}
    </LijstKaart>
  );
}
