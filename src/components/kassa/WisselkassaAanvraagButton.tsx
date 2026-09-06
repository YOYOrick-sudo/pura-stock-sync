import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Banknote } from 'lucide-react';
import { toast } from 'sonner';
import { useUserLocation } from '@/contexts/UserLocationContext';
import { devError } from '@/lib/devLog';

/**
 * Knop + popup om een nieuwe wisselkassa aan te vragen.
 * Stuurt een e-mail naar Helga en logt de aanvraag in wisselkassa_aanvragen.
 * Wordt gebruikt op het kassatelblad en in kas-controle.
 */
export function WisselkassaAanvraagButton() {
  const { userLocation } = useUserLocation();
  const [open, setOpen] = useState(false);
  const [vestiging, setVestiging] = useState<string>(userLocation || 'West');
  const [toelichting, setToelichting] = useState('');
  const [sending, setSending] = useState(false);

  const openDialog = () => {
    setVestiging(userLocation || 'West');
    setToelichting('');
    setOpen(true);
  };

  const verstuur = async () => {
    setSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      let naam = 'Onbekend';
      if (user) {
        const { data: profiel } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('user_id', user.id)
          .maybeSingle();
        naam = [profiel?.first_name, profiel?.last_name].filter(Boolean).join(' ') || user.email?.split('@')[0] || 'Onbekend';
      }

      const tijdstip = new Date().toLocaleString('nl-NL', {
        day: 'numeric', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });

      const { error: logError } = await supabase.from('wisselkassa_aanvragen').insert({
        vestiging,
        aangevraagd_door: user?.id ?? null,
        aangevraagd_door_naam: naam,
        toelichting: toelichting.trim() || null,
      });
      if (logError) devError(logError);

      const { error } = await supabase.functions.invoke('send-transactional-email', {
        body: {
          templateName: 'wisselkassa-aanvraag',
          idempotencyKey: `wisselkassa-${Date.now()}`,
          templateData: {
            vestiging,
            aanvrager: naam,
            tijdstip,
            toelichting: toelichting.trim() || undefined,
          },
        },
      });
      if (error) throw error;

      toast.success(`Aanvraag verstuurd — Helga krijgt een mail voor ${vestiging}.`);
      setOpen(false);
    } catch (e: any) {
      devError(e);
      toast.error('Versturen mislukt. Probeer het opnieuw.');
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        onClick={openDialog}
        style={{ minHeight: 44 }}
      >
        <Banknote className="h-4 w-4 mr-2" />
        Nieuwe wisselkassa
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent style={{ maxWidth: 650 }}>
          <DialogHeader>
            <DialogTitle>Nieuwe wisselkassa aanvragen</DialogTitle>
          </DialogHeader>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 8 }}>
            <p style={{ fontSize: 14, color: 'hsl(var(--muted-foreground))', margin: 0 }}>
              Er gaat direct een e-mail naar Helga met deze aanvraag.
            </p>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase' }}>Vestiging</label>
              <select
                value={vestiging}
                onChange={e => setVestiging(e.target.value)}
                style={{
                  width: '100%', marginTop: 4, padding: '10px 12px', minHeight: 44,
                  border: '1px solid hsl(var(--border))', borderRadius: 14,
                  background: 'hsl(var(--card))', color: 'hsl(var(--foreground))', fontSize: 14,
                }}
              >
                <option value="West">Daily</option>
                <option value="Midsland">Foodbar</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase' }}>Toelichting (optioneel)</label>
              <Textarea
                value={toelichting}
                onChange={e => setToelichting(e.target.value)}
                placeholder="Bijv. wisselgeld is bijna op"
                rows={2}
                style={{ marginTop: 4, borderRadius: 14 }}
              />
            </div>
            <Button
              onClick={verstuur}
              disabled={sending}
              style={{ minHeight: 44 }}
            >
              {sending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Aanvraag versturen
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
