import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import logoOfficial from '@/assets/pura-vida-logo-official.png';

type LinkState = 'checking' | 'ready' | 'invalid' | 'saved';

export default function SetPassword() {
  const navigate = useNavigate();
  const [linkState, setLinkState] = useState<LinkState>('checking');
  const [errorMessage, setErrorMessage] = useState('Vraag een nieuwe invite- of wachtwoord-resetmail aan.');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const url = new URL(window.location.href);
        const hash = new URLSearchParams(url.hash.replace(/^#/, ''));
        const errorDescription = url.searchParams.get('error_description') || hash.get('error_description');

        if (errorDescription) {
          setErrorMessage(decodeURIComponent(errorDescription.replace(/\+/g, ' ')));
          if (!cancelled) setLinkState('invalid');
          return;
        }

        const code = url.searchParams.get('code');
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            setErrorMessage('Deze link is verlopen of al gebruikt. Vraag een nieuwe mail aan.');
            if (!cancelled) setLinkState('invalid');
            return;
          }
          window.history.replaceState({}, document.title, url.pathname);
        } else if (hash.get('access_token') && hash.get('refresh_token')) {
          const { error } = await supabase.auth.setSession({
            access_token: hash.get('access_token')!,
            refresh_token: hash.get('refresh_token')!,
          });
          if (error) {
            setErrorMessage('Deze link is verlopen of al gebruikt. Vraag een nieuwe mail aan.');
            if (!cancelled) setLinkState('invalid');
            return;
          }
          window.history.replaceState({}, document.title, url.pathname);
        } else {
          await new Promise((resolve) => setTimeout(resolve, 700));
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (!cancelled) setLinkState(session ? 'ready' : 'invalid');
      } catch {
        setErrorMessage('De link kon niet verwerkt worden. Vraag een nieuwe mail aan.');
        if (!cancelled) setLinkState('invalid');
      }
    })();

    return () => { cancelled = true; };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) { toast.error('Minimaal 8 tekens'); return; }
    if (password !== confirm) { toast.error('Wachtwoorden komen niet overeen'); return; }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (error) { toast.error('Instellen mislukt', { description: error.message }); return; }
    setLinkState('saved');
    toast.success('Wachtwoord ingesteld');
    setTimeout(() => navigate('/dashboard'), 1200);
  };

  if (linkState === 'checking') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <Loader2 className="w-7 h-7 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Link verwerken…</p>
        </div>
      </div>
    );
  }

  if (linkState === 'invalid') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-[420px] bg-card border border-border/60 rounded-[20px] p-8 shadow-sm text-center space-y-4">
          <img src={logoOfficial} alt="Pura Vida" className="h-14 w-auto mx-auto" />
          <AlertCircle className="w-8 h-8 text-destructive mx-auto" />
          <h1 className="text-xl font-semibold">Ongeldige of verlopen link</h1>
          <p className="text-muted-foreground text-sm">{errorMessage}</p>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="h-11 px-5 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90"
          >
            Naar persoonlijk inloggen
          </button>
        </div>
      </div>
    );
  }

  if (linkState === 'saved') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-[420px] bg-card border border-border/60 rounded-[20px] p-8 shadow-sm text-center space-y-4">
          <img src={logoOfficial} alt="Pura Vida" className="h-14 w-auto mx-auto" />
          <CheckCircle2 className="w-9 h-9 text-primary mx-auto" />
          <h1 className="text-xl font-semibold">Wachtwoord ingesteld</h1>
          <p className="text-muted-foreground text-sm">Je wordt doorgestuurd naar de app.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-[420px] bg-card border border-border/60 rounded-[20px] p-8 shadow-sm">
        <img src={logoOfficial} alt="Pura Vida" className="h-14 w-auto mx-auto mb-6" />
        <h1 className="text-lg font-semibold text-center mb-1">Kies je nieuwe wachtwoord</h1>
        <p className="text-sm text-muted-foreground text-center mb-6">Voor je persoonlijke Pura Vida account</p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Nieuw wachtwoord (min. 8 tekens)"
            autoFocus
            autoComplete="new-password"
            className="h-12 px-4 rounded-xl border border-border/60 bg-background outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
          />
          <input
            type="password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            placeholder="Herhaal wachtwoord"
            autoComplete="new-password"
            className="h-12 px-4 rounded-xl border border-border/60 bg-background outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
          />
          <button
            type="submit"
            disabled={saving}
            className="h-12 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 disabled:opacity-50"
          >
            {saving ? 'Bezig…' : 'Wachtwoord opslaan'}
          </button>
        </form>
      </div>
    </div>
  );
}
