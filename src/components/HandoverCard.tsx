import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { MessageSquare, Edit2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useUserLocation } from '@/contexts/UserLocationContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

export const HandoverCard = () => {
  const { userLocation } = useUserLocation();
  const [isEditing, setIsEditing] = useState(false);
  const [memoText, setMemoText] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const queryClient = useQueryClient();

  // Check if user is admin
  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase.rpc('has_role', {
        _user_id: user.id,
        _role: 'admin'
      });
      setIsAdmin(data === true);
    };
    checkAdmin();
  }, []);

  // Fetch latest memo
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

  // Realtime subscription
  useEffect(() => {
    if (!userLocation) return;

    const channel = supabase
      .channel('handover-memos-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'handover_memos',
          filter: `location=eq.${userLocation}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['handover-memo', userLocation] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userLocation, queryClient]);

  const handleEdit = () => {
    setMemoText(latestMemo?.message || '');
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!memoText.trim()) {
      toast.error('Vul een bericht in');
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('handover_memos')
      .insert({
        location: userLocation,
        message: memoText.trim(),
        created_by: user.id,
      });

    if (error) {
      toast.error('Kon memo niet opslaan');
      console.error(error);
      return;
    }

    toast.success('Bijzonderheden opgeslagen');
    setIsEditing(false);
    queryClient.invalidateQueries({ queryKey: ['handover-memo', userLocation] });
  };

  if (isLoading) {
    return (
      <div
        style={{
          backgroundColor: '#F6F7DD',
          borderRadius: '12px',
          padding: '20px 24px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)',
          minHeight: '100px',
        }}
      >
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-6 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        style={{
          backgroundColor: '#F6F7DD',
          borderRadius: '12px',
          padding: '20px 24px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          minHeight: '100px',
          gap: '16px',
        }}
      >
        <div style={{ flex: 1 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '8px',
            }}
          >
            <MessageSquare size={18} color="#1B7867" />
            <h3
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '14px',
                fontWeight: 600,
                color: '#282E3A',
              }}
            >
              Bijzonderheden Vandaag
            </h3>
          </div>

          <p
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '15px',
              fontWeight: 400,
              color: latestMemo ? '#282E3A' : '#73747B',
              fontStyle: latestMemo ? 'normal' : 'italic',
              lineHeight: 1.5,
            }}
          >
            {latestMemo?.message || 'Geen bijzonderheden vandaag'}
          </p>

          {latestMemo && (
            <p
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '12px',
                color: '#73747B',
                marginTop: '6px',
              }}
            >
              Laatst bijgewerkt: {new Date(latestMemo.updated_at).toLocaleString('nl-NL', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          )}
        </div>

        {isAdmin && (
          <Button variant="outline" size="sm" onClick={handleEdit}>
            <Edit2 size={14} />
          </Button>
        )}
      </div>

      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bijzonderheden bewerken</DialogTitle>
          </DialogHeader>
          <Textarea
            value={memoText}
            onChange={(e) => setMemoText(e.target.value)}
            placeholder="Bijv. Vandaag komt iemand een bon afhalen om 15:00 uur"
            rows={4}
            className="resize-none"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              Annuleren
            </Button>
            <Button onClick={handleSave}>Opslaan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
