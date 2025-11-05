import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { LogOut } from 'lucide-react';
import logoGreen from '@/assets/pura-vida-logo-official.png';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

function getCurrentWeek(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const diff = now.getTime() - start.getTime();
  const oneWeek = 1000 * 60 * 60 * 24 * 7;
  return Math.ceil(diff / oneWeek);
}

const Kassa = () => {
  const navigate = useNavigate();
  const currentWeek = getCurrentWeek();
  const DOELSALDO = 157;

  const [counts, setCounts] = useState({
    '500': 0,
    '200': 0,
    '100': 0,
    '50': 0,
    '20': 0,
    '10': 0,
    '5': 0,
    '2': 0,
    '1': 0,
    '0.50': 0,
    '0.20': 0,
    '0.10': 0,
    '0.05': 0,
  });

  const [cashOmzet, setCashOmzet] = useState(0);
  const [opmerkingen, setOpmerkingen] = useState('');

  const updateCount = (denomination: string, value: number) => {
    setCounts(prev => ({
      ...prev,
      [denomination]: value
    }));
  };

  const calculateTotal = () => {
    return Object.entries(counts).reduce((sum, [denom, count]) => {
      return sum + (parseFloat(denom) * count);
    }, 0);
  };

  const total = calculateTotal();
  const afdracht = Math.max(0, total - DOELSALDO);
  const kasverschil = (total - DOELSALDO) - cashOmzet;

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
      week: currentWeek,
      date: new Date().toISOString(),
      location: 'West',
      denominations: counts,
      cashOmzetLightspeed: cashOmzet,
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
                <span>Week {currentWeek}</span>
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
                <span>Pura Vida - West</span>
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
                Week {currentWeek} • {new Date().toLocaleDateString('nl-NL', {
                  day: 'numeric',
                  month: 'numeric'
                })}
              </div>
              <div className="text-xs text-[#282E3A]/60">
                Kassatelling - West
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

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-3 py-6 sm:px-4 sm:py-8 lg:px-6 pb-10">
        <h1 className="text-2xl sm:text-3xl font-heading font-bold text-[#282E3A] mb-6">
          Kassatelling — invoer
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6 items-start">
          {/* Left side: Denomination tables */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left Column */}
          <div className="overflow-hidden shadow-sm border-[#1B7867]/10 bg-white rounded-lg border">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#1B7867]/10 bg-[#F5F7DD]/20">
                    <th className="px-3 py-3 sm:px-4 sm:py-3 text-left font-heading font-bold text-[#282E3A]/70 text-xs sm:text-sm uppercase tracking-wide">Denominatie</th>
                    <th className="px-3 py-3 sm:px-4 sm:py-3 text-center font-heading font-bold text-[#282E3A]/70 text-xs sm:text-sm uppercase tracking-wide">Aantal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1B7867]/5">
                  <tr>
                    <td className="px-3 py-3 sm:px-4 text-[#282E3A] font-mono">€500</td>
                    <td className="px-3 py-3 sm:px-4 text-center">
                      <input 
                        type="number" 
                        value={counts['500']} 
                        onChange={(e) => updateCount('500', parseInt(e.target.value) || 0)}
                        min={0} 
                        className="w-20 sm:w-24 px-2 py-1 text-center border border-[#1B7867]/20 rounded-md focus:outline-none focus:border-[#1B7867] font-mono" 
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="px-3 py-3 sm:px-4 text-[#282E3A] font-mono">€200</td>
                    <td className="px-3 py-3 sm:px-4 text-center">
                      <input 
                        type="number" 
                        value={counts['200']} 
                        onChange={(e) => updateCount('200', parseInt(e.target.value) || 0)}
                        min={0} 
                        className="w-20 sm:w-24 px-2 py-1 text-center border border-[#1B7867]/20 rounded-md focus:outline-none focus:border-[#1B7867] font-mono" 
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="px-3 py-3 sm:px-4 text-[#282E3A] font-mono">€100</td>
                    <td className="px-3 py-3 sm:px-4 text-center">
                      <input 
                        type="number" 
                        value={counts['100']} 
                        onChange={(e) => updateCount('100', parseInt(e.target.value) || 0)}
                        min={0} 
                        className="w-20 sm:w-24 px-2 py-1 text-center border border-[#1B7867]/20 rounded-md focus:outline-none focus:border-[#1B7867] font-mono" 
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="px-3 py-3 sm:px-4 text-[#282E3A] font-mono">€50</td>
                    <td className="px-3 py-3 sm:px-4 text-center">
                      <input 
                        type="number" 
                        value={counts['50']} 
                        onChange={(e) => updateCount('50', parseInt(e.target.value) || 0)}
                        min={0} 
                        className="w-20 sm:w-24 px-2 py-1 text-center border border-[#1B7867]/20 rounded-md focus:outline-none focus:border-[#1B7867] font-mono" 
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="px-3 py-3 sm:px-4 text-[#282E3A] font-mono">€20</td>
                    <td className="px-3 py-3 sm:px-4 text-center">
                      <input 
                        type="number" 
                        value={counts['20']} 
                        onChange={(e) => updateCount('20', parseInt(e.target.value) || 0)}
                        min={0} 
                        className="w-20 sm:w-24 px-2 py-1 text-center border border-[#1B7867]/20 rounded-md focus:outline-none focus:border-[#1B7867] font-mono" 
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="px-3 py-3 sm:px-4 text-[#282E3A] font-mono">€10</td>
                    <td className="px-3 py-3 sm:px-4 text-center">
                      <input 
                        type="number" 
                        value={counts['10']} 
                        onChange={(e) => updateCount('10', parseInt(e.target.value) || 0)}
                        min={0} 
                        className="w-20 sm:w-24 px-2 py-1 text-center border border-[#1B7867]/20 rounded-md focus:outline-none focus:border-[#1B7867] font-mono" 
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="px-3 py-3 sm:px-4 text-[#282E3A] font-mono">€5</td>
                    <td className="px-3 py-3 sm:px-4 text-center">
                      <input 
                        type="number" 
                        value={counts['5']} 
                        onChange={(e) => updateCount('5', parseInt(e.target.value) || 0)}
                        min={0} 
                        className="w-20 sm:w-24 px-2 py-1 text-center border border-[#1B7867]/20 rounded-md focus:outline-none focus:border-[#1B7867] font-mono" 
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Column */}
          <div className="overflow-hidden shadow-sm border-[#1B7867]/10 bg-white rounded-lg border">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#1B7867]/10 bg-[#F5F7DD]/20">
                    <th className="px-3 py-3 sm:px-4 sm:py-3 text-left font-heading font-bold text-[#282E3A]/70 text-xs sm:text-sm uppercase tracking-wide">Denominatie</th>
                    <th className="px-3 py-3 sm:px-4 sm:py-3 text-center font-heading font-bold text-[#282E3A]/70 text-xs sm:text-sm uppercase tracking-wide">Aantal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1B7867]/5">
                  <tr>
                    <td className="px-3 py-3 sm:px-4 text-[#282E3A] font-mono">€2</td>
                    <td className="px-3 py-3 sm:px-4 text-center">
                      <input 
                        type="number" 
                        value={counts['2']} 
                        onChange={(e) => updateCount('2', parseInt(e.target.value) || 0)}
                        min={0} 
                        className="w-20 sm:w-24 px-2 py-1 text-center border border-[#1B7867]/20 rounded-md focus:outline-none focus:border-[#1B7867] font-mono" 
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="px-3 py-3 sm:px-4 text-[#282E3A] font-mono">€1</td>
                    <td className="px-3 py-3 sm:px-4 text-center">
                      <input 
                        type="number" 
                        value={counts['1']} 
                        onChange={(e) => updateCount('1', parseInt(e.target.value) || 0)}
                        min={0} 
                        className="w-20 sm:w-24 px-2 py-1 text-center border border-[#1B7867]/20 rounded-md focus:outline-none focus:border-[#1B7867] font-mono" 
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="px-3 py-3 sm:px-4 text-[#282E3A] font-mono">€0,50</td>
                    <td className="px-3 py-3 sm:px-4 text-center">
                      <input 
                        type="number" 
                        value={counts['0.50']} 
                        onChange={(e) => updateCount('0.50', parseInt(e.target.value) || 0)}
                        min={0} 
                        className="w-20 sm:w-24 px-2 py-1 text-center border border-[#1B7867]/20 rounded-md focus:outline-none focus:border-[#1B7867] font-mono" 
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="px-3 py-3 sm:px-4 text-[#282E3A] font-mono">€0,20</td>
                    <td className="px-3 py-3 sm:px-4 text-center">
                      <input 
                        type="number" 
                        value={counts['0.20']} 
                        onChange={(e) => updateCount('0.20', parseInt(e.target.value) || 0)}
                        min={0} 
                        className="w-20 sm:w-24 px-2 py-1 text-center border border-[#1B7867]/20 rounded-md focus:outline-none focus:border-[#1B7867] font-mono" 
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="px-3 py-3 sm:px-4 text-[#282E3A] font-mono">€0,10</td>
                    <td className="px-3 py-3 sm:px-4 text-center">
                      <input 
                        type="number" 
                        value={counts['0.10']} 
                        onChange={(e) => updateCount('0.10', parseInt(e.target.value) || 0)}
                        min={0} 
                        className="w-20 sm:w-24 px-2 py-1 text-center border border-[#1B7867]/20 rounded-md focus:outline-none focus:border-[#1B7867] font-mono" 
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="px-3 py-3 sm:px-4 text-[#282E3A] font-mono">€0,05</td>
                    <td className="px-3 py-3 sm:px-4 text-center">
                      <input 
                        type="number" 
                        value={counts['0.05']} 
                        onChange={(e) => updateCount('0.05', parseInt(e.target.value) || 0)}
                        min={0} 
                        className="w-20 sm:w-24 px-2 py-1 text-center border border-[#1B7867]/20 rounded-md focus:outline-none focus:border-[#1B7867] font-mono" 
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          </div>

          {/* Right side: Summary card */}
          <div className="lg:sticky lg:top-6">
            <div className="bg-white rounded-xl shadow-sm border border-[#1B7867]/10 p-3 sm:p-4">
          <div className="flex items-center justify-between py-2">
            <span className="text-lg sm:text-xl font-heading font-bold text-[#282E3A]">
              Totaal
            </span>
            <span className="text-2xl sm:text-3xl font-heading font-bold text-[#1B7867]">
              €{total.toFixed(2).replace('.', ',')}
            </span>
          </div>

          <div className="border-t border-[#1B7867]/10 my-2"></div>

          <div className="flex items-center justify-between gap-4 py-2">
            <span className="text-lg sm:text-xl font-heading font-bold text-[#282E3A]">
              Cash omzet (Lightspeed)
            </span>
            <input 
              type="number" 
              value={cashOmzet} 
              onChange={(e) => setCashOmzet(parseFloat(e.target.value) || 0)}
              min={0} 
              className="w-32 sm:w-40 px-3 py-2 text-right text-xl sm:text-2xl font-heading font-bold text-[#282E3A] border border-[#1B7867]/20 rounded-md focus:outline-none focus:border-[#1B7867] font-mono" 
            />
          </div>

          <div className="border-t border-[#1B7867]/10 my-2"></div>

          <div className="py-2">
            <div className="flex items-center justify-between">
              <span className="text-lg sm:text-xl font-heading font-bold text-[#282E3A]">
                Afdracht / Envelop
              </span>
              <span 
                className={`text-2xl sm:text-3xl font-heading font-bold ${
                  afdracht > 0 ? 'text-[#1B7867]' : 'text-gray-500'
                }`}
              >
                €{afdracht.toFixed(2).replace('.', ',')}
              </span>
            </div>
            <p className="text-sm text-[#282E3A]/70 mt-2">
              {total >= DOELSALDO 
                ? `Leg €${afdracht.toFixed(2).replace('.', ',')} in de envelop, laat €${DOELSALDO.toFixed(2).replace('.', ',')} in de lade.`
                : `Aanvullen uit wisselkassa: €${(DOELSALDO - total).toFixed(2).replace('.', ',')} om de lade op €${DOELSALDO.toFixed(2).replace('.', ',')} te brengen.`
              }
            </p>
          </div>

          <div className="border-t border-[#1B7867]/10 my-2"></div>

          <div className="flex items-center justify-between py-2">
            <span className="text-lg sm:text-xl font-heading font-bold text-[#282E3A]">
              Kasverschil
            </span>
            <span 
              className={`text-2xl sm:text-3xl font-heading font-bold ${
                kasverschil > 0 ? 'text-green-600' : 
                kasverschil < 0 ? 'text-red-600' : 
                'text-[#282E3A]'
              }`}
            >
              €{kasverschil.toFixed(2).replace('.', ',')}
            </span>
          </div>

          <div className="border-t border-[#1B7867]/10 my-2"></div>

          <div className="py-2">
            <label htmlFor="opmerkingen" className="block text-lg sm:text-xl font-heading font-bold text-[#282E3A] mb-2">
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
