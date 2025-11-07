import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { LogOut, Info } from 'lucide-react';
import logoGreen from '@/assets/pura-vida-logo-official.png';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { KassaTabBar } from '@/components/KassaTabBar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useInactivityTimeout } from '@/hooks/useInactivityTimeout';

// Always get week number reliably using ISO 8601
const getWeekNumber = (date: Date): number => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
};
const KassatellingOverdag = () => {
  const navigate = useNavigate();
  const weekNumber = getWeekNumber(new Date());
  const [userLocation, setUserLocation] = useState<string>('');
  const [naam, setNaam] = useState('');

  // Enable inactivity timeout
  useInactivityTimeout();
  const [kassaLade, setKassaLade] = useState({
    '500': '' as number | '',
    '200': '' as number | '',
    '100': '' as number | '',
    '50': '' as number | '',
    '20': '' as number | '',
    '10': '' as number | '',
    '5': '' as number | '',
    '2': '' as number | '',
    '1': '' as number | '',
    '0.50': '' as number | '',
    '0.20': '' as number | '',
    '0.10': '' as number | '',
    '0.05': '' as number | ''
  });
  const [wisselkas, setWisselkas] = useState({
    '500': '' as number | '',
    '200': '' as number | '',
    '100': '' as number | '',
    '50': '' as number | '',
    '20': '' as number | '',
    '10': '' as number | '',
    '5': '' as number | '',
    '2': '' as number | '',
    '1': '' as number | '',
    '0.50': '' as number | '',
    '0.20': '' as number | '',
    '0.10': '' as number | '',
    '0.05': '' as number | ''
  });
  const [opmerkingen, setOpmerkingen] = useState('');
  const [showInstructionsDialog, setShowInstructionsDialog] = useState(false);
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
      }
    };
    fetchUserLocation();
  }, []);
  const updateKassaLade = (denomination: string, value: number | '') => {
    setKassaLade(prev => ({
      ...prev,
      [denomination]: value
    }));
  };
  const updateWisselkas = (denomination: string, value: number | '') => {
    setWisselkas(prev => ({
      ...prev,
      [denomination]: value
    }));
  };
  const calculateTotal = (counts: typeof kassaLade) => {
    return Object.entries(counts).reduce((sum, [denom, count]) => {
      const numCount = count === '' ? 0 : count;
      return sum + parseFloat(denom) * numCount;
    }, 0);
  };
  const kassaLadeTotal = calculateTotal(kassaLade);
  const wisselkasTotal = calculateTotal(wisselkas);
  const total = kassaLadeTotal + wisselkasTotal;
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
  const handleSubmit = async () => {
    const data = {
      type: 'open',
      week: weekNumber,
      date: new Date().toISOString(),
      location: userLocation,
      naam: naam,
      kassaLade: {
        denominations: kassaLade,
        total: kassaLadeTotal
      },
      wisselkas: {
        denominations: wisselkas,
        total: wisselkasTotal
      },
      total: total,
      opmerkingen: opmerkingen
    };
    try {
      await fetch('https://jaapies.app.n8n.cloud/webhook/kassa-afdracht', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      toast.success('Afdracht verzonden ✅');

      // Auto logout and redirect after 1.5 seconds
      setTimeout(async () => {
        await supabase.auth.signOut();
        navigate('/');
      }, 1500);
    } catch (error) {
      console.error('Fout bij verzenden:', error);
      toast.error('Verzenden mislukt');
    }
  };
  return <div className="min-h-screen bg-[#F5F7DD]">
      {/* Header */}
      <div className="bg-[#F5F7DD] border-b border-[#1B7867]/10">
        <div className="max-w-3xl mx-auto px-4 py-4 sm:py-5 sm:px-6 lg:px-8">
          {/* Desktop Layout */}
          <div className="hidden sm:flex items-center justify-between gap-4">
            {/* Left: Week & Page */}
            <div className="flex-1">
              <div className="text-xs text-[#282E3A]/50 mb-1">
                <span>Week {weekNumber}</span>
                <span className="mx-2">•</span>
                <span>{new Date().toLocaleDateString('nl-NL', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}</span>
              </div>
              <div className="text-sm text-[#282E3A]/70">
                <span>Kassatelling</span>
                <span className="mx-2">•</span>
                <span>Pura Vida</span>
                <span className="mx-2">•</span>
                <span>{userLocation}</span>
              </div>
            </div>
            
            {/* Center: Logo */}
            <div className="flex-shrink-0">
              <img src={logoGreen} alt="Pura Vida Foodbar" className="h-16 sm:h-20 w-auto" />
            </div>
            
            {/* Right: Logout */}
            <div className="flex-1 flex justify-end gap-2">
              <Button onClick={handleLogout} variant="ghost" size="sm" className="text-[#282E3A]/50 hover:text-[#282E3A] hover:bg-transparent">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Mobile Layout */}
          <div className="sm:hidden flex items-center justify-between gap-3">
            {/* Left: Week & Page */}
            <div className="flex-1 text-left">
              <div className="text-xs text-[#282E3A]/50 mb-1">
                Week {weekNumber} • {new Date().toLocaleDateString('nl-NL', {
                day: 'numeric',
                month: 'numeric'
              })}
              </div>
              <div className="text-xs text-[#282E3A]/70">
                <span>Kassatelling</span>
                <span className="mx-2">•</span>
                <span>Pura Vida</span>
                <span className="mx-2">•</span>
                <span>{userLocation}</span>
              </div>
            </div>
            
            {/* Center: Logo */}
            <div className="flex-shrink-0">
              <img src={logoGreen} alt="Pura Vida Foodbar" className="h-14 w-auto" />
            </div>
            
            {/* Right: Logout */}
            <div className="flex-1 flex justify-end gap-2">
              <Button onClick={handleLogout} variant="ghost" size="sm" className="text-[#282E3A]/50 hover:text-[#282E3A] hover:bg-transparent">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Bar */}
      <KassaTabBar />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-3 py-6 sm:px-4 sm:py-8 lg:px-6 pb-10">{/* Removed title section - now in KassaTabBar */}
        
        

        {/* Instructies Dialog */}
        <Dialog open={showInstructionsDialog} onOpenChange={setShowInstructionsDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-xl font-heading font-bold text-[#282E3A]">
                Instructies Kassatelling
              </DialogTitle>
            </DialogHeader>
            
            <div className="mt-4">
              <ol className="space-y-3">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#1B7867] text-white text-sm font-heading font-bold flex items-center justify-center">1</span>
                  <div>
                    <span className="font-heading font-medium text-[#282E3A]">Tel de kassa lade</span>
                    <p className="text-xs text-[#282E3A]/60 mt-0.5">Vul alle aantallen in</p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#1B7867] text-white text-sm font-heading font-bold flex items-center justify-center">2</span>
                  <div>
                    <span className="font-heading font-medium text-[#282E3A]">Tel de wisselkas</span>
                    <p className="text-xs text-[#282E3A]/60 mt-0.5">Vul alle aantallen in</p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#1B7867] text-white text-sm font-heading font-bold flex items-center justify-center">3</span>
                  <div>
                    <span className="font-heading font-medium text-[#282E3A]">Controleer het totaal</span>
                    <p className="text-xs text-[#282E3A]/60 mt-0.5">Moet €157,00 zijn</p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#1B7867] text-white text-sm font-heading font-bold flex items-center justify-center">4</span>
                  <div>
                    <span className="font-heading font-medium text-[#282E3A]">Bij tekort/overschot</span>
                    <p className="text-xs text-[#282E3A]/60 mt-0.5">Meld dit in de opmerkingen</p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#1B7867] text-white text-sm font-heading font-bold flex items-center justify-center">5</span>
                  <div>
                    <span className="font-heading font-medium text-[#282E3A]">Aanvullen indien nodig</span>
                    <p className="text-xs text-[#282E3A]/60 mt-0.5">Als totaal &lt; €157, vul aan vanuit wisselkassa tot €157</p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#1B7867] text-white text-sm font-heading font-bold flex items-center justify-center">6</span>
                  <div>
                    <span className="font-heading font-medium text-[#282E3A]">Geen wijzigingen meer</span>
                    <p className="text-xs text-[#282E3A]/60 mt-0.5">Na aanvullen niets meer wijzigen in de telling</p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#1B7867] text-white text-sm font-heading font-bold flex items-center justify-center">7</span>
                  <div>
                    <span className="font-heading font-medium text-[#282E3A]">Verzenden</span>
                    <p className="text-xs text-[#282E3A]/60 mt-0.5">Druk op de verzenden knop</p>
                  </div>
                </li>
              </ol>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>;
};
export default KassatellingOverdag;