import { useState } from 'react';
import { Delete } from 'lucide-react';

interface PincodeNumpadProps {
  /** Title shown above the dots (e.g. "Onderhoud", "Planning") */
  title: string;
  /** Subtitle prompt (default: "Voer je pincode in") */
  subtitle?: string;
  /** Called when 4 digits entered. Return true if accepted, false to clear and show error. */
  onSubmit: (pin: string) => boolean | Promise<boolean>;
  /** External error message (overrides internal "Onjuiste code") */
  errorMessage?: string | null;
  /** When true, disables input (e.g. during async verify) */
  loading?: boolean;
  /** Compact mode: smaller paddings/heights for use inside dialogs */
  compact?: boolean;
}

/**
 * Numpad-style 4-digit pincode entry. Same UX as Onderhoud login.
 * Pure UI — caller decides what `onSubmit` does.
 */
export function PincodeNumpad({
  title,
  subtitle = 'Voer je pincode in',
  onSubmit,
  errorMessage,
  loading = false,
  compact = false,
}: PincodeNumpadProps) {
  const [pin, setPin] = useState('');
  const [internalError, setInternalError] = useState<string | null>(null);

  const error = errorMessage ?? internalError;

  const handleDigit = async (digit: string) => {
    if (loading || pin.length >= 4) return;
    const newPin = pin + digit;
    setPin(newPin);
    setInternalError(null);
    if (newPin.length === 4) {
      const ok = await onSubmit(newPin);
      if (!ok) {
        setPin('');
        setInternalError('Onjuiste code');
      }
    }
  };

  const handleDelete = () => setPin(prev => prev.slice(0, -1));
  const handleClear = () => setPin('');

  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
  const btnHeight = compact ? '60px' : '72px';
  const btnFontSize = compact ? '24px' : '28px';
  const dotSize = compact ? '16px' : '20px';

  const numpadButtonStyle: React.CSSProperties = {
    width: '100%',
    height: btnHeight,
    borderRadius: '20px',
    border: '1.5px solid hsl(var(--border))',
    backgroundColor: 'hsl(var(--card))',
    fontFamily: 'Inter, sans-serif',
    fontSize: btnFontSize,
    fontWeight: 500,
    color: 'hsl(var(--foreground))',
    cursor: 'pointer',
    transition: 'all 150ms ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  return (
    <div className="flex flex-col items-center w-full">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-semibold text-foreground mb-2">{title}</h1>
        <p className="text-[15px] text-muted-foreground">{subtitle}</p>
      </div>

      {/* Pin dots */}
      <div className="flex gap-4 mb-6">
        {[0, 1, 2, 3].map(i => (
          <div
            key={i}
            className="transition-all duration-200"
            style={{
              width: dotSize,
              height: dotSize,
              borderRadius: '50%',
              backgroundColor: i < pin.length ? 'hsl(var(--primary))' : 'transparent',
              border: `2px solid ${i < pin.length ? 'hsl(var(--primary))' : 'hsl(var(--border))'}`,
            }}
          />
        ))}
      </div>

      {error && (
        <p className="text-sm text-destructive mb-4 text-center">{error}</p>
      )}

      <div
        className="grid grid-cols-3 gap-3"
        style={{ maxWidth: '320px', width: '100%' }}
      >
        {digits.map(digit => (
          <button
            key={digit}
            type="button"
            onClick={() => handleDigit(digit)}
            disabled={loading || pin.length >= 4}
            style={numpadButtonStyle}
            className="hover:bg-muted active:bg-accent active:scale-95 disabled:opacity-50"
          >
            {digit}
          </button>
        ))}
        <button
          type="button"
          onClick={handleClear}
          disabled={loading}
          style={{
            ...numpadButtonStyle,
            fontSize: '14px',
            color: 'hsl(var(--muted-foreground))',
          }}
          className="hover:bg-muted active:bg-accent active:scale-95 disabled:opacity-50"
        >
          Wis
        </button>
        <button
          type="button"
          onClick={() => handleDigit('0')}
          disabled={loading || pin.length >= 4}
          style={numpadButtonStyle}
          className="hover:bg-muted active:bg-accent active:scale-95 disabled:opacity-50"
        >
          0
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={loading || pin.length === 0}
          style={numpadButtonStyle}
          className="hover:bg-muted active:bg-accent active:scale-95 disabled:opacity-50"
        >
          <Delete className="h-6 w-6 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}
