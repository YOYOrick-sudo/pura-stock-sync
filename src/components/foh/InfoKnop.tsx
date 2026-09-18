import { useEffect, useRef, useState } from 'react';
import { Info } from 'lucide-react';

/**
 * Standaard info-knop: uitleg hoort niet in beeld te staan maar achter een
 * klein icoon naast de kop. Zelfde vorm en kleur als de info-knop bij taken.
 */
export function InfoKnop({ tekst, label = 'Uitleg' }: { tekst: string; label?: string }) {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const buiten = (e: MouseEvent | TouchEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', buiten);
    document.addEventListener('touchstart', buiten);
    return () => {
      document.removeEventListener('mousedown', buiten);
      document.removeEventListener('touchstart', buiten);
    };
  }, [open]);

  return (
    <span ref={wrap} className="relative inline-flex shrink-0">
      <button
        type="button"
        aria-label={label}
        title={label}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        className="flex items-center justify-center rounded-[8px] border-[1.5px] border-primary/30 bg-secondary transition-colors hover:bg-primary/10"
        style={{ width: 26, height: 26, minWidth: 26, padding: 0 }}
      >
        <Info size={16} className="text-primary" />
      </button>
      {open && (
        <span
          role="tooltip"
          className="absolute left-0 top-[30px] z-30 w-[260px] rounded-[12px] border border-border bg-popover p-3 text-[12px] leading-snug text-muted-foreground shadow-md"
        >
          {tekst}
        </span>
      )}
    </span>
  );
}
