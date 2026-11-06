import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AppSidebar } from '@/components/AppSidebar';
import { MobielOnderbalk } from '@/components/MobielOnderbalk';
import { useUserLocation } from '@/contexts/UserLocationContext';
import { isNavActief, useNavigatieItems } from '@/hooks/useNavigatieItems';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';
import { SidebarInset, SidebarProvider, SidebarTrigger, useSidebar } from '@/components/ui/sidebar';

const GROEP = {
  overzicht: 'Overzicht',
  keuken: 'Keuken',
  voorraad: 'Voorraad',
  beheer: 'Beheer',
} as const;

function paginatitel(pathname: string) {
  const titels: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/kassatelling': 'Kassatelling',
    '/kassatelling-overdag': 'Kassatelling Overdag',
    '/kassa': 'Kassa',
    '/taken-bediening': 'Taken',
    '/kitchen-menu': 'Keuken Menu',
    '/kitchen-tasks': 'Keuken Taken',
    '/recipes': 'Recepten',
    '/kitchen/recipes': 'Recepten',
    '/kitchen/recipes/nieuw': 'Nieuw recept',
    '/kitchen/ingredienten': 'Ingrediënten',
    '/kitchen/gerechten': 'Gerechten',
    '/kitchen/snel-printen': 'Stickers',
    '/kitchen/mep': 'Mise-en-place',
    '/kitchen/mep/week': 'Mise-en-place · week',
    '/kitchen/mep/oud': 'Mise-en-place',
    '/kitchen/mep/beheer': 'Mise-en-place beheren',
    '/kitchen/bestelbord': 'Bestelbord',
    '/settings/mep': 'Mise-en-place instellingen',
    '/settings/keten': 'Voorraadketen',
    '/settings/koelwerkbank': 'Koelwerkbank indelen',
    '/mep-planning': 'MEP Planning',
    '/voorraad': 'Bestellen',
    '/voorraad/onderweg': 'Onderweg',
    '/voorraad/stand': 'Voorraadstand',
    '/settings': 'Instellingen',
    '/cijfers': 'Cijfers',
    '/taken-analyse': 'Statistieken',
    '/taken/admin': 'Takenlijsten beheren',
    '/taken/beheer': 'Lijst bewerken',
    '/onderhoud': 'Onderhoud',
    '/mt-punt': 'MT-punten',
    '/kas-controle': 'Kas-controle',
    '/hr': 'HR',
    '/hr/applicants/new': 'Nieuwe kandidaat',
    '/hr/housing': 'Huisvesting',
    '/hr/housing/new': 'Nieuwe woning',
    '/personeel': 'Personeel',
    '/personeel/wonen': 'Personeel — Wonen',
    '/personeel/collegas': 'Collega\'s',
    '/personeel/settings': 'Personeel — Instellingen',
    '/style-guide': 'Style Guide',
    '/design-preview': 'Design Preview',
    '/design-system': 'Design System',
  };
  if (/^\/kitchen\/recipes\/[^/]+\/bewerken$/.test(pathname)) return 'Recept bewerken';
  if (/^\/kitchen\/recipes\/[^/]+$/.test(pathname)) return 'Recept';
  if (/^\/hr\/applicants\/[^/]+$/.test(pathname)) return 'Kandidaat';
  if (/^\/personeel\/wonen\/[^/]+$/.test(pathname)) return 'Woning';
  return titels[pathname] || 'Pura Vida';
}

const datumFormatter = new Intl.DateTimeFormat('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' });

function Bovenbalk() {
  const { pathname } = useLocation();
  const { state } = useSidebar();
  const isMobile = useIsMobile();
  const { displayLocation } = useUserLocation();
  const items = useNavigatieItems();
  const titel = paginatitel(pathname);
  const item = [...items].reverse().find((kandidaat) => isNavActief(pathname, kandidaat.url));
  const groep = item ? GROEP[item.group] : null;
  const genest = Boolean(item && pathname !== item.url);

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border bg-background px-4">
      {!isMobile && <SidebarTrigger />}
      {!isMobile && <Separator orientation="vertical" className="h-4" />}
      <Breadcrumb className="min-w-0">
        <BreadcrumbList className="flex-nowrap">
          {groep && (
            <>
              <BreadcrumbItem className="text-muted-foreground">{groep}</BreadcrumbItem>
              <BreadcrumbSeparator />
            </>
          )}
          {genest && item && (
            <>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to={item.url}>{item.title}</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
            </>
          )}
          <BreadcrumbItem className="min-w-0">
            <BreadcrumbPage className="truncate">{titel}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="ml-auto flex shrink-0 items-center gap-3">
        {(isMobile || state === 'collapsed') && <span className="text-sm text-muted-foreground">{displayLocation}</span>}
        <span className="hidden text-sm capitalize text-muted-foreground md:inline">{datumFormatter.format(new Date())}</span>
      </div>
    </header>
  );
}

export function SidebarLayout({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(() => {
    try {
      return localStorage.getItem('sidebar-collapsed') !== '1';
    } catch {
      return true;
    }
  });

  return (
    <SidebarProvider
      open={open}
      onOpenChange={(volgende) => {
        setOpen(volgende);
        try { localStorage.setItem('sidebar-collapsed', volgende ? '0' : '1'); } catch { /* ignore */ }
      }}
    >
      {!isMobile && <AppSidebar />}
      <SidebarInset className="flex min-h-dvh min-w-0 flex-1 flex-col bg-background">
        <Bovenbalk />
        <div className="min-w-0 flex-1 px-4 pb-[calc(1rem+var(--onderbalk)+var(--safe-bottom))] pt-4 lg:px-6 lg:pb-6 lg:pt-6">
          {children}
        </div>
      </SidebarInset>
      {isMobile && <MobielOnderbalk />}
    </SidebarProvider>
  );
}
