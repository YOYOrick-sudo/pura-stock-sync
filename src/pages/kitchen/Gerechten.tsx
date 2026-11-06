import { useMemo, useState } from 'react';
import { SidebarLayout } from '@/components/SidebarLayout';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Search, AlertTriangle, Pencil, Archive, ArchiveRestore, Cookie, Leaf } from 'lucide-react';
import { EmptyState } from '@/components/kitchen/EmptyState';
import { cn } from '@/lib/utils';
import { useRole } from '@/hooks/useRole';
import { useArchiveerGerecht, useGerechten, useGerechtAllergenen, type Gerecht } from '@/hooks/useGerechten';
import { GerechtReceptBevat, GerechtReceptSporen } from '@/components/kitchen/GerechtKaartInfo';
import { DataTable, DataTableBody, DataTableCell, DataTableHead, DataTableHeader, DataTableRow, EmptyCell, StatusDot } from '@/components/ui/data-table';
import { GerechtDialog } from '@/components/kitchen/GerechtDialog';
import { AllergeenFilter } from '@/components/kitchen/AllergeenFilter';
import { useIsMobile } from '@/hooks/use-mobile';
import { RijMenu } from '@/components/pura';
import {
  GERECHT_CATEGORIEEN,
  GERECHT_LABEL_CODES,
  GERECHT_LABEL_NAAM,
  GERECHT_LABEL_SOORT,
  isGerechtLabel,
  voldoetAanGerechtFilter,
  gerechtPrijzen,
  type GerechtLabel,
} from '@/lib/gerecht-labels';

/** Labels die iets zeggen over wat erin zit, in vaste volgorde. */
const INHOUD_LABELS = GERECHT_LABEL_CODES.filter((c) => c !== 'vegan');

function gesorteerdeInhoud(gerecht: Gerecht): GerechtLabel[] {
  const set = new Set((gerecht.labels ?? []).filter(isGerechtLabel));
  return INHOUD_LABELS.filter((c) => set.has(c));
}

function opsomming(delen: string[]): string {
  if (delen.length <= 1) return delen.join('');
  return `${delen.slice(0, -1).join(', ')} en ${delen[delen.length - 1]}`;
}

function InhoudChips({ gerecht }: { gerecht: Gerecht }) {
  const inhoud = gesorteerdeInhoud(gerecht);
  if (inhoud.length === 0) {
    return <EmptyCell />;
  }
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {inhoud.map((code) => {
        const soort = GERECHT_LABEL_SOORT[code];
        return (
          <span
            key={code}
            className={cn(
              'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap',
              soort === 'allergeen' && 'bg-destructive/10 text-destructive',
              soort === 'info' && 'bg-muted text-muted-foreground',
            )}
          >
            {GERECHT_LABEL_NAAM[code]}
          </span>
        );
      })}
    </div>
  );
}

export default function Gerechten() {
  const isMobile = useIsMobile();
  const { isManager } = useRole();
  const [categorie, setCategorie] = useState<string>(GERECHT_CATEGORIEEN[0]);
  const [search, setSearch] = useState('');
  const [toonGearchiveerd, setToonGearchiveerd] = useState(false);
  const [alleenOpKaart, setAlleenOpKaart] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [bewerken, setBewerken] = useState<Gerecht | null>(null);
  const [zonder, setZonder] = useState<GerechtLabel[]>([]);
  const [alleenVegan, setAlleenVegan] = useState(false);

  const { data: gerechten = [], isLoading, isError, refetch } = useGerechten(categorie, toonGearchiveerd);
  const receptQuery = useGerechtAllergenen(categorie);
  const archiveer = useArchiveerGerecht();

  const filterActief = zonder.length > 0 || alleenVegan;

  const gefilterd = useMemo(() => {
    const q = search.trim().toLowerCase();
    return gerechten.filter((g) => {
      if (alleenOpKaart && !g.op_kaart) return false;
      const labels = (g.labels ?? []).filter(isGerechtLabel);
      if (q) {
        const match =
          g.naam.toLowerCase().includes(q) ||
          labels.some((l) => GERECHT_LABEL_NAAM[l].toLowerCase().includes(q));
        if (!match) return false;
      }
      return voldoetAanGerechtFilter({ labels, gecontroleerd: g.gecontroleerd }, zonder, alleenVegan);
    });
  }, [gerechten, search, zonder, alleenVegan, alleenOpKaart]);

  const veilig = useMemo(
    () => (filterActief ? gefilterd.filter((g) => g.gecontroleerd) : gefilterd),
    [gefilterd, filterActief],
  );
  const onzeker = useMemo(
    () => (filterActief ? gefilterd.filter((g) => !g.gecontroleerd) : []),
    [gefilterd, filterActief],
  );

  const filterOmschrijving = useMemo(() => {
    const delen = zonder.map((c) => `zonder ${GERECHT_LABEL_NAAM[c].toLowerCase()}`);
    if (alleenVegan) delen.push('vegan');
    return opsomming(delen);
  }, [zonder, alleenVegan]);

  const groepen: { key: 'standaard' | 'special'; titel: string }[] = [
    { key: 'standaard', titel: 'Standaard assortiment' },
    { key: 'special', titel: 'Specials' },
  ];

  const openNieuw = () => {
    setBewerken(null);
    setDialogOpen(true);
  };

  const toggleZonder = (code: GerechtLabel) =>
    setZonder((prev) => (prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]));

  const wisFilter = () => {
    setZonder([]);
    setAlleenVegan(false);
  };

  const renderRij = (g: Gerecht) => {
    const isVegan = (g.labels ?? []).includes('vegan');
    const heeftLabels = (g.labels ?? []).length > 0;
    const recept = receptQuery.data?.get(g.id);
    return (
      <DataTableRow key={g.id} className={cn(g.is_gearchiveerd && 'opacity-60')}>
        <DataTableCell>
          <div className={isMobile ? 'flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5 break-words [overflow-wrap:anywhere]' : 'flex flex-wrap items-center gap-x-2 gap-y-0.5'}>
            <span className="font-medium text-foreground">{g.naam}</span>
            {isVegan && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
                <Leaf className="h-3 w-3" />Vegan
              </span>
            )}
            {!g.gecontroleerd && <span className="inline-flex items-center gap-1 text-xs text-warning"><span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />Nog te controleren</span>}
          </div>
          {(g.kaart_omschrijving || g.notitie) && (
            <p className="mt-0.5 truncate text-xs text-muted-foreground" title={g.kaart_omschrijving ?? g.notitie ?? ''}>
              {g.kaart_omschrijving || g.notitie}
            </p>
          )}
          {isMobile && <div className="mt-1 min-w-0">
            {heeftLabels ? <InhoudChips gerecht={g} /> : <>
              <GerechtReceptBevat gerecht={g} recept={recept} laden={receptQuery.isLoading} fout={receptQuery.isError} />
              <div className="mt-1"><GerechtReceptSporen gerecht={g} recept={recept} /></div>
            </>}
          </div>}
        </DataTableCell>
        <DataTableCell className={isMobile ? 'hidden' : undefined}>
          {heeftLabels ? <InhoudChips gerecht={g} /> : (
            <GerechtReceptBevat gerecht={g} recept={recept} laden={receptQuery.isLoading} fout={receptQuery.isError} />
          )}
          {!heeftLabels && (
            <div className="mt-1 md:hidden"><GerechtReceptSporen gerecht={g} recept={recept} /></div>
          )}
        </DataTableCell>
        <DataTableCell className="hidden md:table-cell">
          {heeftLabels ? <EmptyCell /> : <GerechtReceptSporen gerecht={g} recept={recept} />}
        </DataTableCell>
        <DataTableCell className="text-right tabular-nums">
          {(() => {
            const prijzen = gerechtPrijzen(g.prijs, g.prijs_varianten);
            return prijzen.bedragen ? (
              <>
                <span className={isMobile ? 'break-words text-sm text-foreground' : 'whitespace-nowrap text-sm text-foreground'}>€ {prijzen.bedragen}</span>
                {prijzen.namen && <p className="text-xs text-muted-foreground">{prijzen.namen}</p>}
              </>
            ) : <EmptyCell />;
          })()}
        </DataTableCell>
        {isManager && (
          <DataTableCell className="text-right">
            {isMobile ? <RijMenu naam={g.naam} acties={[
              { label: `${g.naam} bewerken`, onClick: () => { setBewerken(g); setDialogOpen(true); } },
              { label: g.is_gearchiveerd ? `${g.naam} terugzetten` : `${g.naam} archiveren`, gevaar: !g.is_gearchiveerd, onClick: () => archiveer.mutate({ id: g.id, archiveren: !g.is_gearchiveerd }) },
            ]} /> : <div className="flex justify-end">
              <Button variant="ghost" size="icon" className="h-11 w-11" aria-label={`${g.naam} bewerken`}
                onClick={() => { setBewerken(g); setDialogOpen(true); }}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-11 w-11"
                aria-label={g.is_gearchiveerd ? `${g.naam} terugzetten` : `${g.naam} archiveren`}
                onClick={() => archiveer.mutate({ id: g.id, archiveren: !g.is_gearchiveerd })}>
                {g.is_gearchiveerd ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
              </Button>
            </div>}
          </DataTableCell>
        )}
      </DataTableRow>
    );
  };

  const GerechtTabel = ({ rijen }: { rijen: Gerecht[] }) => (
    <DataTable className={isMobile ? 'rounded-none border-0 [&_td]:px-2 [&_th]:px-2' : 'rounded-none border-0'}>
      <DataTableHeader>
        <DataTableHead className={isMobile ? 'w-auto' : 'w-[45%] md:w-[30%]'}>Gerecht</DataTableHead>
        <DataTableHead className={isMobile ? 'hidden' : 'w-auto md:w-[38%]'}>Bevat</DataTableHead>
        <DataTableHead className="hidden md:table-cell w-auto">Kan bevatten</DataTableHead>
        <DataTableHead className={isMobile ? 'w-20 text-right' : 'w-[110px] text-right'}>Prijs</DataTableHead>
        {isManager && <DataTableHead className={isMobile ? 'w-14' : 'w-[104px]'}><span className="sr-only">Acties</span></DataTableHead>}
      </DataTableHeader>
      <DataTableBody>{rijen.map(renderRij)}</DataTableBody>
    </DataTable>
  );

  return (
    <SidebarLayout>
      <div className={isMobile ? 'min-w-0 max-w-full space-y-4 [&_button]:min-h-11' : 'space-y-6'}>
        <Card className="p-4 bg-card shadow-sm">
          <div className={isMobile ? 'flex min-w-0 flex-col gap-2' : 'flex flex-col sm:flex-row gap-3'}>
            <div className={isMobile ? 'relative min-w-0 w-full' : 'relative flex-1'}>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Zoek gerecht of allergeen…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={isMobile ? 'h-11 pl-10 text-base' : 'h-11 pl-10'}
              />
            </div>
            {isManager && (
              <Button onClick={openNieuw} className="min-h-[44px]">
                <Plus className="h-4 w-4 mr-2" />
                Nieuw gerecht
              </Button>
            )}
          </div>

          <div className={isMobile ? 'mt-4 flex min-w-0 flex-nowrap items-center gap-2 overflow-x-auto [&>button]:shrink-0 [&>button]:whitespace-nowrap' : 'flex flex-wrap items-center gap-2 mt-4'}>
            {GERECHT_CATEGORIEEN.map((c) => (
              <Button
                key={c}
                variant="ghost"
                aria-pressed={categorie === c}
                onClick={() => setCategorie(c)}
                className={cn(
                  'px-4 rounded-full text-sm font-medium transition-colors min-h-[44px]',
                  categorie === c ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground' : 'bg-muted text-foreground hover:bg-muted/80',
                )}
              >
                {c}
              </Button>
            ))}
            {isManager && (
              <Button
                variant="ghost"
                aria-pressed={toonGearchiveerd}
                onClick={() => setToonGearchiveerd((v) => !v)}
                className={cn(
                  'ml-auto px-4 rounded-full text-sm font-medium transition-colors min-h-[44px]',
                  toonGearchiveerd ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted/60',
                )}
              >
                {toonGearchiveerd ? 'Verberg gearchiveerde' : 'Toon gearchiveerde'}
              </Button>
            )}
            <Button
              variant="ghost"
              aria-pressed={alleenOpKaart}
              onClick={() => setAlleenOpKaart((v) => !v)}
              className={cn('min-h-11 rounded-full px-4 text-sm', alleenOpKaart ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground' : 'text-muted-foreground')}
            >Alleen op de kaart</Button>
          </div>

          {isMobile ? <div className="min-w-0 [&>div>div:first-child]:flex-wrap [&>div>div:last-child]:flex-nowrap [&>div>div:last-child]:overflow-x-auto [&>div>div:last-child>button]:shrink-0">
          <AllergeenFilter
            zonder={zonder} onToggle={toggleZonder} alleenVegan={alleenVegan}
            onToggleVegan={() => setAlleenVegan((v) => !v)} onWissen={wisFilter}
            aantal={filterActief && !isLoading ? veilig.length : undefined}
          /></div> : <AllergeenFilter
            zonder={zonder}
            onToggle={toggleZonder}
            alleenVegan={alleenVegan}
            onToggleVegan={() => setAlleenVegan((v) => !v)}
            onWissen={wisFilter}
            aantal={filterActief && !isLoading ? veilig.length : undefined}
          />}
        </Card>

        {receptQuery.isError && <div className="flex flex-wrap items-center gap-3 text-sm text-warning" role="alert">
          Receptallergenen konden niet worden geladen.
          <Button variant="outline" className="min-h-11" onClick={() => receptQuery.refetch()}>Opnieuw proberen</Button>
        </div>}

        {isError ? (
          <div className="flex flex-wrap items-center gap-3 text-sm text-warning" role="alert">
            Gerechten konden niet worden geladen.
            <Button variant="outline" className="min-h-11" onClick={() => refetch()}>Opnieuw proberen</Button>
          </div>
        ) : isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Laden…</div>
        ) : veilig.length === 0 && onzeker.length === 0 ? (
          <EmptyState
            icon={Cookie}
            title="Geen gerechten gevonden"
            description={
              filterActief
                ? 'Geen enkel gerecht voldoet aan deze combinatie. Vraag na in de keuken.'
                : search
                  ? 'Pas je zoekopdracht aan'
                  : 'Voeg je eerste gerecht toe'
            }
            action={isManager && !filterActief ? { label: 'Nieuw gerecht', onClick: openNieuw } : undefined}
          />
        ) : (
          <>
            {veilig.length === 0 && (
              <Card className="p-5 bg-card shadow-sm text-sm text-muted-foreground">
                Geen gerecht dat we kunnen garanderen {filterOmschrijving}. Kijk hieronder wat nog nagevraagd moet worden.
              </Card>
            )}

            {groepen.map((groep) => {
              const rijen = veilig.filter((g) => g.groep === groep.key);
              if (rijen.length === 0) return null;
              return (
                <Card key={groep.key} className="bg-card shadow-sm overflow-hidden">
                  <div className="px-5 py-3 border-b bg-muted/30">
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {groep.titel} · {rijen.length}
                    </h2>
                  </div>
                  <GerechtTabel rijen={rijen} />
                </Card>
              );
            })}

            {onzeker.length > 0 && (
              <Card className="bg-card shadow-sm overflow-hidden border-warning/40">
                <div className="px-5 py-3 border-b bg-warning/10 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-warning">
                    Niet te garanderen — eerst navragen in de keuken · {onzeker.length}
                  </h2>
                </div>
                <GerechtTabel rijen={onzeker} />
              </Card>
            )}
          </>
        )}

        <p className={cn('text-xs text-muted-foreground', filterActief && 'text-sm font-medium text-foreground')}>
          Bij twijfel is het productetiket of de keuken leidend. Meld wijzigingen in recepturen direct hier.
        </p>
      </div>

      <GerechtDialog open={dialogOpen} onOpenChange={setDialogOpen} gerecht={bewerken} categorie={categorie} />
    </SidebarLayout>
  );
}
