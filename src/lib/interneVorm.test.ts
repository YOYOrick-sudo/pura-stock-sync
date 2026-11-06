// @ts-ignore vitest types are not installed in the app tsconfig
import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import { naarBasis, basisWeergave, STAM_INHOUD_EENHEDEN, STAM_VORM_EENHEDEN } from '@/components/kitchen/bestelbord/verpakking';

const migratie = readFileSync(new URL('../../drizzle/migrations/0071_interne_vorm.sql', import.meta.url), 'utf8');
const terug = readFileSync(new URL('../../docs/research/0071_interne_vorm_rollback.sql', import.meta.url), 'utf8');

function zonderCommentaar(sql: string) {
  return sql.replace(/--[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
}

describe('basis van de artikelstam', () => {
  test('kg en liter worden gram en milliliter, weergave vouwt terug', () => {
    expect(naarBasis(3.2, 'kg')).toEqual({ waarde: 3200, eenheid: 'g' });
    expect(naarBasis(1.5, 'L')).toEqual({ waarde: 1500, eenheid: 'ml' });
    expect(naarBasis(4, 'stuks')).toEqual({ waarde: 4, eenheid: 'stuk' });
    expect(naarBasis(2, 'doos')).toBeNull();
    expect(basisWeergave(3200, 'g')).toBe('3,2 kg');
    expect(basisWeergave(500, 'g')).toBe('500 g');
    expect(basisWeergave(3.2, 'kg')).toBe('3,2 kg');
  });

  test('de migratie koppelt de vorm en schrijft geen data weg', () => {
    const sql = zonderCommentaar(migratie);
    expect(sql).toContain('ADD COLUMN IF NOT EXISTS artikel_vorm_id');
    expect(sql).toContain('7949ba5b-0f19-4047-9376-e8406347d75c');
    expect(sql).toContain('efc069dd-a960-4902-98c9-9471d43fcca5');
    expect(sql).toContain("3200, 'g'");
    expect(sql).toContain("'emmer', 'emmer', false");
    expect(sql).toContain('COALESCE(v.eenheid, p.eenheid)');
    expect(sql).toContain('CASE WHEN v.id IS NULL THEN p.inhoud_per_eenheid ELSE v.inhoud_basis END');
    expect(sql).toContain("v_email NOT LIKE 'yorick@%'");
    expect(sql).toContain('interne_vorm_opslaan');
    expect(sql).toContain('p_inhoud * 1000');
    expect(sql).toContain('v.inhoud_basis');
    expect(sql.replace(/ON DELETE SET NULL/g, '')).not.toMatch(/\bDELETE\b/);
    expect(sql).not.toMatch(/\bDROP\b/);
    expect(sql).not.toMatch(/foh_tasks|horeko_artikelen|bestel_signalen/);
    for (const eenheid of STAM_VORM_EENHEDEN) expect(sql).toContain(`'${eenheid}'`);
    for (const eenheid of ['g', 'kg', 'ml', 'stuk']) expect(sql).toContain(`'${eenheid}'`);
    expect(STAM_INHOUD_EENHEDEN).toEqual(['g', 'kg', 'ml', 'L', 'stuk']);
  });

  test('de rollback zet de vorige functies terug en laat de vormrijen staan', () => {
    expect(terug).toContain('DROP FUNCTION IF EXISTS public.interne_vorm_opslaan');
    expect(terug).toContain('DROP COLUMN IF EXISTS artikel_vorm_id');
    expect(terug).toContain('p.eenheid, p.inhoud_per_eenheid, p.inhoud_eenheid');
    expect(terug).toContain('p.inhoud_per_eenheid, p.inhoud_eenheid, \'binnen\'');
    const sql = zonderCommentaar(terug);
    expect(sql).not.toMatch(/\bDELETE\b/);
    expect(sql).not.toMatch(/ALTER TABLE (?!public\.interne_producten)/);
    const hook = readFileSync(new URL('../hooks/useInterneLeveringV2.ts', import.meta.url), 'utf8');
    expect(hook).toContain("leesJson<{ product_id: string; artikel_vorm_id: string");
    expect(hook).toContain("'interne_vorm_opslaan'");
    const beheer = readFileSync(new URL('../components/keten/InterneProductenBeheer.tsx', import.meta.url), 'utf8');
    expect(beheer).toContain('useIsEigenaar');
    expect(beheer).toContain('<Dialog ');
    expect(beheer).toContain('bewerken={eigenaar}');
  });
});
