import { Check, ChevronDown } from 'lucide-react';

/**
 * Eén vaste sectiebalk voor de hele takenlijst: takensecties, voorraadronde
 * en au bain-marie zien er hierdoor exact hetzelfde uit.
 * Zonder onToggle is het een rustige kop (niet inklapbaar), met onToggle een
 * knop met pijltje rechts.
 */
export function SectieBalk({
  titel,
  stand,
  afgerond = false,
  open,
  onToggle,
}: {
  titel: string;
  /** Korte stand rechts in de pil, bijvoorbeeld "3/14". */
  stand?: string;
  afgerond?: boolean;
  open?: boolean;
  onToggle?: () => void;
}) {
  const inhoud = (
    <>
      <span
        style={{
          fontSize: '15px',
          fontWeight: 700,
          color: 'hsl(var(--foreground))',
          fontFamily: 'Inter, sans-serif',
          letterSpacing: '0.01em',
        }}
      >
        {titel}
      </span>
      {stand && (
        <span
          style={{
            marginLeft: 'auto',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '12px',
            fontWeight: 600,
            color: afgerond ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
            backgroundColor: afgerond ? 'hsl(var(--primary) / 0.1)' : 'hsl(var(--muted) / 0.6)',
            padding: '3px 10px',
            borderRadius: '999px',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          {afgerond && <Check size={13} />}
          {stand}
        </span>
      )}
      {onToggle && (
        <ChevronDown
          size={20}
          style={{
            marginLeft: stand ? '0' : 'auto',
            flexShrink: 0,
            color: 'hsl(var(--muted-foreground))',
            transition: 'transform 150ms',
            transform: open ? 'rotate(180deg)' : undefined,
          }}
        />
      )}
    </>
  );

  const stijl: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    width: '100%',
    minHeight: '44px',
    padding: '12px 14px',
    backgroundColor: 'hsl(var(--muted))',
    borderRadius: '12px',
    marginBottom: '12px',
    border: '1px solid hsl(var(--border))',
    boxShadow: '0 1px 2px hsl(var(--foreground) / 0.03)',
    textAlign: 'left',
  };

  if (!onToggle) return <div style={stijl}>{inhoud}</div>;

  return (
    <button type="button" onClick={onToggle} style={stijl}>
      {inhoud}
    </button>
  );
}
