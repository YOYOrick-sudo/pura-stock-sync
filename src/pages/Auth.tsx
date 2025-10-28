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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

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
    
    if (!email.trim() || !password.trim()) {
      toast.error('Vul alle velden in');
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
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
    <div className="min-h-screen bg-[#F5F7DD] relative overflow-hidden">
      <WaveBackground />
      
      <div className="relative z-10 flex items-center justify-center min-h-screen px-4 py-8">
        <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm shadow-xl border-2 border-[#1B7867]/20 rounded-3xl p-8">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <img 
              src={logoOfficial} 
              alt="Pura Vida Foodbar" 
              className="h-24 w-auto"
            />
          </div>

          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-heading font-bold text-[#282E3A] mb-2">
              Voorraadregistratie
            </h1>
            <p className="text-[#282E3A]/60 text-sm">
              Log in om door te gaan
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label 
                htmlFor="email" 
                className="block text-sm font-semibold text-[#282E3A]/70 mb-2"
              >
                Gebruikersnaam / Email
              </label>
              <Input
                id="email"
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Pura West Keuken"
                className="h-12 border-2 border-[#1B7867]/20 focus:border-[#1B7867] bg-white rounded-xl"
                disabled={loading}
                autoComplete="username"
              />
            </div>

            <div>
              <label 
                htmlFor="password" 
                className="block text-sm font-semibold text-[#282E3A]/70 mb-2"
              >
                Wachtwoord
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••"
                className="h-12 border-2 border-[#1B7867]/20 focus:border-[#1B7867] bg-white rounded-xl"
                disabled={loading}
                autoComplete="current-password"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-gradient-to-r from-[#1B7867] to-[#0d5a4c] hover:from-[#0d5a4c] hover:to-[#1B7867] text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl font-semibold"
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

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-xs text-[#282E3A]/40">
              Pura Vida Foodbar West
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
