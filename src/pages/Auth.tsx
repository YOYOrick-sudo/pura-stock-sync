import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, LogIn, Building2, Store, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import logoOfficial from '@/assets/pura-vida-logo-official.png';
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
  const [mode, setMode] = useState<'shared' | 'personal'>('shared');
  const [personalEmail, setPersonalEmail] = useState('');
  const [location, setLocation] = useState<'West' | 'Midsland'>('West');
  
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
      const { data: { session: existingSession } } = await supabase.auth.getSession();
      if (existingSession) {
        await supabase.auth.signOut();
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      const emailToUse = mode === 'personal' ? personalEmail.trim() : getEmailForLocation(location);
      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailToUse,
        password: password
      });

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
      if (import.meta.env.DEV) {
        devError('Login failed:', error instanceof Error ? error.message : 'unknown');
      }
      toast.error('Er ging iets mis', { description: 'Probeer het opnieuw' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-[420px] bg-card border border-border/60 rounded-[20px] shadow-sm overflow-hidden">
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
            <div className="grid grid-cols-2 gap-2 rounded-[16px] bg-muted/40 p-1">
              <button
                type="button"
                onClick={() => !loading && setMode('shared')}
                disabled={loading}
                className={`h-11 rounded-[14px] text-[13px] font-semibold transition-all flex items-center justify-center gap-2 ${mode === 'shared' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <Store className="w-4 h-4" />
                Locatie
              </button>
              <button
                type="button"
                onClick={() => !loading && setMode('personal')}
                disabled={loading}
                className={`h-11 rounded-[14px] text-[13px] font-semibold transition-all flex items-center justify-center gap-2 ${mode === 'personal' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <UserRound className="w-4 h-4" />
                Persoonlijk
              </button>
            </div>

            {mode === 'shared' ? (
              <div>
                <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/80 block mb-2">
                  Locatie
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {([
                    { loc: 'West' as const, icon: Building2 },
                    { loc: 'Midsland' as const, icon: Store },
                  ]).map(({ loc, icon: Icon }) => (
                    <button
                      type="button"
                      key={loc}
                      onClick={() => !loading && setLocation(loc)}
                      disabled={loading}
                      className={`flex flex-col items-center justify-center gap-2 py-5 px-4 rounded-[16px] transition-all duration-200
                        ${location === loc
                          ? 'bg-primary/10 text-primary border-2 border-primary'
                          : 'bg-muted/40 text-muted-foreground border-2 border-transparent hover:text-foreground hover:bg-muted/60'
                        } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <Icon className="w-6 h-6" />
                      <span className="text-[15px] font-semibold">{getLocationDisplayName(loc)}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <label htmlFor="pemail" className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/80 block mb-2">
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

            <p className="text-[12px] text-muted-foreground text-center leading-relaxed">
              {mode === 'shared' ? 'Gebruik Persoonlijk voor je eigen medewerkeraccount.' : 'Log in met je eigen e-mailadres en wachtwoord.'}
            </p>
          </form>
        </div>
      </div>
      <PWAInstallHint />
    </div>
  );

};

export default Auth;
