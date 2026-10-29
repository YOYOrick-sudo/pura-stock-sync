import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Send, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { SidebarLayout } from '@/components/SidebarLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

const MAX_LENGTE = 2000;

export default function MtPunt() {
  const [punt, setPunt] = useState('');
  const queryClient = useQueryClient();

  const { data: punten = [], isLoading } = useQuery({
    queryKey: ['mt-punten-eigen'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mt_punten')
        .select('id, punt, ingediend_op')
        .order('ingediend_op', { ascending: false })
        .limit(20);
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
      toast.success('Verstuurd, het komt op de MT-agenda');
    },
    onError: () => {
      toast.error('Versturen is niet gelukt. Probeer het opnieuw.');
    },
  });

  const kanVersturen = punt.trim().length >= 1 && punt.trim().length <= MAX_LENGTE && !verstuur.isPending;

  return (
    <SidebarLayout>
      <div className="page-stack max-w-2xl">
        <h1 className="text-2xl font-semibold">MT-punt aanleveren</h1>

          <Card className="p-4 md:p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="mt-punt-tekst">Punt</Label>
              <Textarea
                id="mt-punt-tekst"
                value={punt}
                onChange={(e) => setPunt(e.target.value)}
                maxLength={MAX_LENGTE}
                rows={6}
                placeholder="Waar moet het MT over praten?"
                className="min-h-[140px]"
              />
            </div>
            <Button
              onClick={() => verstuur.mutate(punt.trim())}
              disabled={!kanVersturen}
              className="min-h-[44px] w-full sm:w-auto"
            >
              {verstuur.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Verstuur
            </Button>
          </Card>

          <section className="space-y-3">
            <h2 className="text-sm font-medium text-muted-foreground">Mijn ingestuurde punten</h2>
            {isLoading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : punten.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nog geen punten ingestuurd.</p>
            ) : (
              <ul className="space-y-2">
                {punten.map((p) => (
                  <li key={p.id} className="rounded-polar-lg border bg-card p-3">
                    <div className="text-xs text-muted-foreground">
                      {new Date(p.ingediend_op).toLocaleDateString('nl-NL', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{p.punt}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </SidebarLayout>
  );
}
