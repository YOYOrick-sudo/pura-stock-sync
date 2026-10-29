import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { EmptyCell, StatusDot } from '@/components/ui/data-table';
import { KAART_CODE_UITLEG } from '@/lib/gerecht-labels';
import { ALLERGEEN_LABEL, isAllergeen, type AllergeenCode } from '@/lib/allergenen';
import type { Gerecht, GerechtAllergenen } from '@/hooks/useGerechten';

function KaartBadge({ code }: { code: keyof typeof KAART_CODE_UITLEG }) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip>
        <PopoverTrigger asChild>
          <TooltipTrigger asChild>
            <Button variant="ghost" className="h-11 min-w-11 px-0.5" aria-label={`${code}: ${KAART_CODE_UITLEG[code]}`}>
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
  const geldig = Array.from(new Set(codes)).filter((c) => c in KAART_CODE_UITLEG);
  if (geldig.length === 0) return <EmptyCell />;
  return (
    <div className="-my-2 flex items-center">
      {geldig.map((code) => <KaartBadge key={code} code={code as keyof typeof KAART_CODE_UITLEG} />)}
    </div>
  );
}

/** Bevat/sporen uit het vooraf berekende recept, Horeko heeft voorrang. */
export function receptAllergenen(recept?: GerechtAllergenen): { bevat: AllergeenCode[]; sporen: AllergeenCode[] } {
  if (!recept) return { bevat: [], sporen: [] };
  const bevat = (recept.horeko_bevat?.length ? recept.horeko_bevat : recept.recept_allergenen ?? []).filter(isAllergeen);
  const sporen = (recept.horeko_bevat_mogelijk?.length ? recept.horeko_bevat_mogelijk : recept.recept_sporen ?? [])
    .filter(isAllergeen).filter((c) => !bevat.includes(c));
  return { bevat, sporen };
}

export function GerechtReceptBevat({ gerecht, recept, laden, fout }: {
  gerecht: Gerecht;
  recept?: GerechtAllergenen;
  laden: boolean;
  fout: boolean;
}) {
  if (gerecht.horeko_match !== 'zeker') return <StatusDot tone="muted">Nog geen recept gekoppeld</StatusDot>;
  if (laden) return <span className="text-sm text-muted-foreground">Laden…</span>;
  if (fout || !recept) return <StatusDot>Niet beschikbaar</StatusDot>;
  const { bevat } = receptAllergenen(recept);
  return (
    <div className="space-y-1">
      <div className="flex flex-wrap items-center gap-1.5">
        {bevat.length === 0 ? (recept.recept_status === 'compleet' || recept.recept_status === 'voorstel' ? <EmptyCell /> : null) : bevat.map((code) => (
          <span key={code} className="rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-medium text-destructive">{ALLERGEEN_LABEL[code]}</span>
        ))}
      </div>
      {recept.recept_status === 'onvolledig' ? (
        <StatusDot>{recept.recept_ingredienten_onbekend ?? 0} ingrediënten zonder allergeneninfo</StatusDot>
      ) : recept.recept_status === 'geen_regels' ? (
        <StatusDot>Geen allergeneninfo uit recept</StatusDot>
      ) : (
        <p className="text-xs text-muted-foreground">Uit recept (nog niet gecontroleerd)</p>
      )}
    </div>
  );
}

export function GerechtReceptSporen({ gerecht, recept }: { gerecht: Gerecht; recept?: GerechtAllergenen }) {
  if (gerecht.horeko_match !== 'zeker') return <EmptyCell />;
  const { sporen } = receptAllergenen(recept);
  if (sporen.length === 0) return <EmptyCell />;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {sporen.map((code) => (
        <span key={code} className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">{ALLERGEEN_LABEL[code]}</span>
      ))}
    </div>
  );
}
