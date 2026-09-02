import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Clock, Zap, Plus, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useMepHandelingen } from '@/hooks/useMepPlanning';
import {
  MepFavoriet,
  MepReceptOptie,
  MepTaak,
  MepTaakInput,
  useMepFavorieten,
  useMepRecepten,
} from '@/hooks/useMepTaken';

interface Props {
  vestiging: string;
  datum: string;
  medewerkers: { id: string; name: string }[];
  onToevoegen: (input: MepTaakInput) => Promise<unknown>;
  /** Optioneel: taak bijwerken ná toevoegen (handeling / persoon). */
  onBijwerken?: (taakId: string, patch: Partial<MepTaak>) => Promise<unknown>;
}

export function MepTaakToevoegen({
  vestiging,
  datum,
  medewerkers,
  onToevoegen,
  onBijwerken,
}: Props) {
  const { data: opties = [] } = useMepRecepten(vestiging);
  const { data: favorieten = [] } = useMepFavorieten(vestiging);
  const { data: handelingen = [] } = useMepHandelingen(vestiging);
  const [zoek, setZoek] = useState('');
  const [bezig, setBezig] = useState(false);
  const [netToegevoegd, setNetToegevoegd] = useState<MepTaak | null>(null);

  const gefilterd = useMemo(() => {
    const q = zoek.trim().toLowerCase();
    if (q.length < 2) return [];
    return opties.filter((o) => o.recept_naam.toLowerCase().includes(q)).slice(0, 8);
  }, [opties, zoek]);

  const exacteMatch = useMemo(() => {
    const q = zoek.trim().toLowerCase();
    return q.length >= 2 && opties.some((o) => o.recept_naam.toLowerCase() === q);
  }, [opties, zoek]);

  const toonNieuw = zoek.trim().length >= 2 && !exacteMatch;

  const naToevoegen = (taak: MepTaak | null) => {
    setZoek('');
    setNetToegevoegd(taak && onBijwerken ? taak : null);
  };

  const voegToe = async (input: MepTaakInput, label: string) => {
    if (bezig) return;
    setBezig(true);
    try {
      const taak = (await onToevoegen(input)) as MepTaak;
      if (!taak?.id) throw new Error('De taak is niet opgeslagen');
      toast.success(`${label} toegevoegd`);
      naToevoegen(taak);
    } catch (e: any) {
      toast.error('Toevoegen mislukt: ' + (e?.message ?? 'onbekende fout'));
    } finally {
      setBezig(false);
    }
  };

  const voegReceptToe = (o: MepReceptOptie) =>
    voegToe(
      {
        vestiging,
        taak_datum: datum,
        titel: o.heeft_methode ? `${o.recept_naam} · ${o.type}` : o.recept_naam,
        categorie: o.categorie || 'Algemeen',
        recept_id: o.recept_id,
        methode_id: o.methode_id,
        doel_aantal: 1,
        doel_eenheid: o.visuele_eenheid,
        prioriteit: 2,
      },
      o.recept_naam,
    );

  const voegVrijToe = () => {
    const titel = zoek.trim();
    if (titel.length < 2) return;
    return voegToe(
      { vestiging, taak_datum: datum, titel, categorie: 'Algemeen', prioriteit: 2 },
      titel,
    );
  };

  const snelToevoegen = (f: MepFavoriet) =>
    voegToe(
      {
        vestiging,
        taak_datum: datum,
        titel: f.titel,
        categorie: f.categorie,
        recept_id: f.recept_id,
        methode_id: f.methode_id,
        handeling: f.handeling,
        doel_aantal: f.doel_aantal,
        doel_eenheid: f.doel_eenheid,
        prioriteit: 2,
      },
      f.titel,
    );

  const patchNieuweTaak = async (patch: Partial<MepTaak>, melding: string) => {
    if (!netToegevoegd || !onBijwerken || bezig) return;
    setBezig(true);
    try {
      await onBijwerken(netToegevoegd.id, patch);
      setNetToegevoegd({ ...netToegevoegd, ...patch });
      toast.success(melding);
    } catch (e: any) {
      toast.error('Opslaan mislukt: ' + (e?.message ?? 'onbekende fout'));
    } finally {
      setBezig(false);
    }
  };

  return (
    <Card className="p-4 sm:p-5 bg-card shadow-sm space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          className="h-12 pl-9 text-[15px]"
          placeholder="Taak toevoegen — typ recept of vrije taak…"
          value={zoek}
          onChange={(e) => setZoek(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              if (gefilterd.length > 0) voegReceptToe(gefilterd[0]);
              else voegVrijToe();
            }
          }}
          autoComplete="off"
        />
      </div>

      {(gefilterd.length > 0 || toonNieuw) && (
        <div className="max-h-72 overflow-y-auto rounded-polar border border-border/60 divide-y divide-border/60">
          {gefilterd.map((o) => (
            <button
              key={o.methode_id ?? `recept:${o.recept_id}`}
              type="button"
              disabled={bezig}
              onClick={() => voegReceptToe(o)}
              className="w-full text-left px-4 py-3 min-h-[56px] transition-colors hover:bg-primary/5 active:bg-primary/10 disabled:opacity-50"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-[15px] font-medium">{o.recept_naam}</span>
                <Badge variant="secondary" className="font-normal shrink-0">
                  {o.heeft_methode ? o.type : 'recept'}
                </Badge>
              </div>
              {o.heeft_methode && (
                <div className="mt-0.5 flex items-center gap-3 text-sm text-muted-foreground">
                  <span>
                    1 {o.visuele_eenheid} = {o.output_hoeveelheid} {o.output_eenheid}
                  </span>
                  {o.standaard_duur != null && (
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />~{o.standaard_duur} min
                    </span>
                  )}
                </div>
              )}
            </button>
          ))}
          {toonNieuw && (
            <button
              type="button"
              disabled={bezig}
              onClick={voegVrijToe}
              className="w-full text-left px-4 py-3 min-h-[56px] flex items-center gap-2 transition-colors hover:bg-primary/5 active:bg-primary/10 disabled:opacity-50"
            >
              <Plus className="w-4 h-4 text-primary shrink-0" />
              <span className="text-[15px] font-medium truncate">Nieuw: “{zoek.trim()}”</span>
              <Badge variant="outline" className="ml-auto font-normal shrink-0">
                vrije taak
              </Badge>
            </button>
          )}
        </div>
      )}

      {netToegevoegd && (
        <div className="rounded-polar border border-primary/30 bg-primary/5 p-3 space-y-3">
          <div className="flex items-center gap-2 text-[15px]">
            <Check className="w-5 h-5 text-primary shrink-0" />
            <span className="font-medium truncate">{netToegevoegd.titel}</span>
            {netToegevoegd.handeling && (
              <Badge variant="secondary" className="font-normal shrink-0">
                {netToegevoegd.handeling}
              </Badge>
            )}
            <span className="text-muted-foreground shrink-0 hidden sm:inline">toegevoegd</span>
            <Button
              size="icon"
              variant="ghost"
              className="ml-auto h-9 w-9 shrink-0"
              onClick={() => setNetToegevoegd(null)}
              aria-label="Klaar"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {handelingen.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Wat moet ermee gebeuren?
              </p>
              <div className="flex flex-wrap gap-2">
                {handelingen.map((h: { id: string; naam: string }) => (
                  <button
                    key={h.id}
                    type="button"
                    disabled={bezig}
                    onClick={() =>
                      patchNieuweTaak(
                        { handeling: netToegevoegd.handeling === h.naam ? null : h.naam },
                        `${netToegevoegd.titel} · ${h.naam}`,
                      )
                    }
                    className={cn(
                      'rounded-polar-md border px-4 min-h-[44px] text-[14px] font-medium transition-colors disabled:opacity-50',
                      netToegevoegd.handeling === h.naam
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border/60 bg-card hover:bg-primary/5 active:bg-primary/10',
                    )}
                  >
                    {h.naam}
                  </button>
                ))}
              </div>
            </div>
          )}

          {medewerkers.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Wie doet het?
              </p>
              <div className="flex flex-wrap gap-2">
                {medewerkers.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    disabled={bezig}
                    onClick={() =>
                      patchNieuweTaak(
                        {
                          toegewezen_aan:
                            netToegevoegd.toegewezen_aan === m.id ? null : m.id,
                        },
                        `${netToegevoegd.titel} → ${m.name}`,
                      )
                    }
                    className={cn(
                      'rounded-polar-md border px-4 min-h-[44px] text-[14px] font-medium transition-colors disabled:opacity-50',
                      netToegevoegd.toegewezen_aan === m.id
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border/60 bg-card hover:bg-primary/5 active:bg-primary/10',
                    )}
                  >
                    {m.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {favorieten.length > 0 && !zoek.trim() && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Vaakst gemaakt
          </p>
          <div className="flex flex-wrap gap-2">
            {favorieten.map((f) => (
              <button
                key={f.sleutel}
                type="button"
                disabled={bezig}
                onClick={() => snelToevoegen(f)}
                className="inline-flex items-center gap-1.5 rounded-polar-md border border-border/60 bg-card px-4 min-h-[44px] text-[14px] font-medium hover:bg-primary/5 active:bg-primary/10 transition-colors disabled:opacity-50"
              >
                <Zap className="w-3.5 h-3.5 shrink-0 text-primary/70" />
                {f.titel}
                {f.handeling && (
                  <span className="text-muted-foreground">· {f.handeling}</span>
                )}
                <span className="text-xs text-muted-foreground">{f.aantal_keer}×</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
