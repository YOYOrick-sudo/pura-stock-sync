import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ClipboardList, Edit2, X, Check, Clock, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useUserLocation } from '@/contexts/UserLocationContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

export const HandoverCard = () => {
  const { userLocation } = useUserLocation();
  const [isEditing, setIsEditing] = useState(false);
  const [memoText, setMemoText] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' });
      setIsAdmin(data === true);
    };
    checkAdmin();
  }, []);

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

  const handleClear = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from('handover_memos').insert({ location: userLocation, message: '', created_by: user.id });
    if (error) { toast.error('Kon overdracht niet wissen'); return; }
    toast.success('Overdracht gewist');
    setIsEditing(false);
    setMemoText('');
    queryClient.invalidateQueries({ queryKey: ['handover-memo', userLocation] });
  };

  const cardClasses = "bg-card border border-border rounded-[20px] shadow-soft";

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
        {isAdmin && !isEditing && (
          <Button variant="outline" size="sm" onClick={handleEdit}>
            <Edit2 size={14} />
          </Button>
        )}
      </div>

      {isEditing ? (
        <>
          <Textarea
            value={memoText}
            onChange={(e) => setMemoText(e.target.value)}
            placeholder="Noteer hier belangrijke informatie voor de volgende shift:&#10;• Speciale afspraken of afhalingen&#10;• Bijzonderheden van vandaag&#10;• Aandachtspunten voor straks"
            rows={5}
            className="resize-none"
            style={{ whiteSpace: 'pre-wrap' }}
            autoFocus
          />
          <div className="flex gap-2 justify-between">
            <Button variant="ghost" size="sm" onClick={handleClear}>
              <Trash2 size={14} /> Wis overdracht
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCancel}>
                <X size={14} /> Annuleren
              </Button>
              <Button size="sm" onClick={handleSave}>
                <Check size={14} /> Opslaan
              </Button>
            </div>
          </div>
        </>
      ) : (
        <>
          <p className={`text-[15px] leading-relaxed whitespace-pre-wrap ${latestMemo?.message ? 'text-foreground' : 'text-muted-foreground italic'}`}>
            {latestMemo?.message || 'Geen overdracht voor vandaag'}
          </p>
          {latestMemo && latestMemo.message && (
            <div className="flex items-center gap-1.5">
              <Clock size={14} className="text-muted-foreground" />
              <p className="text-xs text-muted-foreground">
                Laatst bijgewerkt: {new Date(latestMemo.updated_at).toLocaleString('nl-NL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};
