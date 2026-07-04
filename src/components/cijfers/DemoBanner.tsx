import { useState } from 'react';
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';

interface Props { canWipe: boolean }

export function DemoBanner({ canWipe }: Props) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const wipe = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('rpc_demo_data_wissen');
      if (error) throw error;
      return data as number;
    },
    onSuccess: (count) => {
      toast({ title: 'Demo-data gewist', description: `${count} rijen verwijderd.` });
      qc.invalidateQueries();
      setOpen(false);
    },
    onError: (e: Error) => toast({ title: 'Wissen mislukt', description: e.message, variant: 'destructive' }),
  });

  return (
    <div className="flex items-start gap-3 rounded-[20px] border border-amber-300/60 bg-amber-50 px-5 py-4 text-amber-900">
      <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" />
      <div className="flex-1 text-sm">
        <div className="font-semibold">Demo-gegevens</div>
        <div className="opacity-90">
          Deze cijfers zijn gegenereerd voor design en test. Ze worden vervangen zodra de Lightspeed-koppeling live is.
        </div>
      </div>
      {canWipe && (
        <AlertDialog open={open} onOpenChange={setOpen}>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm" className="border-amber-400 text-amber-900 hover:bg-amber-100">
              <Trash2 className="w-4 h-4 mr-2" /> Demo-data wissen
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Demo-data wissen?</AlertDialogTitle>
              <AlertDialogDescription>
                Alle demo-rijen in de cijfers-tabel worden definitief verwijderd. Dit kan niet ongedaan gemaakt worden. Echte kassadata blijft ongemoeid.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={wipe.isPending}>Annuleren</AlertDialogCancel>
              <AlertDialogAction
                disabled={wipe.isPending}
                onClick={(e) => { e.preventDefault(); wipe.mutate(); }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {wipe.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
                Ja, wissen
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
