import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { LogOut, Info, CheckCircle2 } from 'lucide-react';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useUserLocation } from '@/contexts/UserLocationContext';

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
  const { userLocation } = useUserLocation();
  const [naam, setNaam] = useState('');
  const [canSubmit, setCanSubmit] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState(0);
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
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  
  const [errors, setErrors] = useState({
    naam: '',
    opmerkingen: '',
    total: ''
  });

  useEffect(() => {
    if (!userLocation) return;
    
    const checkSubmitAvailability = () => {
      const key = `kassatelling_last_submit_${userLocation}_open`;
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

  const updateKassaLade = (denomination: string, value: number | '') => {
    setKassaLade(prev => ({ ...prev, [denomination]: value }));
  };
  const updateWisselkas = (denomination: string, value: number | '') => {
    setWisselkas(prev => ({ ...prev, [denomination]: value }));
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
  
  const validateForm = () => {
    const newErrors = { naam: '', opmerkingen: '', total: '' };
    let isValid = true;
    if (!naam || naam.trim().length < 2) { newErrors.naam = 'Vul je naam in (minimaal 2 letters)'; isValid = false; }
    if (!opmerkingen || opmerkingen.trim().length < 3) { newErrors.opmerkingen = 'Vul een korte opmerking in'; isValid = false; }
    if (total <= 0) { newErrors.total = 'Tel eerst de kassa en wisselkas'; isValid = false; }
    setErrors(newErrors);
    return isValid;
  };
  
  const handleSubmit = async () => {
    if (!validateForm()) { toast.error('Vul alle verplichte velden in'); return; }
    if (!canSubmit) {
      const mins = Math.floor(timeRemaining / 60);
      const secs = timeRemaining % 60;
      toast.error(`Je kunt pas over ${mins}m ${secs}s opnieuw indienen`);
      return;
    }
    const data = {
      type: 'open',
      week: weekNumber,
      date: new Date().toISOString(),
      location: userLocation,
      naam: naam,
      kassaLade: { denominations: kassaLade, total: kassaLadeTotal },
      wisselkas: { denominations: wisselkas, total: wisselkasTotal },
      total: total,
      opmerkingen: opmerkingen
    };
    try {
      await fetch('https://jaapies.app.n8n.cloud/webhook/kassa-afdracht', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const key = `kassatelling_last_submit_${userLocation}_open`;
      localStorage.setItem(key, Date.now().toString());
      setCanSubmit(false);
      setTimeRemaining(10 * 60);
      setShowSuccessDialog(true);
    } catch (error) {
      console.error('Fout bij verzenden:', error);
      toast.error('Verzenden mislukt');
    }
  };

  const renderDenomTable = (title: string, data: typeof kassaLade, updateFn: (d: string, v: number | '') => void, totalVal: number) => (
    <div style={{
      backgroundColor: '#FFFFFF',
      borderRadius: '20px',
      border: '1px solid #D5D8E0',
      overflow: 'hidden',
      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
    }}>
      <div style={{ backgroundColor: '#F8F9FA', padding: '12px 16px', borderBottom: '1px solid #D5D8E0' }}>
        <h2 style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 600, color: '#636878', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {title}
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
                  <input type="number" value={data[denom as keyof typeof data]} onChange={e => updateFn(denom, e.target.value === '' ? '' : parseInt(e.target.value))} min={0} style={{
                    width: '80px', padding: '6px 8px', textAlign: 'center',
                    border: '1px solid #C1C5CF', borderRadius: '14px', backgroundColor: '#FFFFFF',
                    fontFamily: "'Geist Mono', monospace", fontSize: '12px', fontWeight: 500, color: '#282E3A', outline: 'none', transition: 'border-color 0.15s',
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
          <span style={{ fontSize: '24px', fontFamily: "'Geist Mono', monospace", fontWeight: 700, color: '#E27726' }}>€{totalVal.toFixed(2).replace('.', ',')}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 400px', gap: '24px', alignItems: 'start' }}>
          {renderDenomTable('Kassa Lade', kassaLade, updateKassaLade, kassaLadeTotal)}
          {renderDenomTable('Wisselkas', wisselkas, updateWisselkas, wisselkasTotal)}

          {/* Right side: Summary card */}
          <div style={{ position: 'sticky', top: '24px' }}>
            <div style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '20px',
              border: '1px solid #D5D8E0',
              padding: '20px',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Totaal */}
                <div style={{ padding: '6px 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '13px', fontFamily: 'Inter, sans-serif', fontWeight: 500, color: '#636878' }}>Totaal</span>
                    <span style={{ fontSize: '28px', fontFamily: "'Geist Mono', monospace", fontWeight: 700, color: errors.total ? '#EF4444' : '#E27726', letterSpacing: '-0.03em' }}>
                      €{total.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                  {errors.total && <p style={{ fontSize: '12px', color: '#EF4444', fontFamily: 'Inter, sans-serif', marginTop: '4px', textAlign: 'right' }}>{errors.total}</p>}
                </div>

                <div style={{ borderTop: '1px solid #EAECF0', margin: '4px 0' }}></div>

                {/* Naam */}
                <div style={{ padding: '6px 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                    <label style={{ fontSize: '11px', fontFamily: 'Inter, sans-serif', fontWeight: 600, color: '#636878', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Naam *</label>
                    <input type="text" value={naam} onChange={e => { setNaam(e.target.value); if (errors.naam) setErrors(prev => ({ ...prev, naam: '' })); }}
                      placeholder="Naam" style={{
                        flex: 1, padding: '8px 12px',
                        border: errors.naam ? '1px solid #EF4444' : '1px solid #C1C5CF',
                        borderRadius: '14px', backgroundColor: '#FFFFFF', fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#282E3A', outline: 'none',
                      }}
                      onFocus={(e) => { if (!errors.naam) { e.target.style.borderColor = '#E27726'; e.target.style.boxShadow = '0 0 0 2px rgba(226,119,38,0.2)'; } }}
                      onBlur={(e) => { if (!errors.naam) { e.target.style.borderColor = '#C1C5CF'; e.target.style.boxShadow = 'none'; } }}
                    />
                  </div>
                  {errors.naam && <p style={{ fontSize: '12px', color: '#EF4444', fontFamily: 'Inter, sans-serif', marginTop: '4px' }}>{errors.naam}</p>}
                </div>

                <div style={{ borderTop: '1px solid #EAECF0', margin: '4px 0' }}></div>

                {/* Opmerkingen */}
                <div style={{ padding: '6px 0' }}>
                  <label style={{ fontSize: '11px', fontFamily: 'Inter, sans-serif', fontWeight: 600, color: '#636878', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '8px' }}>Opmerkingen *</label>
                  <textarea value={opmerkingen} onChange={e => { setOpmerkingen(e.target.value); if (errors.opmerkingen) setErrors(prev => ({ ...prev, opmerkingen: '' })); }}
                    placeholder="Belangrijke opmerkingen..." style={{
                      minHeight: '60px', width: '100%', padding: '8px 12px',
                      border: errors.opmerkingen ? '1px solid #EF4444' : '1px solid #C1C5CF',
                      borderRadius: '14px', backgroundColor: '#FFFFFF', fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#282E3A', outline: 'none', resize: 'vertical', whiteSpace: 'pre-wrap'
                    }}
                    onFocus={(e) => { if (!errors.opmerkingen) { e.target.style.borderColor = '#E27726'; e.target.style.boxShadow = '0 0 0 2px rgba(226,119,38,0.2)'; } }}
                    onBlur={(e) => { if (!errors.opmerkingen) { e.target.style.borderColor = '#C1C5CF'; e.target.style.boxShadow = 'none'; } }}
                  />
                  {errors.opmerkingen && <p style={{ fontSize: '12px', color: '#EF4444', fontFamily: 'Inter, sans-serif', marginTop: '4px' }}>{errors.opmerkingen}</p>}
                </div>

                <div style={{ borderTop: '1px solid #EAECF0', margin: '4px 0' }}></div>

                {/* Verzenden */}
                <div>
                  {!canSubmit && timeRemaining > 0 && (
                    <p style={{ fontSize: '12px', color: '#636878', fontFamily: 'Inter, sans-serif', textAlign: 'center', marginBottom: '12px' }}>
                      Je kunt over {Math.floor(timeRemaining / 60)}m {timeRemaining % 60}s opnieuw indienen
                    </p>
                  )}
                  <button onClick={handleSubmit} disabled={!canSubmit || !naam || naam.length < 2}
                    style={{
                      width: '100%', padding: '14px 20px',
                      backgroundColor: (!canSubmit || !naam || naam.length < 2) ? '#C1C5CF' : '#E27726',
                      color: '#FFFFFF', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '14px',
                      borderRadius: '16px', border: 'none',
                      cursor: (!canSubmit || !naam || naam.length < 2) ? 'not-allowed' : 'pointer',
                      transition: 'all 0.15s',
                      opacity: (!canSubmit || !naam || naam.length < 2) ? 0.45 : 1,
                      marginBottom: '12px',
                    }}
                    onMouseEnter={(e) => { if (canSubmit && naam && naam.length >= 2) e.currentTarget.style.backgroundColor = '#C9630E'; }}
                    onMouseLeave={(e) => { if (canSubmit && naam && naam.length >= 2) e.currentTarget.style.backgroundColor = '#E27726'; }}
                  >
                    {!canSubmit ? 'Wacht alsjeblieft...' : 'Verzenden'}
                  </button>
                  
                  <button onClick={() => setShowInstructionsDialog(true)} style={{
                    width: '100%', padding: '10px 20px', backgroundColor: '#FFF7ED', color: '#A5500D',
                    fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '13px', borderRadius: '16px',
                    border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
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
      </div>

      {/* Success Dialog */}
      <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <AlertDialogContent className="bg-white" style={{ borderRadius: '24px' }}>
          <div className="text-center">
            <CheckCircle2 className="w-16 h-16 text-[#E27726] mx-auto mb-4" />
            <AlertDialogTitle className="text-2xl font-heading font-bold text-[#282E3A]">Kassatelling Verzonden!</AlertDialogTitle>
            <AlertDialogDescription className="text-[#636878] mt-4">
              Verzonden door {naam}<br/>{new Date().toLocaleString('nl-NL')}
            </AlertDialogDescription>
            <AlertDialogAction onClick={() => { setShowSuccessDialog(false); navigate('/dashboard'); }}
              className="mt-6 bg-[#E27726] hover:bg-[#C9630E]" style={{ borderRadius: '16px' }}>
              Terug naar Dashboard
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Instructies Dialog */}
      <Dialog open={showInstructionsDialog} onOpenChange={setShowInstructionsDialog}>
        <DialogContent className="max-w-lg" style={{ borderRadius: '24px' }}>
          <DialogHeader>
            <DialogTitle className="text-xl font-heading font-bold text-[#282E3A]">Instructies Kassatelling</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <ol className="space-y-3">
              {[
                { title: 'Tel de kassa lade', desc: 'Vul alle aantallen in' },
                { title: 'Tel de wisselkas', desc: 'Vul alle aantallen in' },
                { title: 'Controleer het totaal', desc: 'Moet €157,00 zijn' },
                { title: 'Bij tekort/overschot', desc: 'Meld dit in de opmerkingen' },
                { title: 'Aanvullen indien nodig', desc: 'Als totaal < €157, vul aan vanuit wisselkassa tot €157' },
                { title: 'Geen wijzigingen meer', desc: 'Na aanvullen niets meer wijzigen in de telling' },
                { title: 'Verzenden', desc: 'Druk op de verzenden knop' },
              ].map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-[12px] bg-[#E27726] text-white text-sm font-heading font-bold flex items-center justify-center">{i + 1}</span>
                  <div>
                    <span className="font-heading font-medium text-[#303542]">{step.title}</span>
                    <p className="text-[13px] text-[#636878] mt-0.5">{step.desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default KassatellingOverdag;
