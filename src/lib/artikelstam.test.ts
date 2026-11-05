// @ts-ignore node test API is outside the browser app types
import { readFileSync } from 'node:fs';
import { describe, expect, test, vi } from 'vitest';
import { STERKE_KOPPEL_DREMPEL } from './bordZoeken';
import {
  STAM_VESTIGINGEN,
  artikelstamLabel,
  isStamVestiging,
  isStamtreffer,
  naEersteBestelling,
  rpcOntbreekt,
  sterksteStamtreffer,
  type ArtikelZoekRij,
} from './artikelstam';

function rij(deel: Partial<ArtikelZoekRij> & Pick<ArtikelZoekRij, 'naam' | 'score'>): ArtikelZoekRij {
  return {
    artikel_id: null,
    status: null,
    bron: 'artikel',
    standaard_vorm: null,
    standaard_eenheid: null,
    op_vestiging: true,
    ...deel,
  };
}

const regel = {
  id: 's1',
  naam: 'Dragonfruit',
  artikel_id: null as string | null,
  leverancier_id: 'lev-1',
  vestiging: 'West',
};

describe('artikelstam zoeken en concept na eerste bestelling', () => {
  test('Test hoort bij de stamvestigingen, een lege vestiging niet', () => {
    expect(STAM_VESTIGINGEN).toEqual(['West', 'Midsland', 'Test']);
    expect(isStamVestiging('Test')).toBe(true);
    expect(isStamVestiging('West')).toBe(true);
    expect(isStamVestiging('Midsland')).toBe(true);
    expect(isStamVestiging('Noord')).toBe(false);
    expect(isStamVestiging(null)).toBe(false);
  });

  test('een concept in de stam met score 0,9 is een voorstel, historie niet', () => {
    const concept = rij({ artikel_id: 'c1', naam: 'Dragonfruit', score: STERKE_KOPPEL_DREMPEL, status: 'concept', bron: 'artikel' });
    const historie = rij({ naam: 'Dragonfruit', score: 1, bron: 'historie' });
    const zwak = rij({ artikel_id: 'a1', naam: 'Dragon', score: 0.899, status: 'actief' });
    expect(isStamtreffer(concept)).toBe(true);
    expect(isStamtreffer(historie)).toBe(false);
    expect(isStamtreffer(zwak)).toBe(false);
    expect(isStamtreffer({ artikel_id: 'c1', score: '0.900', bron: 'concept' })).toBe(true);
    expect(sterksteStamtreffer([historie, zwak, concept])?.artikel_id).toBe('c1');
    expect(artikelstamLabel('concept')).toBe('Nieuw, nog bevestigen');
    expect(artikelstamLabel('actief')).toBe('');
  });

  test('een treffer van 0,9 of hoger wordt voorgesteld en maakt geen artikel', async () => {
    const maak = vi.fn();
    const koppel = vi.fn();
    const uit = await naEersteBestelling(regel, {
      zoek: async () => [rij({ artikel_id: 'a1', naam: 'Dragonfruit', score: 0.9, status: 'actief' })],
      maak,
      koppel,
    });
    expect(uit).toEqual({ soort: 'voorstel', artikel_id: 'a1', naam: 'Dragonfruit', status: 'actief', score: 0.9 });
    expect(maak).not.toHaveBeenCalled();
    expect(koppel).not.toHaveBeenCalled();
  });

  test('onder 0,9 maakt de RPC een concept en koppelt alleen dat artikel', async () => {
    const maak = vi.fn().mockResolvedValue({ artikel_id: 'nieuw' });
    const koppel = vi.fn().mockResolvedValue(undefined);
    const uit = await naEersteBestelling(regel, {
      zoek: async () => [rij({ naam: 'Dragonfruit', score: 0.85, bron: 'historie' })],
      maak,
      koppel,
    });
    expect(maak).toHaveBeenCalledWith('West', 'Dragonfruit', 'lev-1');
    expect(koppel).toHaveBeenCalledWith('s1', 'nieuw');
    expect(uit).toEqual({ soort: 'aangemaakt', artikel_id: 'nieuw' });
  });

  test('een regel die al een artikel heeft slaat de stam over', async () => {
    const zoek = vi.fn();
    expect(await naEersteBestelling({ ...regel, artikel_id: 'al' }, { zoek, maak: vi.fn(), koppel: vi.fn() })).toEqual({ soort: 'overgeslagen' });
    expect(zoek).not.toHaveBeenCalled();
  });

  test('Test mag een concept krijgen', async () => {
    const maak = vi.fn().mockResolvedValue({ artikel_id: 't1' });
    const uit = await naEersteBestelling(
      { ...regel, vestiging: 'Test', leverancier_id: null },
      { zoek: async () => [], maak, koppel: async () => undefined },
    );
    expect(maak).toHaveBeenCalledWith('Test', 'Dragonfruit', null);
    expect(uit.soort).toBe('aangemaakt');
  });

  test('ontbrekende zoekfunctie laat de oude database met rust', async () => {
    const maak = vi.fn();
    const uit = await naEersteBestelling(regel, {
      zoek: async () => {
        throw { code: 'PGRST202', message: 'Could not find the function public.artikel_zoek_v2 in the schema cache' };
      },
      maak,
      koppel: vi.fn(),
    });
    expect(uit).toEqual({ soort: 'database_oud' });
    expect(maak).not.toHaveBeenCalled();
    expect(rpcOntbreekt({ code: '42883', message: 'function public.artikel_zoek_v2(text, text, integer) does not exist' })).toBe(true);
    expect(rpcOntbreekt({ code: '23505', message: 'duplicate key' })).toBe(false);
  });

  test('de migratie voegt alleen toe en laat print, RLS en bestel_signalen met rust', () => {
    const sql = readFileSync('drizzle/migrations/0067_artikelstam_fase1.sql', 'utf8');
    const zonderCommentaar = sql.replace(/--.*$/gm, '');
    expect(sql).toContain('artikel_zoek_v2');
    expect(sql).toContain('rpc_bord_maak_concept_artikel_v2');
    expect(sql).toContain("'West', 'Midsland', 'Test'");
    expect(zonderCommentaar).not.toMatch(/ADD COLUMN[^;]*\bNOT NULL\b/i);
    expect(zonderCommentaar).not.toMatch(/SET NOT NULL/i);
    expect(zonderCommentaar).not.toMatch(/CREATE\s+(OR REPLACE\s+)?TRIGGER/i);
    expect(zonderCommentaar).not.toMatch(/CREATE POLICY|ALTER POLICY|DROP POLICY|ENABLE ROW LEVEL SECURITY/i);
    expect(zonderCommentaar).not.toMatch(/claim_next_print_job|foh_tasks|horeko_artikelen/);
    expect(zonderCommentaar).not.toMatch(/(ALTER TABLE|UPDATE|INSERT INTO) public\.bestel_signalen/i);
    expect(zonderCommentaar).not.toMatch(/\bprijs\b/i);
    expect(readFileSync('docs/research/0067_artikelstam_fase1_rollback.sql', 'utf8')).toContain('DROP FUNCTION IF EXISTS public.artikel_zoek_v2');
  });

  test('een andere fout bij het aanmaken koppelt de regel niet', async () => {
    const koppel = vi.fn();
    const uit = await naEersteBestelling(regel, {
      zoek: async () => [],
      maak: async () => {
        throw new Error('vestiging geweigerd');
      },
      koppel,
    });
    expect(uit).toEqual({ soort: 'fout', bericht: 'vestiging geweigerd' });
    expect(koppel).not.toHaveBeenCalled();
  });
});
