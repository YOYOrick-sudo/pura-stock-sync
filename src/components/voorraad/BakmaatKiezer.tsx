import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { bakjeLabel, GN_MATEN, HOOGTES, type Hoogte } from '@/lib/voorraad-formaat';

/**
 * Maat en hoogte kiezen in plaats van typen, zodat er nooit een nieuwe
 * schrijfwijze bij komt. Levert altijd "GN 1/6 hoog" op (of leeg).
 */
export function BakmaatKiezer({
  formaat,
  onWijzig,
  className = '',
}: {
  formaat?: string | null;
  onWijzig: (formaat: string | null) => void;
  className?: string;
}) {
  const bakje = bakjeLabel(formaat);
  const maat = bakje?.code ? (bakje.code.match(/\d\/\d/)?.[0] ?? '') : '';
  const hoogte: Hoogte = bakje?.hoogte ?? 'midden';
  const geenGn = !!formaat && !bakje?.code;

  const zet = (nieuweMaat: string, nieuweHoogte: Hoogte) => {
    if (!nieuweMaat) return onWijzig(null);
    onWijzig(`GN ${nieuweMaat} ${nieuweHoogte}`);
  };

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <Select value={maat || 'geen'} onValueChange={(v) => zet(v === 'geen' ? '' : v, hoogte)}>
        <SelectTrigger className="h-11 w-[132px] rounded-[10px] text-[13px]" aria-label="Bakmaat">
          <SelectValue placeholder="maat" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="geen">{geenGn ? formaat : 'geen bakje'}</SelectItem>
          {GN_MATEN.map((m) => {
            const b = bakjeLabel(`GN ${m}`);
            return (
              <SelectItem key={m} value={m}>
                {b?.maat} ({`GN ${m}`})
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
      {maat && (
        <Select value={hoogte} onValueChange={(v) => zet(maat, v as Hoogte)}>
          <SelectTrigger className="h-11 w-[96px] rounded-[10px] text-[13px]" aria-label="Hoogte">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {HOOGTES.map((h) => (
              <SelectItem key={h} value={h}>
                {h}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}

export default BakmaatKiezer;
