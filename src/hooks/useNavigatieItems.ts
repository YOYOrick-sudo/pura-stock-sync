import { Home, ListChecks, Settings, BookOpen, Printer, Calculator, ClipboardList, BarChart3, ChefHat, Cookie, MessageSquarePlus } from 'lucide-react';
import { useUserLocation } from '@/contexts/UserLocationContext';
import { useRole } from '@/hooks/useRole';
import { useIsMtLid } from '@/hooks/useIsMtLid';
import { useHeeftRol } from '@/hooks/useHeeftRol';
import { MT_ROUTES } from '@/lib/mt';
import { useFase2VlagAan } from '@/hooks/useOntvangstV2';

export const allNavigationItems = [
  { title: 'Dashboard', url: '/dashboard', icon: Home, group: 'overzicht' as const, locations: ['West', 'Midsland'], managerOnly: false, ownerOnly: false },
  { title: 'Taken Bediening', url: '/taken-bediening', icon: ListChecks, group: 'overzicht' as const, locations: ['West', 'Midsland'], managerOnly: false, ownerOnly: false },
  // MEP is alleen actief voor West (Daily); niet relevant voor Midsland.
  { title: 'Mise-en-place', url: '/kitchen/mep', icon: ChefHat, group: 'keuken' as const, locations: ['West', 'Midsland'], managerOnly: false, ownerOnly: false },
  { title: 'Bestelbord', url: '/kitchen/bestelbord', icon: ClipboardList, group: 'keuken' as const, locations: ['West', 'Midsland'], managerOnly: false, ownerOnly: false },
  { title: 'Stickers', url: '/kitchen/snel-printen', icon: Printer, group: 'keuken' as const, locations: ['West', 'Midsland'], managerOnly: false, ownerOnly: false },
  { title: 'Recepten', url: '/kitchen/recipes', icon: BookOpen, group: 'keuken' as const, locations: ['West', 'Midsland'], managerOnly: false, ownerOnly: false },
  { title: 'Gerechten', url: '/kitchen/gerechten', icon: Cookie, group: 'keuken' as const, locations: ['West', 'Midsland'], managerOnly: false, ownerOnly: false },
  // Bestellen is voorlopig verborgen voor beide vestigingen (module nog niet in gebruik).
  { title: 'Bestellen', url: '/voorraad', icon: ClipboardList, group: 'voorraad' as const, locations: [] as string[], managerOnly: false, ownerOnly: false },

  { title: 'Voorraadketen', url: '/settings/keten', icon: Settings, group: 'beheer' as const, locations: ['West', 'Midsland'], managerOnly: true, ownerOnly: false },
  { title: 'Koelwerkbank indelen', url: '/settings/koelwerkbank', icon: Settings, group: 'beheer' as const, locations: ['West'], managerOnly: true, ownerOnly: false },
  { title: 'Cijfers', url: '/cijfers', icon: BarChart3, group: 'beheer' as const, locations: ['West', 'Midsland'], managerOnly: false, ownerOnly: true },
  { title: 'Kassatelling', url: '/kassatelling', icon: Calculator, group: 'beheer' as const, locations: ['West', 'Midsland'], managerOnly: false, ownerOnly: false },
  { title: 'Onderhoud', url: '/onderhoud', icon: ClipboardList, group: 'beheer' as const, locations: ['West', 'Midsland'], managerOnly: false, ownerOnly: false },
  { title: 'Settings', url: '/settings', icon: Settings, group: 'beheer' as const, locations: ['West', 'Midsland'], managerOnly: false, ownerOnly: true },
  { title: 'MT-punten', url: '/mt-punt', icon: MessageSquarePlus, group: 'beheer' as const, locations: ['West', 'Midsland'], managerOnly: false, ownerOnly: false, mtOnly: true },
];

export function midslandKeukenUrls(midslandBord: boolean): string[] {
  return ['/kitchen/mep', '/kitchen/gerechten', ...(midslandBord ? ['/kitchen/bestelbord'] : [])];
}

/** Zichtbare menu-items: één bron voor zijbalk/menu en mobiele onderbalk. */
export function useNavigatieItems() {
  const { userLocation } = useUserLocation();
  const midslandBord = useFase2VlagAan(userLocation === 'Midsland' ? 'Midsland' : null, 'ontvangst_v2');
  const { isManager, isOwner } = useRole();
  const { isMtLid } = useIsMtLid();
  const { heeftRol } = useHeeftRol();
  const isMtOnly = heeftRol === false && isMtLid;

  return isMtOnly
    ? allNavigationItems.filter(item => MT_ROUTES.includes(item.url))
    : (userLocation
    ? allNavigationItems.filter(item => item.locations.includes(userLocation))
    : allNavigationItems
  )
    .filter(item => !item.managerOnly || isManager)
    .filter(item => !item.ownerOnly || isOwner)
    .filter(item => !('mtOnly' in item && item.mtOnly) || isMtLid)
    .filter(item => !(
      userLocation === 'Midsland' &&
      item.group === 'keuken' &&
      !midslandKeukenUrls(midslandBord).includes(item.url)
    ));
}

export const isNavActief = (pathname: string, url: string) =>
  pathname === url || (url !== '/' && pathname.startsWith(url + '/'));
