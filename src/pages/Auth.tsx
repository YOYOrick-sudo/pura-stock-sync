import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Loader2, LogIn } from 'lucide-react';
import { toast } from 'sonner';
import logoOfficial from '@/assets/pura-vida-logo-official.png';
const Auth = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const fixedEmail = 'purawestkeuken@puravidafoodbar.nl';

  // Check if already logged in
  useEffect(() => {
    const checkSession = async () => {
      const {
        data: {
          session
        }
      } = await supabase.auth.getSession();
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
      const {
        data,
        error
      } = await supabase.auth.signInWithPassword({
        email: fixedEmail,
        password: password
      });
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Onjuiste inloggegevens', {
            description: 'Controleer je gebruikersnaam en wachtwoord'
          });
        } else {
          toast.error('Inloggen mislukt', {
            description: error.message
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
        description: 'Probeer het opnieuw'
      });
    } finally {
      setLoading(false);
    }
  };
  return <div className="min-h-screen bg-[#F5F7DD] flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md bg-white shadow-lg border border-gray-100 rounded-xl overflow-hidden">
        {/* Header */}
        <div className="px-8 pt-10 pb-6 border-b border-gray-100">
          <div className="flex justify-center mb-4">
            <img src={logoOfficial} alt="Pura Vida Foodbar" className="h-16 w-auto" />
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 text-sm text-gray-600">
              <span className="font-medium">Voorraadregistratie</span>
              <span className="text-gray-300">•</span>
              <span>Pura Vida Foodbar West</span>
            </div>
          </div>
        </div>

        {/* Login Form */}
        <div className="px-8 py-8">
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
                Gebruikersnaam
              </label>
              <div className="relative">
                <Input id="email" type="text" value="Pura West Keuken" className="h-11 border border-gray-200 bg-gray-50 rounded-lg font-medium text-gray-700 cursor-not-allowed" disabled readOnly autoComplete="username" />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
                Wachtwoord
              </label>
              <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Vul je wachtwoord in" className="h-11 border border-gray-300 focus:border-[#1B7867] focus:ring-1 focus:ring-[#1B7867] bg-white rounded-lg text-gray-900 placeholder:text-gray-400" disabled={loading} autoComplete="current-password" autoFocus />
            </div>

            <Button type="submit" disabled={loading} className="w-full h-11 bg-[#1B7867] hover:bg-[#0d5a4c] text-white shadow-sm hover:shadow-md transition-all duration-200 rounded-lg font-semibold text-sm mt-6">
              {loading ? <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Bezig met inloggen...
                </> : <>
                  <LogIn className="mr-2 h-5 w-5" />
                  Inloggen
                </>}
            </Button>
          </form>
        </div>
      </Card>
    </div>;
};
export default Auth;