import { SidebarLayout } from '@/components/SidebarLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LogOut, Users, ChevronRight, Database } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useUserLocation } from '@/contexts/UserLocationContext';
import { devError } from "@/lib/devLog";

export default function Settings() {
  const navigate = useNavigate();
  const { displayLocation } = useUserLocation();
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
      devError('Logout error:', error);
      toast.error('Uitloggen mislukt');
    }
  };

  return (
    <SidebarLayout>
      <div className="max-w-7xl mx-auto space-y-6">

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
                <span className="font-medium">{displayLocation}</span>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold text-lg mb-4">Beheer</h3>
            <Link to="/settings/team">
              <div className="flex items-center justify-between p-3 rounded-polar-md hover:bg-muted/50 cursor-pointer transition-colors">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-primary" />
                  <div>
                    <div className="font-medium">Team</div>
                    <div className="text-sm text-muted-foreground">Teamleden uitnodigen en rollen beheren</div>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </Link>
            <Link to="/settings/bronnen">
              <div className="flex items-center justify-between p-3 rounded-polar-md hover:bg-muted/50 cursor-pointer transition-colors">
                <div className="flex items-center gap-3">
                  <Database className="h-5 w-5 text-primary" />
                  <div>
                    <div className="font-medium">Bronnen & sync</div>
                    <div className="text-sm text-muted-foreground">Lightspeed & Eitje koppelingen, sync-status en handmatig triggeren</div>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </Link>
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
