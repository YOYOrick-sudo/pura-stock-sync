/* eslint-disable react-hooks/rules-of-hooks -- gemockte useMutation, aangeroepen zonder renderer */
import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { CreateStickerJobInput } from './useStickerProducten';
import { useCreatePrintJob } from './usePrintJobs';
import { useCreateStickerPrintJob } from './useStickerProducten';

type MutatieOpties = {
  retry?: boolean | number;
  mutationFn: (input: CreateStickerJobInput) => Promise<{ count: number }>;
};

const mocks = vi.hoisted(() => ({
  location: 'West',
  insert: vi.fn(async (_rijen: unknown) => ({ error: null as unknown })),
  rpc: vi.fn(async (_naam: string, _args: unknown) => ({ error: null as unknown })),
  invalidateQueries: vi.fn(),
  opties: [] as MutatieOpties[],
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (table: string) => {
      if (table !== 'print_jobs') throw new Error(`Onverwachte tabel: ${table}`);
      return { insert: mocks.insert };
    },
    rpc: mocks.rpc,
  },
}));
vi.mock('@/contexts/UserLocationContext', () => ({
  useUserLocation: () => ({ userLocation: mocks.location }),
}));
vi.mock('@/lib/appWake', () => ({ metHerstel: (operation: () => unknown) => operation() }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() } }));
vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
  useQueryClient: () => ({ invalidateQueries: mocks.invalidateQueries }),
  useMutation: (opties: MutatieOpties) => {
    mocks.opties.push(opties);
    return { mutateAsync: opties.mutationFn, mutate: opties.mutationFn };
  },
}));

const datum1 = 'do 05-11';
const datum2 = 'ma 09-11';

function stickerMutatie() {
  useCreateStickerPrintJob();
  const opties = mocks.opties.at(-1);
  if (!opties) throw new Error('Geen sticker-mutatie');
  return opties;
}

function stickerInput(extra: Partial<CreateStickerJobInput> = {}): CreateStickerJobInput {
  return { type: 'bereid', naam: 'Kip', datum1, datum2, tht_dagen: 3, ...extra };
}

beforeEach(() => {
  mocks.opties.length = 0;
  mocks.location = 'West';
  mocks.insert.mockReset();
  mocks.insert.mockResolvedValue({ error: null });
  mocks.rpc.mockReset();
  mocks.rpc.mockResolvedValue({ error: null });
  mocks.invalidateQueries.mockReset();
});

describe('printopdrachten worden niet automatisch herhaald', () => {
  test('useCreateStickerPrintJob geeft retry: false door', () => {
    expect(stickerMutatie().retry).toBe(false);
  });

  test('useCreatePrintJob geeft retry: false door', () => {
    useCreatePrintJob();
    expect(mocks.opties.at(-1)?.retry).toBe(false);
  });
});

describe('één bain-marie-sticker', () => {
  test('bain-marie geeft 1 job', async () => {
    const opties = stickerMutatie();
    await expect(opties.mutationFn({
      type: 'bain',
      naam: 'Kip',
      datum1,
      datum2,
      bron: 'bain_marie',
    })).resolves.toEqual({ count: 1 });

    expect(mocks.insert).toHaveBeenCalledTimes(1);
    const rijen = mocks.insert.mock.calls[0]?.[0] as Array<Record<string, unknown>>;
    expect(rijen).toHaveLength(1);
    expect(rijen[0]?.bron).toBe('bain_marie');
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  test.each(['bereid', 'ontdooid', 'vrij'] as const)(
    '%s geeft één sticker en één registratie',
    async (type) => {
      const opties = stickerMutatie();
      await expect(opties.mutationFn(stickerInput({ type, bron: 'snel_printen' }))).resolves.toEqual({ count: 1 });

      expect(mocks.insert).toHaveBeenCalledTimes(1);
      expect(mocks.insert.mock.calls[0]?.[0]).toHaveLength(1);
      expect(mocks.rpc).toHaveBeenCalledTimes(1);
      expect(mocks.rpc).toHaveBeenCalledWith('sticker_producten_bump', {
        _naam: 'Kip',
        _type: type,
        _tht: type === 'vrij' ? null : 3,
      });
    },
  );

  test('een mislukte telstap geeft geen tweede job', async () => {
    const fout = new Error('x');
    mocks.rpc.mockResolvedValue({ error: fout });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const opties = stickerMutatie();
      const fn = () => opties.mutationFn(stickerInput());
      // De QueryClient in App.tsx herhaalt een mislukte mutatie één keer.
      // Na deze fix faalt de telstap de mutatie niet meer, dus die herhaling blijft uit.
      await expect(fn().catch(() => fn())).resolves.toEqual({ count: 1 });
      expect(mocks.insert).toHaveBeenCalledTimes(1);
      expect(mocks.rpc).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalledWith('Stickerregistratie mislukt', fout);
    } finally {
      warn.mockRestore();
    }
  });

  test('een mislukte insert blijft een fout', async () => {
    const fout = new Error('insert mislukt');
    mocks.insert.mockResolvedValue({ error: fout });
    const opties = stickerMutatie();
    await expect(opties.mutationFn(stickerInput())).rejects.toBe(fout);
    expect(mocks.insert).toHaveBeenCalledTimes(1);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  test('aantal 3 geeft nog steeds 3 stickers', async () => {
    const opties = stickerMutatie();
    await expect(opties.mutationFn(stickerInput({ aantal: 3, bron: 'snel_printen' }))).resolves.toEqual({ count: 3 });
    expect(mocks.insert).toHaveBeenCalledTimes(1);
    const rijen = mocks.insert.mock.calls[0]?.[0] as Array<Record<string, unknown>>;
    expect(rijen).toHaveLength(3);
    expect(rijen.every((rij) => rij.bron === 'snel_printen')).toBe(true);
  });
});
