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
  
  // Validation states
  const [errors, setErrors] = useState({
    naam: '',
    opmerkingen: '',
    total: ''
  });
  // Check throttling status
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
  
  const validateForm = () => {
    const newErrors = { naam: '', opmerkingen: '', total: '' };
    let isValid = true;

    if (!naam || naam.trim().length < 2) {
      newErrors.naam = 'Vul je naam in (minimaal 2 letters)';
      isValid = false;
    }

    if (!opmerkingen || opmerkingen.trim().length < 3) {
      newErrors.opmerkingen = 'Vul een korte opmerking in';
      isValid = false;
    }

    if (total <= 0) {
      newErrors.total = 'Tel eerst de kassa en wisselkas';
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
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Niet ingelogd — log opnieuw in');
        return;
      }

      const { error } = await supabase.from('kassa_afdrachten').insert({
        created_by: user.id,
        location: userLocation,
        type: 'open',
        week_number: weekNumber,
        date: new Date().toISOString().slice(0, 10),
        naam: naam.trim(),
        kassa_lade_denominations: kassaLade,
        kassa_lade_total: kassaLadeTotal,
        wisselkas_denominations: wisselkas,
        wisselkas_total: wisselkasTotal,
        total: total,
        opmerkingen: opmerkingen.trim() || null,
      });

      if (error) throw error;

      // Save timestamp and disable submit
      const key = `kassatelling_last_submit_${userLocation}_open`;
      localStorage.setItem(key, Date.now().toString());
      setCanSubmit(false);
      setTimeRemaining(10 * 60);

      // Clear backup
      localStorage.removeItem(`kassatelling_backup_${userLocation}_open`);

      setShowSuccessDialog(true);
    } catch (error: any) {
      console.error('Fout bij opslaan kassa-afdracht:', error);
      // Backup the count so user doesn't lose it
      try {
        localStorage.setItem(
          `kassatelling_backup_${userLocation}_open`,
          JSON.stringify({ kassaLade, wisselkas, naam, opmerkingen, ts: Date.now() })
        );
      } catch {}
      toast.error(`Opslaan mislukt: ${error?.message ?? 'onbekende fout'}. Je telling is lokaal bewaard — probeer opnieuw.`);
    }
  };
  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Main Content */}
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 400px', gap: '24px', alignItems: 'start' }}>
          {/* Kassa Lade */}
          <div style={{
            backgroundColor: 'hsl(var(--card))',
            borderRadius: '20px',
            border: '1px solid hsl(var(--border))',
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
          }}>
            <div style={{ backgroundColor: 'hsl(var(--card))', padding: '12px 16px', borderBottom: '1px solid hsl(var(--border))' }}>
              <h2 style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 600, color: 'hsl(var(--foreground))', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Kassa Lade
              </h2>
            </div>
            <div style={{ overflowX: 'auto', backgroundColor: 'hsl(var(--card))', padding: '16px' }}>
              <table style={{ width: '100%', fontFamily: 'Inter, sans-serif' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                    <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: 'hsl(var(--muted-foreground))', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Bedrag</th>
                    <th style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 600, color: 'hsl(var(--muted-foreground))', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Aantal</th>
                  </tr>
                </thead>
                <tbody>
                  {['500', '200', '100', '50', '20', '10', '5', '2', '1', '0.50', '0.20', '0.10', '0.05'].map((denom) => <tr key={denom} style={{ borderBottom: '1px solid hsl(var(--border) / 0.5)' }}>
                      <td style={{ padding: '6px 12px', color: 'hsl(var(--foreground))', fontFamily: 'monospace', fontSize: '14px', borderRight: '1px solid hsl(var(--border))' }}>€{denom.replace('.', ',')}</td>
                      <td style={{ padding: '6px 12px', textAlign: 'center' }}>
                        <input type="number" value={kassaLade[denom as keyof typeof kassaLade]} onChange={e => updateKassaLade(denom, e.target.value === '' ? '' : parseInt(e.target.value))} min={0} style={{
                          width: '80px',
                          padding: '6px 8px',
                          textAlign: 'center',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '16px',
                          backgroundColor: 'hsl(var(--card))',
                          fontFamily: 'monospace',
                          fontSize: '14px',
                          color: 'hsl(var(--foreground))',
                          outline: 'none',
                        }}
                        onFocus={(e) => e.target.style.borderColor = 'hsl(var(--primary))'}
                        onBlur={(e) => e.target.style.borderColor = 'hsl(var(--border))'}
                        />
                      </td>
                    </tr>)}
                </tbody>
              </table>
            </div>
            <div style={{ backgroundColor: 'hsl(var(--card))', padding: '12px 16px', borderTop: '1px solid hsl(var(--border))' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, color: 'hsl(var(--foreground))', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Totaal</span>
                <span style={{ fontSize: '24px', fontFamily: 'Inter, sans-serif', fontWeight: 700, color: 'hsl(var(--primary))' }}>€{kassaLadeTotal.toFixed(2).replace('.', ',')}</span>
              </div>
            </div>
          </div>

          {/* Wisselkas */}
          <div style={{
            backgroundColor: 'hsl(var(--card))',
            borderRadius: '20px',
            border: '1px solid hsl(var(--border))',
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
          }}>
            <div style={{ backgroundColor: 'hsl(var(--card))', padding: '12px 16px', borderBottom: '1px solid hsl(var(--border))' }}>
              <h2 style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 600, color: 'hsl(var(--foreground))', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Wisselkas
              </h2>
            </div>
            <div style={{ overflowX: 'auto', backgroundColor: 'hsl(var(--card))', padding: '16px' }}>
              <table style={{ width: '100%', fontFamily: 'Inter, sans-serif' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                    <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: 'hsl(var(--muted-foreground))', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Bedrag</th>
                    <th style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 600, color: 'hsl(var(--muted-foreground))', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Aantal</th>
                  </tr>
                </thead>
                <tbody>
                  {['500', '200', '100', '50', '20', '10', '5', '2', '1', '0.50', '0.20', '0.10', '0.05'].map((denom) => <tr key={denom} style={{ borderBottom: '1px solid hsl(var(--border) / 0.5)' }}>
                      <td style={{ padding: '6px 12px', color: 'hsl(var(--foreground))', fontFamily: 'monospace', fontSize: '14px', borderRight: '1px solid hsl(var(--border))' }}>€{denom.replace('.', ',')}</td>
                      <td style={{ padding: '6px 12px', textAlign: 'center' }}>
                        <input type="number" value={wisselkas[denom as keyof typeof wisselkas]} onChange={e => updateWisselkas(denom, e.target.value === '' ? '' : parseInt(e.target.value))} min={0} style={{
                          width: '80px',
                          padding: '6px 8px',
                          textAlign: 'center',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '16px',
                          backgroundColor: 'hsl(var(--card))',
                          fontFamily: 'monospace',
                          fontSize: '14px',
                          color: 'hsl(var(--foreground))',
                          outline: 'none',
                        }}
                        onFocus={(e) => e.target.style.borderColor = 'hsl(var(--primary))'}
                        onBlur={(e) => e.target.style.borderColor = 'hsl(var(--border))'}
                        />
                      </td>
                    </tr>)}
                </tbody>
              </table>
            </div>
            <div style={{ backgroundColor: 'hsl(var(--card))', padding: '12px 16px', borderTop: '1px solid hsl(var(--border))' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, color: 'hsl(var(--foreground))', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Totaal</span>
                <span style={{ fontSize: '24px', fontFamily: 'Inter, sans-serif', fontWeight: 700, color: 'hsl(var(--primary))' }}>€{wisselkasTotal.toFixed(2).replace('.', ',')}</span>
              </div>
            </div>
          </div>

          {/* Right side: Summary card */}
          <div style={{ position: 'sticky', top: '24px' }}>
            <div style={{
              backgroundColor: 'hsl(var(--card))',
              borderRadius: '20px',
              border: '1px solid hsl(var(--border))',
              padding: '20px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', backgroundColor: 'hsl(var(--card))', borderRadius: '16px', padding: '16px' }}>
                {/* Totaal */}
                <div style={{ padding: '6px 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '14px', fontFamily: 'Inter, sans-serif', fontWeight: 500, color: 'hsl(var(--muted-foreground))' }}>
                      Totaal
                    </span>
                    <span style={{ fontSize: '30px', fontFamily: 'Inter, sans-serif', fontWeight: 700, color: errors.total ? 'hsl(var(--destructive))' : 'hsl(var(--primary))' }}>
                      €{total.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                  {errors.total && (
                    <p style={{ fontSize: '12px', color: 'hsl(var(--destructive))', fontFamily: 'Inter, sans-serif', marginTop: '4px', textAlign: 'right' }}>{errors.total}</p>
                  )}
                </div>

                <div style={{ borderTop: '1px solid hsl(var(--border) / 0.7)', margin: '12px 0' }}></div>

                {/* Naam medewerker */}
                <div style={{ padding: '6px 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                    <label style={{ fontSize: '12px', fontFamily: 'Inter, sans-serif', fontWeight: 600, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Naam *
                    </label>
                    <input 
                      type="text" 
                      value={naam} 
                      onChange={e => {
                        setNaam(e.target.value);
                        if (errors.naam) setErrors(prev => ({ ...prev, naam: '' }));
                      }}
                      placeholder="Naam" 
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        border: errors.naam ? '1px solid hsl(var(--destructive))' : '1px solid hsl(var(--border))',
                        borderRadius: '16px',
                        backgroundColor: 'hsl(var(--card))',
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '14px',
                        color: 'hsl(var(--foreground))',
                        outline: 'none',
                      }}
                      onFocus={(e) => !errors.naam && (e.target.style.borderColor = 'hsl(var(--primary))')}
                      onBlur={(e) => !errors.naam && (e.target.style.borderColor = 'hsl(var(--border))')}
                    />
                  </div>
                  {errors.naam && (
                    <p style={{ fontSize: '12px', color: 'hsl(var(--destructive))', fontFamily: 'Inter, sans-serif', marginTop: '4px' }}>{errors.naam}</p>
                  )}
                </div>

                <div style={{ borderTop: '1px solid hsl(var(--border) / 0.7)', margin: '12px 0' }}></div>

                {/* Opmerkingen */}
                <div style={{ padding: '6px 0' }}>
                  <label style={{ fontSize: '12px', fontFamily: 'Inter, sans-serif', fontWeight: 600, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '8px' }}>
                    Opmerkingen *
                  </label>
                  <textarea 
                    value={opmerkingen} 
                    onChange={e => {
                      setOpmerkingen(e.target.value);
                      if (errors.opmerkingen) setErrors(prev => ({ ...prev, opmerkingen: '' }));
                    }}
                    placeholder="Belangrijke opmerkingen..." 
                    style={{
                      minHeight: '60px',
                      width: '100%',
                      padding: '8px 12px',
                      border: errors.opmerkingen ? '1px solid hsl(var(--destructive))' : '1px solid hsl(var(--border))',
                      borderRadius: '16px',
                      backgroundColor: 'hsl(var(--card))',
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '14px',
                      color: 'hsl(var(--foreground))',
                      outline: 'none',
                      resize: 'vertical',
                      whiteSpace: 'pre-wrap'
                    }}
                    onFocus={(e) => !errors.opmerkingen && (e.target.style.borderColor = 'hsl(var(--primary))')}
                    onBlur={(e) => !errors.opmerkingen && (e.target.style.borderColor = 'hsl(var(--border))')}
                  />
                  {errors.opmerkingen && (
                    <p style={{ fontSize: '12px', color: 'hsl(var(--destructive))', fontFamily: 'Inter, sans-serif', marginTop: '4px' }}>{errors.opmerkingen}</p>
                  )}
                </div>

                <div style={{ borderTop: '1px solid hsl(var(--border) / 0.7)', margin: '12px 0' }}></div>

                {/* Verzenden button */}
                <div>
                  {!canSubmit && timeRemaining > 0 && (
                    <p style={{ fontSize: '12px', color: 'hsl(var(--muted-foreground))', fontFamily: 'Inter, sans-serif', textAlign: 'center', marginBottom: '12px' }}>
                      Je kunt over {Math.floor(timeRemaining / 60)}m {timeRemaining % 60}s opnieuw indienen
                    </p>
                  )}
                  <button 
                    onClick={handleSubmit}
                    disabled={!canSubmit || !naam || naam.length < 2}
                    style={{
                      width: '100%',
                      padding: '14px 20px',
                      backgroundColor: (!canSubmit || !naam || naam.length < 2) ? 'hsl(var(--muted-foreground))' : 'hsl(var(--primary))',
                      color: 'hsl(var(--primary-foreground))',
                      fontFamily: 'Inter, sans-serif',
                      fontWeight: 600,
                      fontSize: '14px',
                      borderRadius: '20px',
                      border: 'none',
                      cursor: (!canSubmit || !naam || naam.length < 2) ? 'not-allowed' : 'pointer',
                      transition: 'all 0.15s',
                      boxShadow: (!canSubmit || !naam || naam.length < 2) ? 'none' : '0 1px 2px rgba(0, 0, 0, 0.05)',
                      marginBottom: '12px',
                    }}
                    onMouseEnter={(e) => {
                      if (canSubmit && naam && naam.length >= 2) {
                        e.currentTarget.style.backgroundColor = 'hsl(var(--primary-hover))';
                        e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (canSubmit && naam && naam.length >= 2) {
                        e.currentTarget.style.backgroundColor = 'hsl(var(--primary))';
                        e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.05)';
                      } else {
                        e.currentTarget.style.backgroundColor = 'hsl(var(--muted-foreground))';
                      }
                    }}
                  >
                    {!canSubmit ? 'Wacht alsjeblieft...' : 'Verzenden'}
                  </button>
                  
                  <button 
                    onClick={() => setShowInstructionsDialog(true)} 
                    style={{
                      width: '100%',
                      padding: '10px 20px',
                      backgroundColor: 'hsl(var(--card))',
                      color: 'hsl(var(--primary))',
                      fontFamily: 'Inter, sans-serif',
                      fontWeight: 500,
                      fontSize: '14px',
                      borderRadius: '20px',
                      border: '1px solid hsl(var(--primary) / 0.3)',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'hsl(var(--primary) / 0.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'hsl(var(--card))';
                    }}
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
          <AlertDialogContent className="bg-white">
            <div className="text-center">
              <CheckCircle2 className="w-16 h-16 text-primary mx-auto mb-4" />
              
              <AlertDialogTitle className="text-2xl font-heading font-bold text-foreground">
                Kassatelling Verzonden!
              </AlertDialogTitle>
              
              <AlertDialogDescription className="text-foreground/70 mt-4">
                Verzonden door {naam}<br/>
                {new Date().toLocaleString('nl-NL')}
              </AlertDialogDescription>
              
              <AlertDialogAction 
                onClick={() => {
                  setShowSuccessDialog(false);
                  navigate('/dashboard');
                }}
                className="mt-6 bg-primary hover:bg-primary/90"
              >
                Terug naar Dashboard
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>

        {/* Instructies Dialog */}
        <Dialog open={showInstructionsDialog} onOpenChange={setShowInstructionsDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-xl font-heading font-bold text-foreground">
                Instructies Kassatelling
              </DialogTitle>
            </DialogHeader>
            
            <div className="mt-4">
              <ol className="space-y-3">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-white text-sm font-heading font-bold flex items-center justify-center">1</span>
                  <div>
                    <span className="font-heading font-medium text-foreground">Tel de kassa lade</span>
                    <p className="text-xs text-foreground/60 mt-0.5">Vul alle aantallen in</p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-white text-sm font-heading font-bold flex items-center justify-center">2</span>
                  <div>
                    <span className="font-heading font-medium text-foreground">Tel de wisselkas</span>
                    <p className="text-xs text-foreground/60 mt-0.5">Vul alle aantallen in</p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-white text-sm font-heading font-bold flex items-center justify-center">3</span>
                  <div>
                    <span className="font-heading font-medium text-foreground">Controleer het totaal</span>
                    <p className="text-xs text-foreground/60 mt-0.5">Moet €157,00 zijn</p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-white text-sm font-heading font-bold flex items-center justify-center">4</span>
                  <div>
                    <span className="font-heading font-medium text-foreground">Bij tekort/overschot</span>
                    <p className="text-xs text-foreground/60 mt-0.5">Meld dit in de opmerkingen</p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-white text-sm font-heading font-bold flex items-center justify-center">5</span>
                  <div>
                    <span className="font-heading font-medium text-foreground">Aanvullen indien nodig</span>
                    <p className="text-xs text-foreground/60 mt-0.5">Als totaal &lt; €157, vul aan vanuit wisselkassa tot €157</p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-white text-sm font-heading font-bold flex items-center justify-center">6</span>
                  <div>
                    <span className="font-heading font-medium text-foreground">Geen wijzigingen meer</span>
                    <p className="text-xs text-foreground/60 mt-0.5">Na aanvullen niets meer wijzigen in de telling</p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-white text-sm font-heading font-bold flex items-center justify-center">7</span>
                  <div>
                    <span className="font-heading font-medium text-foreground">Verzenden</span>
                    <p className="text-xs text-foreground/60 mt-0.5">Druk op de verzenden knop</p>
                  </div>
                </li>
              </ol>
            </div>
          </DialogContent>
        </Dialog>
    </div>
  );
};

export default KassatellingOverdag;