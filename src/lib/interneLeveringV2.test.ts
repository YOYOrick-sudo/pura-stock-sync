// @ts-ignore vitest types are not installed in the app tsconfig
import { describe, expect, test } from 'vitest';
import {
  GROEP_TITEL, MEP_TITEL, VOORRAAD_ZONDER_INHOUD, ZICHTBARE_VELDEN, annuleerRest, annuleerTekst, doelNaMinder, doelNaPlan, geefMee,
  annuleerMelding, interneOntvangstSleutel, klaarUitVoorraad, koppelArtikel, magAnnuleren, mepDatumBijPlaatsen, mepRegels, meldingInplannenOpTest, meldingUitInplanFout,
  ontvang, openRestant, plaatsProduct, plaatsVrijeNaam, planOpMep, redenGeenVoorraad, statusWeergave, uitvoeringGeblokkeerd,
  v1InternZichtbaar, v2BordZichtbaar, v2MepZichtbaar, verdeelMepKlaar, zonderPrijzen, type Aanvraag,
} from './interneLeveringV2';

const VANDAAG = '2026-11-05';

function aanvraag(deel: Partial<Aanvraag> & Pick<Aanvraag, 'id'>): Aanvraag {
  return {
    naam: 'Wortelspread',
    vrije_naam: null,
    product_id: 'p1',
    eenheid: 'bak',
    besteld_aantal: 4,
    gewenste_leverdag: null,
    verwachte_leverdag: null,
    mep_datum: null,
    mep_taak_id: null,
    mep_aantal: 0,
    mep_klaar_aantal: 0,
    voorraad_aantal: 0,
    klaar_aantal: 0,
    meegegeven_aantal: 0,
    ontvangen_aantal: 0,
    geannuleerd_aantal: 0,
    bevestigd: false,
    notitie: null,
    besteld_op: '2026-11-05T08:00:00Z',
    ...deel,
  };
}

describe('schakelaar', () => {
  test('bord en MEP blijven dicht als de vlag uit staat', () => {
    expect(v2BordZichtbaar('West', false)).toBe(false);
    expect(v2BordZichtbaar('Test', false)).toBe(false);
    expect(v2MepZichtbaar('Midsland', false)).toBe(false);
    expect(v1InternZichtbaar(false, true)).toBe(true);
  });

  test('alleen West en Test bestellen, alleen Midsland en Test zien de MEP', () => {
    expect(v2BordZichtbaar('West', true)).toBe(true);
    expect(v2BordZichtbaar('Test', true)).toBe(true);
    expect(v2BordZichtbaar('Midsland', true)).toBe(false);
    expect(v2MepZichtbaar('Midsland', true)).toBe(true);
    expect(v2MepZichtbaar('Test', true)).toBe(true);
    expect(v2MepZichtbaar('West', true)).toBe(false);
    expect(v1InternZichtbaar(true, true)).toBe(false);
  });
});

describe('stap 1 plaatsen', () => {
  test('een groepnaam en geen MEP-dag bij het plaatsen', () => {
    expect(GROEP_TITEL).toBe('Midsland (intern)');
    const geplaatst = plaatsProduct({
      id: 'a1', productId: 'p1', naam: 'Wortelspread', eenheid: 'bak', aantal: 2, maxPerBestelling: 9,
    });
    expect(geplaatst.mep_datum).toBe(mepDatumBijPlaatsen());
    expect(geplaatst.mep_datum).toBeNull();
    expect(statusWeergave(geplaatst, VANDAAG).label).toBe('Besteld');
    expect(statusWeergave(geplaatst, VANDAAG).nieuw).toBe(true);
  });

  test('vrije naam komt binnen als Artikel controleren en blokkeert uitvoering', () => {
    const vrij = plaatsVrijeNaam({ id: 'a2', naam: '  granola huis  ', eenheid: 'kg', aantal: 1 });
    expect(vrij.product_id).toBeNull();
    expect(vrij.vrije_naam).toBe('granola huis');
    expect(statusWeergave(vrij, VANDAAG).label).toBe('Artikel controleren');
    expect(uitvoeringGeblokkeerd(vrij)).toBe(true);
    expect(() => planOpMep(vrij, { aantal: 1, mepDatum: '2026-11-06', verwachteLeverdag: '2026-11-06', taakId: 't1' })).toThrow(/artikel/i);
    const gekoppeld = koppelArtikel(vrij, { id: 'p9', naam: 'Granola huisgemaakt' });
    expect(gekoppeld.product_id).toBe('p9');
    expect(gekoppeld.vrije_naam).toBe('granola huis');
    expect(statusWeergave(gekoppeld, VANDAAG).label).toBe('Besteld');
    expect(uitvoeringGeblokkeerd(gekoppeld)).toBe(false);
  });

  test('maximum per bestelling blijft gelden', () => {
    expect(() => plaatsProduct({
      id: 'a3', productId: 'p1', naam: 'Wortelspread', eenheid: 'bak', aantal: 10, maxPerBestelling: 9,
    })).toThrow(/9/);
  });
});

describe('stap 2 bevestigen', () => {
  test('Voor West toont elke open aanvraag, los van de gekozen dag', () => {
    expect(MEP_TITEL).toBe('Voor West');
    const regels = [
      aanvraag({ id: '1', mep_datum: '2026-11-06', bevestigd: true, verwachte_leverdag: '2026-11-06', mep_aantal: 2 }),
      aanvraag({ id: '2', mep_datum: null }),
      aanvraag({ id: '3', mep_datum: '2026-11-10', bevestigd: true, mep_aantal: 1, verwachte_leverdag: '2026-11-10' }),
      aanvraag({ id: '4', ontvangen_aantal: 4 }),
    ];
    const zichtbaar = mepRegels(regels, '2026-11-07').map((r) => r.id);
    expect(zichtbaar).toEqual(['1', '2', '3']);
  });

  test('op Test is er geen MEP en de melding wijst naar uit voorraad', () => {
    expect(meldingInplannenOpTest('Test')).toBe('Op Test is er geen MEP. Gebruik Uit voorraad klaarzetten.');
    expect(meldingInplannenOpTest('Midsland')).toBeNull();
    expect(meldingInplannenOpTest('West')).toBeNull();
    expect(meldingUitInplanFout(new Error('Op Test is er geen MEP. Gebruik Uit voorraad klaarzetten.'))).toBe('Op Test is er geen MEP. Gebruik Uit voorraad klaarzetten.');
    expect(meldingUitInplanFout(new Error('ERROR: Op Test is er geen MEP. Gebruik Uit voorraad klaarzetten.\nCONTEXT: interne_v2_inplannen'))).toBe('Op Test is er geen MEP. Gebruik Uit voorraad klaarzetten.');
    expect(meldingUitInplanFout(new Error('Ongeldige vestiging: Test'))).toBeNull();
  });

  test('inplannen bevestigt, bewaart het aantal per aanvraag en verhoogt alleen het doel', () => {
    const a = aanvraag({ id: '1', besteld_aantal: 5 });
    const gepland = planOpMep(a, { aantal: 3, mepDatum: '2026-11-06', verwachteLeverdag: '2026-11-07', taakId: 'taak' });
    expect(gepland.bevestigd).toBe(true);
    expect(gepland.mep_aantal).toBe(3);
    expect(gepland.klaar_aantal).toBe(0);
    expect(gepland.meegegeven_aantal).toBe(0);
    expect(statusWeergave(gepland, VANDAAG)).toMatchObject({ label: 'Bevestigd', nieuw: false });
    expect(doelNaPlan(4, 3)).toBe(7);
    const zelfdeDag = planOpMep(gepland, { aantal: 2, mepDatum: '2026-11-06', verwachteLeverdag: '2026-11-07', taakId: 'taak' });
    expect(zelfdeDag.mep_aantal).toBe(5);
    expect(zelfdeDag.mep_taak_id).toBe('taak');
    expect(() => planOpMep(gepland, { aantal: 1, mepDatum: '2026-11-08', verwachteLeverdag: '2026-11-08', taakId: 'andere' })).toThrow(/andere MEP-dag/);
  });

  test('uit voorraad klaarzetten bevestigt en zet klaar, zonder MEP-taak', () => {
    const a = aanvraag({ id: '1', besteld_aantal: 2 });
    const klaar = klaarUitVoorraad(a, { aantal: 2, verwachteLeverdag: '2026-11-06', meegeven: false });
    expect(klaar.mep_taak_id).toBeNull();
    expect(klaar.klaar_aantal).toBe(2);
    expect(klaar.meegegeven_aantal).toBe(0);
    expect(klaar.bevestigd).toBe(true);
    expect(statusWeergave(klaar, VANDAAG).label).toBe('Klaar');
  });

  test('levermoment verstreken alleen als er een verwachte dag is afgesproken', () => {
    const gewenst = aanvraag({ id: '1', gewenste_leverdag: '2026-11-01' });
    expect(statusWeergave(gewenst, VANDAAG).verstreken).toBe(false);
    const afgesproken = aanvraag({ id: '2', bevestigd: true, verwachte_leverdag: '2026-11-04', mep_aantal: 4 });
    expect(statusWeergave(afgesproken, VANDAAG).verstreken).toBe(true);
    expect(statusWeergave({ ...afgesproken, verwachte_leverdag: '2026-11-06' }, VANDAAG).verstreken).toBe(false);
  });
});

describe('stap 3 aantallen', () => {
  test('MEP-afronding zet klaar met het werkelijke aantal en geeft niets mee', () => {
    const vroeg = aanvraag({
      id: 'vroeg', besteld_op: '2026-11-05T07:00:00Z', mep_taak_id: 'taak', mep_aantal: 3, bevestigd: true, verwachte_leverdag: '2026-11-06',
    });
    const laat = aanvraag({
      id: 'laat', besteld_op: '2026-11-05T09:00:00Z', mep_taak_id: 'taak', mep_aantal: 3, bevestigd: true, verwachte_leverdag: '2026-11-06',
    });
    const andere = aanvraag({ id: 'andere', mep_taak_id: 'andere-taak', mep_aantal: 5 });
    const verdeeld = verdeelMepKlaar([laat, andere, vroeg], 'taak', 4);
    const van = (id: string) => verdeeld.find((r) => r.id === id)!;
    expect(van('vroeg')).toMatchObject({ klaar_aantal: 3, mep_klaar_aantal: 3, meegegeven_aantal: 0 });
    expect(van('laat')).toMatchObject({ klaar_aantal: 1, mep_klaar_aantal: 1, meegegeven_aantal: 0 });
    expect(van('andere')).toMatchObject({ klaar_aantal: 0, mep_klaar_aantal: 0 });
    expect(statusWeergave(van('vroeg'), VANDAAG).label).toBe('Klaar');
    expect(openRestant(van('laat'))).toBe(4);
  });

  test('klaarzetten en meegeven kan één handeling zijn, meegeven apart ook', () => {
    const a = aanvraag({ id: '1', besteld_aantal: 4 });
    const samen = klaarUitVoorraad(a, { aantal: 2, verwachteLeverdag: '2026-11-06', meegeven: true });
    expect(samen.klaar_aantal).toBe(2);
    expect(samen.meegegeven_aantal).toBe(2);
    expect(statusWeergave(samen, VANDAAG).label).toBe('Onderweg');
    const rest = klaarUitVoorraad(samen, { aantal: 2, verwachteLeverdag: '2026-11-06', meegeven: false });
    const mee = geefMee(rest, 1);
    expect(mee.klaar_aantal).toBe(4);
    expect(mee.meegegeven_aantal).toBe(3);
    expect(() => geefMee(mee, 2)).toThrow(/klaar/i);
  });

  test('ontvangst houdt het restant open en toont het verschil', () => {
    const onderweg = aanvraag({
      id: '1', besteld_aantal: 5, bevestigd: true, verwachte_leverdag: '2026-11-06',
      klaar_aantal: 5, meegegeven_aantal: 5,
    });
    const deels = ontvang(onderweg, 4);
    expect(deels.ontvangen_aantal).toBe(4);
    expect(deels.meegegeven_aantal).toBe(5);
    expect(deels.besteld_aantal).toBe(5);
    expect(openRestant(deels)).toBe(1);
    expect(statusWeergave(deels, VANDAAG)).toMatchObject({
      label: 'Onderweg',
      ontvangstVerschil: -1,
      openRestant: 1,
    });
    const binnen = ontvang(deels, 1);
    expect(statusWeergave(binnen, VANDAAG).label).toBe('Ontvangen');
    expect(openRestant(binnen)).toBe(0);
  });

  test('een restant blijft open tot het is geleverd of geannuleerd', () => {
    const deelsWeg = aanvraag({
      id: '1', besteld_aantal: 5, klaar_aantal: 5, voorraad_aantal: 5, meegegeven_aantal: 3, ontvangen_aantal: 3, bevestigd: true,
    });
    expect(statusWeergave(deelsWeg, VANDAAG).label).toBe('Klaar');
    expect(openRestant(deelsWeg)).toBe(2);
    const dicht = annuleerRest(deelsWeg, 2);
    expect(openRestant(dicht)).toBe(0);
    expect(statusWeergave(dicht, VANDAAG).label).toBe('Ontvangen');
    const vers = aanvraag({ id: '2', besteld_aantal: 2, mep_aantal: 2, mep_taak_id: 't', bevestigd: true });
    const weg = annuleerRest(vers, 2);
    expect(weg.mep_aantal).toBe(0);
    expect(weg.klaar_aantal).toBe(0);
    expect(statusWeergave(weg, VANDAAG).label).toBe('Geannuleerd');
    expect(doelNaMinder(2, 2)).toEqual({ doel: 0, annuleren: true });
  });

  test('onderweg mag worden geannuleerd, ontvangen voorraad blijft benoemd', () => {
    const onderweg = aanvraag({
      id: '1', besteld_aantal: 5, klaar_aantal: 5, meegegeven_aantal: 5, bevestigd: true,
    });
    expect(statusWeergave(onderweg, VANDAAG).label).toBe('Onderweg');
    expect(magAnnuleren(onderweg)).toBe(true);
    expect(annuleerTekst(onderweg)).toMatch(/nog geen voorraad geboekt/i);
    expect(annuleerTekst(onderweg)).toMatch(/MEP-taak/);
    const deels = ontvang(onderweg, 2);
    expect(statusWeergave(deels, VANDAAG).label).toBe('Onderweg');
    expect(magAnnuleren(deels)).toBe(true);
    expect(annuleerTekst(deels)).toMatch(/blijft in de voorraad/);
    expect(annuleerRest(deels, 3).ontvangen_aantal).toBe(2);
  });

  test('dezelfde ontvangst heeft één sleutel en zonder inhoud telt die niet', () => {
    expect(interneOntvangstSleutel('aanvraag-1', 4)).toBe('intern-v2:aanvraag-1:tot:4.000');
    expect(interneOntvangstSleutel('aanvraag-1', 4)).toBe(interneOntvangstSleutel('aanvraag-1', 4));
    expect(interneOntvangstSleutel('aanvraag-1', 6)).not.toBe(interneOntvangstSleutel('aanvraag-1', 4));
    expect(redenGeenVoorraad(null, 3200, 'g')).toMatch(/geen artikel/);
    expect(redenGeenVoorraad('artikel', null, 'g')).toBe(VOORRAAD_ZONDER_INHOUD);
    expect(redenGeenVoorraad('artikel', 3200, 'g')).toBe(null);
    expect(annuleerMelding('Hummus', { voorraad_teruggedraaid: 2 })).toMatch(/teruggedraaid/);
    expect(annuleerMelding('Hummus', { voorraad_niet_gesplitst: 1 })).toMatch(/blijft staan/);
    expect(annuleerMelding('Hummus', {})).toBe('Hummus geannuleerd');
  });

  test('geen prijzen of verrekening in de zichtbare velden', () => {
    expect(zonderPrijzen(ZICHTBARE_VELDEN)).toBe(true);
  });
});
