import { vervolgactieVoorRegel, type KoelcelCheckItem } from '@/hooks/useKoelcelCheck';

/** Alleen de gekoppelde blauwe-bessenregel vraagt expliciet of de koelcel leeg is. */
export function vraagtKoelcelBevestiging(item: KoelcelCheckItem, items: KoelcelCheckItem[]): boolean {
  if (item.product_sleutel !== 'blauwe-bessen') return false;
  const vervolg = vervolgactieVoorRegel(item, items);
  return vervolg.soort === 'niveau' && vervolg.onderItem.plek === 'koelcel';
}