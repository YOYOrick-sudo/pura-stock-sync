import { useState } from 'react';
import { Warehouse } from 'lucide-react';
import { toast } from 'sonner';
import { useFase2VlagAan } from '@/hooks/useOntvangstV2';
import { Bevestig, InklapGroep, KaartKop, LijstKaart } from '@/components/pura/patronen';
import { StatusBadge } from '@/components/pura/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AantalStapper } from '@/components/kitchen/AantalStapper';
import { foutTekst } from '@/hooks/useInterneLevering';
import {
  useInterneV2Aanvragen, useInterneV2Annuleren, useInterneV2Inplannen, useInterneV2Klaarzetten, useInterneV2Koppelen,
  useInterneV2Meegegeven, useInterneV2Producten,
} from '@/hooks/useInterneLeveringV2';
import {
  aantalRegel, annuleerMelding, annuleerTekst, INTERNE_LEVERING_V2, leverdagTekst, magAnnuleren, mepRegels, meldingInplannenOpTest, meldingUitInplanFout,
  MEP_TITEL, nogMeeTeGeven, nogTeAnnuleren, nogTeVerdelen, statusWeergave, uitvoeringGeblokkeerd, v2MepZichtbaar,
  vandaagAmsterdam, type Aanvraag,
} from '@/lib/interneLeveringV2';

type Modus = 'mep' | 'voorraad' | 'koppel' | null;

export function MepVoorWestV2Kaart({
  regels, producten, gekozenDag, vandaag, vestiging, bezig,
  onInplannen, onKlaarzetten, onMeegeven, onKoppelen, onAnnuleren,
}: {
  regels: Aanvraag[];
  producten: { id: string; naam: string }[];
  gekozenDag: string | null;
  vandaag: string;
  vestiging?: string | null;
  bezig?: boolean;
  onInplannen: (a: Aanvraag, aantal: number, mepDatum: string, leverdag: string) => Promise<unknown>;
  onKlaarzetten: (a: Aanvraag, aantal: number, leverdag: string, meegeven: boolean) => Promise<unknown>;
  onMeegeven: (a: Aanvraag, aantal: number) => Promise<unknown>;
  onKoppelen: (a: Aanvraag, productId: string) => Promise<unknown>;
  onAnnuleren: (a: Aanvraag, aantal: number) => Promise<unknown>;
}) {
  const open = mepRegels(regels, gekozenDag);
  const afgerond = regels.filter((r) => !open.some((o) => o.id === r.id));
  const nieuw = open.filter((r) => statusWeergave(r, vandaag).nieuw).length;
  const [openId, setOpenId] = useState<string | null>(null);
  const [modus, setModus] = useState<Modus>(null);
  const [aantal, setAantal] = useState(1);
  const [mepDatum, setMepDatum] = useState(gekozenDag && gekozenDag >= vandaag ? gekozenDag : vandaag);
  const [leverdag, setLeverdag] = useState(vandaag);
  const [productId, setProductId] = useState(producten[0]?.id ?? '');
  const [inplanFout, setInplanFout] = useState<string | null>(null);
  const [annuleren, setAnnuleren] = useState<Aanvraag | null>(null);
  const zonderMep = meldingInplannenOpTest(vestiging);
  const kanInplannen = open.some((a) => !uitvoeringGeblokkeerd(a) && nogTeVerdelen(a) > 0);
  const melding = (zonderMep && kanInplannen) ? zonderMep : inplanFout;

  const start = (a: Aanvraag, volgende: Modus) => {
    setOpenId(a.id);
    setModus(volgende);
    setAantal(Math.max(1, volgende === 'mep' || volgende === 'voorraad' ? nogTeVerdelen(a) : nogMeeTeGeven(a)));
    setProductId(producten[0]?.id ?? '');
  };

  const klaar = async (a: Aanvraag, meegeven: boolean) => {
    try {
      await onKlaarzetten(a, aantal, leverdag, meegeven);
      setOpenId(null);
      toast.success(meegeven ? `${a.naam} staat klaar en is meegegeven` : `${a.naam} staat klaar`);
    } catch (e) {
      toast.error(foutTekst(e));
    }
  };

  return (
    <LijstKaart kop={<KaartKop icoon={Warehouse} titel={MEP_TITEL} teller={open.length} />}>
      <p className="px-4 pb-1 pt-3 text-sm text-muted-foreground lg:px-6">
        Alle open aanvragen, los van de dag die je hierboven koos.
        {nieuw > 0 ? ` ${nieuw} nieuw.` : ''}
      </p>
      {melding && <p role="alert" className="px-4 pb-2 text-sm text-foreground lg:px-6">{melding}</p>}
      {open.length === 0 && <p className="px-4 py-4 text-sm text-muted-foreground lg:px-6">Geen open aanvragen.</p>}
      <div className="divide-y divide-border">
        {open.map((a) => {
          const status = statusWeergave(a, vandaag);
          const geblokkeerd = uitvoeringGeblokkeerd(a);
          const formulier = openId === a.id;
          return (
            <div key={a.id} className="space-y-2 px-4 py-3 lg:px-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className="min-w-0 break-words font-medium text-foreground">{a.naam}</span>
                <StatusBadge tone={status.toon}>{status.label}</StatusBadge>
                {status.nieuw && <StatusBadge tone="brand">Nieuw</StatusBadge>}
                {status.verstreken && <StatusBadge tone="warning">Levermoment verstreken</StatusBadge>}
              </div>
              <p className="text-sm text-muted-foreground">
                {[
                  aantalRegel(a),
                  a.vrije_naam && a.product_id ? `aangevraagd als ${a.vrije_naam}` : '',
                  a.gewenste_leverdag ? `gewenst ${leverdagTekst(a.gewenste_leverdag)}` : '',
                  a.verwachte_leverdag ? `verwacht ${leverdagTekst(a.verwachte_leverdag)}` : '',
                ].filter(Boolean).join(' · ')}
              </p>
              <div className="flex flex-wrap gap-2">
                {geblokkeerd ? (
                  <Button type="button" size="touch" aria-label={`Koppelen ${a.naam}`} onClick={() => start(a, 'koppel')}>Artikel koppelen</Button>
                ) : (
                  <>
                    {nogTeVerdelen(a) > 0 && !zonderMep && (
                      <Button type="button" size="touch" aria-label={`Inplannen ${a.naam}`} onClick={() => start(a, 'mep')}>Inplannen op MEP</Button>
                    )}
                    {nogTeVerdelen(a) > 0 && (
                      <Button type="button" size="touch" variant="outline" aria-label={`Klaarzetten ${a.naam}`} onClick={() => start(a, 'voorraad')}>Uit voorraad klaarzetten</Button>
                    )}
                    {nogMeeTeGeven(a) > 0 && (
                      <Button type="button" size="touch" variant="outline" aria-label={`Meegegeven ${a.naam}`} disabled={bezig} onClick={() => {
                        onMeegeven(a, nogMeeTeGeven(a)).then(() => toast.success(`${a.naam} meegegeven`)).catch((e) => toast.error(foutTekst(e)));
                      }}>
                        Meegegeven
                      </Button>
                    )}
                  </>
                )}
                {magAnnuleren(a) && (
                  <Button type="button" size="touch" variant="ghost" aria-label={`Annuleren ${a.naam}`} onClick={() => setAnnuleren(a)}>
                    Annuleren
                  </Button>
                )}
              </div>
              {formulier && modus === 'koppel' && (
                <div className="flex flex-wrap items-center gap-2">
                  {producten.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Maak het artikel eerst intern beschikbaar.</p>
                  ) : (
                    <>
                      <select value={productId} onChange={(e) => setProductId(e.target.value)} aria-label={`Artikel voor ${a.naam}`} className="h-11 min-w-[12rem] flex-1 rounded-polar-lg border border-input bg-background px-2 text-base">
                        {producten.map((p) => <option key={p.id} value={p.id}>{p.naam}</option>)}
                      </select>
                      <Button type="button" size="touch" aria-label={`Bevestig koppeling ${a.naam}`} disabled={bezig || !productId} onClick={async () => {
                        try {
                          await onKoppelen(a, productId);
                          setOpenId(null);
                          toast.success(`${a.naam} is gekoppeld`);
                        } catch (e) {
                          toast.error(foutTekst(e));
                        }
                      }}>Koppelen</Button>
                    </>
                  )}
                </div>
              )}
              {formulier && (modus === 'mep' || modus === 'voorraad') && (
                <div className="flex flex-wrap items-center gap-2">
                  <AantalStapper waarde={aantal} min={1} max={Math.max(1, nogTeVerdelen(a))} eenheid={a.eenheid} label={`Aantal ${modus} ${a.naam}`} onChange={setAantal} />
                  {modus === 'mep' && (
                    <Input type="date" value={mepDatum} min={vandaag} onChange={(e) => { setMepDatum(e.target.value); if (!leverdag || leverdag < e.target.value) setLeverdag(e.target.value); }} aria-label={`MEP-dag ${a.naam}`} className="h-11 w-[11rem] text-base" />
                  )}
                  <Input type="date" value={leverdag} min={vandaag} onChange={(e) => setLeverdag(e.target.value)} aria-label={`Verwachte leverdag ${a.naam}`} className="h-11 w-[11rem] text-base" />
                  {modus === 'mep' ? (
                    <Button type="button" size="touch" aria-label={`Bevestig inplannen ${a.naam}`} disabled={bezig} onClick={async () => {
                      try {
                        await onInplannen(a, aantal, mepDatum, leverdag);
                        setOpenId(null);
                        setInplanFout(null);
                        toast.success(`${a.naam} staat op de MEP`);
                      } catch (e) {
                        const netjes = meldingUitInplanFout(e);
                        if (netjes) setInplanFout(netjes);
                        else toast.error(foutTekst(e));
                      }
                    }}>Inplannen</Button>
                  ) : (
                    <>
                      <Button type="button" size="touch" aria-label={`Bevestig klaarzetten ${a.naam}`} disabled={bezig} onClick={() => klaar(a, false)}>Klaarzetten</Button>
                      <Button type="button" size="touch" variant="outline" aria-label={`Klaarzetten en meegeven ${a.naam}`} disabled={bezig} onClick={() => klaar(a, true)}>Klaarzetten en meegeven</Button>
                    </>
                  )}
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
        tekst={annuleren ? annuleerTekst(annuleren) : ''}
        actie="Ja, annuleren"
        onBevestig={() => {
          const regel = annuleren;
          setAnnuleren(null);
          if (!regel) return;
          onAnnuleren(regel, nogTeAnnuleren(regel)).then((uit) => {
            toast.success(annuleerMelding(regel.naam, uit));
          }).catch((e) => toast.error(foutTekst(e)));
        }}
      />
      {afgerond.length > 0 && (
        <InklapGroep titel="Afgerond" aantal={afgerond.length}>
          <div className="divide-y divide-border border-t border-border">
            {afgerond.map((a) => (
              <div key={a.id} className="px-4 py-3 lg:px-6">
                <p className="font-medium text-foreground">{a.naam}</p>
                <p className="text-sm text-muted-foreground">{aantalRegel(a)}</p>
              </div>
            ))}
          </div>
        </InklapGroep>
      )}
    </LijstKaart>
  );
}

/** Open aanvragen voor de makende vestiging. De gekozen MEP-dag filtert deze lijst niet. */
export function MepVoorWestV2({ vestiging, gekozenDag }: { vestiging: string; gekozenDag: string | null }) {
  const vlag = useFase2VlagAan(vestiging || null, INTERNE_LEVERING_V2);
  const zichtbaar = v2MepZichtbaar(vestiging, vlag);
  const aanvragen = useInterneV2Aanvragen(zichtbaar ? vestiging : null, 'mep');
  const producten = useInterneV2Producten(zichtbaar ? vestiging : null);
  const inplannen = useInterneV2Inplannen();
  const klaarzetten = useInterneV2Klaarzetten();
  const mee = useInterneV2Meegegeven();
  const koppelen = useInterneV2Koppelen();
  const annuleren = useInterneV2Annuleren();
  if (!zichtbaar || aanvragen.data == null) return null;
  return (
    <MepVoorWestV2Kaart
      regels={aanvragen.data}
      producten={(producten.data ?? []).map((p) => ({ id: p.product_id, naam: p.naam }))}
      gekozenDag={gekozenDag}
      vandaag={vandaagAmsterdam()}
      vestiging={vestiging}
      bezig={inplannen.isPending || klaarzetten.isPending || mee.isPending || koppelen.isPending || annuleren.isPending}
      onInplannen={(a, aantal, mepDatum, leverdag) => inplannen.mutateAsync({ vestiging, id: a.id, aantal, mepDatum, leverdag })}
      onKlaarzetten={(a, aantal, leverdag, meegeven) => klaarzetten.mutateAsync({ vestiging, id: a.id, aantal, leverdag, meegeven })}
      onMeegeven={(a, aantal) => mee.mutateAsync({ vestiging, id: a.id, aantal })}
      onKoppelen={(a, productId) => koppelen.mutateAsync({ vestiging, aanvraagId: a.id, productId })}
      onAnnuleren={(a, aantal) => annuleren.mutateAsync({ vestiging, id: a.id, aantal })}
    />
  );
}
