import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { ALLERGEEN_CODES, ALLERGEEN_LABEL, type AllergeenCode } from '@/lib/allergenen';
import { useUpdateIngredientAllergenen, type IngredientAllergenen } from '@/hooks/useAllergenen';

interface Props {
  ingredient: IngredientAllergenen | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function AllergenenEditDialog({ ingredient, open, onOpenChange }: Props) {
  const [codes, setCodes] = useState<AllergeenCode[]>([]);
  const [sporen, setSporen] = useState<AllergeenCode[]>([]);
  const [bron, setBron] = useState('');
  const update = useUpdateIngredientAllergenen();

  useEffect(() => {
    if (open && ingredient) {
      setCodes(ingredient.allergenen ?? []);
      setSporen(ingredient.allergenen_sporen ?? []);
      setBron(ingredient.allergenen_bron ?? '');
    }
  }, [open, ingredient]);

  const toggle = (list: AllergeenCode[], set: (v: AllergeenCode[]) => void, c: AllergeenCode) =>
    set(list.includes(c) ? list.filter((x) => x !== c) : [...list, c]);

  const save = async (status: 'bevestigd' | 'ai_voorstel') => {
    if (!ingredient) return;
    try {
      await update.mutateAsync({
        id: ingredient.id,
        allergenen: codes,
        allergenen_sporen: sporen,
        status,
        bron: bron.trim() || null,
      });
      toast.success(status === 'bevestigd' ? 'Allergenen bevestigd' : 'Opgeslagen als voorstel');
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.message ?? 'Opslaan mislukt');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[650px]">
        <DialogHeader>
          <DialogTitle>Allergenen — {ingredient?.naam}</DialogTitle>
          <DialogDescription>
            Vink aan wat volgens het productetiket in dit ingrediënt zit. "Bevestigen" betekent: gecontroleerd op de
            verpakking of leveranciersspecificatie.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">Bevat</p>
            <div className="flex flex-wrap gap-2">
              {ALLERGEEN_CODES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => toggle(codes, setCodes, c)}
                  className={cn(
                    'min-h-[40px] rounded-polar-md border px-3 text-sm transition-colors',
                    codes.includes(c)
                      ? 'border-destructive bg-destructive/10 text-destructive font-medium'
                      : 'border-input hover:bg-muted text-foreground',
                  )}
                >
                  {ALLERGEEN_LABEL[c]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
              Kan sporen bevatten
            </p>
            <div className="flex flex-wrap gap-2">
              {ALLERGEEN_CODES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => toggle(sporen, setSporen, c)}
                  className={cn(
                    'min-h-[40px] rounded-polar-md border px-3 text-sm transition-colors',
                    sporen.includes(c)
                      ? 'border-foreground/30 bg-muted font-medium'
                      : 'border-input hover:bg-muted text-muted-foreground',
                  )}
                >
                  {ALLERGEEN_LABEL[c]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">Bron / notitie</p>
            <Textarea
              value={bron}
              onChange={(e) => setBron(e.target.value)}
              placeholder="Bijv. etiket Hanos-verpakking, gecontroleerd op 12-01"
              rows={2}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => save('ai_voorstel')} disabled={update.isPending}>
            Opslaan als voorstel
          </Button>
          <Button onClick={() => save('bevestigd')} disabled={update.isPending}>
            Bevestigen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
