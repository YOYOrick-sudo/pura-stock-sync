import { useState } from 'react';
import { Loader2, RotateCcw } from 'lucide-react';

/**
 * Noodknop op het inlogscherm: wist de lokale sessie en de offline-cache van
 * deze app op dit apparaat en herlaadt schoon. Raakt nooit data in de database.
 */
export const HerstelKnop = () => {
  const [bezig, setBezig] = useState(false);

  const herstel = async () => {
    if (bezig) return;
    setBezig(true);
    try {
      // 1. Offline-cache legen
      if ('caches' in window) {
        const namen = await caches.keys();
        await Promise.all(namen.map((n) => caches.delete(n)));
      }
      // 2. Service workers afmelden
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
      }
      // 3. Opgeslagen sessie weg (localStorage + IndexedDB)
      try {
        Object.keys(localStorage)
          .filter((k) => k.startsWith('puravida-auth') || k.startsWith('sb-'))
          .forEach((k) => localStorage.removeItem(k));
      } catch {
        // privacymodus — negeren
      }
      try {
        indexedDB.deleteDatabase('puravida-auth-db');
      } catch {
        // negeren
      }
    } catch {
      // wat er ook misgaat: altijd herladen
    } finally {
      window.location.replace('/');
    }
  };

  return (
    <button
      type="button"
      onClick={herstel}
      disabled={bezig}
      className="w-full min-h-[44px] text-[13px] text-muted-foreground/80 hover:text-foreground transition-colors flex items-center justify-center gap-2"
    >
      {bezig ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
      <span>{bezig ? 'Bezig met herstellen…' : 'App reageert niet? Herstel'}</span>
    </button>
  );
};
