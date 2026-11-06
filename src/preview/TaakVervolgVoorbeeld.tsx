import { createRoot } from 'react-dom/client';
import { useState } from 'react';
import { ChefHat, PackageX } from 'lucide-react';
import '@/index.css';
import { Button } from '@/components/ui/button';
import { SectieBalk } from '@/components/foh/SectieBalk';
import { FalafelAanvulRij } from '@/components/foh/FalafelAanvulRij';
import { TaakBewerkKnop } from '@/components/foh/TaakBewerkKnop';
import { TaakVervolgPaneel } from '@/components/foh/TaakVervolgPaneel';
import { cn } from '@/lib/utils';
import type { KetenInvoer } from '@/lib/keten';

const params = new URLSearchParams(window.location.search);
const eigenaar = params.get('rol') !== 'medewerker';
const paneelOpen = params.get('paneel') === '1';

function Rij({
  naam,
  uitleg,
  mep,
  onBewerk,
}: {
  naam: string;
  uitleg: string;
  mep?: boolean;
  onBewerk?: () => void;
}) {
  return (
    <li className="flex flex-wrap items-center gap-1.5 rounded-[14px] border border-border bg-card px-2 py-1 sm:gap-3">
      <button type="button" aria-label={`${naam} afvinken`} className="flex h-11 w-11 shrink-0 items-center justify-center">
        <span className="flex h-[26px] w-[26px] items-center justify-center rounded-[6px] border-2 border-border bg-background sm:h-6 sm:w-6" />
      </button>
      <div className={cn('min-w-0 flex-1 py-1.5', onBewerk && 'min-w-40')}>
        <p className="text-[16px] font-medium leading-snug text-foreground">{naam}</p>
        <p className="mt-0.5 text-[13px] leading-snug text-muted-foreground">{uitleg}</p>
      </div>
      {onBewerk && <TaakBewerkKnop naam={naam} onClick={onBewerk} />}
      {mep ? (
        <Button variant="ghost" className="h-11 shrink-0 gap-1.5 rounded-[14px] border border-primary/20 bg-primary/10 px-3 text-[13px] font-medium text-primary">
          <ChefHat className="h-4 w-4" /> Naar MEP
        </Button>
      ) : (
        <Button variant="ghost" className="h-11 shrink-0 gap-1.5 rounded-[14px] border border-border bg-muted/60 px-3 text-[13px] font-medium text-foreground">
          <PackageX className="h-4 w-4" /> Bijbestellen
        </Button>
      )}
    </li>
  );
}

function Scherm() {
  const [open, setOpen] = useState(paneelOpen);
  const [waarde, setWaarde] = useState<KetenInvoer>({
    instructie: 'Zet 1 bak uit de vriezer in de koelcel.',
    stapKoelcel: true,
    stapVriezer: true,
    stapMagazijn: false,
    eindactie: 'bestelbord',
    komtUitMidsland: false,
  });
  const bewerk = eigenaar ? () => setOpen(true) : undefined;
  return (
    <main className={cn('min-h-screen bg-background px-3 py-4')}>
      <SectieBalk titel="Bijvullen" stand="1/4" />
      <h3 className="mb-3 mt-4 text-[13px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">
        Links boven <span className="rounded bg-muted-foreground/10 px-1.5 py-0.5 text-[11px] font-medium normal-case tracking-normal">0/3</span>
      </h3>
      <ul className="space-y-1.5">
        <FalafelAanvulRij
          naam="Falafel"
          vulnorm="half"
          eenheid="bak"
          doelAantal={1}
          batchAantal={1}
          afgevinkt={false}
          doorgezet={false}
          laden={false}
          fout={false}
          onOpPeil={() => {}}
          onAangevuld={() => {}}
          onOntdooien={() => {}}
          onBestellen={() => {}}
          onHerstel={() => {}}
          onVink={() => {}}
          onBewerk={bewerk}
        />
        <Rij naam="Hummus" uitleg="Min. ½ · uit de koelcel" onBewerk={bewerk} />
        <Rij naam="Tzatziki" uitleg="Vol · zelf maken" mep onBewerk={bewerk} />
      </ul>
      {eigenaar && (
        <TaakVervolgPaneel
          open={open}
          naam="Falafel"
          waarde={waarde}
          midslandVast={false}
          internBeschikbaar={false}
          internLaden={false}
          opslaanBezig={false}
          onOpenChange={setOpen}
          onOpslaan={(invoer) => {
            setWaarde(invoer);
            setOpen(false);
          }}
        />
      )}
    </main>
  );
}

const root = document.getElementById('root');
if (root) createRoot(root).render(<Scherm />);
