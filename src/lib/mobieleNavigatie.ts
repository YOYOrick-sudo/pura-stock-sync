const BALK_ROUTES = ['/dashboard', '/taken-bediening', '/kitchen/mep', '/kitchen/bestelbord'];

/** Verdeel uitsluitend de al zichtbare items; dit voegt geen toegangsregels toe. */
export function verdeelMobieleNavigatie<T extends { url: string }>(items: readonly T[], isMtOnly: boolean) {
  const balk = isMtOnly
    ? items.slice(0, 4)
    : BALK_ROUTES.flatMap(url => items.filter(item => item.url === url));
  const urls = new Set(balk.map(item => item.url));
  return { balk, meer: items.filter(item => !urls.has(item.url)) };
}

export function mobielNavLabel(item: { url: string; title: string }) {
  const labels: Record<string, string> = {
    '/dashboard': 'Start',
    '/taken-bediening': 'Taken',
    '/kitchen/mep': 'MEP',
    '/kitchen/bestelbord': 'Bestellen',
  };
  return labels[item.url] ?? item.title;
}