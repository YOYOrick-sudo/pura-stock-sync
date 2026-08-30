import { useMemo, useState } from 'react';
import { SidebarLayout } from '@/components/SidebarLayout';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Search, AlertTriangle, Pencil, Archive, ArchiveRestore, Cookie } from 'lucide-react';
import { EmptyState } from '@/components/kitchen/EmptyState';
import { cn } from '@/lib/utils';
import { useRole } from '@/hooks/useRole';
import { useArchiveerGerecht, useGerechten, type Gerecht } from '@/hooks/useGerechten';
import { GerechtDialog } from '@/components/kitchen/GerechtDialog';
import {
  GERECHT_CATEGORIEEN,
  GERECHT_LABEL_NAAM,
  GERECHT_LABEL_SOORT,
  isGerechtLabel,
} from '@/lib/gerecht-labels';

function LabelChips({ gerecht }: { gerecht: Gerecht }) {
  const labels = (gerecht.labels ?? []).filter(isGerechtLabel);
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {!gerecht.gecontroleerd && (
        <span className="inline-flex items-center gap-1 rounded-full bg-warning/15 px-2.5 py-1 text-xs font-medium text-warning">
          <AlertTriangle className="h-3 w-3" />
          Nog te controleren
        </span>
      )}
      {labels.length === 0 && gerecht.gecontroleerd && (
        <span className="text-sm text-muted-foreground">Geen labels</span>
      )}
      {labels.map((code) => {
        const soort = GERECHT_LABEL_SOORT[code];
        return (
          <span
            key={code}
            className={cn(
              'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',
              soort === 'allergeen' && 'bg-destructive/10 text-destructive',
              soort === 'dieet' && 'bg-primary/10 text-primary',
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

  const { data: gerechten = [], isLoading } = useGerechten(categorie, toonGearchiveerd);
  const archiveer = useArchiveerGerecht();

  const gefilterd = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return gerechten;
    return gerechten.filter(
      (g) =>
        g.naam.toLowerCase().includes(q) ||
        (g.labels ?? []).some((l) => (isGerechtLabel(l) ? GERECHT_LABEL_NAAM[l].toLowerCase().includes(q) : false)),
    );
  }, [gerechten, search]);

  const groepen: { key: 'standaard' | 'special'; titel: string }[] = [
    { key: 'standaard', titel: 'Standaard assortiment' },
    { key: 'special', titel: 'Specials' },
  ];

  const openNieuw = () => {
    setBewerken(null);
    setDialogOpen(true);
  };

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
        </Card>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Laden…</div>
        ) : gefilterd.length === 0 ? (
          <EmptyState
            icon={Cookie}
            title="Geen gerechten gevonden"
            description={search ? 'Pas je zoekopdracht aan' : 'Voeg je eerste gerecht toe'}
            action={isManager ? { label: 'Nieuw gerecht', onClick: openNieuw } : undefined}
          />
        ) : (
          groepen.map((groep) => {
            const rijen = gefilterd.filter((g) => g.groep === groep.key);
            if (rijen.length === 0) return null;
            return (
              <Card key={groep.key} className="bg-card shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b bg-muted/30">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {groep.titel} · {rijen.length}
                  </h2>
                </div>
                {rijen.map((g, i) => (
                  <div
                    key={g.id}
                    className={cn(
                      'flex flex-col gap-2 px-5 py-3 sm:flex-row sm:items-center sm:gap-4',
                      i % 2 === 1 && 'bg-muted/20',
                      g.is_gearchiveerd && 'opacity-60',
                    )}
                  >
                    <div className="sm:w-[240px] shrink-0">
                      <p className="font-medium text-foreground">{g.naam}</p>
                      <p className="text-xs text-muted-foreground">
                        {g.prijs != null ? `€ ${g.prijs.toFixed(2).replace('.', ',')}` : ''}
                        {g.notitie ? `${g.prijs != null ? ' · ' : ''}${g.notitie}` : ''}
                      </p>
                    </div>
                    <div className="flex-1">
                      <LabelChips gerecht={g} />
                    </div>
                    {isManager && (
                      <div className="flex items-center gap-1 shrink-0">
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
                ))}
              </Card>
            );
          })
        )}

        <p className="text-xs text-muted-foreground">
          Bij twijfel is het productetiket of de keuken leidend. Meld wijzigingen in recepturen direct hier.
        </p>
      </div>

      <GerechtDialog open={dialogOpen} onOpenChange={setDialogOpen} gerecht={bewerken} categorie={categorie} />
    </SidebarLayout>
  );
}
