import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, LogIn } from 'lucide-react';
import { toast } from 'sonner';
import logoOfficial from '@/assets/pura-vida-logo-official.png';

const Auth = () => {
  const navigate = useNavigate();
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
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Onjuiste inloggegevens', { description: 'Controleer je gebruikersnaam en wachtwoord' });
        } else {
          toast.error('Inloggen mislukt', { description: error.message });
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
          toast.error('Verkeerde locatie detecteerd', { description: `Deze account hoort bij ${userRole?.location}` });
          await supabase.auth.signOut();
          return;
        }
        
        toast.success(`Welkom bij ${location}!`);
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
    <div className="min-h-screen bg-background flex items-center justify-center p-4 md:p-12">
      <div className="w-full max-w-[500px] bg-card border border-border rounded-[20px] shadow-elevated overflow-hidden">
        {/* Header */}
        <div className="p-12 pb-6 border-b border-border">
          <div className="text-center mb-6">
            <img 
              src={logoOfficial} 
              alt="Pura Vida Foodbar" 
              className="h-[88px] w-auto mx-auto"
            />
          </div>
          <div className="text-center">
            <div className="text-[13px] text-muted-foreground flex items-center justify-center gap-3">
              <span>Operationeel Systeem</span>
              <span className="text-border">•</span>
              <span>Pura Vida Foodbar</span>
            </div>
          </div>
        </div>

        {/* Login Form */}
        <div className="p-8">
          <form onSubmit={handleLogin} className="flex flex-col gap-6">
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground block mb-3">
                Selecteer Locatie
              </label>
              <div className="grid grid-cols-2 gap-3">
                {(['West', 'Midsland'] as const).map((loc) => (
                  <div
                    key={loc}
                    onClick={() => !loading && setLocation(loc)}
                    className={`cursor-pointer p-4 rounded-[20px] border-1.5 transition-all text-center text-base font-semibold text-foreground
                      ${location === loc 
                        ? 'border-primary bg-secondary' 
                        : 'border-border bg-card hover:bg-muted'
                      } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {loc}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="password" className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground block mb-2">
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
                className="w-full h-11 px-4 text-[15px] text-foreground bg-background border border-border rounded-2xl outline-none transition-colors focus:border-primary"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full h-12 rounded-[20px] text-[15px] font-semibold text-primary-foreground flex items-center justify-center gap-2 transition-all
                ${loading ? 'bg-muted-foreground cursor-not-allowed' : 'bg-primary hover:opacity-90 cursor-pointer shadow-md'}`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Bezig met inloggen...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  <span>Inloggen</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Auth;
