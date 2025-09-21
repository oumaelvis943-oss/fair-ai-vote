import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Bell, BellRing, Users, Vote, CheckCircle, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
  election_id?: string;
}

interface NotificationCenterProps {
  onClose: () => void;
}

export default function NotificationCenter({ onClose }: NotificationCenterProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;
      
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId ? { ...notif, read: true } : notif
        )
      );
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
      
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .in('id', unreadIds);

      if (error) throw error;
      
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, read: true }))
      );

      toast({
        title: "Success",
        description: "All notifications marked as read",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Real-time subscription for new notifications
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user?.id}`
        },
        (payload) => {
          setNotifications(prev => [payload.new as Notification, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'election_created':
        return Vote;
      case 'candidate_status':
        return Users;
      default:
        return Bell;
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <Card className="card-shadow max-w-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="flex items-center gap-2">
          <BellRing className="h-5 w-5 text-primary" />
          Notifications
          {unreadCount > 0 && (
            <Badge variant="destructive" className="ml-2">
              {unreadCount}
            </Badge>
          )}
        </CardTitle>
        <div className="flex gap-1">
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs"
            >
              <CheckCircle className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="max-h-96 overflow-y-auto space-y-3">
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-6">
            <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No notifications yet</p>
          </div>
        ) : (
          notifications.map((notification) => {
            const IconComponent = getNotificationIcon(notification.type);
            return (
              <div
                key={notification.id}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  notification.read ? 'bg-muted/30' : 'bg-primary/5 border-primary/20'
                }`}
                onClick={() => !notification.read && markAsRead(notification.id)}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    notification.read ? 'bg-muted' : 'bg-primary/10'
                  }`}>
                    <IconComponent className={`h-4 w-4 ${
                      notification.read ? 'text-muted-foreground' : 'text-primary'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className={`text-sm font-medium ${
                        notification.read ? 'text-muted-foreground' : 'text-foreground'
                      }`}>
                        {notification.title}
                      </h4>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(notification.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}