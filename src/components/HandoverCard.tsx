import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ClipboardList, Edit2, X, Check, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useUserLocation } from '@/contexts/UserLocationContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

export const HandoverCard = () => {
  const { userLocation } = useUserLocation();
  const [isEditing, setIsEditing] = useState(false);
  const [memoText, setMemoText] = useState('');
  const queryClient = useQueryClient();

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

  const handleEdit = () => { setMemoText(latestMemo?.message || ''); setIsEditing(true); };
  const handleCancel = () => { setIsEditing(false); setMemoText(''); };

  const handleSave = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from('handover_memos').insert({ location: userLocation, message: memoText.trim(), created_by: user.id });
    if (error) { toast.error('Kon overdracht niet opslaan'); return; }
    toast.success(memoText.trim() ? 'Overdracht opgeslagen' : 'Overdracht gewist');
    setIsEditing(false);
    setMemoText('');
    queryClient.invalidateQueries({ queryKey: ['handover-memo', userLocation] });
  };

  // Sync memoText met server-versie zolang we niet aan het editen zijn
  useEffect(() => {
    if (!isEditing) setMemoText(latestMemo?.message || '');
  }, [latestMemo?.message, isEditing]);

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

  const dirty = isEditing && memoText.trim() !== (latestMemo?.message || '').trim();

  const handleSaveInline = async () => {
    if (!dirty) { setIsEditing(false); return; }
    await handleSave();
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

      <Textarea
        value={memoText}
        onChange={(e) => { setMemoText(e.target.value); if (!isEditing) setIsEditing(true); }}
        onFocus={() => setIsEditing(true)}
        onBlur={handleSaveInline}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); (e.target as HTMLTextAreaElement).blur(); }
          if (e.key === 'Escape') { setMemoText(latestMemo?.message || ''); setIsEditing(false); (e.target as HTMLTextAreaElement).blur(); }
        }}
        placeholder="Noteer hier belangrijke informatie voor de volgende shift:&#10;• Speciale afspraken of afhalingen&#10;• Bijzonderheden van vandaag&#10;• Aandachtspunten voor straks"
        rows={4}
        className="resize-none"
        style={{ whiteSpace: 'pre-wrap' }}
      />

      <div className="flex items-center justify-between min-h-[20px]">
        {latestMemo?.message && !isEditing ? (
          <div className="flex items-center gap-1.5">
            <Clock size={14} className="text-muted-foreground" />
            <p className="text-xs text-muted-foreground">
              Laatst bijgewerkt: {new Date(latestMemo.updated_at).toLocaleString('nl-NL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        ) : <span />}
        {isEditing && (
          <div className="flex gap-2 ml-auto">
            <Button variant="ghost" size="sm" onClick={() => { setMemoText(latestMemo?.message || ''); setIsEditing(false); }}>
              <X size={14} /> Annuleren
            </Button>
            <Button size="sm" onClick={handleSave} disabled={!dirty}>
              <Check size={14} /> Opslaan
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
