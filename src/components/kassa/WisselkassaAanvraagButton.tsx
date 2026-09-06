import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Banknote } from 'lucide-react';
import { toast } from 'sonner';
import { useUserLocation } from '@/contexts/UserLocationContext';
import { getLocationDisplayName } from '@/lib/utils';
import { devError } from '@/lib/devLog';

/**
 * Knop + popup om een nieuwe wisselkassa aan te vragen.
 * Stuurt een e-mail naar Helga en logt de aanvraag in wisselkassa_aanvragen.
 * Wordt gebruikt op het kassatelblad en in kas-controle.
 */
export function WisselkassaAanvraagButton() {
  const { userLocation } = useUserLocation();
  const displayLocation = getLocationDisplayName(userLocation);
  const [open, setOpen] = useState(false);
  const [naam, setNaam] = useState('');
  const [sending, setSending] = useState(false);

  const openDialog = () => {
    setNaam('');
    setOpen(true);
  };

  const verstuur = async () => {
    if (!userLocation) {
      toast.error('Geen vestiging bekend. Probeer opnieuw in te loggen.');
      return;
    }

    const trimmedNaam = naam.trim();
    if (trimmedNaam.length < 2) {
      toast.error('Vul je naam in zodat Helga weet wie de aanvraag doet.');
      return;
    }

    setSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      let aanvrager = trimmedNaam;
      if (!aanvrager && user) {
        const { data: profiel } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('user_id', user.id)
          .maybeSingle();
        aanvrager = [profiel?.first_name, profiel?.last_name].filter(Boolean).join(' ') || user.email?.split('@')[0] || 'Onbekend';
      }

      const tijdstip = new Date().toLocaleString('nl-NL', {
        day: 'numeric', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });

      const { error: logError } = await supabase.from('wisselkassa_aanvragen').insert({
        vestiging: userLocation,
        aangevraagd_door: user?.id ?? null,
        aangevraagd_door_naam: aanvrager,
      });
      if (logError) devError(logError);

      const { error } = await supabase.functions.invoke('send-transactional-email', {
        body: {
          templateName: 'wisselkassa-aanvraag',
          idempotencyKey: `wisselkassa-${Date.now()}`,
          templateData: {
            vestiging: displayLocation,
            aanvrager,
            tijdstip,
          },
        },
      });
      if (error) throw error;

      toast.success(`Aanvraag verstuurd — Helga krijgt een mail voor ${displayLocation}.`);
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
        <DialogContent style={{ maxWidth: 420 }}>
          <DialogHeader>
            <DialogTitle>Nieuwe wisselkassa aanvragen</DialogTitle>
          </DialogHeader>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 8 }}>
            <p style={{ fontSize: 14, color: 'hsl(var(--muted-foreground))', margin: 0 }}>
              Er gaat direct een e-mail naar Helga met deze aanvraag.
            </p>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase' }}>Vestiging</label>
              <div
                style={{
                  width: '100%', marginTop: 4, padding: '10px 12px', minHeight: 44,
                  border: '1px solid hsl(var(--border))', borderRadius: 14,
                  background: 'hsl(var(--muted))', color: 'hsl(var(--foreground))', fontSize: 14,
                  display: 'flex', alignItems: 'center',
                }}
              >
                {displayLocation || 'Onbekend'}
              </div>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase' }}>Jouw naam</label>
              <Input
                value={naam}
                onChange={e => setNaam(e.target.value)}
                placeholder="Bijv. Sanne"
                autoFocus
                style={{ marginTop: 4, borderRadius: 14, minHeight: 44 }}
              />
            </div>

            <Button
              onClick={verstuur}
              disabled={sending || naam.trim().length < 2}
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
