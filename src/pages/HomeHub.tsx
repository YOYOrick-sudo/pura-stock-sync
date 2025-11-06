import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Package, Calculator, LogOut } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import WaveBackground from "@/components/WaveBackground";
import logoGreen from "@/assets/pura-vida-logo-official.png";
import { useInactivityTimeout } from "@/hooks/useInactivityTimeout";
const HomeHub = () => {
  const navigate = useNavigate();
  const [userLocation, setUserLocation] = useState<string>('');
  useInactivityTimeout();
  useEffect(() => {
    const fetchUserLocation = async () => {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (user) {
        const {
          data
        } = await supabase.from('user_roles').select('location').eq('user_id', user.id).maybeSingle();
        const location = data?.location || 'West';
        setUserLocation(location);

        // Redirect Midsland users directly to kassa
        if (location === 'Midsland') {
          navigate('/kassa');
        }
      }
    };
    fetchUserLocation();
  }, [navigate]);
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
  return <div className="min-h-screen bg-background flex items-center justify-center p-4 relative">
      <WaveBackground />
      
      {/* Logout button */}
      <Button onClick={handleLogout} variant="ghost" size="default" className="absolute top-4 right-4 text-foreground/70 hover:text-foreground z-10">
        <LogOut className="h-6 w-6" />
      </Button>

      <Card className="p-5 space-y-4 bg-card/80 backdrop-blur-sm shadow-md max-w-md w-full animate-fade-in">
        {/* Logo */}
        <div className="flex justify-center">
          
        </div>

        {/* Title */}
        
        
        {/* Buttons */}
        <div className="flex flex-col gap-3 w-full">
          {userLocation === 'West' && <Button size="default" className="h-14 text-base" onClick={() => navigate('/voorraad')}>
              <Package className="mr-3 h-7 w-7" />
              Voorraadregistratie
            </Button>}
          
          <Button size="default" variant="secondary" className="h-14 text-base" onClick={() => navigate('/kassa')}>
            <Calculator className="mr-3 h-7 w-7" />
            Kassatelling
          </Button>
        </div>
      </Card>
    </div>;
};
export default HomeHub;