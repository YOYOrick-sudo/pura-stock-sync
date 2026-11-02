import { useRef, useState } from 'react';
import { Warehouse } from 'lucide-react';
import { toast } from 'sonner';
import { Bevestig, KaartKop, LijstKaart } from '@/components/pura/patronen';
import { RijMenu } from '@/components/pura/lijst';
import { StatusBadge } from '@/components/pura/StatusBadge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { AantalStapper } from '@/components/kitchen/AantalStapper';
import { getal } from '@/lib/hoeveelheid';
import {
  alsGetal, foutTekst, mepDagKort, onderwegMenuLabels,
  useInterneAnnuleren, useInterneBestellingen, useInterneOntvangen,
  type InterneBestelling,
} from '@/hooks/useInterneLevering';

function statusVan(status: string): { label: string; toon: 'info' | 'success' } | null {
  if (status === 'besteld') return { label: 'Op de MEP', toon: 'info' };
  if (status === 'geleverd') return { label: 'Meegegeven', toon: 'success' };
  return null;
}

function startAantal(r: InterneBestelling) {
  return alsGetal(r.geleverd_aantal) ?? alsGetal(r.aantal) ?? 0;
}

/** Open interne leveringen voor West: ontvangen of, zolang het nog op de MEP staat, annuleren. */
export function InternOnderweg({ vestiging, aan, startAnderId }: { vestiging: string; aan: boolean; startAnderId?: string }) {
  const q = useInterneBestellingen(aan ? vestiging : null);
  const ontvangenMut = useInterneOntvangen();
  const annulerenMut = useInterneAnnuleren();
  const [ander, setAnder] = useState<{ id: string; aantal: number; opmerking: string } | null>(null);
  const anderRef = useRef(ander);
  const [annuleren, setAnnuleren] = useState<InterneBestelling | null>(null);

  const regels = (q.data ?? [])
    .filter((r) => r.status === 'besteld' || r.status === 'geleverd')
    .sort((a, b) => (a.status === b.status ? 0 : a.status === 'besteld' ? -1 : 1) || (a.mep_datum ?? '').localeCompare(b.mep_datum ?? ''));
  const startRij = startAnderId ? regels.find((r) => r.bestelling_id === startAnderId) : undefined;
  if (startRij && anderRef.current?.id !== startRij.bestelling_id) {
    const volgend = { id: startRij.bestelling_id, aantal: startAantal(startRij), opmerking: '' };
    anderRef.current = volgend;
    setAnder(volgend);
  }

  const ontvangen = async (r: InterneBestelling, aantal: number | null, opmerking: string | null) => {
    try {
      await ontvangenMut.mutateAsync({ id: r.bestelling_id, aantal, opmerking });
      setAnder(null);
      toast.success(`${r.naam} ontvangen`);
    } catch (e) {
      toast.error(foutTekst(e));
    }
  };

  const annuleer = async (r: InterneBestelling) => {
    try {
      await annulerenMut.mutateAsync(r.bestelling_id);
      toast.success(`${r.naam} geannuleerd`);
    } catch (e) {
      toast.error(foutTekst(e));
    }
  };

  if (!aan || q.data == null || regels.length === 0) return null;

  return (
    <LijstKaart kop={<KaartKop icoon={Warehouse} titel="Van Midsland" teller={regels.length} />}>
      <div className="divide-y divide-border">
        {regels.map((r) => {
          const status = statusVan(r.status);
          const dag = mepDagKort(r.mep_datum);
          const menu = onderwegMenuLabels(r);
          const openAnder = ander?.id === r.bestelling_id;
          return (
            <div key={r.bestelling_id} className="space-y-2 px-4 py-3 lg:px-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-foreground">{r.naam}</p>
                    {status && <StatusBadge tone={status.toon}>{status.label}</StatusBadge>}
                  </div>
                  <p className="text-sm text-muted-foreground">{[`${getal(alsGetal(r.aantal) ?? 0)} ${r.eenheid}`, dag].filter(Boolean).join(' · ')}</p>
                </div>
                <div className="flex items-center gap-2 sm:shrink-0">
                  {r.kan_ontvangen && !openAnder && (
                    <Button type="button" size="touch" className="min-w-[8rem] flex-1 sm:flex-none" aria-label={`Ontvangen ${r.naam}`} disabled={ontvangenMut.isPending} onClick={() => ontvangen(r, null, null)}>
                      Ontvangen
                    </Button>
                  )}
                  {menu.length > 0 && (
                    <RijMenu
                      naam={r.naam}
                      acties={menu.map((label) => ({
                        label,
                        gevaar: label === 'Annuleren',
                        onClick: () => {
                        if (label === 'Annuleren') setAnnuleren(r);
                        else {
                          const volgend = { id: r.bestelling_id, aantal: startAantal(r), opmerking: '' };
                          anderRef.current = volgend;
                          setAnder(volgend);
                        }
                        },
                      }))}
                    />
                  )}
                </div>
              </div>
              {openAnder && (
                <div className="space-y-2">
                  <AantalStapper waarde={ander.aantal} min={0} max={null} eenheid={r.eenheid} label={`Ontvangen aantal ${r.naam}`} onChange={(n) => {
                    anderRef.current = anderRef.current?.id === r.bestelling_id ? { ...anderRef.current, aantal: n } : anderRef.current;
                    setAnder((h) => h && h.id === r.bestelling_id ? { ...h, aantal: n } : h);
                  }} />
                  <Textarea value={ander.opmerking} onChange={(e) => {
                    const opmerking = e.target.value;
                    if (anderRef.current?.id === r.bestelling_id) anderRef.current = { ...anderRef.current, opmerking };
                    setAnder((h) => h && h.id === r.bestelling_id ? { ...h, opmerking } : h);
                  }} placeholder="Opmerking (optioneel)" className="text-base" />
                  <Button type="button" size="touch" aria-label={`Ontvangen ${r.naam} ander aantal`} disabled={ontvangenMut.isPending} onClick={() => {
                    const gekozen = anderRef.current?.id === r.bestelling_id ? anderRef.current : ander;
                    ontvangen(r, gekozen?.aantal ?? ander.aantal, (gekozen?.opmerking ?? '').trim() || null);
                  }}>
                    Ontvangen
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <Bevestig
        open={!!annuleren}
        onOpenChange={(open) => !open && setAnnuleren(null)}
        titel={annuleren ? `${annuleren.naam} annuleren?` : 'Annuleren'}
        tekst="De bestelling gaat van de MEP van Midsland af."
        actie="Ja, annuleren"
        onBevestig={() => {
          const regel = annuleren;
          setAnnuleren(null);
          if (regel) void annuleer(regel);
        }}
      />
    </LijstKaart>
  );
}
