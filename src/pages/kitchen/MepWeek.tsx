import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SidebarLayout } from '@/components/SidebarLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { addDays, format, isSameDay, startOfWeek } from 'date-fns';
import { nl } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useUserLocation } from '@/contexts/UserLocationContext';
import { useMepTakenBereik, ymd, type MepTaak } from '@/hooks/useMepTaken';

const PRIO_CLASS: Record<number, string> = {
  1: 'bg-destructive/10 text-destructive border-destructive/20',
  2: 'bg-muted text-muted-foreground',
  3: 'bg-muted/60 text-muted-foreground',
};

export default function MepWeek() {
  const navigate = useNavigate();
  const { userLocation } = useUserLocation();
  const vestiging = userLocation ?? '';
  const [weekOffset, setWeekOffset] = useState(0);

  const start = useMemo(
    () => addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), weekOffset * 7),
    [weekOffset],
  );
  const dagen = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(start, i)), [start]);
  const { data: taken = [], isLoading } = useMepTakenBereik(
    vestiging,
    ymd(start),
    ymd(addDays(start, 6)),
  );

  const perDag = useMemo(() => {
    const map = new Map<string, MepTaak[]>();
    for (const t of taken) {
      if (!map.has(t.taak_datum)) map.set(t.taak_datum, []);
      map.get(t.taak_datum)!.push(t);
    }
    return map;
  }, [taken]);

  const weekLabel =
    weekOffset === 0
      ? 'Deze week'
      : `${format(start, 'd MMM', { locale: nl })} – ${format(addDays(start, 6), 'd MMM', { locale: nl })}`;

  return (
    <SidebarLayout>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-[15px] font-medium">
              {format(start, 'd MMMM', { locale: nl })} – {format(addDays(start, 6), 'd MMMM yyyy', { locale: nl })}
            </p>
            <p className="text-sm text-muted-foreground">{vestiging}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="outline"
              className="h-11 w-11"
              onClick={() => setWeekOffset((w) => w - 1)}
              aria-label="Vorige week"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <span className="min-w-[130px] text-center text-[15px] font-medium">{weekLabel}</span>
            <Button
              size="icon"
              variant="outline"
              className="h-11 w-11"
              onClick={() => setWeekOffset((w) => w + 1)}
              aria-label="Volgende week"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
            {weekOffset !== 0 && (
              <Button variant="ghost" className="h-11" onClick={() => setWeekOffset(0)}>
                <CalendarDays className="w-4 h-4 mr-1.5" />
                Deze week
              </Button>
            )}
            <Button variant="outline" className="h-11" onClick={() => navigate('/kitchen/mep')}>
              Vandaag
            </Button>
          </div>
        </div>

        {isLoading ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Laden…</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            {dagen.map((d) => {
              const datum = ymd(d);
              const rijen = perDag.get(datum) ?? [];
              const klaar = rijen.filter((r) => r.status === 'afgerond').length;
              const pct = rijen.length ? Math.round((klaar / rijen.length) * 100) : 0;
              const vandaag = isSameDay(d, new Date());

              return (
                <Card
                  key={datum}
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(`/kitchen/mep?datum=${datum}`)}
                  onKeyDown={(e) => e.key === 'Enter' && navigate(`/kitchen/mep?datum=${datum}`)}
                  className={cn(
                    'p-4 bg-card shadow-sm cursor-pointer transition-colors hover:bg-muted/40 min-h-[150px]',
                    vandaag && 'border-primary/50 ring-1 ring-primary/20',
                  )}
                >
                  <div className="flex items-baseline justify-between mb-2">
                    <div>
                      <p className="text-[15px] font-semibold capitalize">
                        {format(d, 'EEEE', { locale: nl })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(d, 'd MMMM', { locale: nl })}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {rijen.length ? `${klaar}/${rijen.length}` : '—'}
                    </span>
                  </div>

                  {rijen.length > 0 && <Progress value={pct} className="h-1.5 mb-3" />}

                  {rijen.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Geen taken gepland</p>
                  ) : (
                    <ul className="space-y-1.5">
                      {rijen.slice(0, 4).map((t) => (
                        <li key={t.id} className="flex items-center gap-2 text-sm">
                          <span
                            className={cn(
                              'truncate',
                              t.status === 'afgerond' && 'line-through text-muted-foreground',
                            )}
                          >
                            {t.titel}
                          </span>
                          {t.prioriteit === 1 && t.status !== 'afgerond' && (
                            <Badge
                              variant="outline"
                              className={cn('font-normal shrink-0', PRIO_CLASS[1])}
                            >
                              Moet
                            </Badge>
                          )}
                        </li>
                      ))}
                      {rijen.length > 4 && (
                        <li className="text-xs text-muted-foreground">
                          +{rijen.length - 4} meer
                        </li>
                      )}
                    </ul>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}
