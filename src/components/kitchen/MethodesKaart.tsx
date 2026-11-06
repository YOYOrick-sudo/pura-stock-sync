import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash2, Clock, CalendarClock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  HalffabricaatMethode,
  METHODE_TYPES,
  useDeleteMethode,
  useMethodes,
  useSaveMethode,
} from '@/hooks/useHalffabricaatMethodes';
import { telwoord } from '@/lib/hoeveelheid';

const EENHEDEN = ['gram', 'kg', 'ml', 'liter', 'stuks', 'bakken', 'zakken', 'porties'];

interface Props {
  receptId: string;
  /** Alleen managers/eigenaren mogen methodes wijzigen. */
  kanBeheren?: boolean;
}

const leeg = {
  type: 'Bereiden',
  visuele_eenheid: 'bak',
  output_hoeveelheid: 1,
  output_eenheid: 'stuks',
  standaard_duur: 15,
  houdbaarheid: null as number | null,
  instructie: '',
};

export function MethodesKaart({ receptId, kanBeheren = true }: Props) {
  const { data: methodes = [], isLoading, isError } = useMethodes(receptId);
  const save = useSaveMethode();
  const del = useDeleteMethode();

  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(leeg);

  const openNieuw = () => {
    setEditId(null);
    setForm(leeg);
    setOpen(true);
  };

  const openBewerk = (m: HalffabricaatMethode) => {
    setEditId(m.id);
    setForm({
      type: m.type,
      visuele_eenheid: m.visuele_eenheid,
      output_hoeveelheid: Number(m.output_hoeveelheid),
      output_eenheid: m.output_eenheid,
      standaard_duur: m.standaard_duur,
      houdbaarheid: m.houdbaarheid,
      instructie: m.instructie ?? '',
    });
    setOpen(true);
  };

  const opslaan = async () => {
    if (!form.visuele_eenheid.trim()) {
      toast.error('Vul een zichtbare eenheid in, bijvoorbeeld "bak"');
      return;
    }
    if (!form.output_hoeveelheid || form.output_hoeveelheid <= 0) {
      toast.error('Opbrengst moet groter dan 0 zijn');
      return;
    }
    try {
      await save.mutateAsync({
        id: editId ?? undefined,
        recept_id: receptId,
        type: form.type,
        visuele_eenheid: form.visuele_eenheid.trim(),
        output_hoeveelheid: form.output_hoeveelheid,
        output_eenheid: form.output_eenheid,
        standaard_duur: form.standaard_duur,
        houdbaarheid: form.houdbaarheid,
        instructie: form.instructie.trim() || null,
        sort_order: methodes.length * 10,
      });
      toast.success(editId ? 'Handeling bijgewerkt' : 'Handeling toegevoegd');
      setOpen(false);
    } catch (e: any) {
      toast.error('Opslaan mislukt: ' + (e?.message ?? 'onbekende fout'));
    }
  };

  const verwijder = async (m: HalffabricaatMethode) => {
    try {
      await del.mutateAsync(m.id);
      toast.success('Handeling verwijderd');
    } catch (e: any) {
      toast.error('Verwijderen mislukt: ' + (e?.message ?? 'onbekende fout'));
    }
  };

  return (
    <Card>
      <div className="flex min-h-12 items-center justify-between gap-2 border-b border-border px-4 lg:px-6">
        <h2 className="text-sm font-semibold text-foreground">Handelingen</h2>
        {kanBeheren && (
          <Button size="touch" variant="outline" onClick={openNieuw}>
            <Plus aria-hidden />
            Handeling
          </Button>
        )}
      </div>

      {isLoading && !isError ? (
        <div className="space-y-2 px-4 py-2 lg:px-6" aria-busy="true">
          <span className="sr-only">Handelingen laden</span>
          <Skeleton className="h-11 w-full rounded-polar-sm" />
          <Skeleton className="h-11 w-2/3 rounded-polar-sm" />
        </div>
      ) : methodes.length === 0 ? (
        <p className="px-4 py-2 text-sm text-muted-foreground lg:px-6">Geen handelingen.</p>
      ) : (
        <ul>
          {methodes.map((m) => (
            <li key={m.id} className="flex min-h-12 items-center gap-2 border-b border-border px-4 py-2 last:border-b-0 lg:px-6">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-foreground">{m.type}</span>
                  <Badge variant="secondary">
                    1 {m.visuele_eenheid} = {Number(m.output_hoeveelheid)} {m.output_eenheid}
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-2">
                    <Clock className="h-4 w-4" aria-hidden />~{m.standaard_duur} min
                  </span>
                  {m.houdbaarheid != null && (
                    <span className="inline-flex items-center gap-2">
                      <CalendarClock className="h-4 w-4" aria-hidden />
                      {telwoord(m.houdbaarheid, 'dag', 'dagen')} houdbaar
                    </span>
                  )}
                </div>
                {m.instructie && (
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{m.instructie}</p>
                )}
              </div>
              {kanBeheren && (
                <div className="flex shrink-0 items-center gap-2">
                  <Button size="touch-icon" variant="ghost" aria-label="Bewerken" onClick={() => openBewerk(m)}>
                    <Pencil aria-hidden />
                  </Button>
                  <Button
                    size="touch-icon"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    aria-label="Verwijderen"
                    onClick={() => verwijder(m)}
                  >
                    <Trash2 aria-hidden />
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[650px]">
          <DialogHeader>
            <DialogTitle>{editId ? 'Handeling bewerken' : 'Handeling toevoegen'}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Soort handeling</Label>
              <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}>
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {METHODE_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Zichtbare eenheid</Label>
              <Input
                className="h-11"
                placeholder="bak, bus, gastro"
                value={form.visuele_eenheid}
                onChange={(e) => setForm((f) => ({ ...f, visuele_eenheid: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Opbrengst per eenheid</Label>
              <Input
                className="h-11"
                type="number"
                inputMode="decimal"
                value={form.output_hoeveelheid}
                onChange={(e) => setForm((f) => ({ ...f, output_hoeveelheid: Number(e.target.value) }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Eenheid opbrengst</Label>
              <Select
                value={form.output_eenheid}
                onValueChange={(v) => setForm((f) => ({ ...f, output_eenheid: v }))}
              >
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EENHEDEN.map((e) => (
                    <SelectItem key={e} value={e}>
                      {e}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Standaardduur (minuten)</Label>
              <Input
                className="h-11"
                type="number"
                inputMode="numeric"
                value={form.standaard_duur}
                onChange={(e) => setForm((f) => ({ ...f, standaard_duur: Number(e.target.value) }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Houdbaarheid (dagen)</Label>
              <Input
                className="h-11"
                type="number"
                inputMode="numeric"
                placeholder="leeg = onbekend"
                value={form.houdbaarheid ?? ''}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    houdbaarheid: e.target.value === '' ? null : Number(e.target.value),
                  }))
                }
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label>Korte instructie (optioneel)</Label>
              <Textarea
                rows={3}
                placeholder="Wat moet er precies gebeuren?"
                value={form.instructie}
                onChange={(e) => setForm((f) => ({ ...f, instructie: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={save.isPending}>
              Annuleren
            </Button>
            <Button onClick={opslaan} disabled={save.isPending}>
              {save.isPending ? 'Opslaan…' : 'Opslaan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
