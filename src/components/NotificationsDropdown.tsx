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
        <Button variant="ghost" size="icon" className="relative h-10 w-10">
          <Bell className="h-6 w-6" />
          {unreadCount > 0 && (
            <span className="absolute top-0.5 right-0.5 h-1.5 w-1.5 rounded-full bg-[#1B7867]" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end" sideOffset={8}>
        <div className="flex items-center justify-between px-3 py-2">
          <h3 className="text-sm font-medium text-foreground">
            Meldingen {unreadCount > 0 && `(${unreadCount})`}
          </h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs hover:bg-transparent hover:text-primary"
              onClick={() => markAllAsReadMutation.mutate()}
            >
              Alles gelezen
            </Button>
          )}
        </div>
        
        <ScrollArea className="max-h-[320px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <Bell className="h-8 w-8 text-muted-foreground/30 mb-2" />
              <p className="text-xs text-muted-foreground">Geen meldingen</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`w-full text-left px-3 py-2 transition-colors hover:bg-muted/30 ${
                    !notification.read ? 'bg-primary/[0.03]' : ''
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <h4 className={`text-sm ${!notification.read ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                      {notification.title}
                    </h4>
                    {!notification.read && (
                      <span className="h-1.5 w-1.5 rounded-full bg-[#1B7867] flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {notification.message}
                  </p>
                  <p className="text-xs text-muted-foreground/60 mt-0.5">
                    {formatDate(notification.created_at)}
                  </p>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
