import { describe, expect, it } from 'vitest';
import { actiesVoor } from './eilandbezorger';

describe('actiesVoor', () => {
  it('testbestelling kan nooit vrijgegeven of verzonden worden', () => {
    expect(actiesVoor('test_ok', 'test')).toEqual(['annuleren']);
    expect(actiesVoor('geblokkeerd', 'test')).not.toContain('vrijgeven');
  });
  it('onzekere live-bestelling: teruglezen eerst, geen gewone annulering', () => {
    expect(actiesVoor('uitkomst_onbekend', 'live')).toEqual(['teruglezen', 'in_kassa', 'herverzenden']);
  });
  it('verzonden bestelling heeft geen acties', () => {
    expect(actiesVoor('verzonden', 'live')).toEqual([]);
  });
});
