import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { LogOut } from 'lucide-react';
import logoGreen from '@/assets/pura-vida-logo-official.png';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { KassaTabBar } from '@/components/KassaTabBar';

// Always get week number reliably using ISO 8601
const getWeekNumber = (date: Date): number => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
};

const Kassa = () => {
  const navigate = useNavigate();
  const weekNumber = getWeekNumber(new Date());
  const DOELSALDO = 157;
  const [userLocation, setUserLocation] = useState<string>('');

  const [counts, setCounts] = useState({
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
    '0.05': '' as number | '',
  });

  const [cashOmzet, setCashOmzet] = useState<number | ''>('');
  const [opmerkingen, setOpmerkingen] = useState('');

  useEffect(() => {
    const fetchUserLocation = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('user_roles')
          .select('location')
          .eq('user_id', user.id)
          .maybeSingle();
        
        setUserLocation(data?.location || 'West');
      }
    };
    fetchUserLocation();
  }, []);

  const updateCount = (denomination: string, value: number | '') => {
    setCounts(prev => ({
      ...prev,
      [denomination]: value
    }));
  };

  const calculateTotal = () => {
    return Object.entries(counts).reduce((sum, [denom, count]) => {
      const numCount = count === '' ? 0 : count;
      return sum + (parseFloat(denom) * numCount);
    }, 0);
  };

  const total = calculateTotal();
  const afdracht = Math.max(0, total - DOELSALDO);
  const numCashOmzet = cashOmzet === '' ? 0 : cashOmzet;
  const kasverschil = (total - DOELSALDO) - numCashOmzet;

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

  const handleSubmit = async () => {
    const data = {
      type: 'sluit',
      week: weekNumber,
      date: new Date().toISOString(),
      location: userLocation,
      denominations: counts,
      cashOmzetLightspeed: numCashOmzet,
      total: total,
      doelsaldo: DOELSALDO,
      afdracht: afdracht,
      kasverschil: kasverschil,
      opmerkingen: opmerkingen
    };
    
    try {
      await fetch('https://jaapies.app.n8n.cloud/webhook/kassa-afdracht', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      toast.success('Afdracht verzonden ✅');
    } catch (error) {
      console.error('Fout bij verzenden:', error);
      toast.error('Verzenden mislukt');
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7DD]">
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
                <span>Pura Vida - {userLocation}</span>
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
              <div className="text-xs text-[#282E3A]/60">
                Kassatelling - {userLocation}
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
      <div className="max-w-7xl mx-auto px-3 py-6 sm:px-4 sm:py-8 lg:px-6 pb-10">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-[#282E3A] flex items-center gap-2">
            Kassatelling
            <span className="text-[#1B7867]">•</span>
            <span className="text-[#1B7867]">Avond</span>
            <span className="text-[#1B7867]">•</span>
            <span>{userLocation}</span>
          </h1>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6 items-start">
          {/* Denomination table */}
          <div className="overflow-hidden shadow-sm border-[#1B7867]/10 bg-white rounded-lg border">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#1B7867]/10 bg-[#F5F7DD]/20">
                    <th className="px-2 py-0.5 text-left font-heading font-bold text-[#282E3A]/70 text-xs uppercase tracking-wide">Denominatie</th>
                    <th className="px-2 py-0.5 text-center font-heading font-bold text-[#282E3A]/70 text-xs uppercase tracking-wide">Aantal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1B7867]/15">
                  {['500', '200', '100', '50', '20', '10', '5', '2', '1', '0.50', '0.20', '0.10', '0.05'].map((denom, index) => (
                    <tr key={denom} className={index % 2 === 0 ? 'bg-white' : 'bg-[#F5F7DD]/10'}>
                      <td className="px-2 py-0.5 text-[#282E3A] font-mono text-sm border-r border-[#1B7867]/10">€{denom.replace('.', ',')}</td>
                      <td className="px-2 py-0.5 text-center">
                        <input 
                          type="number" 
                          value={counts[denom as keyof typeof counts]} 
                          onChange={(e) => updateCount(denom, e.target.value === '' ? '' : parseInt(e.target.value))}
                          min={0} 
                          className="w-16 px-2 py-0.5 text-center border border-[#1B7867]/30 rounded-md focus:outline-none focus:border-[#1B7867] font-mono text-sm" 
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right side: Summary card */}
          <div className="lg:sticky lg:top-6">
            <div className="bg-white rounded-xl shadow-sm border border-[#1B7867]/10 p-4">
          {/* Totaal - meest prominent */}
          <div className="flex items-center justify-between py-1.5">
            <span className="text-sm font-heading font-medium text-[#282E3A]/60">
              Totaal
            </span>
            <span className="text-3xl font-heading font-bold text-[#1B7867]">
              €{total.toFixed(2).replace('.', ',')}
            </span>
          </div>

          <div className="border-t border-[#1B7867]/5 my-3"></div>

          {/* Cash omzet - compacter */}
          <div className="flex items-center justify-between gap-4 py-1.5">
            <span className="text-sm font-heading font-medium text-[#282E3A]/60">
              Cash omzet (Lightspeed)
            </span>
            <input 
              type="number" 
              value={cashOmzet} 
              onChange={(e) => setCashOmzet(e.target.value === '' ? '' : parseFloat(e.target.value))}
              min={0} 
              className="w-24 px-2 py-1.5 text-right text-lg font-heading font-bold text-[#282E3A] border border-[#1B7867]/20 rounded-md focus:outline-none focus:border-[#1B7867] font-mono" 
            />
          </div>

          <div className="border-t border-[#1B7867]/5 my-3"></div>

          {/* Afdracht - compacter met kleinere uitleg */}
          <div className="py-1.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-heading font-medium text-[#282E3A]/60">
                Afdracht / Envelop
              </span>
              <span className={`text-2xl font-heading font-bold ${
                afdracht > 0 ? 'text-[#1B7867]' : 'text-gray-400'
              }`}>
                €{afdracht.toFixed(2).replace('.', ',')}
              </span>
            </div>
            <p className="text-xs text-[#282E3A]/60 mt-1">
              {total >= DOELSALDO 
                ? `Leg €${afdracht.toFixed(2).replace('.', ',')} in de envelop, laat €${DOELSALDO.toFixed(2).replace('.', ',')} in de lade.`
                : `Aanvullen uit wisselkassa: €${(DOELSALDO - total).toFixed(2).replace('.', ',')} om de lade op €${DOELSALDO.toFixed(2).replace('.', ',')} te brengen.`
              }
            </p>
          </div>

          <div className="border-t border-[#1B7867]/5 my-3"></div>

          {/* Kasverschil - prominente kleurcodering */}
          <div className="flex items-center justify-between py-1.5">
            <span className="text-sm font-heading font-medium text-[#282E3A]/60">
              Kasverschil
            </span>
            <span className={`text-2xl font-heading font-bold ${
              kasverschil > 0 ? 'text-green-600' : 
              kasverschil < 0 ? 'text-red-600' : 
              'text-[#282E3A]'
            }`}>
              €{kasverschil.toFixed(2).replace('.', ',')}
            </span>
          </div>

          <div className="border-t border-[#1B7867]/5 my-3"></div>

          {/* Opmerkingen - compacter label */}
          <div className="py-1.5">
            <label htmlFor="opmerkingen" className="block text-sm font-heading font-medium text-[#282E3A]/60 mb-1.5">
              Opmerkingen
            </label>
            <Textarea
              id="opmerkingen"
              value={opmerkingen}
              onChange={(e) => setOpmerkingen(e.target.value)}
              placeholder="Voeg hier eventuele opmerkingen toe..."
              className="w-full min-h-[80px] border-[#1B7867]/20 focus:border-[#1B7867] font-mono text-sm"
            />
          </div>

          {/* Verzenden button */}
          <div className="mt-4">
            <Button 
              onClick={handleSubmit}
              className="w-full bg-[#1B7867] hover:bg-[#1B7867]/90 text-white font-heading font-bold text-lg py-6"
            >
              Verzenden
            </Button>
          </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default Kassa;
