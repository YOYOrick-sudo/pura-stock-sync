import { useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Clock, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  MEP_CATEGORIEEN,
  MepFavoriet,
  MepReceptOptie,
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
}

export function MepTaakToevoegen({
  open,
  onOpenChange,
  vestiging,
  datum,
  medewerkers,
  onToevoegen,
}: Props) {
  const { data: opties = [] } = useMepRecepten(vestiging);
  const { data: favorieten = [] } = useMepFavorieten(vestiging);
  const [tab, setTab] = useState<'recept' | 'vrij'>('recept');
  const [zoek, setZoek] = useState('');
  const [gekozen, setGekozen] = useState<MepReceptOptie | null>(null);
  const [aantal, setAantal] = useState(1);
  const [titel, setTitel] = useState('');
  const [categorie, setCategorie] = useState<string>('Algemeen');
  const [prioriteit, setPrioriteit] = useState(2);
  const [medewerker, setMedewerker] = useState<string>('geen');
  const [notitie, setNotitie] = useState('');
  const [bezig, setBezig] = useState(false);

  const gefilterd = useMemo(() => {
    const q = zoek.trim().toLowerCase();
    if (!q) return opties;
    return opties.filter(
      (o) => o.recept_naam.toLowerCase().includes(q) || o.type.toLowerCase().includes(q),
    );
  }, [opties, zoek]);

  const reset = () => {
    setZoek('');
    setGekozen(null);
    setAantal(1);
    setTitel('');
    setCategorie('Algemeen');
    setPrioriteit(2);
    setMedewerker('geen');
    setNotitie('');
  };

  const opslaan = async () => {
    const basis = {
      vestiging,
      taak_datum: datum,
      prioriteit,
      toegewezen_aan: medewerker === 'geen' ? null : medewerker,
      notitie: notitie.trim() || null,
    };

    let input: MepTaakInput;
    if (tab === 'recept') {
      if (!gekozen) {
        toast.error('Kies eerst een recept');
        return;
      }
      input = {
        ...basis,
        titel: gekozen.heeft_methode
          ? `${gekozen.recept_naam} · ${gekozen.type}`
          : gekozen.recept_naam,
        categorie: gekozen.categorie || 'Algemeen',
        recept_id: gekozen.recept_id,
        methode_id: gekozen.methode_id,
        doel_aantal: aantal,
        doel_eenheid: gekozen.visuele_eenheid,
      };
    } else {
      if (titel.trim().length < 2) {
        toast.error('Geef de taak een korte naam');
        return;
      }
      input = { ...basis, titel: titel.trim(), categorie };
    }

    setBezig(true);
    try {
      await onToevoegen(input);
      toast.success('Toegevoegd aan de MEP-lijst');
      reset();
      onOpenChange(false);
    } catch (e: any) {
      toast.error('Toevoegen mislukt: ' + (e?.message ?? 'onbekende fout'));
    } finally {
      setBezig(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? onOpenChange(v) : (reset(), onOpenChange(false)))}>
      <DialogContent className="max-w-[650px]">
        <DialogHeader>
          <DialogTitle>Taak toevoegen</DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as 'recept' | 'vrij')}>
          <TabsList className="w-full">
            <TabsTrigger value="recept" className="flex-1">
              Recept / methode
            </TabsTrigger>
            <TabsTrigger value="vrij" className="flex-1">
              Vrije taak
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {tab === 'recept' ? (
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
                className="h-11 pl-9"
                placeholder="Zoek recept of handeling"
                value={zoek}
                onChange={(e) => setZoek(e.target.value)}
              />
            </div>

            <div className="max-h-64 overflow-y-auto rounded-polar border border-border/60 divide-y divide-border/60">
              {gefilterd.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground">
                  Geen recepten aan voor deze vestiging. Zet het recept aan bij Recepten.
                </p>
              ) : (
                blokken.map(([kop, rij]) => (
                  <div key={kop}>
                    <p className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground bg-muted/40">
                      {kop}
                    </p>
                    {rij.map((o) => {
                      const sleutel = o.methode_id ?? `recept:${o.recept_id}`;
                      const actief =
                        (gekozen?.methode_id ?? `recept:${gekozen?.recept_id}`) === sleutel;
                      return (
                        <button
                          key={sleutel}
                          type="button"
                          onClick={() => setGekozen(o)}
                          className={cn(
                            'w-full text-left px-4 py-3 min-h-[56px] transition-colors border-t border-border/60',
                            actief ? 'bg-primary/10' : 'hover:bg-muted/60',
                          )}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-[15px] font-medium">{o.recept_naam}</span>
                            <Badge variant="secondary" className="font-normal shrink-0">
                              {o.heeft_methode ? o.type : o.categorie}
                            </Badge>
                          </div>
                          {o.heeft_methode ? (
                            <div className="mt-0.5 flex items-center gap-3 text-sm text-muted-foreground">
                              <span>
                                1 {o.visuele_eenheid} = {o.output_hoeveelheid} {o.output_eenheid}
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />~{o.standaard_duur} min
                              </span>
                            </div>
                          ) : (
                            <div className="mt-0.5 text-sm text-muted-foreground">
                              Zonder methode — geen sticker of batch bij afronden
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>


            {gekozen && (
              <div className="space-y-1.5">
                <Label>Hoeveel {gekozen.visuele_eenheid}?</Label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 w-12 text-lg"
                    onClick={() => setAantal((a) => Math.max(1, a - 1))}
                  >
                    −
                  </Button>
                  <Input
                    className="h-12 text-center text-lg tabular-nums"
                    type="number"
                    inputMode="numeric"
                    value={aantal}
                    onChange={(e) => setAantal(Math.max(1, Number(e.target.value)))}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 w-12 text-lg"
                    onClick={() => setAantal((a) => a + 1)}
                  >
                    +
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Levert {(gekozen.output_hoeveelheid * aantal).toLocaleString('nl-NL')}{' '}
                  {gekozen.output_eenheid} op
                  {gekozen.houdbaarheid != null && ` · ${gekozen.houdbaarheid} dagen houdbaar`}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Wat moet er gebeuren?</Label>
              <Input
                className="h-11"
                placeholder="Kip vacumeren"
                value={titel}
                onChange={(e) => setTitel(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Categorie</Label>
              <Select value={categorie} onValueChange={setCategorie}>
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MEP_CATEGORIEEN.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Prioriteit</Label>
            <Select value={String(prioriteit)} onValueChange={(v) => setPrioriteit(Number(v))}>
              <SelectTrigger className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Moet vandaag</SelectItem>
                <SelectItem value="2">Normaal</SelectItem>
                <SelectItem value="3">Als er tijd is</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Wie doet het?</Label>
            <Select value={medewerker} onValueChange={setMedewerker}>
              <SelectTrigger className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="geen">Niet toegewezen</SelectItem>
                {medewerkers.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Notitie (optioneel)</Label>
            <Textarea
              rows={2}
              value={notitie}
              onChange={(e) => setNotitie(e.target.value)}
              placeholder="Bijzonderheden voor de kok"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={bezig}>
            Annuleren
          </Button>
          <Button onClick={opslaan} disabled={bezig}>
            {bezig ? 'Toevoegen…' : 'Toevoegen'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
