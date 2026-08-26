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
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Printer } from 'lucide-react';
import { MepTaak } from '@/hooks/useMepTaken';
import { useCreatePrintJob } from '@/hooks/usePrintJobs';
import { supabase } from '@/integrations/supabase/client';

interface Props {
  taak: MepTaak | null;
  onOpenChange: (v: boolean) => void;
  onAfronden: (args: {
    taakId: string;
    aantal: number;
    temperatuur?: number | null;
    notitie?: string | null;
  }) => Promise<{ batch_nummer: string; hoeveelheid: number; eenheid: string } | unknown>;
}

export function MepAfrondDialog({ taak, onOpenChange, onAfronden }: Props) {
  const [aantal, setAantal] = useState(1);
  const [temperatuur, setTemperatuur] = useState('');
  const [notitie, setNotitie] = useState('');
  const [sticker, setSticker] = useState(true);
  const [bezig, setBezig] = useState(false);
  const print = useCreatePrintJob();

  useEffect(() => {
    if (taak) {
      setAantal(Number(taak.doel_aantal ?? 1));
      setTemperatuur('');
      setNotitie('');
      setSticker(!!taak.recept_id);
    }
  }, [taak]);

  const bevestig = async () => {
    if (!taak) return;
    if (aantal <= 0) {
      toast.error('Aantal moet groter dan 0 zijn');
      return;
    }
    setBezig(true);
    try {
      const res: any = await onAfronden({
        taakId: taak.id,
        aantal,
        temperatuur: temperatuur === '' ? null : Number(temperatuur),
        notitie: notitie.trim() || null,
      });
      toast.success(`Afgerond · batch ${res?.batch_nummer ?? ''}`.trim());

      if (sticker && taak.recept_id) {
        const { data: recept } = await supabase
          .from('recipes')
          .select('id, name, tht_dagen, bereiding')
          .eq('id', taak.recept_id)
          .maybeSingle();
        if (recept) {
          await print.mutateAsync({
            id: recept.id,
            name: recept.name,
            tht_dagen: recept.tht_dagen,
            aantal: Math.max(1, Math.round(aantal)),
          } as any);
        }
      }
      onOpenChange(false);
    } catch (e: any) {
      toast.error('Afronden mislukt: ' + (e?.message ?? 'onbekende fout'));
    } finally {
      setBezig(false);
    }
  };

  return (
    <Dialog open={!!taak} onOpenChange={(v) => !v && onOpenChange(false)}>
      <DialogContent className="max-w-[650px]">
        <DialogHeader>
          <DialogTitle>{taak?.titel} afronden</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Hoeveel {taak?.doel_eenheid ?? 'stuks'} gemaakt?</Label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                className="h-14 w-14 text-xl"
                onClick={() => setAantal((a) => Math.max(1, a - 1))}
              >
                −
              </Button>
              <Input
                className="h-14 text-center text-xl tabular-nums"
                type="number"
                inputMode="decimal"
                value={aantal}
                onChange={(e) => setAantal(Number(e.target.value))}
              />
              <Button
                type="button"
                variant="outline"
                className="h-14 w-14 text-xl"
                onClick={() => setAantal((a) => a + 1)}
              >
                +
              </Button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Kerntemperatuur (optioneel)</Label>
            <Input
              className="h-12"
              type="number"
              inputMode="decimal"
              placeholder="bijv. 75"
              value={temperatuur}
              onChange={(e) => setTemperatuur(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Notitie (optioneel)</Label>
            <Textarea rows={2} value={notitie} onChange={(e) => setNotitie(e.target.value)} />
          </div>

          {taak?.recept_id && (
            <div className="flex items-center justify-between rounded-polar border border-border/60 px-4 py-3">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-muted-foreground" />
                <span className="text-[15px]">Sticker printen</span>
              </div>
              <Switch checked={sticker} onCheckedChange={setSticker} />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={bezig}>
            Annuleren
          </Button>
          <Button onClick={bevestig} disabled={bezig} className="min-h-[44px]">
            {bezig ? 'Afronden…' : 'Klaar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
