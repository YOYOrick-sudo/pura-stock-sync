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

  const handleCancel = () => {
    setIsEditing(false);
    setMemoText('');
  };

  const handleSave = async () => {
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
      toast.error('Kon overdracht niet opslaan');
      console.error(error);
      return;
    }

    if (!memoText.trim()) {
      toast.success('Overdracht gewist');
    } else {
      toast.success('Overdracht opgeslagen');
    }
    
    setIsEditing(false);
    setMemoText('');
    queryClient.invalidateQueries({ queryKey: ['handover-memo', userLocation] });
  };

  const handleClear = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('handover_memos')
      .insert({
        location: userLocation,
        message: '',
        created_by: user.id,
      });

    if (error) {
      toast.error('Kon overdracht niet wissen');
      console.error(error);
      return;
    }

    toast.success('Overdracht gewist');
    setIsEditing(false);
    setMemoText('');
    queryClient.invalidateQueries({ queryKey: ['handover-memo', userLocation] });
  };

  if (isLoading) {
    return (
      <div
        className="rounded-polar-lg"
        style={{
          backgroundColor: '#FFF7ED',
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
    <div
      className="rounded-polar-lg"
      style={{
        backgroundColor: '#FFF7ED',
        padding: '20px 24px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        minHeight: '100px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <ClipboardList size={18} color="#E27726" />
            <h3
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '14px',
                fontWeight: 600,
                color: '#282E3A',
              }}
            >
              Overdracht - Bijzonderheden
            </h3>
          </div>
          <p
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '12px',
              color: '#73747B',
              paddingLeft: '26px',
            }}
          >
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
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between' }}>
            <Button variant="ghost" size="sm" onClick={handleClear}>
              <Trash2 size={14} />
              Wis overdracht
            </Button>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button variant="outline" size="sm" onClick={handleCancel}>
                <X size={14} />
                Annuleren
              </Button>
              <Button size="sm" onClick={handleSave}>
                <Check size={14} />
                Opslaan
              </Button>
            </div>
          </div>
        </>
      ) : (
        <>
          <p
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '15px',
              fontWeight: 400,
              color: latestMemo?.message ? '#282E3A' : '#73747B',
              fontStyle: latestMemo?.message ? 'normal' : 'italic',
              lineHeight: 1.5,
              whiteSpace: 'pre-wrap',
            }}
          >
            {latestMemo?.message || 'Geen overdracht voor vandaag'}
          </p>

          {latestMemo && latestMemo.message && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Clock size={14} color="#73747B" />
              <p
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '12px',
                  color: '#73747B',
                }}
              >
                Laatst bijgewerkt: {new Date(latestMemo.updated_at).toLocaleString('nl-NL', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};
