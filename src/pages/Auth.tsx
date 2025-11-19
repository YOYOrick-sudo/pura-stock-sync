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
  const [hoveredCard, setHoveredCard] = useState<'West' | 'Midsland' | null>(null);
  
  const getEmailForLocation = (loc: 'West' | 'Midsland') => {
    return loc === 'West' 
      ? 'purawestkeuken@puravidafoodbar.nl'
      : 'puramidsland@puravidafoodbar.nl';
  };

  // Check if already logged in
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/dashboard');
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
      // Check of er een oude session is en clear die alleen dan
      const { data: { session: existingSession } } = await supabase.auth.getSession();
      if (existingSession) {
        await supabase.auth.signOut();
        // Wacht even zodat de auth state update volledig is
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: getEmailForLocation(location),
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
        // Verificeer dat de user location correct is
        const { data: userRole } = await supabase
          .from('user_roles')
          .select('location')
          .eq('user_id', data.session.user.id)
          .maybeSingle();
        
        console.log('Login voor:', location, '- Database location:', userRole?.location);
        
        if (userRole?.location !== location) {
          toast.error('Verkeerde locatie detecteerd', {
            description: `Deze account hoort bij ${userRole?.location}`
          });
          await supabase.auth.signOut();
          return;
        }
        
        toast.success(`Welkom bij ${location}!`);
        navigate('/dashboard');
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

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#FEFFF1',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '48px 16px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '500px',
        backgroundColor: '#F6F7DD',
        border: '1px solid rgba(197, 197, 202, 0.5)',
        borderRadius: '20px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '48px 32px 24px',
          borderBottom: '1px solid rgba(197, 197, 202, 0.3)'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <img 
              src={logoOfficial} 
              alt="Pura Vida Foodbar" 
              style={{ height: '88px', width: 'auto', margin: '0 auto' }}
            />
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '13px',
              color: '#73747B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px'
            }}>
              <span>Operationeel Systeem</span>
              <span style={{ color: 'rgba(197, 197, 202, 0.5)' }}>•</span>
              <span>Pura Vida Foodbar</span>
            </div>
          </div>
        </div>

        {/* Login Form */}
        <div style={{ padding: '32px' }}>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <label style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '11px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: '#73747B',
                display: 'block',
                marginBottom: '12px'
              }}>
                Selecteer Locatie
              </label>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px'
              }}>
                {/* West Card */}
                <div
                  onClick={() => !loading && setLocation('West')}
                  onMouseEnter={() => !loading && setHoveredCard('West')}
                  onMouseLeave={() => setHoveredCard(null)}
                  style={{
                    cursor: loading ? 'not-allowed' : 'pointer',
                    padding: '16px',
                    borderRadius: '20px',
                    border: location === 'West' 
                      ? '2px solid #1B7867' 
                      : hoveredCard === 'West'
                        ? '1px solid rgba(197, 197, 202, 0.7)'
                        : '1px solid rgba(197, 197, 202, 0.5)',
                    backgroundColor: location === 'West' 
                      ? '#FEFFF1' 
                      : hoveredCard === 'West'
                        ? '#FEFFF1'
                        : '#F6F7DD',
                    transition: 'all 200ms',
                    opacity: loading ? 0.5 : 1,
                    boxShadow: hoveredCard === 'West' && location !== 'West'
                      ? '0 2px 4px rgba(0, 0, 0, 0.08)'
                      : 'none'
                  }}
                >
                  <div style={{
                    textAlign: 'center',
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '16px',
                    fontWeight: 600,
                    color: '#282E3A'
                  }}>
                    West
                  </div>
                </div>

                {/* Midsland Card */}
                <div
                  onClick={() => !loading && setLocation('Midsland')}
                  onMouseEnter={() => !loading && setHoveredCard('Midsland')}
                  onMouseLeave={() => setHoveredCard(null)}
                  style={{
                    cursor: loading ? 'not-allowed' : 'pointer',
                    padding: '16px',
                    borderRadius: '20px',
                    border: location === 'Midsland' 
                      ? '2px solid #1B7867' 
                      : hoveredCard === 'Midsland'
                        ? '1px solid rgba(197, 197, 202, 0.7)'
                        : '1px solid rgba(197, 197, 202, 0.5)',
                    backgroundColor: location === 'Midsland' 
                      ? '#FEFFF1' 
                      : hoveredCard === 'Midsland'
                        ? '#FEFFF1'
                        : '#F6F7DD',
                    transition: 'all 200ms',
                    opacity: loading ? 0.5 : 1,
                    boxShadow: hoveredCard === 'Midsland' && location !== 'Midsland'
                      ? '0 2px 4px rgba(0, 0, 0, 0.08)'
                      : 'none'
                  }}
                >
                  <div style={{
                    textAlign: 'center',
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '16px',
                    fontWeight: 600,
                    color: '#282E3A'
                  }}>
                    Midsland
                  </div>
                </div>
              </div>
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
                  color: '#73747B',
                  display: 'block',
                  marginBottom: '8px'
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
                autoFocus
                style={{
                  width: '100%',
                  height: '44px',
                  padding: '0 16px',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '15px',
                  color: '#282E3A',
                  backgroundColor: '#FEFFF1',
                  border: '1px solid rgba(197, 197, 202, 0.5)',
                  borderRadius: '16px',
                  outline: 'none',
                  transition: 'border-color 200ms',
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#1B7867'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(197, 197, 202, 0.5)'}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                height: '48px',
                padding: '0 24px',
                fontFamily: 'Inter, sans-serif',
                fontSize: '15px',
                fontWeight: 600,
                color: '#FFFFFF',
                backgroundColor: loading ? '#D1D5DB' : '#1B7867',
                border: 'none',
                borderRadius: '20px',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: loading ? 'none' : '0 2px 4px rgba(27, 120, 103, 0.15)',
                transition: 'all 200ms',
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.backgroundColor = '#156B5A';
                  e.currentTarget.style.boxShadow = '0 4px 6px rgba(27, 120, 103, 0.2)';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.backgroundColor = '#1B7867';
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(27, 120, 103, 0.15)';
                }
              }}
            >
              {loading ? (
                <>
                  <Loader2 style={{ width: '20px', height: '20px' }} className="animate-spin" />
                  <span>Bezig met inloggen...</span>
                </>
              ) : (
                <>
                  <LogIn style={{ width: '20px', height: '20px' }} />
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
