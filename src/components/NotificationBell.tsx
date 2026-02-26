import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNavigate } from "react-router-dom";
import { Users, Megaphone, Star, AlertTriangle, Zap, Bot } from "lucide-react";

interface Notification {
  id: string;
  title: string;
  body: string | null;
  type: string | null;
  link: string | null;
  read: boolean | null;
  created_at: string | null;
}

const typeConfig: Record<string, { icon: typeof Bell; className: string }> = {
  caregiver: { icon: Users, className: "text-green-400" },
  campaign: { icon: Megaphone, className: "text-primary" },
  review: { icon: Star, className: "text-amber-400" },
  warning: { icon: AlertTriangle, className: "text-yellow-400" },
  automation: { icon: Zap, className: "text-violet-400" },
  agent: { icon: Bot, className: "text-primary" },
};

export function NotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    // Fetch initial notifications
    supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }) => {
        if (data) setNotifications(data as Notification[]);
      });

    // Subscribe to realtime
    const channel = supabase
      .channel("notifications-bell")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (payload) => {
          setNotifications((prev) => [payload.new as Notification, ...prev].slice(0, 30));
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = async () => {
    if (!user) return;
    await supabase.from("notifications").update({ read: true } as any).eq("user_id", user.id).eq("read", false);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleClick = (n: Notification) => {
    if (!n.read) {
      supabase.from("notifications").update({ read: true } as any).eq("id", n.id);
      setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
    }
    if (n.link) {
      setOpen(false);
      navigate(n.link);
    }
  };

  const formatTime = (ts: string | null) => {
    if (!ts) return "";
    const mins = Math.floor((Date.now() - new Date(ts).getTime()) / 60000);
    if (mins < 60) return `${mins}m ago`;
    if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
    return `${Math.floor(mins / 1440)}d ago`;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center px-1">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-3 border-b border-border">
          <span className="text-sm font-semibold text-foreground">Notifications</span>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="text-xs text-primary h-auto py-1" onClick={markAllRead}>
              Mark All Read
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-80">
          {notifications.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No notifications yet</p>
          ) : (
            notifications.map((n) => {
              const cfg = typeConfig[n.type || ""] || { icon: Bell, className: "text-muted-foreground" };
              const Icon = cfg.icon;
              return (
                <button
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={`w-full text-left flex items-start gap-3 p-3 hover:bg-secondary/50 transition-colors border-b border-border/50 ${!n.read ? "bg-primary/5" : ""}`}
                >
                  <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${cfg.className}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!n.read ? "font-medium text-foreground" : "text-muted-foreground"}`}>{n.title}</p>
                    {n.body && <p className="text-xs text-muted-foreground truncate">{n.body}</p>}
                    <p className="text-[10px] text-muted-foreground/60 mt-0.5">{formatTime(n.created_at)}</p>
                  </div>
                  {!n.read && <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />}
                </button>
              );
            })
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
