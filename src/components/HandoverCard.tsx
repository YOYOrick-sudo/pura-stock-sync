import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ClipboardList, Clock, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useUserLocation } from '@/contexts/UserLocationContext';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

type SaveState = 'idle' | 'saving' | 'saved';

export const HandoverCard = () => {
  const { userLocation } = useUserLocation();
  const draftKey = `handover-draft-${userLocation || 'unknown'}`;
  const [isFocused, setIsFocused] = useState(false);
  const [memoText, setMemoText] = useState('');
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const queryClient = useQueryClient();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const savedTextRef = useRef<string>('');
  const memoTextRef = useRef<string>('');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const getDraft = () => {
    try { return localStorage.getItem(draftKey); } catch { return null; }
  };
  const setDraft = (value: string | null) => {
    try {
      if (value === null) localStorage.removeItem(draftKey);
      else localStorage.setItem(draftKey, value);
    } catch { /* localStorage niet beschikbaar: geen concept */ }
  };

  const { data: latestMemo, isLoading } = useQuery({
    queryKey: ['handover-memo', userLocation],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('handover_memos')
        .select('*')
        .eq('location', userLocation)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!userLocation,
  });

  useEffect(() => { memoTextRef.current = memoText; }, [memoText]);
  useEffect(() => { savedTextRef.current = (latestMemo?.message || '').trim(); }, [latestMemo?.message]);

  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [memoText, latestMemo?.message]);

  useEffect(() => {
    if (!userLocation) return;
    const channel = supabase
      .channel('handover-memos-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'handover_memos', filter: `location=eq.${userLocation}` }, () => {
        queryClient.invalidateQueries({ queryKey: ['handover-memo', userLocation] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userLocation, queryClient]);

  // Kernopslag: alleen schrijven als de tekst echt afwijkt van de laatst bewaarde versie
  const saveNow = useCallback(async (value?: string) => {
    if (!userLocation) return;
    const text = (value ?? memoTextRef.current).trim();
    if (text === savedTextRef.current) return;
    setSaveState('saving');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaveState('idle'); return; }
    const { error } = await supabase
      .from('handover_memos')
      .insert({ location: userLocation, message: text, created_by: user.id });
    if (error) {
      setSaveState('idle');
      toast.error('Kon overdracht niet opslaan');
      return;
    }
    savedTextRef.current = text;
    setDraft(null);
    setSaveState('saved');
    queryClient.invalidateQueries({ queryKey: ['handover-memo', userLocation] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLocation, queryClient, draftKey]);

  // Automatisch opslaan na een korte pauze in het typen
  useEffect(() => {
    if (!isFocused || !userLocation) return;
    if (memoText.trim() === savedTextRef.current) return;
    setSaveState('idle');
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => { void saveNow(); }, 1500);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [memoText, isFocused, userLocation, saveNow]);

  // Opslaan bij wegklikken / app naar achtergrond
  useEffect(() => {
    const flush = () => { void saveNow(); };
    document.addEventListener('visibilitychange', flush);
    window.addEventListener('pagehide', flush);
    return () => {
      document.removeEventListener('visibilitychange', flush);
      window.removeEventListener('pagehide', flush);
    };
  }, [saveNow]);

  // Concept bewaren bij elke toetsaanslag zolang het afwijkt van de server-versie
  useEffect(() => {
    if (!isFocused || !userLocation) return;
    if (memoText.trim() !== savedTextRef.current) setDraft(memoText);
    else setDraft(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memoText, isFocused, userLocation]);

  // Herstel een niet-opgeslagen concept zodra de server-versie bekend is
  const draftCheckedRef = useRef<string | null>(null);
  useEffect(() => {
    if (isLoading || !userLocation) return;
    if (draftCheckedRef.current === userLocation) return;
    draftCheckedRef.current = userLocation;
    const draft = getDraft();
    if (draft !== null && draft.trim() !== (latestMemo?.message || '').trim()) {
      setMemoText(draft);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, userLocation, latestMemo?.message]);

  // Serverversie overnemen zolang hier niemand aan het typen is
  useEffect(() => {
    if (!isFocused) setMemoText(latestMemo?.message || '');
  }, [latestMemo?.message, isFocused]);

  const cardClasses = "bg-card border border-border/60 rounded-[20px] shadow-[var(--shadow-card)]";

  if (isLoading) {
    return (
      <div className={`${cardClasses} p-5 min-h-[100px]`}>
        <div className="animate-pulse">
          <div className="h-4 bg-muted rounded w-1/4 mb-2"></div>
          <div className="h-6 bg-muted rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  const handleWissen = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setMemoText('');
    setDraft(null);
    void saveNow('');
    textareaRef.current?.focus();
  };

  return (
    <div className={`${cardClasses} p-5 flex flex-col gap-3 min-h-[100px]`}>
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <ClipboardList size={18} className="text-primary" />
            <h3 className="text-sm font-semibold text-foreground">
              Overdracht - Bijzonderheden
            </h3>
          </div>
          <p className="text-xs text-muted-foreground pl-[26px]">
            Voor de volgende dienst
          </p>
        </div>
      </div>

      <div className="relative">
        <Textarea
          ref={textareaRef}
          value={memoText}
          onChange={(e) => setMemoText(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            if (timerRef.current) clearTimeout(timerRef.current);
            void saveNow();
            setIsFocused(false);
          }}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
              e.preventDefault();
              (e.target as HTMLTextAreaElement).blur();
            }
          }}
          placeholder="Noteer hier belangrijke informatie voor de volgende shift:&#10;• Speciale afspraken of afhalingen&#10;• Bijzonderheden van vandaag&#10;• Aandachtspunten voor straks"
          rows={3}
          className="resize-none overflow-hidden pr-12"
          style={{ whiteSpace: 'pre-wrap' }}
        />
        {isFocused && memoText.trim().length > 0 && (
          <button
            type="button"
            aria-label="Overdracht wissen"
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleWissen}
            className="absolute top-1 right-1 h-11 w-11 flex items-center justify-center rounded-[14px] text-muted-foreground/70 hover:text-foreground hover:bg-muted transition-colors"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>

      <div className="flex items-center justify-between min-h-[20px]">
        {latestMemo?.message ? (
          <div className="flex items-center gap-1.5">
            <Clock size={14} className="text-muted-foreground" />
            <p className="text-xs text-muted-foreground">
              Laatst bijgewerkt: {new Date(latestMemo.updated_at).toLocaleString('nl-NL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        ) : <span />}
        {saveState !== 'idle' && (
          <p className="text-xs text-muted-foreground ml-auto">
            {saveState === 'saving' ? 'Opslaan…' : 'Opgeslagen'}
          </p>
        )}
      </div>
    </div>
  );
};
