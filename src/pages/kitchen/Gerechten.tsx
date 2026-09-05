import { useMemo, useState } from 'react';
import { SidebarLayout } from '@/components/SidebarLayout';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Search, AlertTriangle, Pencil, Archive, ArchiveRestore, Cookie, Leaf } from 'lucide-react';
import { EmptyState } from '@/components/kitchen/EmptyState';
import { cn } from '@/lib/utils';
import { useRole } from '@/hooks/useRole';
import { useArchiveerGerecht, useGerechten, type Gerecht } from '@/hooks/useGerechten';
import { GerechtDialog } from '@/components/kitchen/GerechtDialog';
import { AllergeenFilter } from '@/components/kitchen/AllergeenFilter';
import {
  GERECHT_CATEGORIEEN,
  GERECHT_LABEL_CODES,
  GERECHT_LABEL_NAAM,
  GERECHT_LABEL_SOORT,
  isGerechtLabel,
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
    return <span className="text-sm text-muted-foreground">—</span>;
  }
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {inhoud.map((code) => {
        const soort = GERECHT_LABEL_SOORT[code];
        return (
          <span
            key={code}
            className={cn(
              'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap',
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
  const { isManager } = useRole();
  const [categorie, setCategorie] = useState<string>(GERECHT_CATEGORIEEN[0]);
  const [search, setSearch] = useState('');
  const [toonGearchiveerd, setToonGearchiveerd] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [bewerken, setBewerken] = useState<Gerecht | null>(null);
  const [zonder, setZonder] = useState<GerechtLabel[]>([]);
  const [alleenVegan, setAlleenVegan] = useState(false);

  const { data: gerechten = [], isLoading } = useGerechten(categorie, toonGearchiveerd);
  const archiveer = useArchiveerGerecht();

  const filterActief = zonder.length > 0 || alleenVegan;

  const gefilterd = useMemo(() => {
    const q = search.trim().toLowerCase();
    return gerechten.filter((g) => {
      const labels = (g.labels ?? []).filter(isGerechtLabel);
      if (q) {
        const match =
          g.naam.toLowerCase().includes(q) ||
          labels.some((l) => GERECHT_LABEL_NAAM[l].toLowerCase().includes(q));
        if (!match) return false;
      }
      if (alleenVegan && !labels.includes('vegan')) return false;
      if (zonder.some((code) => labels.includes(code))) return false;
      return true;
    });
  }, [gerechten, search, zonder, alleenVegan]);

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

  const kolomKlasse = cn(
    'sm:grid-cols-[minmax(180px,260px)_1fr_auto]',
    !isManager && 'sm:grid-cols-[minmax(180px,260px)_1fr]',
  );

  const renderRij = (g: Gerecht, i: number) => {
    const isVegan = (g.labels ?? []).includes('vegan');
    return (
      <div
        key={g.id}
        className={cn(
          'grid px-0 py-2 sm:items-center grid-cols-1',
          kolomKlasse,
          'border-b border-border/50 last:border-b-0',
          i % 2 === 1 && 'bg-muted/20',
          g.is_gearchiveerd && 'opacity-60',
        )}
      >
        <div className="min-w-0 px-4 sm:border-r border-border/50 py-1 sm:py-0">
          <p className="font-medium text-foreground flex items-center gap-2 flex-wrap">
            <span>{g.naam}</span>
            {isVegan && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                <Leaf className="h-3 w-3" />
                Vegan
              </span>
            )}
            {!g.gecontroleerd && (
              <span className="inline-flex items-center gap-1 rounded-full bg-warning/15 px-2 py-0.5 text-xs font-medium text-warning">
                <AlertTriangle className="h-3 w-3" />
                Nog te controleren
              </span>
            )}
          </p>
          <p className="text-xs text-muted-foreground">
            {g.prijs != null ? `€ ${g.prijs.toFixed(2).replace('.', ',')}` : ''}
            {g.notitie ? `${g.prijs != null ? ' · ' : ''}${g.notitie}` : ''}
          </p>
        </div>
        <div className="min-w-0 px-4 sm:border-r border-border/50 py-1 sm:py-0">
          <InhoudChips gerecht={g} />
        </div>
        {isManager && (
          <div className="flex items-center gap-1 shrink-0 justify-end px-4 py-1 sm:py-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-11 w-11"
              aria-label={`${g.naam} bewerken`}
              onClick={() => {
                setBewerken(g);
                setDialogOpen(true);
              }}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-11 w-11"
              aria-label={g.is_gearchiveerd ? `${g.naam} terugzetten` : `${g.naam} archiveren`}
              onClick={() => archiveer.mutate({ id: g.id, archiveren: !g.is_gearchiveerd })}
            >
              {g.is_gearchiveerd ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
            </Button>
          </div>
        )}
      </div>
    );
  };

  const Tabelkop = () => (
    <div className={cn('hidden sm:grid items-center px-0 py-2 border-b bg-muted/10', kolomKlasse)}>
      <span className="px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-r border-border/50">
        Gerecht
      </span>
      <span className="px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-r border-border/50">
        Bevat
      </span>
      {isManager && (
        <span className="px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground w-[96px] text-right">
          Acties
        </span>
      )}
    </div>
  );

  return (
    <SidebarLayout>
      <div className="space-y-6">
        <Card className="p-4 bg-card shadow-sm">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Zoek gerecht of allergeen…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-11 pl-10"
              />
            </div>
            {isManager && (
              <Button onClick={openNieuw} className="min-h-[44px]">
                <Plus className="h-4 w-4 mr-2" />
                Nieuw gerecht
              </Button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-4">
            {GERECHT_CATEGORIEEN.map((c) => (
              <button
                key={c}
                onClick={() => setCategorie(c)}
                className={cn(
                  'px-4 rounded-full text-sm font-medium transition-colors min-h-[44px]',
                  categorie === c ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground hover:bg-muted/80',
                )}
              >
                {c}
              </button>
            ))}
            {isManager && (
              <button
                onClick={() => setToonGearchiveerd((v) => !v)}
                className={cn(
                  'ml-auto px-4 rounded-full text-sm font-medium transition-colors min-h-[44px]',
                  toonGearchiveerd ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted/60',
                )}
              >
                {toonGearchiveerd ? 'Verberg gearchiveerde' : 'Toon gearchiveerde'}
              </button>
            )}
          </div>

          <AllergeenFilter
            zonder={zonder}
            onToggle={toggleZonder}
            alleenVegan={alleenVegan}
            onToggleVegan={() => setAlleenVegan((v) => !v)}
            onWissen={wisFilter}
          />
        </Card>

        {filterActief && !isLoading && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-polar bg-primary/5 border border-primary/20 px-4 py-3">
            <p className="text-sm font-medium text-foreground">
              {veilig.length} {veilig.length === 1 ? 'gerecht' : 'gerechten'} {filterOmschrijving}
            </p>
            <Button variant="outline" className="min-h-[44px]" onClick={wisFilter}>
              Wis filter
            </Button>
          </div>
        )}

        {isLoading ? (
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
                  <Tabelkop />
                  {rijen.map(renderRij)}
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
                <Tabelkop />
                {onzeker.map(renderRij)}
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
