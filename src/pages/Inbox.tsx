import { useState, useEffect, useRef } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Inbox as InboxIcon, MessageSquare, Mail, Send, Search, User, Phone, AtSign, ExternalLink } from "lucide-react";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from "@/components/ui/breadcrumb";
import { useConversationThreads, useThreadMessages, useUnreadCount } from "@/hooks/useAgencyData";
import { useAuth } from "@/hooks/useAuth";

import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatTimeAgo, formatPhone } from "@/lib/formatters";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { Link } from "react-router-dom";

const Inbox = () => {
  
  const { agencyId } = useAuth();
  const { data: threads, isLoading, isError, refetch } = useConversationThreads();
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "sms" | "email" | "unread">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [composing, setComposing] = useState(false);
  const [composeChannel, setComposeChannel] = useState<"sms" | "email">("sms");
  const [composeBody, setComposeBody] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const selectedThread = threads?.find(t => t.id === selectedThreadId);
  const { data: messages, isLoading: loadingMessages, refetch: refetchMessages } = useThreadMessages(
    selectedThread?.contact_phone || null,
    selectedThread?.contact_email || null,
    selectedThread?.channel || "sms"
  );

  // Realtime subscription for new inbound messages
  useEffect(() => {
    if (!agencyId) return;
    const channel = supabase
      .channel("inbound-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "inbound_messages" }, () => {
        refetch();
        if (selectedThreadId) refetchMessages();
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "conversation_threads" }, () => {
        refetch();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [agencyId, selectedThreadId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Mark thread as read when selected
  useEffect(() => {
    if (selectedThread && selectedThread.unread_count > 0) {
      supabase.from("conversation_threads").update({ unread_count: 0 }).eq("id", selectedThread.id).then(() => refetch());
      // Mark inbound messages as read
      const contact = selectedThread.contact_phone || selectedThread.contact_email;
      if (contact) {
        supabase.from("inbound_messages")
          .update({ read: true })
          .eq("agency_id", agencyId!)
          .eq("from_contact", contact)
          .eq("read", false)
          .then(() => {});
      }
    }
  }, [selectedThreadId]);

  const filteredThreads = (threads || []).filter(t => {
    if (filter === "sms" && t.channel !== "sms") return false;
    if (filter === "email" && t.channel !== "email") return false;
    if (filter === "unread" && (t.unread_count || 0) === 0) return false;
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      return (t.contact_name || "").toLowerCase().includes(s) ||
        (t.contact_phone || "").includes(s) ||
        (t.contact_email || "").toLowerCase().includes(s);
    }
    return true;
  });

  const handleSend = async () => {
    if (!agencyId || !composeBody.trim() || !selectedThread) return;
    setSending(true);
    const to = composeChannel === "sms" ? selectedThread.contact_phone : selectedThread.contact_email;
    if (!to) {
      toast.error(`No ${composeChannel === "sms" ? "phone number" : "email"} for this contact`);
      setSending(false);
      return;
    }
    try {
      const { data, error } = await supabase.functions.invoke("send-message", {
        body: {
          agency_id: agencyId,
          channel: composeChannel,
          to,
          subject: composeChannel === "email" ? composeSubject || "Message" : undefined,
          body: composeBody,
        },
      });
      if (error) throw error;
      if (data?.success) {
        toast.success("Message sent");
        setComposeBody("");
        setComposeSubject("");
        refetchMessages();
        // Update thread
        await supabase.from("conversation_threads").update({
          last_message_at: new Date().toISOString(),
          last_message_preview: composeBody.slice(0, 100),
          updated_at: new Date().toISOString(),
        }).eq("id", selectedThread.id);
        refetch();
      } else {
        toast.error(data?.error || "Failed to send");
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to send");
    }
    setSending(false);
  };

  return (
    <AppLayout>
      <div className="space-y-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem><BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbPage>Inbox</BreadcrumbPage></BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex items-center gap-3">
          <InboxIcon className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Inbox</h1>
        </div>

        {isError ? (
          <ErrorState message="Unable to load conversations." onRetry={refetch} />
        ) : (
          <div className="flex flex-col md:flex-row gap-4 h-[calc(100vh-14rem)]">
            {/* Left panel: Thread list */}
            <div className="w-full md:w-[35%] flex flex-col border border-border rounded-lg bg-card overflow-hidden">
              <div className="p-3 border-b border-border space-y-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="Search contacts..."
                    className="pl-8 h-8 text-xs bg-secondary border-border"
                  />
                </div>
                <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
                  <TabsList className="h-7 bg-secondary/50 w-full">
                    <TabsTrigger value="all" className="text-xs h-5 flex-1">All</TabsTrigger>
                    <TabsTrigger value="sms" className="text-xs h-5 flex-1">SMS</TabsTrigger>
                    <TabsTrigger value="email" className="text-xs h-5 flex-1">Email</TabsTrigger>
                    <TabsTrigger value="unread" className="text-xs h-5 flex-1">Unread</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <ScrollArea className="flex-1">
                {isLoading ? (
                  <div className="p-3 space-y-2">
                    {Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-16" />)}
                  </div>
                ) : filteredThreads.length === 0 ? (
                  <div className="p-6 text-center">
                    <InboxIcon className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No conversations found</p>
                  </div>
                ) : (
                  filteredThreads.map(thread => (
                    <button
                      key={thread.id}
                      onClick={() => {
                        setSelectedThreadId(thread.id);
                        setComposeChannel(thread.channel as "sms" | "email");
                      }}
                      className={`w-full text-left p-3 border-b border-border/50 hover:bg-secondary/30 transition-colors ${
                        selectedThreadId === thread.id ? "bg-primary/10 border-l-2 border-l-primary" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          {thread.channel === "sms" ? (
                            <MessageSquare className="h-3.5 w-3.5 text-primary shrink-0" />
                          ) : (
                            <Mail className="h-3.5 w-3.5 text-accent shrink-0" />
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {thread.contact_name || thread.contact_phone || thread.contact_email || "Unknown Contact"}
                            </p>
                            {!thread.contact_name && (
                              <p className="text-xs text-amber-400">Unknown Contact</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {(thread.unread_count || 0) > 0 && (
                            <span className="h-2 w-2 rounded-full bg-primary" />
                          )}
                          <span className="text-[10px] text-muted-foreground">
                            {thread.last_message_at ? formatTimeAgo(thread.last_message_at) : ""}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 truncate pl-5">
                        {thread.last_message_preview || "No messages"}
                      </p>
                    </button>
                  ))
                )}
              </ScrollArea>
            </div>

            {/* Right panel: Conversation view */}
            <div className="flex-1 flex flex-col border border-border rounded-lg bg-card overflow-hidden">
              {!selectedThread ? (
                <div className="flex-1 flex items-center justify-center">
                  <EmptyState
                    icon={InboxIcon}
                    title="Select a conversation"
                    description="Choose a thread from the left to view messages."
                  />
                </div>
              ) : (
                <>
                  {/* Contact info header */}
                  <div className="p-3 border-b border-border flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {selectedThread.contact_name || "Unknown Contact"}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          {selectedThread.contact_phone && (
                            <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{formatPhone(selectedThread.contact_phone)}</span>
                          )}
                          {selectedThread.contact_email && (
                            <span className="flex items-center gap-1"><AtSign className="h-3 w-3" />{selectedThread.contact_email}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    {selectedThread.caregiver_id && (
                      <Link to="/caregivers">
                        <Button variant="outline" size="sm" className="text-xs">
                          <ExternalLink className="h-3 w-3 mr-1" /> View Profile
                        </Button>
                      </Link>
                    )}
                  </div>

                  {/* Messages area */}
                  <ScrollArea className="flex-1 p-4">
                    {loadingMessages ? (
                      <div className="space-y-3">
                        {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-12 w-3/4" style={{ marginLeft: i % 2 === 0 ? 0 : "auto" }} />)}
                      </div>
                    ) : (messages || []).length === 0 ? (
                      <div className="text-center text-muted-foreground text-sm py-8">No messages yet</div>
                    ) : (
                      <div className="space-y-3">
                        {(messages || []).map((msg: any) => (
                          <div key={msg.id} className={`flex ${msg.direction === "outbound" ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[70%] rounded-lg px-3 py-2 ${
                              msg.direction === "outbound"
                                ? "bg-primary/20 text-foreground"
                                : "bg-secondary text-foreground"
                            }`}>
                              {msg.subject && <p className="text-xs font-semibold mb-1">{msg.subject}</p>}
                              <p className="text-sm whitespace-pre-wrap">{msg.body}</p>
                              <div className="flex items-center gap-1 mt-1">
                                <span className="text-[10px] text-muted-foreground">
                                  {msg.created_at ? formatTimeAgo(msg.created_at) : ""}
                                </span>
                                {msg.direction === "outbound" && (
                                  <span className="text-[10px]">
                                    {msg.status === "sent" ? "✓" : msg.status === "failed" ? "✗" : "⏳"}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                        <div ref={messagesEndRef} />
                      </div>
                    )}
                  </ScrollArea>

                  {/* Compose bar */}
                  <div className="p-3 border-t border-border space-y-2">
                    <div className="flex items-center gap-2">
                      <Tabs value={composeChannel} onValueChange={v => setComposeChannel(v as "sms" | "email")}>
                        <TabsList className="h-7 bg-secondary/50">
                          <TabsTrigger value="sms" className="text-xs h-5" disabled={!selectedThread.contact_phone}>
                            <MessageSquare className="h-3 w-3 mr-1" />SMS
                          </TabsTrigger>
                          <TabsTrigger value="email" className="text-xs h-5" disabled={!selectedThread.contact_email}>
                            <Mail className="h-3 w-3 mr-1" />Email
                          </TabsTrigger>
                        </TabsList>
                      </Tabs>
                    </div>
                    {composeChannel === "email" && (
                      <Input
                        value={composeSubject}
                        onChange={e => setComposeSubject(e.target.value)}
                        placeholder="Subject..."
                        className="h-8 text-xs bg-secondary border-border"
                      />
                    )}
                    <div className="flex gap-2">
                      <Textarea
                        value={composeBody}
                        onChange={e => setComposeBody(e.target.value)}
                        placeholder="Type a message..."
                        className="min-h-[60px] text-sm bg-secondary border-border resize-none"
                        onKeyDown={e => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSend();
                          }
                        }}
                      />
                      <Button
                        onClick={handleSend}
                        disabled={sending || !composeBody.trim()}
                        className="bg-primary text-primary-foreground self-end"
                        size="sm"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Inbox;
