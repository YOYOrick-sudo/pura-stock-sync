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

      // Save timestamp and disable submit
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
  return (
    <div>
      {/* Main Content */}
      <div className="max-w-[1400px] mx-auto">

        <div className="grid grid-cols-[1fr_1fr_400px] gap-6 items-start">
          {/* Kassa Lade */}
          <div className="bg-card rounded-lg border border-border overflow-hidden shadow-sm">
            <div className="bg-card px-4 py-3 border-b border-border">
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                Kassa Lade
              </h2>
            </div>
            <div className="overflow-x-auto bg-card p-4">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-3 py-2 text-left font-semibold text-muted-foreground text-xs uppercase tracking-wide">Bedrag</th>
                    <th className="px-3 py-2 text-center font-semibold text-muted-foreground text-xs uppercase tracking-wide">Aantal</th>
                  </tr>
                </thead>
                <tbody>
                  {['500', '200', '100', '50', '20', '10', '5', '2', '1', '0.50', '0.20', '0.10', '0.05'].map((denom) => <tr key={denom} className="border-b border-border/20">
                      <td className="px-3 py-1.5 text-foreground font-mono text-sm border-r border-border/30">{'\u20AC'}{denom.replace('.', ',')}</td>
                      <td className="px-3 py-1.5 text-center">
                        <input type="number" value={kassaLade[denom as keyof typeof kassaLade]} onChange={e => updateKassaLade(denom, e.target.value === '' ? '' : parseInt(e.target.value))} min={0}
                        className="w-20 px-2 py-1.5 text-center border border-border rounded-md bg-card font-mono text-sm text-foreground outline-none focus:border-primary"
                        />
                      </td>
                    </tr>)}
                </tbody>
              </table>
            </div>
            <div className="bg-card px-4 py-3 border-t border-border">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground text-xs uppercase tracking-wide">Totaal</span>
                <span className="text-2xl font-bold text-primary">{'\u20AC'}{kassaLadeTotal.toFixed(2).replace('.', ',')}</span>
              </div>
            </div>
          </div>

          {/* Wisselkas */}
          <div className="bg-card rounded-lg border border-border overflow-hidden shadow-sm">
            <div className="bg-card px-4 py-3 border-b border-border">
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                Wisselkas
              </h2>
            </div>
            <div className="overflow-x-auto bg-card p-4">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-3 py-2 text-left font-semibold text-muted-foreground text-xs uppercase tracking-wide">Bedrag</th>
                    <th className="px-3 py-2 text-center font-semibold text-muted-foreground text-xs uppercase tracking-wide">Aantal</th>
                  </tr>
                </thead>
                <tbody>
                  {['500', '200', '100', '50', '20', '10', '5', '2', '1', '0.50', '0.20', '0.10', '0.05'].map((denom) => <tr key={denom} className="border-b border-border/20">
                      <td className="px-3 py-1.5 text-foreground font-mono text-sm border-r border-border/30">{'\u20AC'}{denom.replace('.', ',')}</td>
                      <td className="px-3 py-1.5 text-center">
                        <input type="number" value={wisselkas[denom as keyof typeof wisselkas]} onChange={e => updateWisselkas(denom, e.target.value === '' ? '' : parseInt(e.target.value))} min={0}
                        className="w-20 px-2 py-1.5 text-center border border-border rounded-md bg-card font-mono text-sm text-foreground outline-none focus:border-primary"
                        />
                      </td>
                    </tr>)}
                </tbody>
              </table>
            </div>
            <div className="bg-card px-4 py-3 border-t border-border">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground text-xs uppercase tracking-wide">Totaal</span>
                <span className="text-2xl font-bold text-primary">{'\u20AC'}{wisselkasTotal.toFixed(2).replace('.', ',')}</span>
              </div>
            </div>
          </div>

          {/* Right side: Summary card */}
          <div className="sticky top-6">
            <div className="bg-card rounded-lg border border-border p-5 shadow-sm">
              <div className="flex flex-col gap-4 bg-card rounded-md p-4">
                {/* Totaal */}
                <div className="py-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">
                      Totaal
                    </span>
                    <span className={`text-3xl font-bold ${errors.total ? 'text-destructive' : 'text-primary'}`}>
                      {'\u20AC'}{total.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                  {errors.total && (
                    <p className="text-xs text-destructive mt-1 text-right">{errors.total}</p>
                  )}
                </div>

                <div className="border-t border-border/30 my-3"></div>

                {/* Naam medewerker */}
                <div className="py-1.5">
                  <div className="flex items-center justify-between gap-4">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
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
                      className={`flex-1 px-3 py-2 border rounded-md bg-card text-sm text-foreground outline-none focus:border-primary ${errors.naam ? 'border-destructive' : 'border-border'}`}
                    />
                  </div>
                  {errors.naam && (
                    <p className="text-xs text-destructive mt-1">{errors.naam}</p>
                  )}
                </div>

                <div className="border-t border-border/30 my-3"></div>

                {/* Opmerkingen */}
                <div className="py-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-2">
                    Opmerkingen *
                  </label>
                  <textarea
                    value={opmerkingen}
                    onChange={e => {
                      setOpmerkingen(e.target.value);
                      if (errors.opmerkingen) setErrors(prev => ({ ...prev, opmerkingen: '' }));
                    }}
                    placeholder="Belangrijke opmerkingen..."
                    className={`min-h-[60px] w-full px-3 py-2 border rounded-md bg-card text-sm text-foreground outline-none resize-y whitespace-pre-wrap focus:border-primary ${errors.opmerkingen ? 'border-destructive' : 'border-border'}`}
                  />
                  {errors.opmerkingen && (
                    <p className="text-xs text-destructive mt-1">{errors.opmerkingen}</p>
                  )}
                </div>

                <div className="border-t border-border/30 my-3"></div>

                {/* Verzenden button */}
                <div>
                  {!canSubmit && timeRemaining > 0 && (
                    <p className="text-xs text-muted-foreground text-center mb-3">
                      Je kunt over {Math.floor(timeRemaining / 60)}m {timeRemaining % 60}s opnieuw indienen
                    </p>
                  )}
                  <button
                    onClick={handleSubmit}
                    disabled={!canSubmit || !naam || naam.length < 2}
                    className={`w-full py-3.5 px-5 text-white font-semibold text-sm rounded-lg border-none transition-all mb-3 ${
                      (!canSubmit || !naam || naam.length < 2)
                        ? 'bg-input cursor-not-allowed'
                        : 'bg-primary cursor-pointer shadow-sm hover:bg-primary/90 hover:shadow-md'
                    }`}
                  >
                    {!canSubmit ? 'Wacht alsjeblieft...' : 'Verzenden'}
                  </button>

                  <button
                    onClick={() => setShowInstructionsDialog(true)}
                    className="w-full py-2.5 px-5 bg-card text-primary font-medium text-sm rounded-lg border border-primary/30 cursor-pointer transition-all flex items-center justify-center gap-2 hover:bg-primary/5"
                  >
                    <Info className="w-4 h-4" />
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
                    <p className="text-xs text-foreground/60 mt-0.5">Moet {'\u20AC'}157,00 zijn</p>
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
                    <p className="text-xs text-foreground/60 mt-0.5">Als totaal &lt; {'\u20AC'}157, vul aan vanuit wisselkassa tot {'\u20AC'}157</p>
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
