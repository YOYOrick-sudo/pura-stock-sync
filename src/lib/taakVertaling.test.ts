import { describe, it, expect, vi } from 'vitest';
vi.mock('@/integrations/supabase/client', () => ({ supabase: {} }));
import { magAutoVertalen } from './taakVertaling';

describe('magAutoVertalen', () => {
  it('vult in als Engels leeg is', () => {
    expect(magAutoVertalen(null, undefined)).toBe(true);
    expect(magAutoVertalen('  ', undefined)).toBe(true);
  });
  it('overschrijft nooit handmatig Engels', () => {
    expect(magAutoVertalen('Wipe tables', undefined)).toBe(false);
    expect(magAutoVertalen('Wipe tables', 'Clean tables')).toBe(false);
  });
  it('werkt eigen automatische vertaling bij', () => {
    expect(magAutoVertalen('Clean tables', 'Clean tables')).toBe(true);
  });
});
