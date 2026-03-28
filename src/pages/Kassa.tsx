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
  '20': 2,    // 2 x €20 = €40
  '10': 5,    // 5 x €10 = €50
  '5': 5,     // 5 x €5 = €25
  '2': 10,    // 10 x €2 = €20
  '1': 10,    // 10 x €1 = €10
  '0.50': 10, // 10 x €0,50 = €5
  '0.20': 20, // 20 x €0,20 = €4
  '0.10': 20, // 20 x €0,10 = €2
  '0.05': 20, // 20 x €0,05 = €1
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
    } catch (error) {
      console.error('Fout bij verzenden:', error);
      toast.error('Verzenden mislukt');
    }
  };

  const isDisabled = !canSubmit || !naam || naam.length < 2 || cashOmzet === '';

  return (
    <div>
      {/* Main Content */}
      <div className="max-w-[1400px] mx-auto">
        <div className="grid grid-cols-[1fr_400px] gap-6 items-start">
          {/* Denomination table */}
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
                  {['500', '200', '100', '50', '20', '10', '5', '2', '1', '0.50', '0.20', '0.10', '0.05'].map((denom, index) => (
                    <tr key={denom} className="border-b border-border/20">
                      <td className="px-3 py-1.5 text-foreground font-mono text-sm border-r border-border/30">{'\u20AC'}{denom.replace('.', ',')}</td>
                      <td className="px-3 py-1.5 text-center">
                        <input
                          type="number"
                          value={counts[denom as keyof typeof counts]}
                          onChange={(e) => updateCount(denom, e.target.value === '' ? '' : parseInt(e.target.value))}
                          min={0}
                          className="w-20 px-2 py-1.5 text-center border border-border rounded-md bg-card font-mono text-sm text-foreground outline-none focus:border-primary"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="bg-card px-4 py-3 border-t border-border">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground text-xs uppercase tracking-wide">Totaal</span>
                <span className="text-2xl font-bold text-primary">{'\u20AC'}{calculateTotal().toFixed(2).replace('.', ',')}</span>
              </div>
            </div>
          </div>

          {/* Right side: Summary card */}
          <div className="sticky top-6 flex flex-col gap-4">
            {/* Beginsaldo Reference - Collapsible */}
            <Collapsible open={beginsaldoExpanded} onOpenChange={setBeginsaldoExpanded}>
              <div className="bg-card rounded-lg border border-border overflow-hidden shadow-sm">

                {/* Clickable header met icon en pijltje */}
                <CollapsibleTrigger className="w-full px-4 py-3 bg-card cursor-pointer border-none transition-colors hover:bg-muted">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wallet className="w-4 h-4 text-primary" />
                      <span className="text-xs font-semibold text-foreground uppercase tracking-wide">
                        Beginsaldo (blijft in kassa)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-primary">
                        {'\u20AC'}{Object.entries(BEGINSALDO_VERDELING).reduce((sum, [denom, count]) => sum + (parseFloat(denom) * count), 0).toFixed(2).replace('.', ',')}
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 text-primary transition-transform duration-200 ${beginsaldoExpanded ? 'rotate-180' : ''}`}
                      />
                    </div>
                  </div>
                </CollapsibleTrigger>

                {/* Uitklapbare content met denominaties */}
                <CollapsibleContent>
                  <div className="px-4 py-3 bg-card border-t border-border">
                    {Object.entries(BEGINSALDO_VERDELING)
                      .sort((a, b) => parseFloat(b[0]) - parseFloat(a[0]))
                      .map(([denom, count]) => (
                      <div key={denom} className="flex justify-between py-1.5 border-b border-border/20">
                        <span className="font-mono text-[13px] text-foreground">{'\u20AC'}{denom.replace('.', ',')} x {count}</span>
                        <span className="text-[13px] text-muted-foreground">
                          {'\u20AC'}{(parseFloat(denom) * count).toFixed(2).replace('.', ',')}
                        </span>
                      </div>
                    ))}
                    <div className="flex justify-between py-2 mt-2 border-t border-border">
                      <span className="text-xs font-semibold text-foreground uppercase tracking-wide">Totaal</span>
                      <span className="text-lg font-bold text-primary">
                        {'\u20AC'}{Object.entries(BEGINSALDO_VERDELING).reduce((sum, [denom, count]) => sum + (parseFloat(denom) * count), 0).toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>

            {/* Summary card */}
            <div className="bg-card rounded-lg border border-border shadow-sm p-4">
              {/* Totaal - meest prominent */}
              <div className="flex items-center justify-between py-1">
                <span className="text-sm font-medium text-muted-foreground">
                  Totaal
                </span>
                <span className="text-3xl font-bold text-primary">
                  {'\u20AC'}{total.toFixed(2).replace('.', ',')}
                </span>
              </div>

              <div className="border-t border-border/30 my-2"></div>

              {/* Cash omzet - compacter */}
              <div className="py-1">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm font-medium text-muted-foreground">
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
                    className={`w-24 px-2 py-1.5 text-right text-lg font-bold text-foreground border rounded-md bg-card outline-none transition-colors focus:border-primary ${errors.cashOmzet ? 'border-destructive' : 'border-border'}`}
                  />
                </div>
                {errors.cashOmzet && (
                  <p className="text-xs text-destructive mt-1 text-right">{errors.cashOmzet}</p>
                )}
              </div>

              <div className="border-t border-border/30 my-2"></div>

              {/* Naam medewerker */}
              <div className="py-1">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm font-medium text-muted-foreground">
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
                    className={`w-48 px-2 py-1.5 text-right text-sm text-foreground border rounded-md bg-card outline-none transition-colors focus:border-primary ${errors.naam ? 'border-destructive' : 'border-border'}`}
                  />
                </div>
                {errors.naam && (
                  <p className="text-xs text-destructive mt-1 text-right">{errors.naam}</p>
                )}
              </div>

              <div className="border-t border-border/30 my-2"></div>

              {/* Afdracht - compacter met kleinere uitleg */}
              <div className="py-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    Afdracht / Envelop
                  </span>
                  <span className={`text-2xl font-bold ${afdracht > 0 ? 'text-primary' : 'text-muted-foreground'}`}>
                    {'\u20AC'}{afdracht.toFixed(2).replace('.', ',')}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {total >= DOELSALDO
                    ? `Leg \u20AC${afdracht.toFixed(2).replace('.', ',')} in de envelop, laat \u20AC${DOELSALDO.toFixed(2).replace('.', ',')} in de lade.`
                    : `Aanvullen uit wisselkassa: \u20AC${(DOELSALDO - total).toFixed(2).replace('.', ',')} om de lade op \u20AC${DOELSALDO.toFixed(2).replace('.', ',')} te brengen.`
                  }
                </p>
              </div>

              <div className="border-t border-border/30 my-2"></div>

              {/* Kasverschil - prominente kleurcodering */}
              <div className="flex items-center justify-between py-1">
                <span className="text-sm font-medium text-muted-foreground">
                  Kasverschil
                </span>
                <span className={`text-2xl font-bold ${kasverschil > 0 ? 'text-green-600' : kasverschil < 0 ? 'text-destructive' : 'text-foreground'}`}>
                  {'\u20AC'}{kasverschil.toFixed(2).replace('.', ',')}
                </span>
              </div>

              <div className="border-t border-border/30 my-2"></div>

              {/* Opmerkingen - compacter label */}
              <div className="py-1">
                <label htmlFor="opmerkingen" className="block text-sm font-medium text-muted-foreground mb-1.5">
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
                  className={`w-full min-h-[80px] px-3 py-2 font-mono text-sm text-foreground border rounded-md bg-card outline-none resize-y transition-colors whitespace-pre-wrap focus:border-primary ${errors.opmerkingen ? 'border-destructive' : 'border-border'}`}
                />
                {errors.opmerkingen && (
                  <p className="text-xs text-destructive mt-1">{errors.opmerkingen}</p>
                )}
              </div>

              {/* Verzenden button */}
              <div className="mt-4">
                {!canSubmit && timeRemaining > 0 && (
                  <p className="text-xs text-muted-foreground mb-2 text-center">
                    Je kunt over {Math.floor(timeRemaining / 60)}m {timeRemaining % 60}s opnieuw indienen
                  </p>
                )}
                <button
                  onClick={handleSubmit}
                  disabled={isDisabled}
                  className={`w-full p-5 font-semibold text-lg text-white border-none rounded-lg transition-all shadow-sm ${
                    isDisabled
                      ? 'bg-input cursor-not-allowed'
                      : 'bg-primary cursor-pointer hover:bg-primary/90 hover:shadow-md'
                  }`}
                >
                  {!canSubmit ? 'Wacht alsjeblieft...' : 'Verzenden'}
                </button>

                <button
                  onClick={() => setShowInstructionsDialog(true)}
                  className="w-full mt-2 py-2.5 px-5 font-medium text-sm bg-card text-primary border border-border rounded-lg cursor-pointer transition-all flex items-center justify-center gap-2 hover:bg-muted hover:border-primary"
                >
                  <Info className="w-4 h-4" />
                  Instructies
                </button>
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-heading font-bold text-foreground">
              Instructies Kassatelling Avond
            </DialogTitle>
          </DialogHeader>

          <div className="mt-4">
            <ol className="space-y-4">
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-white text-sm font-heading font-bold flex items-center justify-center">1</span>
                <div>
                  <span className="font-heading font-medium text-foreground">Print dagomzet</span>
                  <p className="text-sm text-foreground/70 mt-1">Print omzet uit in Lightspeed. Check open en niet-gefinancierde tafels {'\u2192'} verplaats naar tafel 100 of 101.</p>
                </div>
              </li>

              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-white text-sm font-heading font-bold flex items-center justify-center">2</span>
                <div>
                  <span className="font-heading font-medium text-foreground">Finaliseer betalingen</span>
                  <p className="text-sm text-foreground/70 mt-1">Betaalde maar niet-gefinaliseerde tafels handmatig afronden.</p>
                </div>
              </li>

              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-white text-sm font-heading font-bold flex items-center justify-center">3</span>
                <div>
                  <span className="font-heading font-medium text-foreground">Vul naam in</span>
                  <p className="text-sm text-foreground/70 mt-1">Vul je naam in bij "Naam medewerker".</p>
                </div>
              </li>

              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-white text-sm font-heading font-bold flex items-center justify-center">4</span>
                <div>
                  <span className="font-heading font-medium text-foreground">Noteer cash omzet</span>
                  <p className="text-sm text-foreground/70 mt-1">Voer het cash bedrag uit Lightspeed in.</p>
                </div>
              </li>

              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-white text-sm font-heading font-bold flex items-center justify-center">5</span>
                <div>
                  <span className="font-heading font-medium text-foreground">Tel de kassa</span>
                  <p className="text-sm text-foreground/70 mt-1">Vul alle denominaties in de velden in.</p>
                </div>
              </li>

              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-white text-sm font-heading font-bold flex items-center justify-center">6</span>
                <div>
                  <span className="font-heading font-medium text-foreground">Controleer kassalade</span>
                  <p className="text-sm text-foreground/70 mt-1">De kassalade moet altijd {'\u20AC'}157 bevatten. Vul indien nodig aan vanuit de wisselkassa.</p>
                  <p className="text-xs text-amber-600/80 mt-1 font-medium">Belangrijk voor zowel Midsland als West</p>
                </div>
              </li>

              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-white text-sm font-heading font-bold flex items-center justify-center">7</span>
                <div>
                  <span className="font-heading font-medium text-foreground">Noteer bijzonderheden</span>
                  <p className="text-sm text-foreground/70 mt-1">Vermeld tekorten, plussen of andere afwijkingen.</p>
                  <p className="text-xs text-red-600/80 mt-1 font-medium">Altijd melden bij verschillen!</p>
                </div>
              </li>

              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-white text-sm font-heading font-bold flex items-center justify-center">8</span>
                <div>
                  <span className="font-heading font-medium text-foreground">Verzend</span>
                  <p className="text-sm text-foreground/70 mt-1">Klik op "Verzenden" om de kassatelling te versturen.</p>
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
