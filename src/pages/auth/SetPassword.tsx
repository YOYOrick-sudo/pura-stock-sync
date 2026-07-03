import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import logoOfficial from '@/assets/pura-vida-logo-official.png';

export default function SetPassword() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Supabase parses the URL hash (invite link) via detectSessionInUrl. Wait briefly.
    let cancelled = false;
    (async () => {
      // Give the client a tick to process the invite hash tokens.
      await new Promise(r => setTimeout(r, 400));
      const { data: { session } } = await supabase.auth.getSession();
      if (!cancelled) {
        setHasSession(!!session);
        setChecking(false);
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
    toast.success('Wachtwoord ingesteld');
    navigate('/dashboard');
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!hasSession) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md text-center space-y-3">
          <h1 className="text-xl font-semibold">Ongeldige of verlopen link</h1>
          <p className="text-muted-foreground text-sm">Vraag een nieuwe invite-mail aan.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-[420px] bg-card border border-border/60 rounded-[20px] p-8 shadow-sm">
        <img src={logoOfficial} alt="Pura Vida" className="h-14 w-auto mx-auto mb-6" />
        <h1 className="text-lg font-semibold text-center mb-1">Kies je wachtwoord</h1>
        <p className="text-sm text-muted-foreground text-center mb-6">Persoonlijk account</p>
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
