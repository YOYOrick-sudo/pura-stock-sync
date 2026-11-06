import { useEffect, useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { DRUK, STAP_MOTION } from './aanvulMotion';
import { cn } from '@/lib/utils';
import {
  VERVOLG_OPTIES,
  normaliseerVervolg,
  valideerVervolg,
  type VervolgActie,
  type VervolgInvoer,
} from '@/lib/taakVervolg';

const INTERN_UITLEG = 'Dit product staat niet bij de interne producten. Daarom kun je het niet bij Midsland bestellen.';

function Keuze({
  gekozen,
  disabled,
  onClick,
  children,
}: {
  gekozen: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      aria-pressed={gekozen}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'h-11 w-full justify-start rounded-polar px-3 text-left text-[13px] font-medium',
        DRUK,
        gekozen
          ? 'border border-primary/30 bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary'
          : 'border border-border bg-card text-foreground hover:bg-muted',
        disabled && 'opacity-40',
      )}
    >
      {children}
    </Button>
  );
}

export function TaakVervolgFormulier({
  naam,
  waarde,
  internBeschikbaar,
  internLaden,
  opslaanBezig,
  onOpslaan,
  onSluiten,
}: {
  naam: string;
  waarde: VervolgInvoer;
  internBeschikbaar: boolean;
  internLaden: boolean;
  opslaanBezig: boolean;
  onOpslaan: (invoer: VervolgInvoer) => void;
  onSluiten: () => void;
}) {
  const [instructie, setInstructie] = useState(waarde.instructie);
  const [vervolgactie, setVervolgactie] = useState<VervolgActie>(waarde.vervolgactie);
  const [vervolgAlsOp, setVervolgAlsOp] = useState<VervolgActie | null>(waarde.vervolgAlsOp);
  const [fout, setFout] = useState<string | null>(null);

  useEffect(() => {
    setInstructie(waarde.instructie);
    setVervolgactie(waarde.vervolgactie);
    setVervolgAlsOp(waarde.vervolgAlsOp);
    setFout(null);
  }, [naam, waarde.instructie, waarde.vervolgactie, waarde.vervolgAlsOp]);

  const internUit = internLaden || !internBeschikbaar;
  const kies = (actie: VervolgActie) => {
    if (actie === 'intern_midsland' && internUit) return;
    setVervolgactie(actie);
    if (actie === 'geen' || vervolgAlsOp === actie) setVervolgAlsOp(null);
  };

  const bewaar = () => {
    const invoer = normaliseerVervolg({ instructie, vervolgactie, vervolgAlsOp });
    const melding = valideerVervolg(invoer, { internBeschikbaar: !internUit });
    if (melding) {
      setFout(melding);
      return;
    }
    setFout(null);
    onOpslaan(invoer);
  };

  return (
    <div className={cn('flex flex-col gap-4', STAP_MOTION)}>
      <label className="flex flex-col gap-1.5 text-[13px] font-medium text-foreground">
        Instructie
        <Textarea
          value={instructie}
          onChange={(event) => setInstructie(event.target.value)}
          placeholder="Korte tekst onder de taak"
          rows={2}
          className="min-h-11 text-[16px]"
          aria-label={`Instructie voor ${naam}`}
        />
      </label>
      <fieldset className="flex flex-col gap-1.5">
        <legend className="mb-1 text-[13px] font-medium text-foreground">Na het afvinken</legend>
        {VERVOLG_OPTIES.map((optie) => {
          const uit = optie.id === 'intern_midsland' && internUit;
          return (
            <Keuze key={optie.id} gekozen={vervolgactie === optie.id} disabled={uit} onClick={() => kies(optie.id)}>
              {optie.label}
            </Keuze>
          );
        })}
        {internUit && (
          <p className="text-[13px] leading-snug text-muted-foreground">
            {internLaden ? 'Even kijken of dit intern besteld kan worden.' : INTERN_UITLEG}
          </p>
        )}
      </fieldset>
      {vervolgactie !== 'geen' && (
        <fieldset className={cn('flex flex-col gap-1.5', STAP_MOTION)}>
          <legend className="mb-1 text-[13px] font-medium text-foreground">Als het niet bij te vullen is</legend>
          <p className="text-[13px] leading-snug text-muted-foreground">Bijvoorbeeld als de vriezer leeg is.</p>
          <Keuze gekozen={vervolgAlsOp == null} onClick={() => setVervolgAlsOp(null)}>Geen</Keuze>
          {VERVOLG_OPTIES.filter((optie) => optie.id !== 'geen' && optie.id !== vervolgactie).map((optie) => {
            const uit = optie.id === 'intern_midsland' && internUit;
            return (
              <Keuze
                key={optie.id}
                gekozen={vervolgAlsOp === optie.id}
                disabled={uit}
                onClick={() => { if (!uit) setVervolgAlsOp(optie.id); }}
              >
                {optie.label}
              </Keuze>
            );
          })}
        </fieldset>
      )}
      {fout && <p className="text-[13px] text-destructive">{fout}</p>}
      <div className="flex gap-2">
        <Button type="button" variant="ghost" className={cn('h-11 flex-1', DRUK)} onClick={onSluiten} disabled={opslaanBezig}>
          Sluiten
        </Button>
        <Button type="button" className={cn('h-11 flex-1', DRUK)} onClick={bewaar} disabled={opslaanBezig}>
          {opslaanBezig ? 'Bewaren…' : 'Bewaar'}
        </Button>
      </div>
    </div>
  );
}

export function TaakVervolgPaneel({
  open,
  naam,
  waarde,
  internBeschikbaar,
  internLaden,
  opslaanBezig,
  onOpenChange,
  onOpslaan,
}: {
  open: boolean;
  naam: string;
  waarde: VervolgInvoer;
  internBeschikbaar: boolean;
  internLaden: boolean;
  opslaanBezig: boolean;
  onOpenChange: (open: boolean) => void;
  onOpslaan: (invoer: VervolgInvoer) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-polar px-4 pb-6 pt-4 duration-200">
        <SheetHeader className="mb-3 space-y-1 text-left">
          <SheetTitle className="text-[16px]">{naam}</SheetTitle>
          <SheetDescription>Wat er moet gebeuren, en wat je daarna doet.</SheetDescription>
        </SheetHeader>
        <TaakVervolgFormulier
          naam={naam}
          waarde={waarde}
          internBeschikbaar={internBeschikbaar}
          internLaden={internLaden}
          opslaanBezig={opslaanBezig}
          onOpslaan={onOpslaan}
          onSluiten={() => onOpenChange(false)}
        />
      </SheetContent>
    </Sheet>
  );
}
