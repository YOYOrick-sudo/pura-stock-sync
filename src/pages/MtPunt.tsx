import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Send, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStatus } from '@/contexts/AuthContext';
import { SidebarLayout } from '@/components/SidebarLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { formatNlDatumTijd, mtStatusLabel } from '@/lib/mt';
import { useIsMobile } from '@/hooks/use-mobile';
import { KaartKop, LijstKaart, StatusLabel } from '@/components/pura';

const MAX_LENGTE = 2000;

export default function MtPunt() {
  const isMobile = useIsMobile();
  const [punt, setPunt] = useState('');
  const queryClient = useQueryClient();
  const { session } = useAuthStatus();
  const userId = session?.user?.id ?? null;

  const { data: punten = [], isLoading } = useQuery({
    queryKey: ['mt-punten-eigen', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mt_punten')
        .select('id, punt, ingediend_op, status')
        .eq('ingediend_door', userId!)
        .order('ingediend_op', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const verstuur = useMutation({
    mutationFn: async (tekst: string) => {
      const { error } = await supabase.from('mt_punten').insert({ punt: tekst });
      if (error) throw error;
    },
    onSuccess: () => {
      setPunt('');
      queryClient.invalidateQueries({ queryKey: ['mt-punten-eigen'] });
      toast.success('Punt ontvangen');
    },
    onError: () => {
      toast.error('Versturen is niet gelukt. Probeer het opnieuw.');
    },
  });

  const lengte = punt.trim().length;
  const kanVersturen = lengte >= 1 && lengte <= MAX_LENGTE && !verstuur.isPending;

  return (
    <SidebarLayout>
      <div className={isMobile ? 'min-w-0 space-y-4' : 'space-y-4'}>

        <Card className="p-4 md:p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="mt-punt-tekst">Punt</Label>
            <Textarea
              id="mt-punt-tekst"
              value={punt}
              onChange={(e) => setPunt(e.target.value)}
              maxLength={MAX_LENGTE}
              required
              rows={6}
              placeholder="Waar moet het MT over praten?"
              className={isMobile ? 'min-h-[140px] text-base' : 'min-h-[140px]'}
            />
          </div>
          <Button
            onClick={() => verstuur.mutate(punt.trim())}
            disabled={!kanVersturen}
            className={isMobile ? 'min-h-[44px] w-full' : 'min-h-[44px] w-full sm:w-auto'}
          >
            {verstuur.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Verstuur
          </Button>
        </Card>

        {isMobile ? (
          <LijstKaart kop={<KaartKop titel="Mijn punten" />}>
            {isLoading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : punten.length === 0 ? (
              <p className="px-4 py-4 text-sm text-muted-foreground">Je hebt nog geen punten ingediend.</p>
            ) : (
              <ul className="divide-y divide-border">
                {punten.map((p) => (
                  <li key={p.id} className="min-h-12 min-w-0 px-4 py-3">
                    <div className="flex min-w-0 items-start justify-between gap-2">
                      <p className="min-w-0 flex-1 whitespace-pre-wrap break-words text-sm [overflow-wrap:anywhere]">{p.punt}</p>
                      {p.status && <StatusLabel>{mtStatusLabel(p.status)}</StatusLabel>}
                    </div>
                    <span className="mt-1 block text-xs text-muted-foreground">{formatNlDatumTijd(p.ingediend_op)}</span>
                  </li>
                ))}
              </ul>
            )}
          </LijstKaart>
        ) : (
        <section className="space-y-3">
          <h2 className="text-base font-semibold">Mijn punten</h2>
          {isLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : punten.length === 0 ? (
            <p className="text-sm text-muted-foreground">Je hebt nog geen punten ingediend.</p>
          ) : (
            <ul className="space-y-2">
              {punten.map((p) => (
                <li key={p.id} className="rounded-polar-lg border bg-card p-3 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-muted-foreground">{formatNlDatumTijd(p.ingediend_op)}</span>
                    {p.status && <Badge variant="secondary">{mtStatusLabel(p.status)}</Badge>}
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{p.punt}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
        )}
      </div>
    </SidebarLayout>
  );
}
