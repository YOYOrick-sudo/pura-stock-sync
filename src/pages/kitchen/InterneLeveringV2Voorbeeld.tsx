import { useState } from 'react';
import { InternGroepV2Kaart } from '@/components/kitchen/bestelbord/InternGroepV2';
import { InternOnderwegV2Kaart } from '@/components/kitchen/bestelbord/InternOnderwegV2';
import { MepVoorWestV2Kaart } from '@/components/kitchen/MepVoorWestV2';
import { InterneProductenBeheerKaart } from '@/components/keten/InterneProductenBeheer';
import type { InternV2Product } from '@/hooks/useInterneLeveringV2';
import {
  annuleerRest, geefMee, klaarUitVoorraad, koppelArtikel, ontvang, plaatsProduct, plaatsVrijeNaam,
  planOpMep, vandaagAmsterdam, type Aanvraag,
} from '@/lib/interneLeveringV2';

const VANDAAG = vandaagAmsterdam();
const producten: InternV2Product[] = [
  { product_id: 'p-wortel', artikel_id: 'a-wortel', naam: 'Wortelspread', eenheid: 'bak', inhoud_per_eenheid: 3200, inhoud_eenheid: 'g', max_per_bestelling: 9, volgorde: 1, open_aantal: 1 },
  { product_id: 'p-granola', artikel_id: 'a-granola', naam: 'Granola huisgemaakt', eenheid: 'kg', inhoud_per_eenheid: 1, inhoud_eenheid: 'kg', max_per_bestelling: null, volgorde: 2, open_aantal: 0 },
];

const besteld = plaatsProduct({ id: 'b1', productId: 'p-wortel', naam: 'Wortelspread', eenheid: 'bak', aantal: 2, maxPerBestelling: 9, besteldOp: '2026-11-05T08:00:00Z' });
const vrij = plaatsVrijeNaam({ id: 'b2', naam: 'granola crunch', eenheid: 'kg', aantal: 3, besteldOp: '2026-11-05T08:05:00Z' });
const bevestigd = planOpMep(
  plaatsProduct({ id: 'b3', productId: 'p-granola', naam: 'Granola huisgemaakt', eenheid: 'kg', aantal: 4, maxPerBestelling: null, besteldOp: '2026-11-05T07:00:00Z' }),
  { aantal: 4, mepDatum: '2026-11-06', verwachteLeverdag: '2026-11-06', taakId: 'taak-granola' },
);
const onderweg = ontvang(
  {
    ...klaarUitVoorraad(
      plaatsProduct({ id: 'b4', productId: 'p-wortel', naam: 'Wortelspread', eenheid: 'bak', aantal: 5, maxPerBestelling: 9, besteldOp: '2026-11-04T09:00:00Z' }),
      { aantal: 5, verwachteLeverdag: '2026-11-04', meegeven: true },
    ),
  },
  4,
);
const start: Aanvraag[] = [besteld, vrij, bevestigd, onderweg];

/** Voorbeeldschermen met de schakelaar aan. Geen database, alleen de nieuwe route. */
export default function InterneLeveringV2Voorbeeld() {
  const [aanvragen, setAanvragen] = useState<Aanvraag[]>(start);
  const [taakDoel, setTaakDoel] = useState(0);
  const zet = (volgende: Aanvraag) => setAanvragen((h) => h.map((a) => a.id === volgende.id ? volgende : a));

  return (
    <div className="mx-auto min-h-screen max-w-3xl space-y-8 bg-background p-4 text-foreground">
      <header className="space-y-1">
        <p className="text-sm text-muted-foreground">Schakelaar interne_levering_v2 aan · vestiging Test</p>
        <h1 className="text-xl font-semibold">Interne levering, Midsland naar West</h1>
      </header>
      <section className="space-y-2" aria-label="Bestelbord West">
        <h2 className="text-sm font-semibold text-muted-foreground">Bestelbord West</h2>
        <InternGroepV2Kaart
          producten={producten}
          aanvragen={aanvragen}
          losse={[{ id: 'los-1', naam: 'Citroen', aantal: 4, eenheid: 'stuks' }]}
          vandaag={VANDAAG}
          onBestellen={async (p, aantal) => {
            const nieuw = plaatsProduct({
              id: crypto.randomUUID(), productId: p.product_id, naam: p.naam, eenheid: p.eenheid,
              aantal, maxPerBestelling: p.max_per_bestelling, besteldOp: new Date().toISOString(),
            });
            setAanvragen((h) => [nieuw, ...h]);
          }}
          onVrij={async (naam, aantal, eenheid) => {
            const nieuw = plaatsVrijeNaam({ id: crypto.randomUUID(), naam, eenheid, aantal, besteldOp: new Date().toISOString() });
            setAanvragen((h) => [nieuw, ...h]);
          }}
          onDoorzetten={async (regel) => {
            const nieuw = plaatsVrijeNaam({ id: regel.id, naam: regel.naam, eenheid: regel.eenheid, aantal: regel.aantal, besteldOp: new Date().toISOString() });
            setAanvragen((h) => [nieuw, ...h]);
          }}
        />
      </section>
      <section className="space-y-2" aria-label="MEP Midsland">
        <h2 className="text-sm font-semibold text-muted-foreground">MEP Midsland · gekozen dag {VANDAAG} · doel op de taak {taakDoel}</h2>
        <MepVoorWestV2Kaart
          regels={aanvragen}
          producten={producten.map((p) => ({ id: p.product_id, naam: p.naam }))}
          gekozenDag="2026-11-01"
          vandaag={VANDAAG}
          vestiging="Test"
          onKoppelen={async (a, productId) => {
            const product = producten.find((p) => p.product_id === productId);
            if (!product) return;
            zet(koppelArtikel(a, { id: product.product_id, naam: product.naam }));
          }}
          onInplannen={async (a, aantal, mepDatum, leverdag) => {
            zet(planOpMep(a, { aantal, mepDatum, verwachteLeverdag: leverdag, taakId: 'taak-voorbeeld' }));
            setTaakDoel((n) => n + aantal);
          }}
          onKlaarzetten={async (a, aantal, leverdag, meegeven) => {
            zet(klaarUitVoorraad(a, { aantal, verwachteLeverdag: leverdag, meegeven }));
          }}
          onMeegeven={async (a, aantal) => zet(geefMee(a, aantal))}
        />
      </section>
      <section className="space-y-2" aria-label="Ontvangst West">
        <h2 className="text-sm font-semibold text-muted-foreground">Ontvangst West</h2>
        <InternOnderwegV2Kaart
          aanvragen={aanvragen}
          vandaag={VANDAAG}
          onOntvangen={async (a, aantal) => zet(ontvang(a, aantal ?? a.meegegeven_aantal - a.ontvangen_aantal))}
          onAnnuleren={async (a, aantal) => zet(annuleerRest(a, aantal))}
        />
      </section>
      <section className="space-y-2" aria-label="Beheer">
        <h2 className="text-sm font-semibold text-muted-foreground">Beheer</h2>
        <InterneProductenBeheerKaart
          producten={[
            { product_id: 'p-wortel', artikel_id: 'a-wortel', naam: 'Wortelspread', eenheid: 'bak', inhoud_per_eenheid: 3200, inhoud_eenheid: 'g', max_per_bestelling: 9, v2_beschikbaar: false, huidige_route: true },
            { product_id: 'p-granola', artikel_id: 'a-granola', naam: 'Granola huisgemaakt', eenheid: 'kg', inhoud_per_eenheid: 1, inhoud_eenheid: 'kg', max_per_bestelling: null, v2_beschikbaar: true, huidige_route: false },
          ]}
          artikelen={[{ id: 'a-citroen', naam: 'Citroen bio' }]}
          zoek="citr"
          gekozen={{ id: 'a-citroen', naam: 'Citroen bio' }}
          eenheid="stuks"
          inhoud="1"
          inhoudEenheid="kg"
          max=""
          onZoek={() => {}}
          onKies={() => {}}
          onEenheid={() => {}}
          onInhoud={() => {}}
          onInhoudEenheid={() => {}}
          onMax={() => {}}
          onOpslaan={() => {}}
        />
      </section>
    </div>
  );
}
