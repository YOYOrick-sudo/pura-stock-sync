import { useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Clock, Zap, Plus, Check } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  MepFavoriet,
  MepReceptOptie,
  MepTaak,
  MepTaakInput,
  useMepFavorieten,
  useMepRecepten,
} from '@/hooks/useMepTaken';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  vestiging: string;
  datum: string;
  medewerkers: { id: string; name: string }[];
  onToevoegen: (input: MepTaakInput) => Promise<unknown>;
  /** Optioneel: persoon toewijzen ná toevoegen. */
  onToewijzen?: (taakId: string, medewerkerId: string) => Promise<unknown>;
}

export function MepTaakToevoegen({
  open,
  onOpenChange,
  vestiging,
  datum,
  medewerkers,
  onToevoegen,
  onToewijzen,
}: Props) {
  const { data: opties = [] } = useMepRecepten(vestiging);
  const { data: favorieten = [] } = useMepFavorieten(vestiging);
  const [zoek, setZoek] = useState('');
  const [bezig, setBezig] = useState(false);
  // Net toegevoegde taak → stap 2 (persoon toewijzen)
  const [netToegevoegd, setNetToegevoegd] = useState<MepTaak | null>(null);

  const gefilterd = useMemo(() => {
    const q = zoek.trim().toLowerCase();
    if (q.length < 2) return [];
    return opties
      .filter((o) => o.recept_naam.toLowerCase().includes(q))
      .slice(0, 8);
  }, [opties, zoek]);

  const exacteMatch = useMemo(() => {
    const q = zoek.trim().toLowerCase();
    return q.length >= 2 && opties.some((o) => o.recept_naam.toLowerCase() === q);
  }, [opties, zoek]);

  const toonNieuw = zoek.trim().length >= 2 && !exacteMatch;

  const sluit = () => {
    setZoek('');
    setNetToegevoegd(null);
    onOpenChange(false);
  };

  const naToevoegen = (taak: MepTaak | null) => {
    setZoek('');
    if (taak && medewerkers.length > 0 && onToewijzen) {
      setNetToegevoegd(taak);
    } else {
      setNetToegevoegd(null);
    }
  };

  const voegReceptToe = async (o: MepReceptOptie) => {
    if (bezig) return;
    setBezig(true);
    try {
      const taak = (await onToevoegen({
        vestiging,
        taak_datum: datum,
        titel: o.heeft_methode ? `${o.recept_naam} · ${o.type}` : o.recept_naam,
        categorie: o.categorie || 'Algemeen',
        recept_id: o.recept_id,
        methode_id: o.methode_id,
        doel_aantal: 1,
        doel_eenheid: o.visuele_eenheid,
        prioriteit: 2,
      })) as MepTaak;
      toast.success(`${o.recept_naam} toegevoegd`);
      naToevoegen(taak ?? null);
    } catch (e: any) {
      toast.error('Toevoegen mislukt: ' + (e?.message ?? 'onbekende fout'));
    } finally {
      setBezig(false);
    }
  };

  const voegVrijToe = async () => {
    const titel = zoek.trim();
    if (titel.length < 2 || bezig) return;
    setBezig(true);
    try {
      const taak = (await onToevoegen({
        vestiging,
        taak_datum: datum,
        titel,
        categorie: 'Algemeen',
        prioriteit: 2,
      })) as MepTaak;
      toast.success(`${titel} toegevoegd`);
      naToevoegen(taak ?? null);
    } catch (e: any) {
      toast.error('Toevoegen mislukt: ' + (e?.message ?? 'onbekende fout'));
    } finally {
      setBezig(false);
    }
  };

  const snelToevoegen = async (f: MepFavoriet) => {
    if (bezig) return;
    setBezig(true);
    try {
      const taak = (await onToevoegen({
        vestiging,
        taak_datum: datum,
        titel: f.titel,
        categorie: f.categorie,
        recept_id: f.recept_id,
        methode_id: f.methode_id,
        doel_aantal: f.doel_aantal,
        doel_eenheid: f.doel_eenheid,
        prioriteit: 2,
      })) as MepTaak;
      toast.success(`${f.titel} toegevoegd`);
      naToevoegen(taak ?? null);
    } catch (e: any) {
      toast.error('Toevoegen mislukt: ' + (e?.message ?? 'onbekende fout'));
    } finally {
      setBezig(false);
    }
  };

  const wijsToe = async (medewerkerId: string) => {
    if (!netToegevoegd || !onToewijzen || bezig) return;
    setBezig(true);
    try {
      await onToewijzen(netToegevoegd.id, medewerkerId);
      const naam = medewerkers.find((m) => m.id === medewerkerId)?.name ?? '';
      toast.success(`${netToegevoegd.titel} → ${naam}`);
      sluit();
    } catch (e: any) {
      toast.error('Toewijzen mislukt: ' + (e?.message ?? 'onbekende fout'));
    } finally {
      setBezig(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? onOpenChange(v) : sluit())}>
      <DialogContent className="max-w-[650px]">
        <DialogHeader>
          <DialogTitle>Taak toevoegen</DialogTitle>
        </DialogHeader>

        {netToegevoegd ? (
          /* Stap 2: persoon toewijzen */
          <div className="space-y-4">
            <p className="flex items-center gap-2 text-[15px]">
              <Check className="w-5 h-5 text-primary shrink-0" />
              <span className="font-medium truncate">{netToegevoegd.titel}</span>
              <span className="text-muted-foreground shrink-0">toegevoegd</span>
            </p>
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Wie doet het?
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {medewerkers.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    disabled={bezig}
                    onClick={() => wijsToe(m.id)}
                    className="rounded-polar-md border border-border/60 bg-card px-3 py-2.5 min-h-[48px] text-[14px] font-medium text-left hover:bg-primary/5 active:bg-primary/10 transition-colors disabled:opacity-50 truncate"
                  >
                    {m.name}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex justify-end">
              <Button variant="outline" onClick={sluit} disabled={bezig}>
                Overslaan
              </Button>
            </div>
          </div>
        ) : (
          /* Stap 1: toevoegen */
          <div className="space-y-3">
            {favorieten.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Vaakst gemaakt
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {favorieten.map((f) => (
                    <button
                      key={f.sleutel}
                      type="button"
                      disabled={bezig}
                      onClick={() => snelToevoegen(f)}
                      className="rounded-polar-md border border-border/60 bg-card px-3 py-2.5 min-h-[56px] text-left hover:bg-primary/5 active:bg-primary/10 transition-colors disabled:opacity-50"
                    >
                      <span className="flex items-center gap-1.5 text-[14px] font-medium leading-tight line-clamp-2">
                        <Zap className="w-3.5 h-3.5 shrink-0 text-primary/70" />
                        {f.titel}
                      </span>
                      <span className="text-xs text-muted-foreground">{f.aantal_keer}×</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                className="h-12 pl-9 text-[15px]"
                placeholder="Typ recept of taak…"
                value={zoek}
                onChange={(e) => setZoek(e.target.value)}
                autoFocus
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
                    className={cn(
                      'w-full text-left px-4 py-3 min-h-[56px] transition-colors hover:bg-primary/5 active:bg-primary/10 disabled:opacity-50',
                      'flex items-center gap-2 text-[15px] font-medium text-primary',
                    )}
                  >
                    <Plus className="w-4 h-4 shrink-0" />
                    Nieuw: "{zoek.trim()}"
                  </button>
                )}
              </div>
            )}

            {zoek.trim().length > 0 && zoek.trim().length < 2 && (
              <p className="text-sm text-muted-foreground px-1">Typ minstens 2 tekens…</p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
