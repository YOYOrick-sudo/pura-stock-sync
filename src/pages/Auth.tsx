import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, LogIn } from 'lucide-react';
import { toast } from 'sonner';
import logoOfficial from '@/assets/pura-vida-logo-official.png';

const Auth = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await redirectByRole(session.user.id);
      }
    };
    checkSession();
  }, [navigate]);

  const redirectByRole = async (userId: string) => {
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role, location')
      .eq('user_id', userId)
      .maybeSingle();

    if (userRole) {
      const role = userRole.role as string;
      if (role === 'owner' || role === 'manager' || role === 'admin') {
        navigate('/dashboard');
      } else {
        navigate('/mijn/dashboard');
      }
    } else {
      navigate('/dashboard');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error('Vul je e-mail en wachtwoord in');
      return;
    }
    setLoading(true);
    try {
      const { data: { session: existingSession } } = await supabase.auth.getSession();
      if (existingSession) {
        await supabase.auth.signOut();
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Onjuiste inloggegevens', {
            description: 'Controleer je e-mail en wachtwoord'
          });
        } else {
          toast.error('Inloggen mislukt', {
            description: error.message
          });
        }
        return;
      }

      if (data.session) {
        toast.success('Welkom!');
        await redirectByRole(data.session.user.id);
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

  const inputStyle: React.CSSProperties = {
    width: '100%',
    height: '36px',
    padding: '0 12px',
    fontFamily: 'Inter, sans-serif',
    fontSize: '13px',
    color: '#282E3A',
    backgroundColor: '#FFFFFF',
    border: '1px solid #C1C5CF',
    borderRadius: '14px',
    outline: 'none',
    transition: 'border-color 0.15s, box-shadow 0.15s',
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = '#E27726';
    e.currentTarget.style.boxShadow = '0 0 0 2px rgba(226,119,38,0.2)';
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = '#C1C5CF';
    e.currentTarget.style.boxShadow = 'none';
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#F8F9FA',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '48px 16px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '420px',
        backgroundColor: '#FFFFFF',
        border: '1px solid #D5D8E0',
        borderRadius: '20px',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '40px 32px 24px',
          borderBottom: '1px solid #D5D8E0'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '16px' }}>
            <img
              src={logoOfficial}
              alt="Pura Vida Foodbar"
              style={{ height: '80px', width: 'auto', margin: '0 auto' }}
            />
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '12px',
              color: '#8D93A0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}>
              <span>Operationeel Systeem</span>
              <span style={{ color: '#D5D8E0' }}>•</span>
              <span>Pura Vida Foodbar</span>
            </div>
          </div>
        </div>

        {/* Login Form */}
        <div style={{ padding: '28px 32px 32px' }}>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label
                htmlFor="email"
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '11px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: '#8D93A0',
                  display: 'block',
                  marginBottom: '6px'
                }}
              >
                E-mailadres
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="naam@puravidafoodbar.nl"
                disabled={loading}
                autoComplete="email"
                autoFocus
                style={{
                  ...inputStyle,
                  opacity: loading ? 0.5 : 1,
                }}
                onFocus={handleFocus}
                onBlur={handleBlur}
              />
            </div>

            <div>
              <label
                htmlFor="password"
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '11px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: '#8D93A0',
                  display: 'block',
                  marginBottom: '6px'
                }}
              >
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
                style={{
                  ...inputStyle,
                  opacity: loading ? 0.5 : 1,
                }}
                onFocus={handleFocus}
                onBlur={handleBlur}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                height: '40px',
                padding: '0 18px',
                fontFamily: 'Inter, sans-serif',
                fontSize: '14px',
                fontWeight: 600,
                color: '#FFFFFF',
                backgroundColor: loading ? 'rgba(226,119,38,0.45)' : '#E27726',
                border: 'none',
                borderRadius: '16px',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'background-color 0.15s',
                marginTop: '4px',
              }}
              onMouseEnter={(e) => {
                if (!loading) e.currentTarget.style.backgroundColor = '#C9630E';
              }}
              onMouseLeave={(e) => {
                if (!loading) e.currentTarget.style.backgroundColor = '#E27726';
              }}
              onMouseDown={(e) => {
                if (!loading) e.currentTarget.style.transform = 'scale(0.97)';
              }}
              onMouseUp={(e) => {
                if (!loading) e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              {loading ? (
                <>
                  <Loader2 style={{ width: '18px', height: '18px' }} className="animate-spin" />
                  <span>Bezig met inloggen...</span>
                </>
              ) : (
                <>
                  <LogIn style={{ width: '18px', height: '18px' }} />
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
