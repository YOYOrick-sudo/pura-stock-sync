import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Package, Calculator } from "lucide-react";
import { supabase } from "@/lib/supabase";

const HomeHub = () => {
  const navigate = useNavigate();
  const [userLocation, setUserLocation] = useState<string>('');

  useEffect(() => {
    const fetchUserLocation = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('user_roles')
          .select('location')
          .eq('user_id', user.id)
          .maybeSingle();
        
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

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center space-y-8">
        <h1 className="text-4xl font-heading font-bold text-foreground">
          Pura Vida — Kies module
        </h1>
        
        <div className="flex flex-col gap-4 w-full max-w-md">
          {userLocation === 'West' && (
            <Button
              size="lg"
              className="h-16 text-lg"
              onClick={() => navigate('/voorraad')}
            >
              <Package className="mr-2 h-5 w-5" />
              Voorraadregistratie
            </Button>
          )}
          
          <Button
            size="lg"
            variant="secondary"
            className="h-16 text-lg"
            onClick={() => navigate('/kassa')}
          >
            <Calculator className="mr-2 h-5 w-5" />
            Kassatelling
          </Button>
        </div>
      </div>
    </div>
  );
};

export default HomeHub;
