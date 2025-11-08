import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Package, Calculator, LogOut, CheckSquare } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import WaveBackground from "@/components/WaveBackground";
import logoGreen from "@/assets/pura-vida-logo-official.png";
import { useUserLocation } from "@/contexts/UserLocationContext";
const HomeHub = () => {
  const navigate = useNavigate();
  const { userLocation } = useUserLocation();
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

      <Card className="p-5 space-y-4 bg-card/80 backdrop-blur-sm shadow-md max-w-sm md:max-w-md w-full animate-fade-in">
        {/* Logo */}
        <div className="flex justify-center mb-4">
          <img src={logoGreen} alt="Pura Vida" className="h-20" />
        </div>

        {/* Title */}
        <h2 className="text-2xl font-heading font-bold text-center text-foreground mb-6">
          Dashboard
        </h2>
        
        {/* Buttons */}
        <div className="flex flex-col gap-3 w-full">
          {/* FOH Taken tile - EERSTE en voor ALLE users */}
          <Button size="default" className="h-16 text-base font-semibold" onClick={() => navigate('/foh')}>
            <CheckSquare className="mr-3 h-7 w-7" />
            Bediening Taken
          </Button>
          
          {/* Kassatelling tile - TWEEDE optie */}
          <Button size="default" variant="secondary" className="h-16 text-base" onClick={() => navigate('/kassa')}>
            <Calculator className="mr-3 h-7 w-7" />
            Kassatelling
          </Button>

          {/* Voorraad tile - alleen West, DERDE optie */}
          {userLocation === 'West' && <Button size="default" variant="outline" className="h-16 text-base" onClick={() => navigate('/voorraad')}>
              <Package className="mr-3 h-7 w-7" />
              Voorraadregistratie
            </Button>}
        </div>
      </Card>
    </div>;
};
export default HomeHub;