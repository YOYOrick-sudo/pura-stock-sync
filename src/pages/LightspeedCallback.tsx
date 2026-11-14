import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

type State = { phase: 'busy' } | { phase: 'ok'; vestiging: string } | { phase: 'error'; message: string };

const TAZZA_CALLBACK_URL = 'https://nqhzgefqrohpirjabewu.supabase.co/functions/v1/lightspeed-koppeling';

function stuurDoorNaarTazza(params: URLSearchParams) {
  const url = new URL(TAZZA_CALLBACK_URL);
  for (const naam of ['code', 'state', 'error', 'error_description']) {
    for (const waarde of params.getAll(naam)) {
      url.searchParams.append(naam, waarde);
    }
  }
  window.location.replace(url.toString());
}

function isInvalidState(data: unknown): boolean {
  return typeof data === 'object' && data !== null &&
    'error' in data && data.error === 'invalid_state';
}

export default function LightspeedCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [state, setState] = useState<State>({ phase: 'busy' });

  useEffect(() => {
    const code = params.get('code');
    const stateParam = params.get('state');
    if (stateParam?.startsWith('tazza-')) {
      stuurDoorNaarTazza(params);
      return;
    }
    const err = params.get('error');
    if (err) {
      setState({ phase: 'error', message: `Lightspeed weigerde: ${err} ${params.get('error_description') ?? ''}` });
      return;
    }
    if (!code || !stateParam) {
      setState({ phase: 'error', message: 'Ontbrekende code of state in URL.' });
      return;
    }
    (async () => {
      const { data, error } = await supabase.functions.invoke('lightspeed-oauth', {
        body: { action: 'callback', code, state: stateParam },
      });
      if (error) {
        if (error.context instanceof Response) {
          let antwoord: unknown;
          try {
            antwoord = await error.context.clone().json();
          } catch {
            // Geen leesbaar serverantwoord: behoud de bestaande foutafhandeling.
          }
          if (isInvalidState(antwoord)) {
            stuurDoorNaarTazza(params);
            return;
          }
        }
        setState({ phase: 'error', message: error.message });
        return;
      }
      if (isInvalidState(data)) {
        stuurDoorNaarTazza(params);
        return;
      }
      if (data?.ok) {
        setState({ phase: 'ok', vestiging: data.vestiging });
      } else {
        setState({ phase: 'error', message: JSON.stringify(data) });
      }
    })();
  }, [params]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--app-canvas))' }}>
      <div className="bg-card border border-border rounded-[20px] shadow-card p-8 max-w-md w-full text-center">
        {state.phase === 'busy' && (
          <>
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">Bezig met koppelen…</p>
          </>
        )}
        {state.phase === 'ok' && (
          <>
            <CheckCircle2 className="w-10 h-10 text-success mx-auto mb-3" />
            <h1 className="text-lg font-semibold mb-1">{state.vestiging} gekoppeld</h1>
            <p className="text-sm text-muted-foreground mb-4">De koppeling met Lightspeed is actief.</p>
            <Button onClick={() => navigate('/cijfers')} className="w-full">Terug naar Cijfers</Button>
          </>
        )}
        {state.phase === 'error' && (
          <>
            <AlertCircle className="w-10 h-10 text-destructive mx-auto mb-3" />
            <h1 className="text-lg font-semibold mb-1">Koppelen mislukt</h1>
            <p className="text-xs text-muted-foreground mb-4 break-words">{state.message}</p>
            <Button onClick={() => navigate('/cijfers')} variant="outline" className="w-full">Terug naar Cijfers</Button>
          </>
        )}
      </div>
    </div>
  );
}
