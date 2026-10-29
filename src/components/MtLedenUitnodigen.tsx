import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2, Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type Lid = { email: string; naam: string | null; heeft_user: boolean; bevestigd: boolean };

function statusLabel(l: Lid) {
  if (l.bevestigd) return { tekst: 'heeft account', variant: 'default' as const };
  if (l.heeft_user) return { tekst: 'uitgenodigd', variant: 'secondary' as const };
  return { tekst: 'nog geen account', variant: 'outline' as const };
}

async function foutUitRespons(error: unknown): Promise<{ status?: number; code?: string }> {
  const ctx = (error as { context?: Response })?.context;
  if (ctx && typeof ctx.json === 'function') {
    const body = await ctx.json().catch(() => ({}));
    return { status: ctx.status, code: body?.error };
  }
  return {};
}

export function MtLedenUitnodigen() {
  const queryClient = useQueryClient();
  const [bevestig, setBevestig] = useState<Lid | null>(null);

  const { data: leden = [], isLoading, isError } = useQuery({
    queryKey: ['mt-leden-status'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('mt-invite', { body: { action: 'status' } });
      if (error) throw error;
      return (data?.leden ?? []) as Lid[];
    },
  });

  const uitnodigen = useMutation({
    mutationFn: async (email: string) => {
      const { error } = await supabase.functions.invoke('mt-invite', {
        body: { email },
      });
      if (error) throw error;
    },
    onSuccess: (_d, email) => {
      toast.success(`Uitnodiging verstuurd naar ${email}`);
      queryClient.invalidateQueries({ queryKey: ['mt-leden-status'] });
    },
    onError: async (error) => {
      const { status, code } = await foutUitRespons(error);
      if (status === 409) toast.error('Heeft al een account');
      else toast.error('Uitnodigen is niet gelukt', { description: code });
      queryClient.invalidateQueries({ queryKey: ['mt-leden-status'] });
    },
  });

  return (
    <Card className="p-4 md:p-6 space-y-3">
      <h2 className="text-base font-semibold">MT-leden uitnodigen</h2>
      {isLoading ? (
        <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : isError ? (
        <p className="text-sm text-muted-foreground">Status kon niet worden opgehaald.</p>
      ) : (
        <ul className="divide-y">
          {leden.map((l) => {
            const s = statusLabel(l);
            return (
              <li key={l.email} className="flex flex-wrap items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">{l.naam ?? l.email}</div>
                  <div className="text-xs text-muted-foreground truncate">{l.email}</div>
                </div>
                <Badge variant={s.variant}>{s.tekst}</Badge>
                <Button
                  variant="outline"
                  className="min-h-[44px]"
                  disabled={l.bevestigd || uitnodigen.isPending}
                  onClick={() => setBevestig(l)}
                >
                  {uitnodigen.isPending && uitnodigen.variables === l.email
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <Mail className="h-4 w-4" />}
                  Nodig uit
                </Button>
              </li>
            );
          })}
        </ul>
      )}

      <AlertDialog open={!!bevestig} onOpenChange={(o) => !o && setBevestig(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Uitnodiging versturen</AlertDialogTitle>
            <AlertDialogDescription>
              Er gaat een mail naar {bevestig?.email} met een link om een wachtwoord te kiezen. Versturen?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="min-h-[44px]">Annuleren</AlertDialogCancel>
            <AlertDialogAction
              className="min-h-[44px]"
              onClick={() => { if (bevestig) uitnodigen.mutate(bevestig.email); setBevestig(null); }}
            >
              Versturen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
