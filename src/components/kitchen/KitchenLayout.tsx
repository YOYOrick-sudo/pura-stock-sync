import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, LogOut } from 'lucide-react';
import logoGreen from '@/assets/pura-vida-logo-official.png';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
      console.error('Logout error:', error);
      toast.error('Uitloggen mislukt');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      {/* Header */}
      <div className="bg-white border-b border-[#D5D8E0]">
        <div className="max-w-[1200px] mx-auto px-4 py-4 sm:py-5 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-4">
            <Button
              onClick={() => navigate(backTo)}
              variant="ghost"
              size="sm"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {backLabel}
            </Button>

            <img src={logoGreen} alt="Pura Vida Foodbar" className="h-12 sm:h-16 w-auto" />

            <Button
              onClick={handleLogout}
              variant="ghost"
              size="sm"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>

          <div className="text-center">
            <h1 style={{ fontFamily: "'Instrument Sans', sans-serif", fontSize: '24px', fontWeight: 700, color: '#1A1F28', letterSpacing: '-0.02em', marginBottom: '4px' }}>{title}</h1>
            {subtitle && <p style={{ fontSize: '14px', color: '#636878' }}>{subtitle}</p>}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1200px] mx-auto px-4 py-6 sm:px-6 lg:px-8 pb-24">
        {children}
      </div>
    </div>
  );
}
