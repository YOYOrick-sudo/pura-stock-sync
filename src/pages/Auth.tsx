import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, LogIn, Building2, Store } from 'lucide-react';
import { toast } from 'sonner';
import logoOfficial from '@/assets/pura-vida-logo-official.png';
import { getLocationDisplayName } from '@/lib/utils';
import { PWAInstallHint } from '@/components/PWAInstallHint';

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
    setLoading(true);
    try {
      const { data: { session: existingSession } } = await supabase.auth.getSession();
      if (existingSession) {
        await supabase.auth.signOut();
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: getEmailForLocation(location),
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
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Login error:', error);
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
            <div>
              <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/80 block mb-2">
                Locatie
              </label>
              <div className="grid grid-cols-2 gap-1 p-1 bg-muted/40 rounded-[14px]">
                {(['West', 'Midsland'] as const).map((loc) => (
                  <button
                    type="button"
                    key={loc}
                    onClick={() => !loading && setLocation(loc)}
                    disabled={loading}
                    className={`py-2.5 rounded-[10px] text-[14px] font-medium transition-all
                      ${location === loc 
                        ? 'bg-card text-foreground shadow-sm border border-border/60' 
                        : 'text-muted-foreground hover:text-foreground'
                      } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    {getLocationDisplayName(loc)}
                  </button>
                ))}
              </div>
            </div>

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
