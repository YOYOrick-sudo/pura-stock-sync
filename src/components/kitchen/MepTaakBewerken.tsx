import { useEffect, useState } from 'react';
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
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { MepTaak } from '@/hooks/useMepTaken';
import { useMepHandelingen } from '@/hooks/useMepPlanning';

const PRIO = [
  { waarde: 1, label: 'Moet vandaag' },
  { waarde: 2, label: 'Normaal' },
  { waarde: 3, label: 'Als er tijd is' },
];

interface Props {
  taak: MepTaak | null;
  vestiging: string;
  medewerkers: { id: string; name: string }[];
  onOpenChange: (open: boolean) => void;
  onOpslaan: (taakId: string, patch: Partial<MepTaak>) => Promise<unknown>;
}

function Chip({
  actief,
  onClick,
  children,
  disabled,
}: {
  actief: boolean;
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'rounded-polar-md border px-4 min-h-[44px] text-[14px] font-medium transition-colors disabled:opacity-50',
        actief
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border/60 bg-card hover:bg-primary/5 active:bg-primary/10',
      )}
    >
      {children}
    </button>
  );
}

export function MepTaakBewerken({
  taak,
  vestiging,
  medewerkers,
  onOpenChange,
  onOpslaan,
}: Props) {
  const { data: handelingen = [] } = useMepHandelingen(vestiging);
  const [handeling, setHandeling] = useState<string | null>(null);
  const [persoon, setPersoon] = useState<string | null>(null);
  const [prioriteit, setPrioriteit] = useState(2);
  const [aantal, setAantal] = useState('');
  const [eenheid, setEenheid] = useState('');
  const [deadline, setDeadline] = useState('');
  const [notitie, setNotitie] = useState('');
  const [bezig, setBezig] = useState(false);

  useEffect(() => {
    if (!taak) return;
    setHandeling(taak.handeling);
    setPersoon(taak.toegewezen_aan);
    setPrioriteit(taak.prioriteit);
    setAantal(taak.doel_aantal != null ? String(Number(taak.doel_aantal)) : '');
    setEenheid(taak.doel_eenheid ?? '');
    setDeadline(taak.deadline ? taak.deadline.slice(0, 5) : '');
    setNotitie(taak.notitie ?? '');
  }, [taak]);

  const opslaan = async () => {
    if (!taak || bezig) return;
    const getal = aantal.trim() === '' ? null : Number(aantal.replace(',', '.'));
    if (getal != null && (!Number.isFinite(getal) || getal < 0)) {
      toast.error('Vul een geldig aantal in');
      return;
    }
    setBezig(true);
    try {
      await onOpslaan(taak.id, {
        handeling,
        toegewezen_aan: persoon,
        prioriteit,
        doel_aantal: getal,
        doel_eenheid: eenheid.trim() || null,
        deadline: deadline.trim() ? `${deadline}:00` : null,
        notitie: notitie.trim() || null,
      });
      toast.success('Taak bijgewerkt');
      onOpenChange(false);
    } catch (e: any) {
      toast.error('Opslaan mislukt: ' + (e?.message ?? 'onbekende fout'));
    } finally {
      setBezig(false);
    }
  };

  return (
    <Dialog open={!!taak} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[650px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-left">{taak?.titel}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {handelingen.length > 0 && (
            <div className="space-y-2">
              <Label>Wat moet ermee gebeuren?</Label>
              <div className="flex flex-wrap gap-2">
                <Chip actief={!handeling} onClick={() => setHandeling(null)}>
                  Geen
                </Chip>
                {handelingen.map((h: { id: string; naam: string }) => (
                  <Chip
                    key={h.id}
                    actief={handeling === h.naam}
                    onClick={() => setHandeling(h.naam)}
                  >
                    {h.naam}
                  </Chip>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Wie doet het?</Label>
            <div className="flex flex-wrap gap-2">
              <Chip actief={!persoon} onClick={() => setPersoon(null)}>
                Niemand
              </Chip>
              {medewerkers.map((m) => (
                <Chip key={m.id} actief={persoon === m.id} onClick={() => setPersoon(m.id)}>
                  {m.name}
                </Chip>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Prioriteit</Label>
            <div className="flex flex-wrap gap-2">
              {PRIO.map((p) => (
                <Chip
                  key={p.waarde}
                  actief={prioriteit === p.waarde}
                  onClick={() => setPrioriteit(p.waarde)}
                >
                  {p.label}
                </Chip>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="mep-aantal">Aantal</Label>
              <Input
                id="mep-aantal"
                inputMode="decimal"
                className="h-12"
                value={aantal}
                onChange={(e) => setAantal(e.target.value)}
                placeholder="1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mep-eenheid">Eenheid</Label>
              <Input
                id="mep-eenheid"
                className="h-12"
                value={eenheid}
                onChange={(e) => setEenheid(e.target.value)}
                placeholder="bak, kg, stuk…"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="mep-deadline">Klaar voor</Label>
            <Input
              id="mep-deadline"
              type="time"
              className="h-12"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="mep-notitie">Notitie</Label>
            <Textarea
              id="mep-notitie"
              rows={2}
              value={notitie}
              onChange={(e) => setNotitie(e.target.value)}
              placeholder="Bijzonderheden voor de keuken"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            className="h-12"
            onClick={() => onOpenChange(false)}
            disabled={bezig}
          >
            Annuleren
          </Button>
          <Button className="h-12" onClick={opslaan} disabled={bezig}>
            Opslaan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
