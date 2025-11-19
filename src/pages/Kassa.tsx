import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { LogOut, Info, CheckCircle2, Wallet, ChevronDown } from 'lucide-react';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import logoGreen from '@/assets/pura-vida-logo-official.png';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useUserLocation } from '@/contexts/UserLocationContext';

// Always get week number reliably using ISO 8601
const getWeekNumber = (date: Date): number => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
};

// Fixed starting balance that should always remain in the register
const BEGINSALDO_VERDELING = {
  '20': 2,    // 2 × €20 = €40
  '10': 5,    // 5 × €10 = €50
  '5': 5,     // 5 × €5 = €25
  '2': 10,    // 10 × €2 = €20
  '1': 10,    // 10 × €1 = €10
  '0.50': 10, // 10 × €0,50 = €5
  '0.20': 20, // 20 × €0,20 = €4
  '0.10': 20, // 20 × €0,10 = €2
  '0.05': 20, // 20 × €0,05 = €1
};

const Kassa = () => {
  const navigate = useNavigate();
  const weekNumber = getWeekNumber(new Date());
  const DOELSALDO = 157;
  const { userLocation } = useUserLocation();
  const [showInstructionsDialog, setShowInstructionsDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [naam, setNaam] = useState('');
  const [canSubmit, setCanSubmit] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [beginsaldoExpanded, setBeginsaldoExpanded] = useState(false);

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

  // Check throttling status
  useEffect(() => {
    if (!userLocation) return;
    
    const checkSubmitAvailability = () => {
      const key = `kassatelling_last_submit_${userLocation}_sluit`;
      const lastSubmit = localStorage.getItem(key);
      
      if (lastSubmit) {
        const elapsed = Date.now() - parseInt(lastSubmit);
        const remaining = (10 * 60 * 1000) - elapsed;
        
        if (remaining > 0) {
          setCanSubmit(false);
          setTimeRemaining(Math.ceil(remaining / 1000));
        } else {
          setCanSubmit(true);
          setTimeRemaining(0);
        }
      }
    };
    
    checkSubmitAvailability();
    const interval = setInterval(checkSubmitAvailability, 1000);
    
    return () => clearInterval(interval);
  }, [userLocation]);

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

    // Check throttling
    if (!canSubmit) {
      const mins = Math.floor(timeRemaining / 60);
      const secs = timeRemaining % 60;
      toast.error(`Je kunt pas over ${mins}m ${secs}s opnieuw indienen`);
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

      // Save timestamp and disable submit
      const key = `kassatelling_last_submit_${userLocation}_sluit`;
      localStorage.setItem(key, Date.now().toString());
      setCanSubmit(false);
      setTimeRemaining(10 * 60);
      
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
    <div style={{ minHeight: '100vh', backgroundColor: '#FEFFF1', fontFamily: 'Inter, sans-serif' }}>
      {/* Main Content */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '24px', alignItems: 'start' }}>
          {/* Denomination table */}
          <div style={{
            backgroundColor: '#F6F7DD',
            borderRadius: '20px',
            border: '1px solid rgba(197, 197, 202, 0.5)',
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
          }}>
            <div style={{ backgroundColor: '#FFFFFF', padding: '12px 16px', borderBottom: '1px solid rgba(197, 197, 202, 0.5)' }}>
              <h2 style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 600, color: '#282E3A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Kassa Lade
              </h2>
            </div>
            <div style={{ overflowX: 'auto', backgroundColor: '#FFFFFF', padding: '16px' }}>
              <table style={{ width: '100%', fontFamily: 'Inter, sans-serif' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(197, 197, 202, 0.3)' }}>
                    <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: '#73747B', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Bedrag</th>
                    <th style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 600, color: '#73747B', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Aantal</th>
                  </tr>
                </thead>
                <tbody>
                  {['500', '200', '100', '50', '20', '10', '5', '2', '1', '0.50', '0.20', '0.10', '0.05'].map((denom, index) => (
                    <tr key={denom} style={{ borderBottom: '1px solid rgba(197, 197, 202, 0.2)' }}>
                      <td style={{ padding: '8px 12px', color: '#282E3A', fontFamily: 'monospace', fontSize: '14px', borderRight: '1px solid rgba(197, 197, 202, 0.3)' }}>€{denom.replace('.', ',')}</td>
                      <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                        <input 
                          type="number" 
                          value={counts[denom as keyof typeof counts]} 
                          onChange={(e) => updateCount(denom, e.target.value === '' ? '' : parseInt(e.target.value))}
                          min={0} 
                          style={{
                            width: '80px',
                            padding: '6px 8px',
                            textAlign: 'center',
                            border: '1px solid rgba(197, 197, 202, 0.5)',
                            borderRadius: '16px',
                            backgroundColor: '#FFFFFF',
                            fontFamily: 'monospace',
                            fontSize: '14px',
                            color: '#282E3A',
                            outline: 'none',
                          }}
                          onFocus={(e) => e.target.style.borderColor = '#1B7867'}
                          onBlur={(e) => e.target.style.borderColor = 'rgba(197, 197, 202, 0.5)'}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ backgroundColor: '#FFFFFF', padding: '12px 16px', borderTop: '1px solid rgba(197, 197, 202, 0.5)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, color: '#282E3A', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Totaal</span>
                <span style={{ fontSize: '24px', fontFamily: 'Inter, sans-serif', fontWeight: 700, color: '#1B7867' }}>€{calculateTotal().toFixed(2).replace('.', ',')}</span>
              </div>
            </div>
          </div>

          {/* Right side: Summary card */}
          <div style={{ position: 'sticky', top: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Beginsaldo Reference - Collapsible */}
            <Collapsible open={beginsaldoExpanded} onOpenChange={setBeginsaldoExpanded}>
              <div style={{
                backgroundColor: '#F6F7DD',
                borderRadius: '20px',
                border: '1px solid rgba(197, 197, 202, 0.5)',
                overflow: 'hidden',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
              }}>
                
                {/* Clickable header met icon en pijltje */}
                <CollapsibleTrigger style={{ width: '100%', padding: '12px 16px', backgroundColor: '#FFFFFF', cursor: 'pointer', border: 'none', transition: 'background-color 0.15s' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F6F7DD'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FFFFFF'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Wallet style={{ width: '16px', height: '16px', color: '#1B7867' }} />
                      <span style={{ fontSize: '12px', fontFamily: 'Inter, sans-serif', fontWeight: 600, color: '#282E3A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Beginsaldo (blijft in kassa)
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '18px', fontFamily: 'Inter, sans-serif', fontWeight: 700, color: '#1B7867' }}>
                        €{Object.entries(BEGINSALDO_VERDELING).reduce((sum, [denom, count]) => sum + (parseFloat(denom) * count), 0).toFixed(2).replace('.', ',')}
                      </span>
                      <ChevronDown 
                        style={{ width: '16px', height: '16px', color: '#1B7867', transition: 'transform 0.2s', transform: beginsaldoExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }} 
                      />
                    </div>
                  </div>
                </CollapsibleTrigger>
                
                {/* Uitklapbare content met denominaties */}
                <CollapsibleContent>
                  <div style={{ padding: '12px 16px', backgroundColor: '#FFFFFF', borderTop: '1px solid rgba(197, 197, 202, 0.5)' }}>
                    {Object.entries(BEGINSALDO_VERDELING).map(([denom, count]) => (
                      <div key={denom} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(197, 197, 202, 0.2)' }}>
                        <span style={{ fontFamily: 'monospace', fontSize: '13px', color: '#282E3A' }}>€{denom.replace('.', ',')} × {count}</span>
                        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#73747B' }}>
                          €{(parseFloat(denom) * count).toFixed(2).replace('.', ',')}
                        </span>
                      </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', marginTop: '8px', borderTop: '1px solid rgba(197, 197, 202, 0.5)' }}>
                      <span style={{ fontSize: '12px', fontFamily: 'Inter, sans-serif', fontWeight: 600, color: '#282E3A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Totaal</span>
                      <span style={{ fontSize: '18px', fontFamily: 'Inter, sans-serif', fontWeight: 700, color: '#1B7867' }}>
                        €{Object.entries(BEGINSALDO_VERDELING).reduce((sum, [denom, count]) => sum + (parseFloat(denom) * count), 0).toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>

            {/* Summary card */}
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
            {!canSubmit && timeRemaining > 0 && (
              <p className="text-xs text-[#282E3A]/60 mb-2 text-center">
                Je kunt over {Math.floor(timeRemaining / 60)}m {timeRemaining % 60}s opnieuw indienen
              </p>
            )}
            <Button 
              onClick={handleSubmit}
              disabled={!canSubmit || !naam || naam.length < 2 || !opmerkingen || opmerkingen.length < 3 || cashOmzet === '' || cashOmzet <= 0}
              className={`w-full font-heading font-bold text-lg py-6 transition-all ${
                (!canSubmit || !naam || naam.length < 2 || !opmerkingen || opmerkingen.length < 3 || cashOmzet === '' || cashOmzet <= 0)
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-[#1B7867] hover:bg-[#1B7867]/90 text-white'
              }`}
            >
              {!canSubmit ? 'Wacht alsjeblieft...' : 'Verzenden'}
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
