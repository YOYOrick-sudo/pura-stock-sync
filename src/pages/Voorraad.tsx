import { SidebarLayout } from '@/components/SidebarLayout';
import OrderDashboard from '@/components/OrderDashboard';
import { useUserLocation } from '@/contexts/UserLocationContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { LogOut, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

function getCurrentWeek(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const diff = now.getTime() - start.getTime();
  const oneWeek = 1000 * 60 * 60 * 24 * 7;
  return Math.ceil(diff / oneWeek);
}

export default function Voorraad() {
  const { userLocation } = useUserLocation();
  const navigate = useNavigate();
  const currentWeek = getCurrentWeek();

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
      <div className="min-h-screen bg-gradient-to-b from-[#F5F7DD] to-[#F5F7DD]/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-6 pt-12 pb-20">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              {/* Hamburger menu - alleen mobiel */}
              <SidebarTrigger className="lg:hidden h-10 w-10 mt-1" />
              
              <div>
                <h1 className="text-2xl sm:text-3xl font-heading font-bold text-foreground mb-2">
                  Telling & Bestelling
                </h1>
                
                {/* Week + datum */}
                <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground flex-wrap">
                  <span>Week {currentWeek}</span>
                  <span>•</span>
                  <span>
                    {new Date().toLocaleDateString('nl-NL', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </span>
                </div>
                
                {/* Locatie + info */}
                <div className="flex items-center gap-2 mt-1">
                  {userLocation && (
                    <Badge variant="secondary" className="bg-[#1B7867]/10 text-[#1B7867] border-[#1B7867]/20">
                      {userLocation}
                    </Badge>
                  )}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button className="text-[#1B7867] hover:text-[#0d5a4c] transition-colors">
                          <Info className="h-4 w-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs bg-white border-[#1B7867]/20 text-[#282E3A]">
                        <p className="text-sm">Noteer de huidige voorraad. Het systeem rekent uit wat Midsland aanvult.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </div>
            
            <Button 
              onClick={handleLogout} 
              variant="ghost" 
              size="sm" 
              className="text-muted-foreground hover:text-foreground self-start lg:self-center"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
          
          <OrderDashboard />
        </div>
      </div>
    </SidebarLayout>
  );
}
