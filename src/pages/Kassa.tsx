import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { LogOut, Info, CheckCircle2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import logoGreen from '@/assets/pura-vida-logo-official.png';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { KassaTabBar } from '@/components/KassaTabBar';
import { useInactivityTimeout } from '@/hooks/useInactivityTimeout';

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
  const [showInstructionsDialog, setShowInstructionsDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [naam, setNaam] = useState('');
  
  // Enable inactivity timeout
  useInactivityTimeout();

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
  
  // Validation states
  const [errors, setErrors] = useState({
    naam: '',
    opmerkingen: '',
    cashOmzet: ''
  });

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
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Uitloggen mislukt');
    }
  };

  const validateForm = () => {
    const newErrors = { naam: '', opmerkingen: '', cashOmzet: '' };
    let isValid = true;

    if (!naam || naam.trim().length < 2) {
      newErrors.naam = 'Vul je naam in (minimaal 2 letters)';
      isValid = false;
    }

    if (!opmerkingen || opmerkingen.trim().length < 3) {
      newErrors.opmerkingen = 'Vul een korte opmerking in';
      isValid = false;
    }

    if (cashOmzet === '' || cashOmzet <= 0) {
      newErrors.cashOmzet = 'Vul een geldige omzet in';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error('Vul alle verplichte velden in');
      return;
    }
    const data = {
      type: 'sluit',
      week: weekNumber,
      date: new Date().toISOString(),
      location: userLocation,
      naam: naam,
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
      
      setShowSuccessDialog(true);
      
      // Auto logout and redirect after 3 seconds
      setTimeout(async () => {
        await supabase.auth.signOut();
        navigate('/');
      }, 3000);
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
                <span>Pura Vida • {userLocation}</span>
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
                <span>Pura Vida • {userLocation}</span>
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
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6 items-start">
          {/* Denomination table */}
          <div className="overflow-hidden shadow-sm border-[#1B7867]/10 bg-white rounded-lg border">
            <div className="bg-[#1B7867]/10 px-3 py-2.5 border-b border-[#1B7867]/20">
              <h2 className="font-heading font-bold text-[#1B7867] text-sm uppercase tracking-wide">
                Kassa Lade
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#1B7867]/10 bg-[#F5F7DD]/20">
                    <th className="px-2.5 py-1 text-left font-heading font-bold text-[#282E3A]/70 text-xs uppercase tracking-wide">Bedrag</th>
                    <th className="px-2.5 py-1 text-center font-heading font-bold text-[#282E3A]/70 text-xs uppercase tracking-wide">Aantal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1B7867]/15">
                  {['500', '200', '100', '50', '20', '10', '5', '2', '1', '0.50', '0.20', '0.10', '0.05'].map((denom, index) => (
                    <tr key={denom} className="even:bg-[#F5F7DD]/15 hover:bg-[#F5F7DD]/30 transition-colors border-b border-[#282E3A]/5">
                      <td className="px-2.5 py-1 text-[#282E3A] font-mono text-sm border-r border-[#1B7867]/10">€{denom.replace('.', ',')}</td>
                      <td className="px-2.5 py-1 text-center">
                        <input 
                          type="number" 
                          value={counts[denom as keyof typeof counts]} 
                          onChange={(e) => updateCount(denom, e.target.value === '' ? '' : parseInt(e.target.value))}
                          min={0} 
                          className="w-16 px-2 py-1 text-center border border-[#1B7867]/20 focus:border-[#1B7867] focus:ring-1 focus:ring-[#1B7867]/20 rounded-lg bg-[#F5F7DD]/40 font-mono text-sm transition-colors" 
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="bg-[#1B7867]/5 px-3 py-2 border-t border-[#1B7867]/10">
              <div className="flex items-center justify-between">
                <span className="font-heading font-bold text-[#1B7867] text-xs uppercase tracking-wide">Totaal</span>
                <span className="text-xl font-heading font-bold text-[#1B7867]">€{calculateTotal().toFixed(2).replace('.', ',')}</span>
              </div>
            </div>
          </div>

          {/* Right side: Summary card */}
          <div className="lg:sticky lg:top-6">
            <div className="bg-white rounded-xl shadow-sm border border-[#1B7867]/10 p-4">
          {/* Totaal - meest prominent */}
          <div className="flex items-center justify-between py-1">
            <span className="text-sm font-heading font-medium text-[#282E3A]/60">
              Totaal
            </span>
            <span className="text-3xl font-heading font-bold text-[#1B7867]">
              €{total.toFixed(2).replace('.', ',')}
            </span>
          </div>

          <div className="border-t border-[#1B7867]/5 my-2"></div>

          {/* Cash omzet - compacter */}
          <div className="py-1">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm font-heading font-medium text-[#282E3A]/60">
                Cash omzet (Lightspeed)
              </span>
              <input 
                type="number" 
                value={cashOmzet} 
                onChange={(e) => {
                  setCashOmzet(e.target.value === '' ? '' : parseFloat(e.target.value));
                  if (errors.cashOmzet) setErrors(prev => ({ ...prev, cashOmzet: '' }));
                }}
                min={0} 
                className={`w-24 px-2 py-1.5 text-right text-lg font-heading font-bold text-[#282E3A] border rounded-md focus:outline-none font-mono transition-colors ${
                  errors.cashOmzet ? 'border-red-500 focus:border-red-500 ring-1 ring-red-500' : 'border-[#1B7867]/20 focus:border-[#1B7867]'
                }`}
              />
            </div>
            {errors.cashOmzet && (
              <p className="text-xs text-red-500 mt-1 text-right">{errors.cashOmzet}</p>
            )}
          </div>

          <div className="border-t border-[#1B7867]/5 my-2"></div>

          {/* Naam medewerker */}
          <div className="py-1">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm font-heading font-medium text-[#282E3A]/60">
                Naam medewerker
              </span>
              <input 
                type="text" 
                value={naam} 
                onChange={(e) => {
                  setNaam(e.target.value);
                  if (errors.naam) setErrors(prev => ({ ...prev, naam: '' }));
                }}
                placeholder="Vul je naam in"
                className={`w-48 px-2 py-1.5 text-right text-sm font-heading text-[#282E3A] border rounded-md focus:outline-none transition-colors ${
                  errors.naam ? 'border-red-500 focus:border-red-500 ring-1 ring-red-500' : 'border-[#1B7867]/20 focus:border-[#1B7867]'
                }`}
              />
            </div>
            {errors.naam && (
              <p className="text-xs text-red-500 mt-1 text-right">{errors.naam}</p>
            )}
          </div>

          <div className="border-t border-[#1B7867]/5 my-2"></div>

          {/* Afdracht - compacter met kleinere uitleg */}
          <div className="py-1">
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

          <div className="border-t border-[#1B7867]/5 my-2"></div>

          {/* Kasverschil - prominente kleurcodering */}
          <div className="flex items-center justify-between py-1">
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

          <div className="border-t border-[#1B7867]/5 my-2"></div>

          {/* Opmerkingen - compacter label */}
          <div className="py-1">
            <label htmlFor="opmerkingen" className="block text-sm font-heading font-medium text-[#282E3A]/60 mb-1.5">
              Opmerkingen
            </label>
            <Textarea
              id="opmerkingen"
              value={opmerkingen}
              onChange={(e) => {
                setOpmerkingen(e.target.value);
                if (errors.opmerkingen) setErrors(prev => ({ ...prev, opmerkingen: '' }));
              }}
              placeholder="Voeg hier eventuele opmerkingen toe..."
              className={`w-full min-h-[80px] font-mono text-sm transition-colors ${
                errors.opmerkingen ? 'border-red-500 focus:border-red-500 ring-1 ring-red-500' : 'border-[#1B7867]/20 focus:border-[#1B7867]'
              }`}
            />
            {errors.opmerkingen && (
              <p className="text-xs text-red-500 mt-1">{errors.opmerkingen}</p>
            )}
          </div>

          {/* Verzenden button */}
          <div className="mt-4">
            <Button 
              onClick={handleSubmit}
              disabled={!naam || naam.length < 2 || !opmerkingen || opmerkingen.length < 3 || cashOmzet === '' || cashOmzet <= 0}
              className={`w-full font-heading font-bold text-lg py-6 transition-all ${
                (!naam || naam.length < 2 || !opmerkingen || opmerkingen.length < 3 || cashOmzet === '' || cashOmzet <= 0)
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-[#1B7867] hover:bg-[#1B7867]/90 text-white'
              }`}
            >
              Verzenden
            </Button>
            
            <Button
              variant="outline"
              onClick={() => setShowInstructionsDialog(true)}
              className="w-full mt-2 border-[#1B7867]/30 text-[#1B7867] hover:bg-[#1B7867]/5 font-heading font-medium flex items-center gap-2 justify-center"
            >
              <Info className="h-4 w-4" />
              Instructies
            </Button>
          </div>
          </div>
        </div>
        </div>
      </div>

      {/* Success Dialog */}
      <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <AlertDialogContent className="bg-white">
          <div className="text-center">
            <CheckCircle2 className="w-16 h-16 text-[#1B7867] mx-auto mb-4" />
            
            <AlertDialogTitle className="text-2xl font-heading font-bold text-[#282E3A]">
              Kassatelling Verzonden!
            </AlertDialogTitle>
            
            <AlertDialogDescription className="text-[#282E3A]/70 mt-4">
              Verzonden door {naam}<br/>
              {new Date().toLocaleString('nl-NL')}
            </AlertDialogDescription>
            
            <AlertDialogAction 
              onClick={() => {
                setShowSuccessDialog(false);
                supabase.auth.signOut();
                navigate('/');
              }}
              className="mt-6 bg-[#1B7867] hover:bg-[#1B7867]/90"
            >
              Sluiten
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Instructies Dialog */}
      <Dialog open={showInstructionsDialog} onOpenChange={setShowInstructionsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-heading font-bold text-[#282E3A]">
              Instructies Kassatelling Avond
            </DialogTitle>
          </DialogHeader>
          
          <div className="mt-4">
            <ol className="space-y-4">
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#1B7867] text-white text-sm font-heading font-bold flex items-center justify-center">1</span>
                <div>
                  <span className="font-heading font-medium text-[#282E3A]">Print dagomzet</span>
                  <p className="text-sm text-[#282E3A]/70 mt-1">Print omzet uit in Lightspeed. Check open en niet-gefinancierde tafels → verplaats naar tafel 100 of 101.</p>
                </div>
              </li>

              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#1B7867] text-white text-sm font-heading font-bold flex items-center justify-center">2</span>
                <div>
                  <span className="font-heading font-medium text-[#282E3A]">Finaliseer betalingen</span>
                  <p className="text-sm text-[#282E3A]/70 mt-1">Betaalde maar niet-gefinaliseerde tafels handmatig afronden.</p>
                </div>
              </li>

              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#1B7867] text-white text-sm font-heading font-bold flex items-center justify-center">3</span>
                <div>
                  <span className="font-heading font-medium text-[#282E3A]">Vul naam in</span>
                  <p className="text-sm text-[#282E3A]/70 mt-1">Vul je naam in bij "Naam medewerker".</p>
                </div>
              </li>

              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#1B7867] text-white text-sm font-heading font-bold flex items-center justify-center">4</span>
                <div>
                  <span className="font-heading font-medium text-[#282E3A]">Noteer cash omzet</span>
                  <p className="text-sm text-[#282E3A]/70 mt-1">Voer het cash bedrag uit Lightspeed in.</p>
                </div>
              </li>

              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#1B7867] text-white text-sm font-heading font-bold flex items-center justify-center">5</span>
                <div>
                  <span className="font-heading font-medium text-[#282E3A]">Tel de kassa</span>
                  <p className="text-sm text-[#282E3A]/70 mt-1">Vul alle denominaties in de velden in.</p>
                </div>
              </li>

              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#1B7867] text-white text-sm font-heading font-bold flex items-center justify-center">6</span>
                <div>
                  <span className="font-heading font-medium text-[#282E3A]">Controleer kassalade</span>
                  <p className="text-sm text-[#282E3A]/70 mt-1">De kassalade moet altijd €157 bevatten. Vul indien nodig aan vanuit de wisselkassa.</p>
                  <p className="text-xs text-amber-600/80 mt-1 font-medium">💡 Belangrijk voor zowel Midsland als West</p>
                </div>
              </li>

              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#1B7867] text-white text-sm font-heading font-bold flex items-center justify-center">7</span>
                <div>
                  <span className="font-heading font-medium text-[#282E3A]">Noteer bijzonderheden</span>
                  <p className="text-sm text-[#282E3A]/70 mt-1">Vermeld tekorten, plussen of andere afwijkingen.</p>
                  <p className="text-xs text-red-600/80 mt-1 font-medium">⚠️ Altijd melden bij verschillen!</p>
                </div>
              </li>

              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#1B7867] text-white text-sm font-heading font-bold flex items-center justify-center">8</span>
                <div>
                  <span className="font-heading font-medium text-[#282E3A]">Verzend</span>
                  <p className="text-sm text-[#282E3A]/70 mt-1">Klik op "Verzenden" om de kassatelling te versturen.</p>
                </div>
              </li>
            </ol>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Kassa;
