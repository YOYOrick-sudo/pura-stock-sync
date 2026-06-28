import { useEffect, useState } from 'react';
import { Share, X } from 'lucide-react';

const DISMISS_KEY = 'pwa-install-hint-dismissed';

function isIpadSafari(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  // iPadOS 13+ reports as Mac; detect via touch points
  const isIpad =
    /iPad/.test(ua) ||
    (navigator.platform === 'MacIntel' && (navigator as any).maxTouchPoints > 1);
  const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
  return isIpad && isSafari;
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  if (window.matchMedia?.('(display-mode: standalone)').matches) return true;
  if ((navigator as any).standalone === true) return true;
  return false;
}

export const PWAInstallHint = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;
    if (!isIpadSafari()) return;
    try {
      if (localStorage.getItem(DISMISS_KEY)) return;
    } catch {
      // ignore
    }
    setShow(true);
  }, []);

  if (!show) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      // ignore
    }
    setShow(false);
  };

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 max-w-[440px] w-[calc(100%-2rem)]">
      <div className="bg-card border border-border rounded-2xl shadow-elevated p-4 flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center shrink-0">
          <Share className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 text-sm text-foreground leading-snug">
          <div className="font-semibold mb-0.5">Tip voor de iPad</div>
          <div className="text-muted-foreground">
            Tik op <span className="font-medium text-foreground">Delen</span> →{' '}
            <span className="font-medium text-foreground">Zet op beginscherm</span> voor een
            stabielere sessie (minder vaak opnieuw inloggen).
          </div>
        </div>
        <button
          onClick={dismiss}
          aria-label="Sluiten"
          className="w-7 h-7 rounded-lg hover:bg-muted flex items-center justify-center shrink-0 text-muted-foreground"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default PWAInstallHint;
