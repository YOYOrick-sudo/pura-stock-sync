import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useMergeIngredienten, type IngredientStat } from '@/hooks/useIngredienten';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selected: IngredientStat[];
  onDone: () => void;
}

export function MergeIngredientenDialog({ open, onOpenChange, selected, onDone }: Props) {
  const [keep, setKeep] = useState<string>('');
  const merge = useMergeIngredienten();

  // Zorg dat er een default keep is (meest gebruikte)
  const defaultKeep =
    keep ||
    [...selected].sort((a, b) => b.aantal_recepten - a.aantal_recepten)[0]?.id ||
    '';
  const drop = selected.filter((s) => s.id !== defaultKeep).map((s) => s.id);
  const affected = selected
    .filter((s) => s.id !== defaultKeep)
    .reduce((sum, s) => sum + (s.aantal_recepten ?? 0), 0);
  const keepNaam = selected.find((s) => s.id === defaultKeep)?.naam ?? '';

  const handleConfirm = async () => {
    if (!defaultKeep || drop.length === 0) return;
    try {
      const n = await merge.mutateAsync({ keep: defaultKeep, drop });
      toast.success(`Samengevoegd — ${n} recept${n === 1 ? '' : 'en'} bijgewerkt`);
      onOpenChange(false);
      setKeep('');
      onDone();
    } catch (e: any) {
      toast.error('Samenvoegen mislukt: ' + (e.message ?? 'onbekende fout'));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[650px] rounded-[24px]">
        <DialogHeader>
          <DialogTitle>Ingrediënten samenvoegen</DialogTitle>
          <DialogDescription>
            Welke naam blijft bestaan? De andere ingrediënten worden vervangen en verwijderd.
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          <RadioGroup value={defaultKeep} onValueChange={setKeep} className="space-y-2">
            {selected.map((s) => (
              <label
                key={s.id}
                htmlFor={`keep-${s.id}`}
                className="flex items-center gap-3 rounded-polar-lg border border-border p-3 cursor-pointer hover:bg-muted/40 min-h-[52px]"
              >
                <RadioGroupItem value={s.id} id={`keep-${s.id}`} />
                <span className="flex-1 font-medium">{s.naam}</span>
                <span className="text-xs text-muted-foreground">
                  {s.aantal_recepten} recept{s.aantal_recepten === 1 ? '' : 'en'}
                </span>
              </label>
            ))}
          </RadioGroup>

          {defaultKeep && drop.length > 0 && (
            <div className="mt-4 rounded-polar-lg bg-primary/5 border border-primary/20 p-3 text-sm">
              <span className="font-semibold">{affected}</span>{' '}
              recept{affected === 1 ? '' : 'en'} worden omgezet naar{' '}
              <span className="font-semibold">"{keepNaam}"</span>.
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={merge.isPending}>
            Annuleren
          </Button>
          <Button onClick={handleConfirm} disabled={merge.isPending || !defaultKeep || drop.length === 0}>
            {merge.isPending ? 'Samenvoegen…' : 'Samenvoegen'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
