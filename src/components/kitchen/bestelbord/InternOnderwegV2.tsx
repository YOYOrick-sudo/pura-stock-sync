import { useState } from 'react';
import { Warehouse } from 'lucide-react';
import { toast } from 'sonner';
import { Bevestig, KaartKop, LijstKaart } from '@/components/pura/patronen';
import { StatusBadge } from '@/components/pura/StatusBadge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { AantalStapper } from '@/components/kitchen/AantalStapper';
import { foutTekst } from '@/hooks/useInterneLevering';
import { useInterneV2Aanvragen, useInterneV2Annuleren, useInterneV2Ontvangen } from '@/hooks/useInterneLeveringV2';
import {
  aantalRegel, leverdagTekst, nogTeAnnuleren, nogTeOntvangen, openRestant, statusWeergave, vandaagAmsterdam, type Aanvraag,
} from '@/lib/interneLeveringV2';

export function InternOnderwegV2Kaart({
  aanvragen, vandaag, bezig, onOntvangen, onAnnuleren,
}: {
  aanvragen: Aanvraag[];
  vandaag: string;
  bezig?: boolean;
  onOntvangen: (a: Aanvraag, aantal: number | null, opmerking: string | null) => Promise<unknown>;
  onAnnuleren: (a: Aanvraag, aantal: number) => Promise<unknown>;
}) {
  const open = aanvragen.filter((a) => openRestant(a) > 0);
  const [ander, setAnder] = useState<{ id: string; aantal: number; opmerking: string } | null>(null);
  const [annuleren, setAnnuleren] = useState<Aanvraag | null>(null);

  const ontvangen = async (a: Aanvraag, aantal: number | null, opmerking: string | null) => {
    try {
      await onOntvangen(a, aantal, opmerking);
      setAnder(null);
      toast.success(`${a.naam} ontvangen`);
    } catch (e) {
      toast.error(foutTekst(e));
    }
  };

  if (open.length === 0) return null;

  return (
    <LijstKaart kop={<KaartKop icoon={Warehouse} titel="Van Midsland" teller={open.length} />}>
      <div className="divide-y divide-border">
        {open.map((a) => {
          const status = statusWeergave(a, vandaag);
          const onderweg = nogTeOntvangen(a);
          const openAnder = ander?.id === a.id;
          return (
            <div key={a.id} className="space-y-2 px-4 py-3 lg:px-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-foreground">{a.naam}</p>
                    <StatusBadge tone={status.toon}>{status.label}</StatusBadge>
                    {status.verstreken && <StatusBadge tone="warning">Levermoment verstreken</StatusBadge>}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {[aantalRegel(a), a.verwachte_leverdag ? `leverdag ${leverdagTekst(a.verwachte_leverdag)}` : ''].filter(Boolean).join(' · ')}
                  </p>
                  {status.ontvangstVerschil != null && (
                    <p className="text-sm text-foreground">Ontvangstverschil {status.ontvangstVerschil > 0 ? '+' : ''}{status.ontvangstVerschil}. Het restant blijft open.</p>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {onderweg > 0 && !openAnder && (
                    <Button type="button" size="touch" className="min-w-[8rem]" aria-label={`Ontvangen ${a.naam}`} disabled={bezig} onClick={() => ontvangen(a, null, null)}>
                      Ontvangen
                    </Button>
                  )}
                  {onderweg > 0 && (
                    <Button type="button" size="touch" variant="outline" aria-label={`Ander aantal ontvangen ${a.naam}`} onClick={() => setAnder({ id: a.id, aantal: onderweg, opmerking: '' })}>
                      Ander aantal
                    </Button>
                  )}
                  {nogTeAnnuleren(a) > 0 && (
                    <Button type="button" size="touch" variant="ghost" aria-label={`Annuleren ${a.naam}`} onClick={() => setAnnuleren(a)}>
                      Annuleren
                    </Button>
                  )}
                </div>
              </div>
              {openAnder && ander && (
                <div className="space-y-2">
                  <AantalStapper waarde={ander.aantal} min={0} max={onderweg} eenheid={a.eenheid} label={`Ontvangen aantal ${a.naam}`} onChange={(n) => setAnder((h) => h && h.id === a.id ? { ...h, aantal: n } : h)} />
                  <Textarea value={ander.opmerking} onChange={(e) => setAnder((h) => h && h.id === a.id ? { ...h, opmerking: e.target.value } : h)} placeholder="Opmerking (optioneel)" className="text-base" />
                  <Button type="button" size="touch" aria-label={`Ontvangen ${a.naam} ander aantal`} disabled={bezig} onClick={() => ontvangen(a, ander.aantal, ander.opmerking.trim() || null)}>
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
        onOpenChange={(openDialog) => !openDialog && setAnnuleren(null)}
        titel={annuleren ? `${annuleren.naam} annuleren?` : 'Annuleren'}
        tekst="Alleen wat nog niet ontvangen is, gaat dicht. Wat al binnen is, blijft staan."
        actie="Ja, annuleren"
        onBevestig={() => {
          const regel = annuleren;
          setAnnuleren(null);
          if (!regel) return;
          onAnnuleren(regel, nogTeAnnuleren(regel)).then(() => toast.success(`${regel.naam} geannuleerd`)).catch((e) => toast.error(foutTekst(e)));
        }}
      />
    </LijstKaart>
  );
}

export function InternOnderwegV2({ vestiging }: { vestiging: string }) {
  const aanvragen = useInterneV2Aanvragen(vestiging, 'bord');
  const ontvangen = useInterneV2Ontvangen();
  const annuleren = useInterneV2Annuleren();
  if (aanvragen.data == null) return null;
  return (
    <InternOnderwegV2Kaart
      aanvragen={aanvragen.data}
      vandaag={vandaagAmsterdam()}
      bezig={ontvangen.isPending || annuleren.isPending}
      onOntvangen={(a, aantal, opmerking) => ontvangen.mutateAsync({ vestiging, id: a.id, aantal, opmerking })}
      onAnnuleren={(a, aantal) => annuleren.mutateAsync({ vestiging, id: a.id, aantal })}
    />
  );
}
