import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, LogOut } from 'lucide-react';
import logoGreen from '@/assets/pura-vida-logo-official.png';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { devError } from "@/lib/devLog";

interface KitchenLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  backTo?: string;
  backLabel?: string;
}

export function KitchenLayout({ children, title, subtitle, backTo = '/kitchen', backLabel = 'Keuken' }: KitchenLayoutProps) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Uitgelogd');
      navigate('/auth');
    } catch (error) {
      devError('Logout error:', error);
      toast.error('Uitloggen mislukt');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-background border-b border-primary/10">
        <div className="max-w-5xl mx-auto px-4 py-4 sm:py-5 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-4">
            <Button
              onClick={() => navigate(backTo)}
              variant="ghost"
              size="sm"
              className="text-foreground/50 hover:text-foreground hover:bg-transparent"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {backLabel}
            </Button>

            <img src={logoGreen} alt="Pura Vida Foodbar" className="h-12 sm:h-16 w-auto" />

            <Button
              onClick={handleLogout}
              variant="ghost"
              size="sm"
              className="text-foreground/50 hover:text-foreground hover:bg-transparent"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>

          <div className="text-center">
            <h1 className="text-xl sm:text-2xl font-heading font-bold text-foreground mb-1">{title}</h1>
            {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 py-6 sm:px-6 lg:px-8 pb-24">
        {children}
      </div>
    </div>
  );
}
