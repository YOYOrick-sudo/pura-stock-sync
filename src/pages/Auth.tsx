import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, LogIn, Building2, Store, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import logoOfficial from '@/assets/pura-vida-logo-sea-cropped.png';
import { getLocationDisplayName } from '@/lib/utils';
import { PWAInstallHint } from '@/components/PWAInstallHint';
import { devError } from "@/lib/devLog";

const Auth = () => {
  const navigate = useNavigate();
  const [cooldown, setCooldown] = useState(0);
  const cooldownTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (cooldownTimer.current) window.clearInterval(cooldownTimer.current);
    };
  }, []);

  const startCooldown = (seconds: number) => {
    setCooldown(seconds);
    if (cooldownTimer.current) window.clearInterval(cooldownTimer.current);
    cooldownTimer.current = window.setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) {
          if (cooldownTimer.current) window.clearInterval(cooldownTimer.current);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  };
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [selection, setSelection] = useState<'daily' | 'foodbar' | 'personal'>('daily');
  const [personalEmail, setPersonalEmail] = useState('');

  const mode: 'shared' | 'personal' = selection === 'personal' ? 'personal' : 'shared';
  const location: 'West' | 'Midsland' = selection === 'foodbar' ? 'Midsland' : 'West';

  const getEmailForLocation = (loc: 'West' | 'Midsland') => {
    return loc === 'West'
      ? 'purawestkeuken@puravidafoodbar.nl'
      : 'puramidsland@puravidafoodbar.nl';
  };


  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) navigate('/dashboard');
    };
    checkSession();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cooldown > 0) return;
    if (!password.trim()) { toast.error('Vul het wachtwoord in'); return; }
    if (mode === 'personal' && !personalEmail.trim()) { toast.error('Vul je e-mailadres in'); return; }
    setLoading(true);
    try {
      const emailToUse = mode === 'personal' ? personalEmail.trim() : getEmailForLocation(location);

      // Hard timeout as a safety net: if the client hangs, surface it instead of
      // spinning forever on "Bezig met inloggen".
      const signInPromise = supabase.auth.signInWithPassword({ email: emailToUse, password });
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 12_000)
      );
      const { data, error } = await Promise.race([signInPromise, timeoutPromise]) as Awaited<typeof signInPromise>;

      if (error) {
        const status = (error as any).status;
        const msg = error.message || '';
        if (status === 429 || /rate limit/i.test(msg)) {
          toast.error('Te veel inlogpogingen', { description: 'Wacht 30 seconden en probeer opnieuw.' });
          startCooldown(30);
        } else if (msg.includes('Invalid login credentials')) {
          toast.error('Onjuiste inloggegevens', { description: 'Controleer je gebruikersnaam en wachtwoord' });
        } else {
          toast.error('Inloggen mislukt', { description: msg });
        }
        return;
      }

      if (data.session) {
        if (mode === 'shared') {
          const { data: userRole } = await supabase
            .from('user_roles')
            .select('location')
            .eq('user_id', data.session.user.id)
            .maybeSingle();

          if (userRole?.location !== location) {
            toast.error('Verkeerde locatie detecteerd', { description: `Deze account hoort bij ${getLocationDisplayName(userRole?.location || '')}` });
            await supabase.auth.signOut();
            return;
          }
          toast.success(`Welkom bij ${getLocationDisplayName(location)}!`);
        } else {
          toast.success('Welkom terug!');
        }
        navigate('/dashboard');
      }
    } catch (error) {
      const isTimeout = error instanceof Error && error.message === 'timeout';
      if (import.meta.env.DEV) {
        devError('Login failed:', error instanceof Error ? error.message : 'unknown');
      }
      if (isTimeout) {
        toast.error('Inloggen duurt te lang', { description: 'Ververs de pagina en probeer opnieuw.' });
      } else {
        toast.error('Er ging iets mis', { description: 'Probeer het opnieuw' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 md:p-8 bg-background">
      <div
        className="w-full max-w-[420px] bg-card border border-border/60 rounded-[20px] overflow-hidden"
        style={{
          boxShadow: '0 20px 40px -12px rgba(0,0,0,0.08), 0 8px 16px -8px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)',
        }}
      >
        {/* Header */}
        <div className="px-8 pt-10 pb-2">
          <div className="text-center mb-4">
            <img 
              src={logoOfficial} 
              alt="Pura Vida Foodbar" 
              className="h-16 w-auto mx-auto"
            />
          </div>
          <div className="text-center">
            <div className="text-[12px] text-muted-foreground/80 flex items-center justify-center gap-2">
              <span>Operationeel Systeem</span>
              <span className="text-border">•</span>
              <span>Pura Vida Foodbar</span>
            </div>
          </div>
        </div>

        {/* Login Form */}
        <div className="px-8 pt-6 pb-8">
          <form onSubmit={handleLogin} className="flex flex-col gap-5">
            <div>
              <label className="text-[11px] font-medium text-foreground/45 block mb-2">
                Kies inlogmethode
              </label>
              <div className="grid grid-cols-3 gap-3">
                {([
                  { key: 'daily' as const, label: 'Daily', icon: Building2 },
                  { key: 'foodbar' as const, label: 'Foodbar', icon: Store },
                  { key: 'personal' as const, label: 'Persoonlijk', icon: UserRound },
                ]).map(({ key, label, icon: Icon }) => (
                  <button
                    type="button"
                    key={key}
                    onClick={() => !loading && setSelection(key)}
                    disabled={loading}
                    className={`flex flex-col items-center justify-center gap-2 py-5 px-2 rounded-[16px] transition-all duration-200 active:scale-[0.98]
                      ${selection === key
                        ? 'bg-primary/10 text-primary ring-1 ring-primary/20 shadow-[0_2px_8px_-2px_rgba(22,163,74,0.15)]'
                        : 'bg-card/60 text-muted-foreground border border-border/30 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:text-foreground hover:bg-card/80 hover:shadow-[0_4px_12px_-4px_rgba(0,0,0,0.06)] hover:-translate-y-[1px]'
                      } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <Icon className="w-6 h-6" />
                    <span className="text-[14px] font-semibold">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {mode === 'personal' && (
              <div>
                <label htmlFor="pemail" className="text-[11px] font-medium text-foreground/45 block mb-2">
                  E-mail
                </label>
                <input
                  id="pemail"
                  type="email"
                  value={personalEmail}
                  onChange={(e) => setPersonalEmail(e.target.value)}
                  placeholder="jouw@puravidafoodbar.nl"
                  disabled={loading}
                  autoComplete="email"
                  className="w-full h-12 px-4 text-[15px] text-foreground bg-background border border-border/60 rounded-xl outline-none transition-all focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
                />
              </div>
            )}



            <div>
              <label htmlFor="password" className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/80 block mb-2">
                Wachtwoord
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Vul je wachtwoord in"
                disabled={loading}
                autoComplete="current-password"
                autoFocus
                className="w-full h-12 px-4 text-[15px] text-foreground bg-background border border-border/60 rounded-xl outline-none transition-all focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <button
              type="submit"
              disabled={loading || cooldown > 0}
              className={`w-full h-12 rounded-xl text-[15px] font-semibold text-primary-foreground flex items-center justify-center gap-2 transition-all
                ${loading || cooldown > 0 ? 'bg-muted-foreground cursor-not-allowed' : 'bg-primary hover:opacity-90 hover:-translate-y-[1px] cursor-pointer'}`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Bezig met inloggen...</span>
                </>
              ) : cooldown > 0 ? (
                <span>Wacht {cooldown}s…</span>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Inloggen</span>
                </>
              )}
            </button>

          </form>
        </div>
      </div>
      <PWAInstallHint />
    </div>
  );

};

export default Auth;
