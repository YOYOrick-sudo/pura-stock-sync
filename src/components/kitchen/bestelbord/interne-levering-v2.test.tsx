// @ts-ignore vitest types are not installed in the app tsconfig
import { describe, expect, test, vi } from 'vitest';
import { createElement, type ReactNode } from 'react';
import { renderToString } from 'react-dom/server';
import { InternGroepV2, InternGroepV2Kaart } from './InternGroepV2';
import { InternOnderwegV2Kaart } from './InternOnderwegV2';
import { MepVoorWestV2Kaart } from '@/components/kitchen/MepVoorWestV2';
import { InterneProductenBeheerKaart } from '@/components/keten/InterneProductenBeheer';
import type { InternV2Product } from '@/hooks/useInterneLeveringV2';
import { plaatsProduct, plaatsVrijeNaam, planOpMep, type Aanvraag } from '@/lib/interneLeveringV2';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { rpc: vi.fn(), from: vi.fn() },
}));
vi.mock('@/hooks/useOntvangstV2', () => ({
  useFase2VlagAan: () => false,
}));
vi.mock('@/hooks/useInterneLeveringV2', () => ({
  useInterneV2Producten: () => ({ data: [{ product_id: 'p', naam: 'Wortelspread' }], isLoading: false }),
  useInterneV2Aanvragen: () => ({ data: [], isLoading: false }),
  useInterneV2Plaatsen: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

const noop = async () => {};
const wortel: InternV2Product = {
  product_id: 'p-wortel', artikel_id: null, naam: 'Wortelspread', eenheid: 'bak',
  inhoud_per_eenheid: 3.2, inhoud_eenheid: 'kg', max_per_bestelling: 9, volgorde: 1, open_aantal: 0,
};

function html(node: ReactNode) {
  return renderToString(node);
}

describe('interne levering v2 schermen', () => {
  test('zonder vlag komt de nieuwe groep niet in beeld', () => {
    expect(html(createElement(InternGroepV2, { vestiging: 'West' }))).toBe('');
    expect(html(createElement(InternGroepV2, { vestiging: 'Test' }))).toBe('');
  });

  test('één groep Midsland (intern), met vrije naam en zonder prijzen', () => {
    const vrij = plaatsVrijeNaam({ id: 'v', naam: 'granola crunch', eenheid: 'kg', aantal: 1 });
    const tekst = html(createElement(InternGroepV2Kaart, {
      producten: [wortel],
      aanvragen: [vrij],
      losse: [{ id: 'los', naam: 'Citroen', aantal: 2, eenheid: 'stuks' }],
      vandaag: '2026-11-05',
      onBestellen: noop,
      onVrij: noop,
      onDoorzetten: noop,
    }));
    expect(tekst.match(/Midsland \(intern\)/g)?.length).toBe(1);
    expect(tekst).toContain('Artikel controleren');
    expect(tekst).toContain('Vrije naam');
    expect(tekst).toContain('Doorzetten');
    expect(tekst).not.toMatch(/€|prijs|verreken/i);
  });

  test('Voor West toont open aanvragen van een andere dag, met de twee keuzes', () => {
    const besteld = plaatsProduct({
      id: '1', productId: 'p-wortel', naam: 'Wortelspread', eenheid: 'bak', aantal: 2, maxPerBestelling: 9,
    });
    const andereDag = planOpMep(
      plaatsProduct({ id: '2', productId: 'p-granola', naam: 'Granola huisgemaakt', eenheid: 'kg', aantal: 1, maxPerBestelling: null, besteldOp: '2026-11-05T09:00:00Z' }),
      { aantal: 1, mepDatum: '2026-11-10', verwachteLeverdag: '2026-11-10', taakId: 't' },
    );
    const tekst = html(createElement(MepVoorWestV2Kaart, {
      regels: [besteld, andereDag],
      producten: [{ id: 'p-wortel', naam: 'Wortelspread' }],
      gekozenDag: '2026-11-05',
      vandaag: '2026-11-05',
      onInplannen: noop,
      onKlaarzetten: noop,
      onMeegeven: noop,
      onKoppelen: noop,
      onAnnuleren: noop,
    }));
    expect(tekst).toContain('Voor West');
    expect(tekst).toContain('Wortelspread');
    expect(tekst).toContain('Granola huisgemaakt');
    expect(tekst).toContain('Inplannen op MEP');
    expect(tekst).toContain('Uit voorraad klaarzetten');
    expect(tekst).toContain('Nieuw');
    expect(tekst).toContain('Bevestigd');
    expect(tekst).not.toContain('Op Test is er geen MEP');
  });

  test('op Test verdwijnt inplannen en blijft de melding bij uit voorraad', () => {
    const besteld = plaatsProduct({
      id: '1', productId: 'p-wortel', naam: 'Wortelspread', eenheid: 'bak', aantal: 2, maxPerBestelling: 9,
    });
    const tekst = html(createElement(MepVoorWestV2Kaart, {
      regels: [besteld],
      producten: [{ id: 'p-wortel', naam: 'Wortelspread' }],
      gekozenDag: '2026-11-05',
      vandaag: '2026-11-05',
      vestiging: 'Test',
      onInplannen: noop,
      onKlaarzetten: noop,
      onMeegeven: noop,
      onKoppelen: noop,
      onAnnuleren: noop,
    }));
    expect(tekst).toContain('Op Test is er geen MEP. Gebruik Uit voorraad klaarzetten.');
    expect(tekst).toContain('Uit voorraad klaarzetten');
    expect(tekst).not.toContain('Inplannen op MEP');
  });

  test('ontvangst toont het verschil en laat het restant open', () => {
    const deels: Aanvraag = {
      ...plaatsProduct({ id: '1', productId: 'p', naam: 'Wortelspread', eenheid: 'bak', aantal: 5, maxPerBestelling: null }),
      bevestigd: true,
      verwachte_leverdag: '2026-11-04',
      klaar_aantal: 5,
      meegegeven_aantal: 5,
      ontvangen_aantal: 4,
    };
    const tekst = html(createElement(InternOnderwegV2Kaart, {
      aanvragen: [deels],
      vandaag: '2026-11-05',
      onOntvangen: noop,
      onAnnuleren: noop,
    }));
    expect(tekst).toContain('Van Midsland');
    expect(tekst).toContain('Ontvangstverschil');
    expect(tekst).toContain('Levermoment verstreken');
    expect(tekst).toContain('Ontvangen');
    expect(tekst).toContain('Annuleren');
    expect(tekst).not.toMatch(/€|prijs/);
  });

  test('onderweg blijft annuleerbaar op de MEP en bij ontvangst', () => {
    const onderweg: Aanvraag = {
      ...plaatsProduct({ id: '1', productId: 'p', naam: 'Wortelspread', eenheid: 'bak', aantal: 5, maxPerBestelling: null }),
      bevestigd: true,
      klaar_aantal: 5,
      meegegeven_aantal: 5,
    };
    const mep = html(createElement(MepVoorWestV2Kaart, {
      regels: [onderweg],
      producten: [{ id: 'p', naam: 'Wortelspread' }],
      gekozenDag: '2026-11-05',
      vandaag: '2026-11-05',
      vestiging: 'Midsland',
      onInplannen: noop,
      onKlaarzetten: noop,
      onMeegeven: noop,
      onKoppelen: noop,
      onAnnuleren: noop,
    }));
    const west = html(createElement(InternOnderwegV2Kaart, {
      aanvragen: [onderweg],
      vandaag: '2026-11-05',
      onOntvangen: noop,
      onAnnuleren: noop,
    }));
    expect(mep).toContain('Onderweg');
    expect(mep).toContain('Annuleren');
    expect(west).toContain('Onderweg');
    expect(west).toContain('Annuleren');
  });

  test('beheer koppelt een bestaand artikel en laat de huidige route met rust', () => {
    const tekst = html(createElement(InterneProductenBeheerKaart, {
      producten: [
        { product_id: '1', artikel_id: 'a', naam: 'Wortelspread', eenheid: 'bak', inhoud_per_eenheid: 3.2, inhoud_eenheid: 'kg', max_per_bestelling: 9, v2_beschikbaar: false, huidige_route: true },
      ],
      artikelen: [{ id: 'g', naam: 'Granola huisgemaakt' }],
      zoek: 'gra',
      gekozen: { id: 'g', naam: 'Granola huisgemaakt' },
      eenheid: 'kg',
      inhoud: '1',
      inhoudEenheid: 'kg',
      max: '',
      onZoek: () => {},
      onKies: () => {},
      onEenheid: () => {},
      onInhoud: () => {},
      onInhoudEenheid: () => {},
      onMax: () => {},
      onOpslaan: () => {},
    }));
    expect(tekst).toContain('geen nieuw artikel');
    expect(tekst).toContain('al beschikbaar');
    expect(tekst).toContain('Beschikbaar maken');
  });
});
