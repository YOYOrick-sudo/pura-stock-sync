import { describe, expect, it } from 'vitest';
import { deelTellenIn, telStatus } from './tellenOrde';

const r = (id: string, o: Partial<Parameters<typeof telStatus>[0]> = {}) => ({
  id, telrol: 'bediening', telvraag_vandaag: false, tellen_nodig: false, dagen_sinds_telling: 3, stand: 12, ...o,
});

describe('deelTellenIn', () => {
  it('zet telvraag van vandaag bovenaan en toont elk artikel maar één keer', () => {
    const { vandaag, overige } = deelTellenIn([r('a', { telvraag_vandaag: true }), r('b'), r('a', { telvraag_vandaag: true })], 'bediening');
    expect(vandaag.map((x) => x.id)).toEqual(['a']);
    expect(overige.map((x) => x.id)).toEqual(['b']);
  });
  it('laat artikelen van de andere rol weg', () => {
    expect(deelTellenIn([r('k', { telrol: 'keuken' })], 'bediening').overige).toHaveLength(0);
  });
});

describe('telStatus', () => {
  it('tellen gaat voor alles', () => expect(telStatus(r('a', { tellen_nodig: true, dagen_sinds_telling: 0 })).soort).toBe('tellen'));
  it('vandaag geteld', () => expect(telStatus(r('a', { dagen_sinds_telling: 0 })).soort).toBe('geteld'));
  it('onbekend zonder stand', () => expect(telStatus(r('a', { stand: null })).soort).toBe('onbekend'));
  it('anders de stand', () => expect(telStatus(r('a'))).toEqual({ soort: 'stand', stand: 12 }));
});
