import { useState } from 'react';
import { Ruler } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

/**
 * Visueel naslagwerk: hoe diep is laag / midden / hoog, en hoe groot zijn de
 * GN-maten? Alleen uitleg — er valt hier niets in te stellen.
 */

/** De drie hoogtes met de echte GN-diepte in mm (65 / 100 / 150). */
const HOOGTE_MM: Record<string, number> = { laag: 65, midden: 100, hoog: 150 };
const HOOGTE_UITLEG: Record<string, string> = {
  laag: 'plat · garnituur & toppings',
  midden: 'standaard · de meeste bakjes',
  hoog: 'diep · natte of grote producten',
};
const HOOGTE_VOLGORDE = ['laag', 'midden', 'hoog'] as const;

/** Bovenaanzicht: breedte × diepte in mm (echte GN-maten). */
const GN_BOVENAAN: { code: string; woord: string; b: number; d: number }[] = [
  { code: '1/1', woord: 'hele bak', b: 530, d: 325 },
  { code: '1/2', woord: 'halve bak', b: 265, d: 325 },
  { code: '1/3', woord: 'groot', b: 176, d: 325 },
  { code: '1/4', woord: 'breed', b: 265, d: 162 },
  { code: '1/6', woord: 'standaard', b: 176, d: 162 },
  { code: '1/9', woord: 'klein', b: 176, d: 108 },
];

/** Eén GN-bak in zijaanzicht: smaller aan de bodem, met overstaande rand. */
function BakjeZijaanzicht({ hoogte }: { hoogte: (typeof HOOGTE_VOLGORDE)[number] }) {
  const mm = HOOGTE_MM[hoogte];
  // 150mm → 96px hoog getekend; bodem 12% smaller dan de rand.
  const h = Math.round((mm / 150) * 96);
  const randHoogte = 7;
  const totaal = h + randHoogte;
  const bodemInset = 6;
  const breedte = 92;
  return (
    <div className="flex flex-col items-center gap-2">
      <svg
        width={breedte + 20}
        height={totaal + 8}
        viewBox={`0 0 ${breedte + 20} ${totaal + 8}`}
        className="block"
        role="img"
        aria-label={`GN bakje, ${hoogte}`}
      >
        {/* wand van de bak: taps toelopend profiel */}
        <path
          d={`M 10 ${randHoogte + 2} L ${10 + bodemInset} ${randHoogte + h} L ${breedte + 10 - bodemInset} ${randHoogte + h} L ${breedte + 10} ${randHoogte + 2} Z`}
          fill="hsl(var(--muted))"
          stroke="hsl(var(--border))"
          strokeWidth="1.5"
        />
        {/* overstaande rand bovenop */}
        <rect
          x={2}
          y={0}
          width={breedte + 16}
          height={randHoogte}
          rx={2}
          fill="hsl(var(--muted))"
          stroke="hsl(var(--border))"
          strokeWidth="1.5"
        />
      </svg>
      <div className="text-center">
        <p className="text-[15px] font-bold text-foreground">{hoogte}</p>
        <p className="text-[13px] tabular-nums text-muted-foreground">{(mm / 10).toLocaleString('nl-NL')} cm diep</p>
        <p className="text-[12px] text-muted-foreground">{HOOGTE_UITLEG[hoogte]}</p>
      </div>
    </div>
  );
}

export function BakmaatUitleg({ variant = 'knop' }: { variant?: 'knop' | 'link' }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {variant === 'knop' ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex h-11 items-center gap-2 rounded-[14px] border border-border bg-card px-4 text-[14px] font-medium text-muted-foreground transition-colors hover:bg-muted"
        >
          <Ruler size={18} className="text-primary" />
          Bakmaten bekijken
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Bakmaten bekijken"
          className="inline-flex h-11 w-11 items-center justify-center rounded-[10px] border border-border text-muted-foreground"
        >
          <Ruler size={16} className="text-primary" />
        </button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[650px] rounded-[24px]">
          <DialogHeader>
            <DialogTitle className="text-[17px]">Zo groot zijn de bakjes</DialogTitle>
          </DialogHeader>

          {/* Zijaanzicht: hoe diep? */}
          <div>
            <p className="mb-3 text-[13px] font-medium text-muted-foreground">Hoe diep? (zijaanzicht)</p>
            <div className="flex items-end justify-center gap-8 rounded-[16px] border border-border bg-muted/40 px-4 pb-4 pt-5">
              {HOOGTE_VOLGORDE.map((h) => (
                <BakjeZijaanzicht key={h} hoogte={h} />
              ))}
            </div>
          </div>

          {/* Bovenaanzicht: hoe groot? */}
          <div>
            <p className="mb-3 mt-5 text-[13px] font-medium text-muted-foreground">Hoe groot? (van boven)</p>
            <div className="grid grid-cols-3 gap-3">
              {GN_BOVENAAN.map((gn) => (
                <div key={gn.code} className="flex flex-col items-center gap-1.5 rounded-[14px] border border-border bg-card px-2 py-3">
                  <svg width={96} height={64} viewBox="0 0 96 64" role="img" aria-label={`GN ${gn.code}`}>
                    <rect
                      x={48 - (gn.b / 530) * 44}
                      y={32 - (gn.d / 325) * 28}
                      width={(gn.b / 530) * 88}
                      height={(gn.d / 325) * 56}
                      rx={3}
                      fill="hsl(var(--muted))"
                      stroke="hsl(var(--border))"
                      strokeWidth="1.5"
                    />
                  </svg>
                  <p className="text-[13px] font-semibold text-foreground">GN {gn.code} · {gn.woord}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[12px] text-muted-foreground">
              Maat en hoogte zijn twee losse keuzes: een standaard bakje (GN 1/6) kan laag, midden of hoog zijn.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setOpen(false)}
            className="mt-2 h-12 w-full rounded-[14px] bg-primary text-[15px] font-semibold text-primary-foreground"
          >
            Sluiten
          </button>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default BakmaatUitleg;
