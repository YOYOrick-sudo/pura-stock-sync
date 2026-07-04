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
import { devError } from "@/lib/devLog";

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
      devError('Logout error:', error);
      toast.error('Uitloggen mislukt');
    }
  };

  return (
    <SidebarLayout>
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto space-y-6 pb-20">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
            <div>
              <div>
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
                    <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                      {userLocation}
                    </Badge>
                  )}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button className="text-primary hover:text-primary/80 transition-colors">
                          <Info className="h-4 w-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs bg-card border-primary/20 text-foreground">
                        <p className="text-sm">Noteer de huidige voorraad. Het systeem rekent uit wat Foodbar aanvult.</p>
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
