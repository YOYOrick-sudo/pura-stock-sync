import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMepHandelingen, useMepTitelSuggesties, useKeukenMedewerkers, MepNieuweRegel } from '@/hooks/useMepPlanning';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  location: string;
  dagOpties: { waarde: string; label: string }[];
  standaardDag: string;
  onOpslaan: (regel: MepNieuweRegel, dag: string) => void;
}

const PRIOS = [
  { waarde: 1, label: 'Moet vandaag' },
  { waarde: 2, label: 'Normaal' },
  { waarde: 3, label: 'Als er tijd is' },
];

export function MepToevoegenDialog({ open, onOpenChange, location, dagOpties, standaardDag, onOpslaan }: Props) {
  const [titel, setTitel] = useState('');
  const [recipeId, setRecipeId] = useState<string | null>(null);
  const [handeling, setHandeling] = useState<string>('geen');
  const [aantal, setAantal] = useState('1');
  const [eenheid, setEenheid] = useState('');
  const [prioriteit, setPrioriteit] = useState(2);
  const [medewerker, setMedewerker] = useState<string>('geen');
  const [dag, setDag] = useState(standaardDag);

  const { data: handelingen = [] } = useMepHandelingen(location);
  const { data: suggesties = [] } = useMepTitelSuggesties(location);
  const { data: medewerkers = [] } = useKeukenMedewerkers(location);

  const matches = useMemo(() => {
    const q = titel.trim().toLowerCase();
    if (q.length < 2) return [];
    return suggesties.filter((s) => s.titel.toLowerCase().includes(q)).slice(0, 6);
  }, [titel, suggesties]);

  useEffect(() => {
    if (open) setDag(standaardDag);
  }, [open, standaardDag]);

  const exact = suggesties.some((s) => s.titel.toLowerCase() === titel.trim().toLowerCase());

  const reset = () => {
    setTitel('');
    setRecipeId(null);
    setHandeling('geen');
    setAantal('1');
    setEenheid('');
    setPrioriteit(2);
    setMedewerker('geen');
    setDag(standaardDag);
  };

  const opslaan = () => {
    if (!titel.trim()) return;
    onOpslaan(
      {
        titel: titel.trim(),
        handeling: handeling === 'geen' ? null : handeling,
        recipe_id: recipeId,
        quantity: Number(aantal) || 1,
        eenheid: eenheid.trim() || null,
        prioriteit,
        employee_id: medewerker === 'geen' ? null : medewerker,
      },
      dag,
    );
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        else setDag(standaardDag);
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-w-[650px]">
        <DialogHeader>
          <DialogTitle>Toevoegen aan mise-en-place</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Dag-toggle */}
          <div className="space-y-2">
            <Label>Dag</Label>
            <div className="flex gap-2">
              {dagOpties.map((o) => (
                <Button
                  key={o.waarde}
                  type="button"
                  variant={dag === o.waarde ? 'default' : 'outline'}
                  className="flex-1 h-11"
                  onClick={() => setDag(o.waarde)}
                >
                  {o.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Titel met autocomplete */}
          <div className="space-y-2">
            <Label htmlFor="mep-titel">Halfproduct of taak</Label>
            <Input
              id="mep-titel"
              value={titel}
              onChange={(e) => {
                setTitel(e.target.value);
                setRecipeId(null);
              }}
              placeholder="Bijv. Kip vacumeren"
              autoComplete="off"
            />
            {matches.length > 0 && (
              <div className="rounded-polar border border-border divide-y divide-border overflow-hidden">
                {matches.map((s) => (
                  <button
                    key={s.titel}
                    type="button"
                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center justify-between"
                    onClick={() => {
                      setTitel(s.titel);
                      setRecipeId(s.recipe_id);
                    }}
                  >
                    <span>{s.titel}</span>
                    {s.recipe_id && <Badge variant="outline" className="text-[11px]">Recept</Badge>}
                  </button>
                ))}
              </div>
            )}
            {titel.trim().length >= 2 && !exact && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Plus className="h-3 w-3" /> Nieuw: "{titel.trim()}" wordt als nieuwe taak aangemaakt
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Handeling</Label>
              <Select value={handeling} onValueChange={setHandeling}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="geen">Geen</SelectItem>
                  {handelingen.map((h) => (
                    <SelectItem key={h.id} value={h.naam}>{h.naam}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Medewerker</Label>
              <Select value={medewerker} onValueChange={setMedewerker}>
                <SelectTrigger><SelectValue placeholder="Niemand" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="geen">Niemand</SelectItem>
                  {medewerkers.map((m) => (
                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="mep-aantal">Aantal</Label>
              <Input id="mep-aantal" type="number" min="1" value={aantal} onChange={(e) => setAantal(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mep-eenheid">Eenheid</Label>
              <Input id="mep-eenheid" value={eenheid} onChange={(e) => setEenheid(e.target.value)} placeholder="bakken" />
            </div>
            <div className="space-y-2">
              <Label>Prioriteit</Label>
              <Select value={String(prioriteit)} onValueChange={(v) => setPrioriteit(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRIOS.map((p) => (
                    <SelectItem key={p.waarde} value={String(p.waarde)}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuleren</Button>
          <Button onClick={opslaan} disabled={!titel.trim()} className={cn('min-w-[120px]')}>Toevoegen</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
