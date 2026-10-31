import type { StickerType } from './labelZpl';

/** De suggestieregistratie kent alleen snel-printtypen, geen bain-marie. */
export async function registreerStickerGebruik(
  type: StickerType,
  registreer: (type: Exclude<StickerType, 'bain'>) => PromiseLike<{ error: unknown }>,
): Promise<void> {
  if (type === 'bain') return;
  const { error } = await registreer(type);
  if (error) throw error;
}