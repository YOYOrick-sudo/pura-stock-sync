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
      if (user) {
        setUserEmail(user.email || '');
      }
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
      <div className="max-w-7xl mx-auto px-6 space-y-10 pt-12">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Instellingen</h1>
          <p className="text-sm text-muted-foreground">{userLocation}</p>
        </div>

        <div className="grid gap-4 max-w-2xl">
          <Card className="p-6">
            <h3 className="font-semibold text-lg mb-4">Gebruikersinformatie</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email:</span>
                <span className="font-medium">{userEmail}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Locatie:</span>
                <span className="font-medium">{userLocation}</span>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold text-lg mb-4">Account</h3>
            <Button 
              onClick={handleLogout} 
              variant="destructive"
              className="w-full"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Uitloggen
            </Button>
          </Card>
        </div>
      </div>
    </SidebarLayout>
  );
}
