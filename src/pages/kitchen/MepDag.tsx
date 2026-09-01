import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { SidebarLayout } from '@/components/SidebarLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmptyState } from '@/components/kitchen/EmptyState';
import { MepTaakToevoegen } from '@/components/kitchen/MepTaakToevoegen';
import { MepAfrondDialog } from '@/components/kitchen/MepAfrondDialog';
import {
  Plus,
  Check,
  Undo2,
  Trash2,
  Clock,
  Settings,
  ChevronLeft,
  ChevronRight,
  Tag,
  CalendarDays,
} from 'lucide-react';
import { addDays, differenceInCalendarDays, format, parseISO } from 'date-fns';
import { nl } from 'date-fns/locale';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useUserLocation } from '@/contexts/UserLocationContext';
import { useKeukenMedewerkers } from '@/hooks/useMepPlanning';
import {
  MepTaak,
  useMepTaakMutaties,
  useMepTaken,
  useProductieBatches,
  ymd,
} from '@/hooks/useMepTaken';

const PRIO_LABEL: Record<number, string> = { 1: 'Moet vandaag', 2: 'Normaal', 3: 'Als er tijd is' };
const PRIO_CLASS: Record<number, string> = {
  1: 'bg-destructive/10 text-destructive border-destructive/20',
  2: 'bg-muted text-muted-foreground',
  3: 'bg-muted/60 text-muted-foreground',
};

export default function MepDag() {
  const navigate = useNavigate();
  const { userLocation } = useUserLocation();
  const vestiging = userLocation ?? '';
  const [params, setParams] = useSearchParams();
  const datumParam = params.get('datum');
  const initieleOffset = datumParam
    ? differenceInCalendarDays(parseISO(datumParam), new Date())
    : 0;
  const [dagOffset, setDagOffsetState] = useState(Number.isFinite(initieleOffset) ? initieleOffset : 0);
  const datum = ymd(addDays(new Date(), dagOffset));
  const setDagOffset = (fn: (d: number) => number) => {
    setDagOffsetState((d) => {
      const next = fn(d);
      const nieuweDatum = ymd(addDays(new Date(), next));
      if (next === 0) setParams({}, { replace: true });
      else setParams({ datum: nieuweDatum }, { replace: true });
      return next;
    });
  };

  const { data: taken = [], isLoading } = useMepTaken(vestiging, datum);
  const { data: batches = [] } = useProductieBatches(vestiging, datum);
  const { data: medewerkers = [] } = useKeukenMedewerkers(vestiging);
  const { toevoegen, bijwerken, verwijderen, afronden, heropenen } = useMepTaakMutaties(vestiging, datum);

  const [toevoegenOpen, setToevoegenOpen] = useState(false);
  const [afrondTaak, setAfrondTaak] = useState<MepTaak | null>(null);
  const [weergave, setWeergave] = useState<'categorie' | 'persoon'>('categorie');

  const open = taken.filter((t) => t.status !== 'afgerond');
  const klaar = taken.filter((t) => t.status === 'afgerond');
  const voortgang = taken.length ? Math.round((klaar.length / taken.length) * 100) : 0;

  const groepen = useMemo(() => {
    const map = new Map<string, MepTaak[]>();
    for (const t of taken) {
      const sleutel =
        weergave === 'categorie'
          ? t.categorie || 'Algemeen'
          : medewerkers.find((m) => m.id === t.toegewezen_aan)?.name ?? 'Niet toegewezen';
      if (!map.has(sleutel)) map.set(sleutel, []);
      map.get(sleutel)!.push(t);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0], 'nl'));
  }, [taken, weergave, medewerkers]);

  const dagLabel =
    dagOffset === 0
      ? 'Vandaag'
      : dagOffset === 1
        ? 'Morgen'
        : format(addDays(new Date(), dagOffset), 'EEEE d MMMM', { locale: nl });

  const verwijder = async (t: MepTaak) => {
    try {
      await verwijderen.mutateAsync(t.id);
      toast.success('Taak verwijderd');
    } catch (e: any) {
      toast.error('Verwijderen mislukt: ' + (e?.message ?? 'onbekende fout'));
    }
  };

  const heropen = async (t: MepTaak) => {
    try {
      await heropenen.mutateAsync(t.id);
      toast.success('Taak weer open gezet');
    } catch (e: any) {
      toast.error('Heropenen mislukt: ' + (e?.message ?? 'onbekende fout'));
    }
  };

  return (
    <SidebarLayout>
      <div className="space-y-4">
        {/* Kop */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[15px] font-medium capitalize">
              {format(addDays(new Date(), dagOffset), 'EEEE d MMMM', { locale: nl })}
            </p>
            <p className="text-sm text-muted-foreground">
              {vestiging} · {klaar.length}/{taken.length} klaar
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="outline"
              className="h-11 w-11"
              onClick={() => setDagOffset((d) => d - 1)}
              aria-label="Vorige dag"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <span className="min-w-[92px] text-center text-[15px] font-medium">{dagLabel}</span>
            <Button
              size="icon"
              variant="outline"
              className="h-11 w-11"
              onClick={() => setDagOffset((d) => d + 1)}
              aria-label="Volgende dag"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
            <Button
              size="icon"
              variant="outline"
              className="h-11 w-11"
              onClick={() => navigate('/kitchen/mep/week')}
              aria-label="Weekweergave"
            >
              <CalendarDays className="w-5 h-5" />
            </Button>
            <Button
              size="icon"
              variant="outline"
              className="h-11 w-11"
              onClick={() => navigate('/settings/mep')}
              aria-label="Instellingen"
            >
              <Settings className="w-5 h-5" />
            </Button>
            <Button className="h-11" onClick={() => setToevoegenOpen(true)}>
              <Plus className="w-5 h-5 mr-1.5" />
              Taak
            </Button>
          </div>
        </div>

        {/* Voortgang */}
        <Card className="p-4 sm:p-5 bg-card shadow-sm">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="font-medium">
              {klaar.length} van {taken.length} klaar
            </span>
            <span className="text-muted-foreground tabular-nums">{voortgang}%</span>
          </div>
          <Progress value={voortgang} className="h-2" />
        </Card>

        <Tabs value={weergave} onValueChange={(v) => setWeergave(v as 'categorie' | 'persoon')}>
          <TabsList>
            <TabsTrigger value="categorie">Per categorie</TabsTrigger>
            <TabsTrigger value="persoon">Per persoon</TabsTrigger>
          </TabsList>
        </Tabs>

        {isLoading ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Laden…</p>
        ) : taken.length === 0 ? (
          <EmptyState
            icon={Plus}
            title="Nog geen MEP voor deze dag"
            description="Voeg halffabricaten of vrije taken toe om de dag klaar te zetten."
            action={{ label: 'Taak toevoegen', onClick: () => setToevoegenOpen(true) }}
          />
        ) : (
          <div className="space-y-4">
            {groepen.map(([naam, rijen]) => (
              <Card key={naam} className="overflow-hidden bg-card shadow-sm">
                <div className="px-4 sm:px-5 py-3 border-b border-border/60 flex items-center justify-between">
                  <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {naam}
                  </h2>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {rijen.filter((r) => r.status === 'afgerond').length}/{rijen.length}
                  </span>
                </div>
                <ul className="divide-y divide-border/60">
                  {rijen.map((t) => {
                    const isKlaar = t.status === 'afgerond';
                    return (
                      <li
                        key={t.id}
                        className={cn(
                          'flex items-center gap-3 px-4 sm:px-5 py-3 min-h-[64px]',
                          isKlaar && 'opacity-60',
                        )}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={cn(
                                'text-[15px] font-medium',
                                isKlaar && 'line-through text-muted-foreground',
                              )}
                            >
                              {t.titel}
                            </span>
                            {t.doel_aantal != null && (
                              <Badge variant="secondary" className="font-normal">
                                {Number(t.doel_aantal)} {t.doel_eenheid ?? ''}
                              </Badge>
                            )}
                            <Badge variant="outline" className={cn('font-normal', PRIO_CLASS[t.prioriteit])}>
                              {PRIO_LABEL[t.prioriteit]}
                            </Badge>
                          </div>
                          <div className="mt-0.5 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                            {weergave === 'categorie' && t.toegewezen_aan && (
                              <span>{medewerkers.find((m) => m.id === t.toegewezen_aan)?.name}</span>
                            )}
                            {t.deadline && (
                              <span className="inline-flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {t.deadline.slice(0, 5)}
                              </span>
                            )}
                            {t.notitie && <span className="truncate">{t.notitie}</span>}
                          </div>
                        </div>

                        {isKlaar ? (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-11 w-11"
                            onClick={() => heropen(t)}
                            aria-label="Heropenen"
                          >
                            <Undo2 className="w-5 h-5" />
                          </Button>
                        ) : (
                          <>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-11 w-11 text-destructive hover:text-destructive"
                              onClick={() => verwijder(t)}
                              aria-label="Verwijderen"
                            >
                              <Trash2 className="w-5 h-5" />
                            </Button>
                            <Button
                              className="h-11 min-w-[44px]"
                              onClick={() => setAfrondTaak(t)}
                            >
                              <Check className="w-5 h-5" />
                            </Button>
                          </>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </Card>
            ))}
          </div>
        )}

        {/* Batches van vandaag */}
        {batches.length > 0 && (
          <Card className="p-4 sm:p-5 bg-card shadow-sm">
            <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground pb-3 mb-1 border-b border-border/60">
              Vandaag gemaakt
            </h2>
            <ul className="divide-y divide-border/60">
              {batches.map((b: any) => (
                <li key={b.id} className="flex items-center justify-between gap-4 py-2.5 text-sm">
                  <span className="inline-flex items-center gap-2 min-w-0">
                    <Tag className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="truncate">{b.omschrijving}</span>
                  </span>
                  <span className="text-muted-foreground tabular-nums shrink-0">
                    {b.hoeveelheid ? `${Number(b.hoeveelheid)} ${b.eenheid ?? ''} · ` : ''}
                    {b.batch_nummer}
                    {b.houdbaar_tot
                      ? ` · t/m ${format(new Date(b.houdbaar_tot), 'd MMM', { locale: nl })}`
                      : ''}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>

      <MepTaakToevoegen
        open={toevoegenOpen}
        onOpenChange={setToevoegenOpen}
        vestiging={vestiging}
        datum={datum}
        medewerkers={medewerkers}
        onToevoegen={(input) => toevoegen.mutateAsync(input)}
        onToewijzen={(taakId, medewerkerId) =>
          bijwerken.mutateAsync({ id: taakId, toegewezen_aan: medewerkerId })
        }
      />

      <MepAfrondDialog
        taak={afrondTaak}
        onOpenChange={(v) => !v && setAfrondTaak(null)}
        onAfronden={(args) => afronden.mutateAsync(args)}
      />
    </SidebarLayout>
  );
}
