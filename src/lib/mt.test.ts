import { describe, it, expect } from 'vitest';
import { mtStatusLabel, sorteerOpDeadline, isVerlopen, MT_ROUTES } from './mt';

describe('mt', () => {
  it('vertaalt statussen naar gewone woorden', () => {
    expect(mtStatusLabel('op_agenda')).toBe('Op de agenda');
    expect(mtStatusLabel('in_notion')).toBe('In Notion');
    expect(mtStatusLabel('raar')).toBe('raar');
  });
  it('sorteert deadline oplopend, zonder deadline onderaan', () => {
    const r = sorteerOpDeadline([{ deadline: null }, { deadline: '2026-11-05' }, { deadline: '2026-11-01' }]);
    expect(r.map((x) => x.deadline)).toEqual(['2026-11-01', '2026-11-05', null]);
  });
  it('deadline vóór vandaag is verlopen, vandaag niet', () => {
    expect(isVerlopen('2026-10-28', '2026-10-29')).toBe(true);
    expect(isVerlopen('2026-10-29', '2026-10-29')).toBe(false);
    expect(isVerlopen(null, '2026-10-29')).toBe(false);
  });
  it('MT-only accounts mogen alleen de twee MT-pagina\'s', () => {
    expect(MT_ROUTES).toEqual(['/mt-punt', '/mt-actiepunten']);
  });
});
