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
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Printer, Snowflake, ChefHat, Tag } from 'lucide-react';
import { addDays, format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { MepTaak } from '@/hooks/useMepTaken';
import { useCreateStickerPrintJob } from '@/hooks/useStickerProducten';
import type { StickerType } from '@/lib/labelZpl';

interface Props {
  taak: MepTaak | null;
  onOpenChange: (v: boolean) => void;
  onAfronden: (args: {
    taakId: string;
    aantal: number;
    temperatuur?: number | null;
  }) => Promise<{ batch_nummer: string; hoeveelheid: number; eenheid: string } | unknown>;
}

const TYPES: { key: StickerType; label: string; icon: typeof Snowflake }[] = [
  { key: 'bereid', label: 'Bereid', icon: ChefHat },
  { key: 'ontdooid', label: 'Ontdooid', icon: Snowflake },
  { key: 'vrij', label: 'Vrij', icon: Tag },
];
const DEFAULT_THT: Record<StickerType, number> = { ontdooid: 2, bereid: 3, vrij: 0 };

function fmtDatum(d: Date) {
  return format(d, 'EEE dd-MM', { locale: nl });
}

export function MepAfrondDialog({ taak, onOpenChange, onAfronden }: Props) {
  const [aantal, setAantal] = useState(1);
  const [temperatuur, setTemperatuur] = useState('');
  const [sticker, setSticker] = useState(true);
  const [stickerType, setStickerType] = useState<StickerType>('bereid');
  const [stickerNaam, setStickerNaam] = useState('');
  const [thtDagen, setThtDagen] = useState(3);
  const [stickerAantal, setStickerAantal] = useState(1);
  const [bezig, setBezig] = useState(false);
  const printSticker = useCreateStickerPrintJob();

  useEffect(() => {
    if (taak) {
      setAantal(Number(taak.doel_aantal ?? 1));
      setTemperatuur('');
      setSticker(true);
      setStickerType('bereid');
      setStickerNaam(taak.titel);
      setThtDagen(DEFAULT_THT.bereid);
      setStickerAantal(1);
    }
  }, [taak]);

  const kiesType = (t: StickerType) => {
    setStickerType(t);
    setThtDagen(DEFAULT_THT[t]);
  };

  const bevestig = async () => {
    if (!taak) return;
    if (aantal <= 0) {
      toast.error('Aantal moet groter dan 0 zijn');
      return;
    }
    setBezig(true);
    let afrondingGelukt = false;
    try {
      const res: any = await onAfronden({
        taakId: taak.id,
        aantal,
        temperatuur: temperatuur === '' ? null : Number(temperatuur),
      });
      afrondingGelukt = true;
      toast.success(`Afgerond · batch ${res?.batch_nummer ?? ''}`.trim());
    } catch (e: any) {
      toast.error('Afronden mislukt: ' + (e?.message ?? 'onbekende fout'));
      setBezig(false);
      return;
    }

    if (sticker) {
      const naam = stickerNaam.trim() || taak.titel;
      if (naam) {
        try {
          const vandaag = new Date();
          await printSticker.mutateAsync({
            type: stickerType,
            naam,
            datum1: fmtDatum(vandaag),
            datum2: stickerType === 'vrij' ? undefined : fmtDatum(addDays(vandaag, thtDagen)),
            tht_dagen: stickerType === 'vrij' ? null : thtDagen,
            aantal: stickerAantal,
            bron: 'mep',
          });
          toast.success(
            stickerAantal > 1
              ? `${stickerAantal} stickers in de wachtrij`
              : 'Sticker in de wachtrij — komt er niets uit, kijk dan bij de statusbalk',
          );
        } catch (e: any) {
          toast.warning(
            `Taak afgerond, maar sticker kon niet worden geprint: ${e?.message ?? 'onbekende fout'}`,
          );
        }
      } else {
        toast.warning('Taak afgerond. Vul een productnaam in om een sticker te printen.');
      }
    }

    onOpenChange(false);
    setBezig(false);
  };

  return (
    <Dialog open={!!taak} onOpenChange={(v) => !v && onOpenChange(false)}>
      <DialogContent className="max-w-[560px] p-4 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-1">
          <DialogTitle className="text-lg">{taak?.titel} afronden</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {/* Aantal + temperatuur */}
          <div className="grid grid-cols-[1fr_auto] gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm">Hoeveel {taak?.doel_eenheid ?? 'stuks'}?</Label>
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
                  inputMode="decimal"
                  value={aantal}
                  onChange={(e) => setAantal(Number(e.target.value))}
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
            </div>

            <div className="space-y-1.5 w-[110px]">
              <Label className="text-sm">Kerntemp.</Label>
              <Input
                className="h-12 text-center"
                type="number"
                inputMode="decimal"
                placeholder="°C"
                value={temperatuur}
                onChange={(e) => setTemperatuur(e.target.value)}
              />
            </div>
          </div>

          {/* Sticker */}
          <div className="rounded-polar border border-border/60">
            <div className="flex items-center justify-between px-3 py-2.5">
              <div className="flex items-center gap-2">
                <Printer className="w-4 h-4 text-muted-foreground" />
                <span className="text-[15px] font-medium">Sticker printen</span>
              </div>
              <Switch checked={sticker} onCheckedChange={setSticker} />
            </div>

            {sticker && (
              <div className="space-y-3 border-t border-border/60 px-3 py-3">
                <div className="flex flex-wrap gap-2">
                  {TYPES.map(({ key, label, icon: Icon }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => kiesType(key)}
                      className={cn(
                        'inline-flex min-h-[40px] items-center gap-1.5 rounded-polar-md border px-3 text-[14px] transition-colors',
                        stickerType === key
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-input bg-card hover:bg-muted',
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      {label}
                    </button>
                  ))}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm">Naam op sticker</Label>
                  <Input
                    className="h-11"
                    value={stickerNaam}
                    onChange={(e) => setStickerNaam(e.target.value)}
                    placeholder="Productnaam"
                  />
                </div>

                <div className="flex flex-wrap items-end gap-4">
                  {stickerType !== 'vrij' && (
                    <div className="space-y-1.5">
                      <Label className="text-sm">Houdbaar (dagen)</Label>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          className="h-10 w-10"
                          onClick={() => setThtDagen((d) => Math.max(1, d - 1))}
                        >
                          −
                        </Button>
                        <span className="w-9 text-center text-[16px] font-medium tabular-nums">
                          {thtDagen}
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          className="h-10 w-10"
                          onClick={() => setThtDagen((d) => Math.min(30, d + 1))}
                        >
                          +
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <Label className="text-sm">Aantal stickers</Label>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="h-10 w-10"
                        onClick={() => setStickerAantal((a) => Math.max(1, a - 1))}
                      >
                        −
                      </Button>
                      <span className="w-9 text-center text-[16px] font-medium tabular-nums">
                        {stickerAantal}
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        className="h-10 w-10"
                        onClick={() => setStickerAantal((a) => Math.min(20, a + 1))}
                      >
                        +
                      </Button>
                    </div>
                  </div>
                </div>

                {stickerType !== 'vrij' && (
                  <p className="text-sm text-muted-foreground">
                    T.h.t. {fmtDatum(addDays(new Date(), thtDagen))}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 pt-2">
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
