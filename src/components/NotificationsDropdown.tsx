import { Bell } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  link: string | null;
  created_at: string;
}

export function NotificationsDropdown() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: notifications = [], refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Notification[];
    },
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
        },
        () => {
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('read', false);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Alle meldingen gemarkeerd als gelezen');
    },
  });

  const handleNotificationClick = (notification: Notification) => {
    markAsReadMutation.mutate(notification.id);
    
    if (notification.link) {
      navigate(notification.link);
      setOpen(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Zojuist';
    if (diffMins < 60) return `${diffMins} min geleden`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} uur geleden`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} dag${diffDays > 1 ? 'en' : ''} geleden`;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative h-10 w-10"
          style={{
            borderRadius: '8px',
            transition: 'background-color 200ms',
            border: 'none',
          }}
        >
          <Bell className="h-6 w-6" style={{ color: '#636878' }} />
          {unreadCount > 0 && (
            <span 
              className="absolute top-0.5 right-0.5 rounded-full" 
              style={{
                width: '6px',
                height: '6px',
                backgroundColor: '#E27726',
              }}
            />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 p-0" 
        align="end" 
        sideOffset={8}
        style={{
          borderRadius: '16px',
          border: '1px solid #EAECF0',
          boxShadow: '0 2px 4px 0 rgb(0 0 0 / 0.05)',
        }}
      >
        <div 
          className="flex items-center justify-between px-3 py-2"
          style={{ borderBottom: '1px solid #EAECF0' }}
        >
          <h3 
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '15px',
              fontWeight: 600,
              color: '#282E3A',
            }}
          >
            Meldingen
          </h3>
          {unreadCount > 0 && (
            <button
              onClick={() => markAllAsReadMutation.mutate()}
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '13px',
                color: '#E27726',
                fontWeight: 500,
                transition: 'opacity 150ms',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '0.7';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '1';
              }}
            >
              Alles als gelezen markeren
            </button>
          )}
        </div>
        
        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div 
              className="p-4 text-center"
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '14px',
                color: '#636878',
              }}
            >
              Geen meldingen
            </div>
          ) : (
            <div>
              {notifications.map((notification, index) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className="cursor-pointer"
                  style={{
                    padding: '12px 16px',
                    backgroundColor: !notification.read ? '#F1F3F5' : '#FFFFFF',
                    borderBottom: index < notifications.length - 1 ? '1px solid #EAECF0' : 'none',
                    transition: 'background-color 150ms',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(226, 119, 38, 0.04)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = !notification.read ? '#F1F3F5' : '#FFFFFF';
                  }}
                >
                  <div className="flex justify-between items-start mb-1">
                    <h4 
                      style={{
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '15px',
                        fontWeight: 500,
                        color: '#282E3A',
                      }}
                    >
                      {notification.title}
                    </h4>
                    <span 
                      style={{
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '13px',
                        color: '#636878',
                      }}
                    >
                      {formatDate(notification.created_at)}
                    </span>
                  </div>
                  <p 
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '14px',
                      color: '#636878',
                    }}
                  >
                    {notification.message}
                  </p>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
