import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

type Status = 'loading' | 'valid' | 'already' | 'invalid' | 'success' | 'error';

export default function Unsubscribe() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<Status>('loading');

  useEffect(() => {
    if (!token) { setStatus('invalid'); return; }

    const validate = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${token}`,
          { headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY } }
        );
        const data = await res.json();
        if (!res.ok) { setStatus('invalid'); return; }
        if (data.valid === false && data.reason === 'already_unsubscribed') { setStatus('already'); return; }
        setStatus('valid');
      } catch { setStatus('invalid'); }
    };
    validate();
  }, [token]);

  const handleUnsubscribe = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('handle-email-unsubscribe', {
        body: { token },
      });
      if (error) throw error;
      if (data?.reason === 'already_unsubscribed') { setStatus('already'); return; }
      setStatus('success');
    } catch { setStatus('error'); }
  };

  const messages: Record<Status, { title: string; body: string }> = {
    loading: { title: 'Even geduld...', body: 'We controleren je verzoek.' },
    valid: { title: 'Uitschrijven', body: 'Klik op de knop om je uit te schrijven voor e-mails.' },
    already: { title: 'Al uitgeschreven', body: 'Je bent al uitgeschreven voor onze e-mails.' },
    invalid: { title: 'Ongeldige link', body: 'Deze uitschrijflink is ongeldig of verlopen.' },
    success: { title: 'Uitgeschreven', body: 'Je ontvangt geen e-mails meer van ons.' },
    error: { title: 'Er ging iets mis', body: 'Probeer het later opnieuw.' },
  };

  const msg = messages[status];

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full text-center space-y-4">
        <h1 className="text-2xl font-bold text-foreground">{msg.title}</h1>
        <p className="text-muted-foreground">{msg.body}</p>
        {status === 'valid' && (
          <button
            onClick={handleUnsubscribe}
            className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
          >
            Bevestig uitschrijving
          </button>
        )}
      </div>
    </div>
  );
}
