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

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
      {/* Title */}
      <div className="text-center mb-8">
        <h1 style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: '24px',
          fontWeight: 600,
          color: '#282E3A',
          marginBottom: '8px',
        }}>
          Onderhoud
        </h1>
        <p style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: '15px',
          color: '#73747B',
        }}>
          Voer je pincode in
        </p>
      </div>

      {/* Pin dots */}
      <div className="flex gap-4 mb-8">
        {[0, 1, 2, 3].map(i => (
          <div
            key={i}
            style={{
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              backgroundColor: i < pin.length ? '#1B7867' : 'transparent',
              border: `2px solid ${i < pin.length ? '#1B7867' : 'rgba(197, 197, 202, 0.5)'}`,
              transition: 'all 200ms ease',
            }}
          />
        ))}
      </div>

      {/* Error message */}
      {error && (
        <p style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: '14px',
          color: '#EF4444',
          marginBottom: '16px',
          textAlign: 'center',
        }}>
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
            style={{
              width: '100%',
              height: '72px',
              borderRadius: '16px',
              border: '1px solid rgba(197, 197, 202, 0.3)',
              backgroundColor: '#FFFFFF',
              fontFamily: 'Inter, sans-serif',
              fontSize: '28px',
              fontWeight: 500,
              color: '#282E3A',
              cursor: 'pointer',
              transition: 'all 150ms ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            className="hover:bg-gray-50 active:bg-gray-100 active:scale-95"
          >
            {digit}
          </button>
        ))}
        {/* Bottom row: clear, 0, delete */}
        <button
          onClick={handleClear}
          disabled={loading}
          style={{
            width: '100%',
            height: '72px',
            borderRadius: '16px',
            border: '1px solid rgba(197, 197, 202, 0.3)',
            backgroundColor: '#FFFFFF',
            fontFamily: 'Inter, sans-serif',
            fontSize: '14px',
            fontWeight: 500,
            color: '#73747B',
            cursor: 'pointer',
            transition: 'all 150ms ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          className="hover:bg-gray-50 active:bg-gray-100 active:scale-95"
        >
          Wis
        </button>
        <button
          onClick={() => handleDigit('0')}
          disabled={loading || pin.length >= 4}
          style={{
            width: '100%',
            height: '72px',
            borderRadius: '16px',
            border: '1px solid rgba(197, 197, 202, 0.3)',
            backgroundColor: '#FFFFFF',
            fontFamily: 'Inter, sans-serif',
            fontSize: '28px',
            fontWeight: 500,
            color: '#282E3A',
            cursor: 'pointer',
            transition: 'all 150ms ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          className="hover:bg-gray-50 active:bg-gray-100 active:scale-95"
        >
          0
        </button>
        <button
          onClick={handleDelete}
          disabled={loading || pin.length === 0}
          style={{
            width: '100%',
            height: '72px',
            borderRadius: '16px',
            border: '1px solid rgba(197, 197, 202, 0.3)',
            backgroundColor: '#FFFFFF',
            cursor: 'pointer',
            transition: 'all 150ms ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          className="hover:bg-gray-50 active:bg-gray-100 active:scale-95"
        >
          <Delete className="h-6 w-6" style={{ color: '#73747B' }} />
        </button>
      </div>

      {/* Loading indicator */}
      {loading && (
        <div className="mt-6 flex items-center gap-2" style={{ color: '#73747B' }}>
          <LogIn className="h-4 w-4 animate-spin" />
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px' }}>Inloggen...</span>
        </div>
      )}
    </div>
  );
}
