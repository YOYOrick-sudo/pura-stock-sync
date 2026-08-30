import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import {
  GERECHT_LABEL_CODES,
  GERECHT_LABEL_NAAM,
  GERECHT_LABEL_SOORT,
  type GerechtLabel,
} from '@/lib/gerecht-labels';
import { useUpsertGerecht, type Gerecht } from '@/hooks/useGerechten';
import { toast } from '@/hooks/use-toast';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  gerecht: Gerecht | null;
  categorie: string;
}

export function GerechtDialog({ open, onOpenChange, gerecht, categorie }: Props) {
  const upsert = useUpsertGerecht();
  const [naam, setNaam] = useState('');
  const [groep, setGroep] = useState<'standaard' | 'special'>('standaard');
  const [prijs, setPrijs] = useState('');
  const [labels, setLabels] = useState<GerechtLabel[]>([]);
  const [gecontroleerd, setGecontroleerd] = useState(true);
  const [notitie, setNotitie] = useState('');

  useEffect(() => {
    if (!open) return;
    setNaam(gerecht?.naam ?? '');
    setGroep(gerecht?.groep ?? 'standaard');
    setPrijs(gerecht?.prijs != null ? String(gerecht.prijs) : '');
    setLabels(gerecht?.labels ?? []);
    setGecontroleerd(gerecht?.gecontroleerd ?? true);
    setNotitie(gerecht?.notitie ?? '');
  }, [open, gerecht]);

  const toggle = (code: GerechtLabel) =>
    setLabels((prev) => (prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]));

  const opslaan = async () => {
    if (naam.trim().length < 2) {
      toast({ title: 'Vul een naam in', variant: 'destructive' });
      return;
    }
    const prijsWaarde = prijs.trim() ? Number(prijs.replace(',', '.')) : null;
    if (prijsWaarde != null && Number.isNaN(prijsWaarde)) {
      toast({ title: 'Prijs klopt niet', description: 'Gebruik bijvoorbeeld 3,80', variant: 'destructive' });
      return;
    }
    try {
      await upsert.mutateAsync({
        id: gerecht?.id,
        naam,
        categorie,
        groep,
        prijs: prijsWaarde,
        labels,
        gecontroleerd,
        notitie: notitie || null,
        is_gearchiveerd: gerecht?.is_gearchiveerd ?? false,
        sort_order: gerecht?.sort_order ?? 999,
        vestiging: gerecht?.vestiging ?? null,
      });
      toast({ title: gerecht ? 'Gerecht bijgewerkt' : 'Gerecht toegevoegd' });
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: 'Opslaan mislukt', description: e?.message, variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[650px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{gerecht ? 'Gerecht bewerken' : 'Nieuw gerecht'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
            <div className="space-y-2">
              <Label htmlFor="gerecht-naam">Naam</Label>
              <Input id="gerecht-naam" value={naam} onChange={(e) => setNaam(e.target.value)} className="h-11" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gerecht-prijs">Prijs (optioneel)</Label>
              <Input
                id="gerecht-prijs"
                value={prijs}
                onChange={(e) => setPrijs(e.target.value)}
                placeholder="3,80"
                inputMode="decimal"
                className="h-11"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Groep</Label>
            <div className="flex gap-2">
              {(['standaard', 'special'] as const).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGroep(g)}
                  className={cn(
                    'min-h-[44px] px-4 rounded-polar text-sm font-medium transition-colors',
                    groep === g ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground hover:bg-muted/80',
                  )}
                >
                  {g === 'standaard' ? 'Standaard assortiment' : 'Special'}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Allergenen en labels</Label>
            <div className="flex flex-wrap gap-2">
              {GERECHT_LABEL_CODES.map((code) => {
                const actief = labels.includes(code);
                const soort = GERECHT_LABEL_SOORT[code];
                return (
                  <button
                    key={code}
                    type="button"
                    onClick={() => toggle(code)}
                    aria-pressed={actief}
                    className={cn(
                      'min-h-[44px] px-4 rounded-full text-sm font-medium border transition-colors',
                      !actief && 'bg-background text-muted-foreground border-border hover:bg-muted',
                      actief && soort === 'allergeen' && 'bg-destructive/10 text-destructive border-destructive/30',
                      actief && soort === 'dieet' && 'bg-primary/10 text-primary border-primary/30',
                      actief && soort === 'info' && 'bg-muted text-foreground border-border',
                    )}
                  >
                    {GERECHT_LABEL_NAAM[code]}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-polar border p-4">
            <div>
              <p className="text-sm font-medium">Gecontroleerd</p>
              <p className="text-xs text-muted-foreground">Uit = toont oranje waarschuwing "nog te controleren"</p>
            </div>
            <Switch checked={gecontroleerd} onCheckedChange={setGecontroleerd} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gerecht-notitie">Notitie (optioneel)</Label>
            <Textarea
              id="gerecht-notitie"
              value={notitie}
              onChange={(e) => setNotitie(e.target.value)}
              rows={2}
              placeholder="Bijv. wisselende leverancier, sporen van noten"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" className="min-h-[44px]" onClick={() => onOpenChange(false)}>
            Annuleren
          </Button>
          <Button className="min-h-[44px]" onClick={opslaan} disabled={upsert.isPending}>
            {upsert.isPending ? 'Opslaan…' : 'Opslaan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
