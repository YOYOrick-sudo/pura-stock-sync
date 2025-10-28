import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Loader2, LogIn } from 'lucide-react';
import { toast } from 'sonner';
import logoOfficial from '@/assets/pura-vida-logo-official.png';
import WaveBackground from '@/components/WaveBackground';

const Auth = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const fixedEmail = 'purawestkeuken@puravidafoodbar.nl';

  // Check if already logged in
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/');
      }
    };
    checkSession();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password.trim()) {
      toast.error('Vul het wachtwoord in');
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: fixedEmail,
        password: password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Onjuiste inloggegevens', {
            description: 'Controleer je gebruikersnaam en wachtwoord',
          });
        } else {
          toast.error('Inloggen mislukt', {
            description: error.message,
          });
        }
        return;
      }

      if (data.session) {
        toast.success('Welkom terug!');
        navigate('/');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Er ging iets mis', {
        description: 'Probeer het opnieuw',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5F7DD] via-[#F5F7DD] to-[#e8ecc8] relative overflow-hidden">
      <WaveBackground />
      
      <div className="relative z-10 flex items-center justify-center min-h-screen px-4 py-12">
        <Card className="w-full max-w-md bg-white shadow-2xl border-0 rounded-2xl overflow-hidden">
          {/* Header with gradient */}
          <div className="bg-gradient-to-r from-[#1B7867] to-[#0d5a4c] px-8 pt-10 pb-8">
            <div className="flex justify-center mb-4">
              <div className="bg-white/95 rounded-2xl p-4 shadow-lg">
                <img 
                  src={logoOfficial} 
                  alt="Pura Vida Foodbar" 
                  className="h-16 w-auto"
                />
              </div>
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-heading font-bold text-white mb-1">
                Voorraadregistratie
              </h1>
              <p className="text-white/80 text-sm">
                Pura Vida Foodbar West
              </p>
            </div>
          </div>

          {/* Login Form */}
          <div className="px-8 py-8">
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label 
                  htmlFor="email" 
                  className="block text-xs font-bold uppercase tracking-wide text-[#282E3A]/60 mb-2"
                >
                  Gebruikersnaam
                </label>
                <div className="relative">
                  <Input
                    id="email"
                    type="text"
                    value="Pura West Keuken"
                    className="h-12 border-2 border-[#1B7867]/10 bg-[#F5F7DD]/30 rounded-xl font-semibold text-[#282E3A] cursor-not-allowed"
                    disabled
                    readOnly
                    autoComplete="username"
                  />
                </div>
              </div>

              <div>
                <label 
                  htmlFor="password" 
                  className="block text-xs font-bold uppercase tracking-wide text-[#282E3A]/60 mb-2"
                >
                  Wachtwoord
                </label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Vul je wachtwoord in"
                  className="h-12 border-2 border-[#1B7867]/20 focus:border-[#1B7867] bg-white rounded-xl text-[#282E3A] placeholder:text-[#282E3A]/40"
                  disabled={loading}
                  autoComplete="current-password"
                  autoFocus
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-13 bg-gradient-to-r from-[#1B7867] to-[#0d5a4c] hover:from-[#0d5a4c] hover:to-[#1B7867] text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl font-bold text-base mt-8"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Bezig met inloggen...
                  </>
                ) : (
                  <>
                    <LogIn className="mr-2 h-5 w-5" />
                    Inloggen
                  </>
                )}
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
