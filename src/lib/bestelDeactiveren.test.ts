import { describe, expect, test } from 'vitest';
import { leesDeactiveren, rpcOntbreekt } from '../../supabase/functions/bot-bestelbord/deactiveren';

const ID = '11111111-1111-4111-8111-111111111111';

describe('deactiveren invoer', () => {
  test('accepteert ids en een lege reden', () => {
    expect(leesDeactiveren([ID], undefined)).toEqual({ ok: true, ids: [ID], reden: null });
    expect(leesDeactiveren([ID, ID], '  niet meer nodig  ')).toEqual({ ok: true, ids: [ID], reden: 'niet meer nodig' });
  });

  test('weigert een lege lijst, een te lange reden en een ongeldig id', () => {
    expect(leesDeactiveren([], null).ok).toBe(false);
    expect(leesDeactiveren([ID], 'x'.repeat(501)).ok).toBe(false);
    expect(leesDeactiveren(['geen-uuid'], null).ok).toBe(false);
    expect(leesDeactiveren([{ id: ID }], null).ok).toBe(false);
  });

  test('herkent alleen een ontbrekende functie, geen inhoudelijke fout', () => {
    expect(rpcOntbreekt({ code: 'PGRST202', message: 'schema cache' })).toBe(true);
    expect(rpcOntbreekt({ message: 'function public.bestelbot_deactiveer(text, uuid[], text) does not exist' })).toBe(true);
    expect(rpcOntbreekt({ message: 'Could not find the function public.bestelbot_deactiveer' })).toBe(true);
    expect(rpcOntbreekt({ message: 'niet gevonden voor deze vestiging' })).toBe(false);
    expect(rpcOntbreekt({ message: 'status is besteld' })).toBe(false);
    expect(rpcOntbreekt(null)).toBe(false);
  });
});
