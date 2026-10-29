import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { KAART_CODE_UITLEG } from '@/lib/gerecht-labels';
import { ALLERGEEN_LABEL, isAllergeen } from '@/lib/allergenen';
import type { Gerecht, GerechtAllergenen } from '@/hooks/useGerechten';

function KaartBadge({ code }: { code: keyof typeof KAART_CODE_UITLEG }) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip>
        <PopoverTrigger asChild>
          <TooltipTrigger asChild>
            <Button variant="ghost" className="h-11 min-w-11 p-1" aria-label={`${code}: ${KAART_CODE_UITLEG[code]}`}>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">{code}</span>
            </Button>
          </TooltipTrigger>
        </PopoverTrigger>
        {!open && <TooltipContent>{KAART_CODE_UITLEG[code]}</TooltipContent>}
      </Tooltip>
      <PopoverContent className="text-sm">{KAART_CODE_UITLEG[code]}</PopoverContent>
    </Popover>
  );
}

export function GerechtKaartCodes({ codes }: { codes: string[] }) {
  return (
    <div className="flex flex-wrap items-center gap-0.5">
      {Array.from(new Set(codes)).map((code) => code in KAART_CODE_UITLEG
        ? <KaartBadge key={code} code={code as keyof typeof KAART_CODE_UITLEG} /> : null)}
    </div>
  );
}

export function GerechtReceptAllergenen({ gerecht, recept, laden, fout }: {
  gerecht: Gerecht;
  recept?: GerechtAllergenen;
  laden: boolean;
  fout: boolean;
}) {
  if (gerecht.horeko_match !== 'zeker') return (
    <div className="text-sm text-muted-foreground">—<p className="text-xs">Nog geen recept gekoppeld</p></div>
  );
  if (laden) return <span className="text-sm text-muted-foreground">Receptallergenen laden…</span>;
  if (fout || !recept) return <span className="text-xs text-warning">Receptallergenen niet beschikbaar</span>;
  const bevat = (recept.horeko_bevat?.length ? recept.horeko_bevat : recept.recept_allergenen ?? []).filter(isAllergeen);
  const sporen = (recept.horeko_bevat_mogelijk?.length ? recept.horeko_bevat_mogelijk : recept.recept_sporen ?? [])
    .filter(isAllergeen).filter((code) => !bevat.includes(code));
  return (
    <div className="space-y-1.5">
      <p className="text-xs text-muted-foreground">Uit recept (nog niet gecontroleerd)</p>
      <div className="flex flex-wrap gap-1.5">
        {bevat.map((code) => <span key={code} className="rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive">{ALLERGEEN_LABEL[code]}</span>)}
        {sporen.map((code) => <span key={code} className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">Kan bevatten: {ALLERGEEN_LABEL[code]}</span>)}
        {bevat.length === 0 && sporen.length === 0 && <span className="text-sm text-muted-foreground">—</span>}
      </div>
      {recept.recept_status === 'onvolledig' && <p className="text-xs text-warning">{recept.recept_ingredienten_onbekend ?? 0} ingrediënten zonder allergeneninfo</p>}
      {recept.recept_status === 'geen_regels' && <p className="text-xs text-warning">Geen allergeneninfo uit recept beschikbaar</p>}
    </div>
  );
}