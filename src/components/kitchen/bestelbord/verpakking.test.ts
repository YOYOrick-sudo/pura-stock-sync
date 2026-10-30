// @ts-ignore bun test runner
import { describe, it, expect } from 'bun:test';
import { verpakkingWeergave, eenheidLabel } from './verpakking';

describe('verpakkingWeergave', () => {
  it('melk doos 12×1 L: 2 dozen = 24 L', () => {
    const w = verpakkingWeergave({ vorm: 'doos 12×1 L', eenheid: 'doos', inhoud_basis: 12000, inhoud_eenheid: 'ml', prijs: 14.4 }, 2);
    expect(w.eenheid).toBe('dozen');
    expect(w.inhoud).toBe('12 × 1 L');
    expect(w.totaal).toBe('24 L');
    expect(w.perBasis).toBe('€\u00a01,20/L');
  });
  it('koksroom 6×1 L vs 1 L: vergelijkprijs per liter', () => {
    const doos = verpakkingWeergave({ vorm: 'doos 6×1 L', eenheid: 'doos', inhoud_basis: 6000, inhoud_eenheid: 'ml', prijs: 9.6 }, 1);
    const pak = verpakkingWeergave({ vorm: 'pak 1 L', eenheid: 'pak', inhoud_basis: 1000, inhoud_eenheid: 'ml', prijs: 1.75 }, 1);
    expect(doos.totaal).toBe('6 L');
    expect(doos.perBasis).toBe('€\u00a01,60/L');
    expect(pak.perBasis).toBe('€\u00a01,75/L');
  });
  it('zonder inhoud geen totaal', () => {
    expect(verpakkingWeergave({ vorm: 'zak', eenheid: 'zak' }, 1).totaal).toBeNull();
  });
  it('meervoud', () => {
    expect(eenheidLabel('fles', 3)).toBe('flessen');
    expect(eenheidLabel('fles', 1)).toBe('fles');
  });
});
