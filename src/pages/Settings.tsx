import { SidebarLayout } from '@/components/SidebarLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useUserLocation } from '@/contexts/UserLocationContext';

export default function Settings() {
  const navigate = useNavigate();
  const { userLocation } = useUserLocation();
  const [userEmail, setUserEmail] = useState<string>('');

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) { setUserEmail(user.email || ''); }
    };
    fetchUserData();
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Uitgelogd');
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Uitloggen mislukt');
    }
  };

  return (
    <SidebarLayout>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '28px 32px' }} className="space-y-6">
        <div>
          <h1 style={{ fontFamily: "'Instrument Sans', sans-serif", fontSize: '24px', fontWeight: 700, color: '#1A1F28', letterSpacing: '-0.02em' }}>Instellingen</h1>
          <p style={{ fontSize: '14px', color: '#636878' }}>{userLocation}</p>
        </div>

        <div className="grid gap-4 max-w-2xl">
          <Card className="p-5" style={{ borderRadius: '20px', border: '1px solid #D5D8E0' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#303542', marginBottom: '16px' }}>Gebruikersinformatie</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span style={{ fontSize: '13px', fontWeight: 500, color: '#636878' }}>Email:</span>
                <span style={{ fontSize: '13px', fontWeight: 500, color: '#303542' }}>{userEmail}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ fontSize: '13px', fontWeight: 500, color: '#636878' }}>Locatie:</span>
                <span style={{ fontSize: '13px', fontWeight: 500, color: '#303542' }}>{userLocation}</span>
              </div>
            </div>
          </Card>

          <Card className="p-5" style={{ borderRadius: '20px', border: '1px solid #D5D8E0' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#303542', marginBottom: '16px' }}>Account</h3>
            <Button onClick={handleLogout} variant="destructive" className="w-full" style={{ borderRadius: '16px' }}>
              <LogOut className="mr-2 h-4 w-4" />
              Uitloggen
            </Button>
          </Card>
        </div>
      </div>
    </SidebarLayout>
  );
}
