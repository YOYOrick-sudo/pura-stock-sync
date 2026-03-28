import { useState } from 'react';
import { Delete, LogIn } from 'lucide-react';

interface PincodeLoginProps {
  onLogin: (pin: string) => Promise<boolean>;
  loading: boolean;
  error: string | null;
}

export function PincodeLogin({ onLogin, loading, error }: PincodeLoginProps) {
  const [pin, setPin] = useState('');

  const handleDigit = (digit: string) => {
    if (pin.length < 4) {
      const newPin = pin + digit;
      setPin(newPin);
      if (newPin.length === 4) {
        onLogin(newPin).then(success => {
          if (!success) setPin('');
        });
      }
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setPin('');
  };

  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

  const numpadButtonStyle: React.CSSProperties = {
    width: '100%',
    height: '72px',
    borderRadius: '16px',
    border: '1.5px solid hsl(var(--border))',
    backgroundColor: 'hsl(var(--card))',
    fontSize: '28px',
    fontWeight: 500,
    color: 'hsl(var(--foreground))',
    cursor: 'pointer',
    transition: 'all 150ms ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
      {/* Title */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-semibold text-foreground mb-2">
          Onderhoud
        </h1>
        <p className="text-[15px] text-muted-foreground">
          Voer je pincode in
        </p>
      </div>

      {/* Pin dots */}
      <div className="flex gap-4 mb-8">
        {[0, 1, 2, 3].map(i => (
          <div
            key={i}
            className="transition-all duration-200"
            style={{
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              backgroundColor: i < pin.length ? 'hsl(var(--primary))' : 'transparent',
              border: `2px solid ${i < pin.length ? 'hsl(var(--primary))' : 'hsl(var(--border))'}`,
            }}
          />
        ))}
      </div>

      {/* Error message */}
      {error && (
        <p className="text-sm text-destructive mb-4 text-center">
          {error}
        </p>
      )}

      {/* Numpad */}
      <div className="grid grid-cols-3 gap-3" style={{ maxWidth: '320px', width: '100%' }}>
        {digits.map(digit => (
          <button
            key={digit}
            onClick={() => handleDigit(digit)}
            disabled={loading || pin.length >= 4}
            style={numpadButtonStyle}
            className="hover:bg-muted active:bg-accent active:scale-95"
          >
            {digit}
          </button>
        ))}
        {/* Bottom row: clear, 0, delete */}
        <button
          onClick={handleClear}
          disabled={loading}
          style={{
            ...numpadButtonStyle,
            fontSize: '14px',
            color: 'hsl(var(--muted-foreground))',
          }}
          className="hover:bg-muted active:bg-accent active:scale-95"
        >
          Wis
        </button>
        <button
          onClick={() => handleDigit('0')}
          disabled={loading || pin.length >= 4}
          style={numpadButtonStyle}
          className="hover:bg-muted active:bg-accent active:scale-95"
        >
          0
        </button>
        <button
          onClick={handleDelete}
          disabled={loading || pin.length === 0}
          style={{
            ...numpadButtonStyle,
          }}
          className="hover:bg-muted active:bg-accent active:scale-95"
        >
          <Delete className="h-6 w-6 text-muted-foreground" />
        </button>
      </div>

      {/* Loading indicator */}
      {loading && (
        <div className="mt-6 flex items-center gap-2 text-muted-foreground">
          <LogIn className="h-4 w-4 animate-spin" />
          <span className="text-sm">Inloggen...</span>
        </div>
      )}
    </div>
  );
}
