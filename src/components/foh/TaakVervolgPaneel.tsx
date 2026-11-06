import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DRUK } from './aanvulMotion';
import { cn } from '@/lib/utils';
import {
  beschikbareEindacties,
  eindLabel,
  ketenSamenvatting,
  normaliseerKeten,
  valideerKeten,
  type Eindactie,
  type KetenInvoer,
  type VoorraadStap,
} from '@/lib/keten';

const STAPPEN: readonly { id: VoorraadStap; label: string; veld: 'stapKoelcel' | 'stapVriezer' | 'stapMagazijn' }[] = [
  { id: 'koelcel', label: 'Koelcel', veld: 'stapKoelcel' },
  { id: 'vriezer', label: 'Vriezer', veld: 'stapVriezer' },
  { id: 'magazijn', label: 'Magazijn', veld: 'stapMagazijn' },
];

function Chip({
  actief,
  disabled,
  onClick,
  children,
}: {
  actief: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={actief}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'min-h-11 rounded-polar border px-4 text-[14px] font-medium transition-colors disabled:opacity-50',
        DRUK,
        actief
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border bg-card text-foreground hover:bg-muted',
      )}
    >
      {children}
    </button>
  );
}

export function TaakVervolgFormulier({
  naam,
  waarde,
  midslandVast,
  internBeschikbaar,
  internLaden,
  opslaanBezig,
  onOpslaan,
  onSluiten,
}: {
  naam: string;
  waarde: KetenInvoer;
  midslandVast: boolean;
  internBeschikbaar: boolean;
  internLaden: boolean;
  opslaanBezig: boolean;
  onOpslaan: (invoer: KetenInvoer) => void;
  onSluiten: () => void;
}) {
  const [instructie, setInstructie] = useState(waarde.instructie);
  const [stapKoelcel, setStapKoelcel] = useState(waarde.stapKoelcel);
  const [stapVriezer, setStapVriezer] = useState(waarde.stapVriezer);
  const [stapMagazijn, setStapMagazijn] = useState(waarde.stapMagazijn);
  const [eindactie, setEindactie] = useState<Eindactie>(waarde.eindactie);
  const [komtUitMidsland, setKomtUitMidsland] = useState(waarde.komtUitMidsland || midslandVast);
  const [fout, setFout] = useState<string | null>(null);

  useEffect(() => {
    setInstructie(waarde.instructie);
    setStapKoelcel(waarde.stapKoelcel);
    setStapVriezer(waarde.stapVriezer);
    setStapMagazijn(waarde.stapMagazijn);
    setEindactie(waarde.eindactie);
    setKomtUitMidsland(waarde.komtUitMidsland || midslandVast);
    setFout(null);
  }, [
    naam,
    waarde.instructie,
    waarde.stapKoelcel,
    waarde.stapVriezer,
    waarde.stapMagazijn,
    waarde.eindactie,
    waarde.komtUitMidsland,
    midslandVast,
  ]);

  const vlaggen = { stapKoelcel, stapVriezer, stapMagazijn };
  const zetStap = (veld: keyof typeof vlaggen, aan: boolean) => {
    if (veld === 'stapKoelcel') setStapKoelcel(aan);
    if (veld === 'stapVriezer') setStapVriezer(aan);
    if (veld === 'stapMagazijn') setStapMagazijn(aan);
  };
  const stappen = STAPPEN.filter((stap) => vlaggen[stap.veld]).map((stap) => stap.id);
  const midsland = midslandVast || komtUitMidsland;

  const bewaar = () => {
    const invoer = normaliseerKeten({
      instructie,
      stapKoelcel,
      stapVriezer,
      stapMagazijn,
      eindactie,
      komtUitMidsland: midsland,
    }, { midslandVast });
    const melding = valideerKeten(invoer);
    if (melding) {
      setFout(melding);
      return;
    }
    setFout(null);
    onOpslaan(invoer);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-2">
        <Label htmlFor="taak-instructie">Instructie</Label>
        <Textarea
          id="taak-instructie"
          value={instructie}
          onChange={(event) => setInstructie(event.target.value)}
          placeholder="Korte tekst onder de taak"
          rows={2}
          className="min-h-11 text-[16px]"
          aria-label={`Instructie voor ${naam}`}
        />
      </div>

      <div className="rounded-polar border border-border bg-card px-3 py-2">
        <button
          type="button"
          aria-pressed={midsland}
          disabled={midslandVast}
          onClick={() => {
            if (midslandVast) return;
            setKomtUitMidsland((aan) => {
              const volgend = !aan;
              if (!volgend) setEindactie((huidig) => huidig === 'intern_midsland' ? 'bestelbord' : huidig);
              return volgend;
            });
          }}
          className="flex min-h-11 w-full items-center gap-3 text-left disabled:opacity-100"
        >
          <span
            className={cn(
              'flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-polar-sm border-2 bg-background',
              midsland ? 'border-primary bg-primary/15 text-primary' : 'border-border',
            )}
          >
            {midsland ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : null}
          </span>
          <span className="text-[16px] font-medium text-foreground">Komt uit Midsland</span>
        </button>
        <p className="pb-1 pl-[38px] text-[13px] leading-snug text-muted-foreground">
          {midslandVast
            ? 'Dit product staat bij de interne producten. De eindactie is intern bestellen bij Midsland.'
            : midsland
              ? internLaden
                ? 'Even kijken of dit intern besteld kan worden.'
                : internBeschikbaar
                  ? 'De eindactie is intern bestellen bij Midsland.'
                  : 'De eindactie is intern bestellen bij Midsland. Bestellen lukt pas als het product bij de interne producten staat.'
              : 'Staat dit uit, dan kies je hieronder Naar MEP of bijbestellen.'}
        </p>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-[13px] font-medium text-foreground">Voorraadstappen</legend>
        <p className="text-[13px] leading-snug text-muted-foreground">
          Altijd in deze volgorde. Alleen de stappen die aan staan komen op de lijst.
        </p>
        <div className="flex flex-wrap gap-2">
          {STAPPEN.map((stap) => (
            <Chip
              key={stap.id}
              actief={vlaggen[stap.veld]}
              onClick={() => zetStap(stap.veld, !vlaggen[stap.veld])}
            >
              {stap.label}
            </Chip>
          ))}
        </div>
      </fieldset>

      {!midsland && (
        <fieldset className="space-y-2">
          <legend className="text-[13px] font-medium text-foreground">Eindactie</legend>
          <div className="flex flex-wrap gap-2">
            {beschikbareEindacties(false).map((actie) => (
              <Chip key={actie} actief={eindactie === actie} onClick={() => setEindactie(actie)}>
                {eindLabel(actie)}
              </Chip>
            ))}
          </div>
        </fieldset>
      )}

      <p className="text-[13px] leading-snug text-muted-foreground">
        {ketenSamenvatting(stappen, midsland ? 'intern_midsland' : (eindactie === 'intern_midsland' ? 'bestelbord' : eindactie))}
      </p>
      {fout && <p className="text-[13px] text-destructive">{fout}</p>}
      <DialogFooter className="gap-2 sm:gap-2">
        <Button type="button" variant="ghost" className={cn('h-11', DRUK)} onClick={onSluiten} disabled={opslaanBezig}>
          Sluiten
        </Button>
        <Button type="button" className={cn('h-11', DRUK)} onClick={bewaar} disabled={opslaanBezig}>
          {opslaanBezig ? 'Bewaren…' : 'Bewaar'}
        </Button>
      </DialogFooter>
    </div>
  );
}

export function TaakVervolgPaneel({
  open,
  naam,
  waarde,
  midslandVast,
  internBeschikbaar,
  internLaden,
  opslaanBezig,
  ketenAan = true,
  onOpenChange,
  onOpslaan,
}: {
  open: boolean;
  naam: string;
  waarde: KetenInvoer;
  midslandVast: boolean;
  internBeschikbaar: boolean;
  internLaden: boolean;
  opslaanBezig: boolean;
  /** Zonder aanvulketen bewaart het paneel wel, maar de lijst maakt nog niets aan. */
  ketenAan?: boolean;
  onOpenChange: (open: boolean) => void;
  onOpslaan: (invoer: KetenInvoer) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[650px] max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-left text-[16px]">{naam}</DialogTitle>
          <DialogDescription className="text-left text-[13px]">
            {ketenAan
              ? 'Welke stappen gelden, en wat er gebeurt als het overal op is.'
              : 'Welke stappen gelden, en wat er gebeurt als het overal op is. Bewaren kan nu. Op de lijst wordt er pas iets aangemaakt als de aanvulketen aan staat.'}
          </DialogDescription>
        </DialogHeader>
        <TaakVervolgFormulier
          naam={naam}
          waarde={waarde}
          midslandVast={midslandVast}
          internBeschikbaar={internBeschikbaar}
          internLaden={internLaden}
          opslaanBezig={opslaanBezig}
          onOpslaan={onOpslaan}
          onSluiten={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
