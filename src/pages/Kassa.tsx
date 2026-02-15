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

// getWeekNumber function
const getWeekNumber = (date: Date): number => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
};

const BEGINSALDO_VERDELING = {
  '20': 2,
  '10': 5,
  '5': 5,
  '2': 10,
  '1': 10,
  '0.50': 10,
  '0.20': 20,
  '0.10': 20,
  '0.05': 20,
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
  
  const [errors, setErrors] = useState({
    naam: '',
    opmerkingen: '',
    cashOmzet: ''
  });

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

      const key = `kassatelling_last_submit_${userLocation}_sluit`;
      localStorage.setItem(key, Date.now().toString());
      setCanSubmit(false);
      setTimeRemaining(10 * 60);
      
      setShowSuccessDialog(true);
    } catch (error) {
      console.error('Fout bij verzenden:', error);
      toast.error('Verzenden mislukt');
    }
  };

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '24px', alignItems: 'start' }}>
          {/* Denomination table */}
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '20px',
            border: '1px solid #D5D8E0',
            overflow: 'hidden',
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
          }}>
            <div style={{ backgroundColor: '#F8F9FA', padding: '12px 16px', borderBottom: '1px solid #D5D8E0' }}>
              <h2 style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 600, color: '#636878', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Kassa Lade
              </h2>
            </div>
            <div style={{ overflowX: 'auto', backgroundColor: '#FFFFFF', padding: '16px' }}>
              <table style={{ width: '100%', fontFamily: 'Inter, sans-serif' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #EAECF0' }}>
                    <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 500, color: '#636878', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Bedrag</th>
                    <th style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 500, color: '#636878', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Aantal</th>
                  </tr>
                </thead>
                <tbody>
                  {['500', '200', '100', '50', '20', '10', '5', '2', '1', '0.50', '0.20', '0.10', '0.05'].map((denom) => (
                    <tr key={denom} style={{ borderBottom: '1px solid #EAECF0' }}>
                      <td style={{ padding: '6px 12px', color: '#282E3A', fontFamily: "'Geist Mono', monospace", fontSize: '12px', fontWeight: 500, borderRight: '1px solid #EAECF0' }}>€{denom.replace('.', ',')}</td>
                      <td style={{ padding: '6px 12px', textAlign: 'center' }}>
                        <input 
                          type="number" 
                          value={counts[denom as keyof typeof counts]} 
                          onChange={(e) => updateCount(denom, e.target.value === '' ? '' : parseInt(e.target.value))}
                          min={0} 
                          style={{
                            width: '80px',
                            padding: '6px 8px',
                            textAlign: 'center',
                            border: '1px solid #C1C5CF',
                            borderRadius: '14px',
                            backgroundColor: '#FFFFFF',
                            fontFamily: "'Geist Mono', monospace",
                            fontSize: '12px',
                            fontWeight: 500,
                            color: '#282E3A',
                            outline: 'none',
                            transition: 'border-color 0.15s',
                          }}
                          onFocus={(e) => { e.target.style.borderColor = '#E27726'; e.target.style.boxShadow = '0 0 0 2px rgba(226,119,38,0.2)'; }}
                          onBlur={(e) => { e.target.style.borderColor = '#C1C5CF'; e.target.style.boxShadow = 'none'; }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ backgroundColor: '#F8F9FA', padding: '12px 16px', borderTop: '1px solid #D5D8E0' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, color: '#636878', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Totaal</span>
                <span style={{ fontSize: '24px', fontFamily: "'Geist Mono', monospace", fontWeight: 700, color: '#E27726' }}>€{calculateTotal().toFixed(2).replace('.', ',')}</span>
              </div>
            </div>
          </div>

          {/* Right side: Summary card */}
          <div style={{ position: 'sticky', top: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Beginsaldo Reference - Collapsible */}
            <Collapsible open={beginsaldoExpanded} onOpenChange={setBeginsaldoExpanded}>
              <div style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '20px',
                border: '1px solid #D5D8E0',
                overflow: 'hidden',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
              }}>
                <CollapsibleTrigger style={{ width: '100%', padding: '12px 16px', backgroundColor: '#FFFFFF', cursor: 'pointer', border: 'none', transition: 'background-color 0.15s' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F8F9FA'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FFFFFF'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Wallet style={{ width: '16px', height: '16px', color: '#E27726' }} />
                      <span style={{ fontSize: '11px', fontFamily: 'Inter, sans-serif', fontWeight: 600, color: '#636878', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Beginsaldo (blijft in kassa)
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '18px', fontFamily: "'Geist Mono', monospace", fontWeight: 700, color: '#E27726' }}>
                        €{Object.entries(BEGINSALDO_VERDELING).reduce((sum, [denom, count]) => sum + (parseFloat(denom) * count), 0).toFixed(2).replace('.', ',')}
                      </span>
                      <ChevronDown 
                        style={{ width: '16px', height: '16px', color: '#8D93A0', transition: 'transform 0.15s', transform: beginsaldoExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }} 
                      />
                    </div>
                  </div>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <div style={{ padding: '12px 16px', backgroundColor: '#FFFFFF', borderTop: '1px solid #D5D8E0' }}>
                    {Object.entries(BEGINSALDO_VERDELING)
                      .sort((a, b) => parseFloat(b[0]) - parseFloat(a[0]))
                      .map(([denom, count]) => (
                      <div key={denom} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #EAECF0' }}>
                        <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '12px', fontWeight: 500, color: '#282E3A' }}>€{denom.replace('.', ',')} × {count}</span>
                        <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '12px', fontWeight: 500, color: '#636878' }}>
                          €{(parseFloat(denom) * count).toFixed(2).replace('.', ',')}
                        </span>
                      </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', marginTop: '8px', borderTop: '1px solid #D5D8E0' }}>
                      <span style={{ fontSize: '11px', fontFamily: 'Inter, sans-serif', fontWeight: 600, color: '#636878', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Totaal</span>
                      <span style={{ fontSize: '18px', fontFamily: "'Geist Mono', monospace", fontWeight: 700, color: '#E27726' }}>
                        €{Object.entries(BEGINSALDO_VERDELING).reduce((sum, [denom, count]) => sum + (parseFloat(denom) * count), 0).toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>

            {/* Summary card */}
            <div style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '20px',
              border: '1px solid #D5D8E0',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
              padding: '16px'
            }}>
              {/* Totaal */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0' }}>
                <span style={{ fontSize: '13px', fontFamily: 'Inter, sans-serif', fontWeight: 500, color: '#636878' }}>
                  Totaal
                </span>
                <span style={{ fontSize: '28px', fontFamily: "'Geist Mono', monospace", fontWeight: 700, color: '#E27726', letterSpacing: '-0.03em' }}>
                  €{total.toFixed(2).replace('.', ',')}
                </span>
              </div>

              <div style={{ borderTop: '1px solid #EAECF0', margin: '8px 0' }}></div>

              {/* Cash omzet */}
              <div style={{ padding: '4px 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                  <span style={{ fontSize: '13px', fontFamily: 'Inter, sans-serif', fontWeight: 500, color: '#636878' }}>
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
                    style={{
                      width: '96px',
                      padding: '6px 8px',
                      textAlign: 'right',
                      fontSize: '16px',
                      fontFamily: "'Geist Mono', monospace",
                      fontWeight: 600,
                      color: '#282E3A',
                      border: errors.cashOmzet ? '1px solid #EF4444' : '1px solid #C1C5CF',
                      borderRadius: '14px',
                      backgroundColor: '#FFFFFF',
                      outline: 'none',
                      transition: 'border-color 0.15s'
                    }}
                    onFocus={(e) => { if (!errors.cashOmzet) { e.target.style.borderColor = '#E27726'; e.target.style.boxShadow = '0 0 0 2px rgba(226,119,38,0.2)'; } }}
                    onBlur={(e) => { if (!errors.cashOmzet) { e.target.style.borderColor = '#C1C5CF'; e.target.style.boxShadow = 'none'; } }}
                  />
                </div>
                {errors.cashOmzet && (
                  <p style={{ fontSize: '12px', color: '#EF4444', marginTop: '4px', textAlign: 'right', fontFamily: 'Inter, sans-serif' }}>{errors.cashOmzet}</p>
                )}
              </div>

              <div style={{ borderTop: '1px solid #EAECF0', margin: '8px 0' }}></div>

              {/* Naam medewerker */}
              <div style={{ padding: '4px 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                  <span style={{ fontSize: '13px', fontFamily: 'Inter, sans-serif', fontWeight: 500, color: '#636878' }}>
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
                    style={{
                      width: '192px',
                      padding: '6px 8px',
                      textAlign: 'right',
                      fontSize: '13px',
                      fontFamily: 'Inter, sans-serif',
                      color: '#282E3A',
                      border: errors.naam ? '1px solid #EF4444' : '1px solid #C1C5CF',
                      borderRadius: '14px',
                      backgroundColor: '#FFFFFF',
                      outline: 'none',
                      transition: 'border-color 0.15s'
                    }}
                    onFocus={(e) => { if (!errors.naam) { e.target.style.borderColor = '#E27726'; e.target.style.boxShadow = '0 0 0 2px rgba(226,119,38,0.2)'; } }}
                    onBlur={(e) => { if (!errors.naam) { e.target.style.borderColor = '#C1C5CF'; e.target.style.boxShadow = 'none'; } }}
                  />
                </div>
                {errors.naam && (
                  <p style={{ fontSize: '12px', color: '#EF4444', marginTop: '4px', textAlign: 'right', fontFamily: 'Inter, sans-serif' }}>{errors.naam}</p>
                )}
              </div>

              <div style={{ borderTop: '1px solid #EAECF0', margin: '8px 0' }}></div>

              {/* Afdracht */}
              <div style={{ padding: '4px 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', fontFamily: 'Inter, sans-serif', fontWeight: 500, color: '#636878' }}>
                    Afdracht / Envelop
                  </span>
                  <span style={{
                    fontSize: '24px',
                    fontFamily: "'Geist Mono', monospace",
                    fontWeight: 700,
                    color: afdracht > 0 ? '#E27726' : '#8D93A0'
                  }}>
                    €{afdracht.toFixed(2).replace('.', ',')}
                  </span>
                </div>
                <p style={{ fontSize: '12px', color: '#636878', marginTop: '4px', fontFamily: 'Inter, sans-serif' }}>
                  {total >= DOELSALDO 
                    ? `Leg €${afdracht.toFixed(2).replace('.', ',')} in de envelop, laat €${DOELSALDO.toFixed(2).replace('.', ',')} in de lade.`
                    : `Aanvullen uit wisselkassa: €${(DOELSALDO - total).toFixed(2).replace('.', ',')} om de lade op €${DOELSALDO.toFixed(2).replace('.', ',')} te brengen.`
                  }
                </p>
              </div>

              <div style={{ borderTop: '1px solid #EAECF0', margin: '8px 0' }}></div>

              {/* Kasverschil */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0' }}>
                <span style={{ fontSize: '13px', fontFamily: 'Inter, sans-serif', fontWeight: 500, color: '#636878' }}>
                  Kasverschil
                </span>
                <span style={{
                  fontSize: '24px',
                  fontFamily: "'Geist Mono', monospace",
                  fontWeight: 700,
                  color: kasverschil > 0 ? '#22C55E' : kasverschil < 0 ? '#EF4444' : '#282E3A'
                }}>
                  €{kasverschil.toFixed(2).replace('.', ',')}
                </span>
              </div>

              <div style={{ borderTop: '1px solid #EAECF0', margin: '8px 0' }}></div>

              {/* Opmerkingen */}
              <div style={{ padding: '4px 0' }}>
                <label htmlFor="opmerkingen" style={{ display: 'block', fontSize: '13px', fontFamily: 'Inter, sans-serif', fontWeight: 500, color: '#636878', marginBottom: '6px' }}>
                  Opmerkingen
                </label>
                <textarea
                  id="opmerkingen"
                  value={opmerkingen}
                  onChange={(e) => {
                    setOpmerkingen(e.target.value);
                    if (errors.opmerkingen) setErrors(prev => ({ ...prev, opmerkingen: '' }));
                  }}
                  placeholder="Voeg hier eventuele opmerkingen toe..."
                  style={{
                    width: '100%',
                    minHeight: '80px',
                    padding: '8px 12px',
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '13px',
                    color: '#282E3A',
                    border: errors.opmerkingen ? '1px solid #EF4444' : '1px solid #C1C5CF',
                    borderRadius: '14px',
                    backgroundColor: '#FFFFFF',
                    outline: 'none',
                    resize: 'vertical',
                    transition: 'border-color 0.15s',
                    whiteSpace: 'pre-wrap'
                  }}
                  onFocus={(e) => { if (!errors.opmerkingen) { e.target.style.borderColor = '#E27726'; e.target.style.boxShadow = '0 0 0 2px rgba(226,119,38,0.2)'; } }}
                  onBlur={(e) => { if (!errors.opmerkingen) { e.target.style.borderColor = '#C1C5CF'; e.target.style.boxShadow = 'none'; } }}
                />
                {errors.opmerkingen && (
                  <p style={{ fontSize: '12px', color: '#EF4444', marginTop: '4px', fontFamily: 'Inter, sans-serif' }}>{errors.opmerkingen}</p>
                )}
              </div>

              {/* Verzenden button */}
              <div style={{ marginTop: '16px' }}>
                {!canSubmit && timeRemaining > 0 && (
                  <p style={{ fontSize: '12px', color: '#636878', marginBottom: '8px', textAlign: 'center', fontFamily: 'Inter, sans-serif' }}>
                    Je kunt over {Math.floor(timeRemaining / 60)}m {timeRemaining % 60}s opnieuw indienen
                  </p>
                )}
                <button 
                  onClick={handleSubmit}
                  disabled={!canSubmit || !naam || naam.length < 2 || cashOmzet === ''}
                  style={{
                    width: '100%',
                    padding: '14px 20px',
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 600,
                    fontSize: '14px',
                    backgroundColor: (!canSubmit || !naam || naam.length < 2 || cashOmzet === '') ? '#C1C5CF' : '#E27726',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '16px',
                    cursor: (!canSubmit || !naam || naam.length < 2 || cashOmzet === '') ? 'not-allowed' : 'pointer',
                    transition: 'all 0.15s',
                    opacity: (!canSubmit || !naam || naam.length < 2 || cashOmzet === '') ? 0.45 : 1,
                  }}
                  onMouseEnter={(e) => {
                    if (!(!canSubmit || !naam || naam.length < 2 || cashOmzet === '')) {
                      e.currentTarget.style.backgroundColor = '#C9630E';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!(!canSubmit || !naam || naam.length < 2 || cashOmzet === '')) {
                      e.currentTarget.style.backgroundColor = '#E27726';
                    }
                  }}
                >
                  {!canSubmit ? 'Wacht alsjeblieft...' : 'Verzenden'}
                </button>
                
                <button
                  onClick={() => setShowInstructionsDialog(true)}
                  style={{
                    width: '100%',
                    marginTop: '8px',
                    padding: '10px 20px',
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 500,
                    fontSize: '13px',
                    backgroundColor: '#FFF7ED',
                    color: '#A5500D',
                    border: 'none',
                    borderRadius: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FFEDD5'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FFF7ED'}
                >
                  <Info style={{ width: '16px', height: '16px' }} />
                  Instructies
                </button>
              </div>
            </div>
        </div>
        </div>
      </div>

      {/* Success Dialog */}
      <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <AlertDialogContent className="bg-white" style={{ borderRadius: '24px' }}>
          <div className="text-center">
            <CheckCircle2 className="w-16 h-16 text-[#E27726] mx-auto mb-4" />
            
            <AlertDialogTitle className="text-2xl font-heading font-bold text-[#282E3A]">
              Kassatelling Verzonden!
            </AlertDialogTitle>
            
            <AlertDialogDescription className="text-[#636878] mt-4">
              Verzonden door {naam}<br/>
              {new Date().toLocaleString('nl-NL')}
            </AlertDialogDescription>
            
            <AlertDialogAction 
              onClick={() => {
                setShowSuccessDialog(false);
                navigate('/dashboard');
              }}
              className="mt-6 bg-[#E27726] hover:bg-[#C9630E]"
              style={{ borderRadius: '16px' }}
            >
              Terug naar Dashboard
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Instructies Dialog */}
      <Dialog open={showInstructionsDialog} onOpenChange={setShowInstructionsDialog}>
        <DialogContent className="max-w-2xl" style={{ borderRadius: '24px' }}>
          <DialogHeader>
            <DialogTitle className="text-xl font-heading font-bold text-[#282E3A]">
              Instructies Kassatelling Avond
            </DialogTitle>
          </DialogHeader>
          
          <div className="mt-4">
            <ol className="space-y-4">
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-[12px] bg-[#E27726] text-white text-sm font-heading font-bold flex items-center justify-center">1</span>
                <div>
                  <span className="font-heading font-medium text-[#303542]">Print dagomzet</span>
                  <p className="text-[13px] text-[#636878] mt-1">Print omzet uit in Lightspeed. Check open en niet-gefinancierde tafels → verplaats naar tafel 100 of 101.</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-[12px] bg-[#E27726] text-white text-sm font-heading font-bold flex items-center justify-center">2</span>
                <div>
                  <span className="font-heading font-medium text-[#303542]">Finaliseer betalingen</span>
                  <p className="text-[13px] text-[#636878] mt-1">Betaalde maar niet-gefinaliseerde tafels handmatig afronden.</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-[12px] bg-[#E27726] text-white text-sm font-heading font-bold flex items-center justify-center">3</span>
                <div>
                  <span className="font-heading font-medium text-[#303542]">Vul naam in</span>
                  <p className="text-[13px] text-[#636878] mt-1">Vul je naam in bij "Naam medewerker".</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-[12px] bg-[#E27726] text-white text-sm font-heading font-bold flex items-center justify-center">4</span>
                <div>
                  <span className="font-heading font-medium text-[#303542]">Noteer cash omzet</span>
                  <p className="text-[13px] text-[#636878] mt-1">Voer het cash bedrag uit Lightspeed in.</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-[12px] bg-[#E27726] text-white text-sm font-heading font-bold flex items-center justify-center">5</span>
                <div>
                  <span className="font-heading font-medium text-[#303542]">Tel de kassa</span>
                  <p className="text-[13px] text-[#636878] mt-1">Vul alle denominaties in de velden in.</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-[12px] bg-[#E27726] text-white text-sm font-heading font-bold flex items-center justify-center">6</span>
                <div>
                  <span className="font-heading font-medium text-[#303542]">Controleer kassalade</span>
                  <p className="text-[13px] text-[#636878] mt-1">De kassalade moet altijd €157 bevatten. Vul indien nodig aan vanuit de wisselkassa.</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-[12px] bg-[#E27726] text-white text-sm font-heading font-bold flex items-center justify-center">7</span>
                <div>
                  <span className="font-heading font-medium text-[#303542]">Noteer bijzonderheden</span>
                  <p className="text-[13px] text-[#636878] mt-1">Vermeld tekorten, plussen of andere afwijkingen.</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-[12px] bg-[#E27726] text-white text-sm font-heading font-bold flex items-center justify-center">8</span>
                <div>
                  <span className="font-heading font-medium text-[#303542]">Verzend</span>
                  <p className="text-[13px] text-[#636878] mt-1">Klik op "Verzenden" om de kassatelling te versturen.</p>
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
