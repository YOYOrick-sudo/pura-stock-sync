import { useEffect, useState } from 'react';
import { Loader2, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HerstelKnop } from '@/components/auth/HerstelKnop';
import logo from '@/assets/pura-vida-logo-sea-cropped.png';

const TRAAG_NA_MS = 10_000;

/**
 * Rustig startscherm zolang nog niet vaststaat of iemand ingelogd is.
 * Nooit het inlogscherm laten flitsen terwijl de sessie nog wordt gelezen.
 */
export const StartScherm = ({ offline, opnieuw }: { offline?: boolean; opnieuw?: () => void }) => {
  const [traag, setTraag] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setTraag(true), TRAAG_NA_MS);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-[320px] text-center">
        <img src={logo} alt="Pura Vida" className="h-16 w-auto mx-auto mb-8 opacity-90" />
        <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />

        {offline && (
          <p className="mt-6 text-[13px] text-muted-foreground flex items-center justify-center gap-2">
            <WifiOff className="w-4 h-4" />
            Geen verbinding
          </p>
        )}

        {(traag || offline) && (
          <div className="mt-6 space-y-3">
            {traag && !offline && (
              <p className="text-[13px] text-muted-foreground">Het duurt langer dan normaal.</p>
            )}
            <Button
              variant="outline"
              className="w-full min-h-[44px]"
              onClick={() => (opnieuw ? opnieuw() : window.location.reload())}
            >
              Opnieuw proberen
            </Button>
            {traag && <HerstelKnop />}
          </div>
        )}
      </div>
    </div>
  );
};
