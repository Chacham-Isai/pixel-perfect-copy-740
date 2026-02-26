import { useState, useRef, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Send, Bot, User, Plus } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const HalevaiChat = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hey! I'm your Halevai AI growth strategist. I have real-time access to your caregiver pipeline, campaigns, competitors, and enrollment data.\n\nHere's what I see right now:\n- **47 caregivers** in your pipeline (5 HOT in the last 24h)\n- **$18.50 CPA** on Oregon campaigns (below your $25 target 🎉)\n- **FreedomCare** just raised pay rates in Washington County\n- **3 enrollments** are stale (>14 days)\n\nWhat would you like to tackle? I can help with campaign strategy, competitive analysis, outreach scripts, or anything else.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    // Mock AI response for now - will be wired to edge function
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Great question! Based on your current data, here's my recommendation:\n\n**Strategy: Counter FreedomCare's Pay Raise**\n\n1. **Highlight your $22/hr rate** — still $4/hr above their new rate\n2. **Launch a poaching campaign** targeting Washington County with messaging: \"Earn $22/hr — the highest in Washington County\"\n3. **Create a comparison landing page** showing your benefits vs. competitors\n\n[ACTION:launch_campaign] Would you like me to set up this campaign? I can create the ad copy, landing page, and outreach sequence.",
        },
      ]);
      setIsLoading(false);
    }, 1500);
  };

  return (
    <AppLayout>
      <div className="flex flex-col h-[calc(100vh-8rem)]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Bot className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">Halevai AI</h1>
              <p className="text-xs text-muted-foreground">Your AI growth strategist • 16 live data sources</p>
            </div>
          </div>
          <Button variant="outline" size="sm"><Plus className="h-4 w-4 mr-1" /> New Chat</Button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 pb-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
              {msg.role === "assistant" && (
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
              )}
              <Card className={`max-w-[80%] p-4 ${
                msg.role === "user"
                  ? "bg-primary/10 border-primary/20"
                  : "bg-card halevai-border"
              }`}>
                <div className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                  {msg.content.split(/(\*\*.*?\*\*)/g).map((part, j) =>
                    part.startsWith("**") && part.endsWith("**")
                      ? <strong key={j} className="text-primary">{part.slice(2, -2)}</strong>
                      : part.startsWith("[ACTION:")
                        ? <span key={j} className="inline-flex items-center gap-1 bg-primary/20 text-primary text-xs px-2 py-0.5 rounded-full font-medium mt-1">{part}</span>
                        : part
                  )}
                </div>
              </Card>
              {msg.role === "user" && (
                <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                  <User className="h-4 w-4 text-foreground" />
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Bot className="h-4 w-4 text-primary animate-pulse" />
              </div>
              <Card className="bg-card halevai-border p-4">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </Card>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="flex gap-2 pt-2 border-t border-border">
          <Input
            placeholder="Ask about campaigns, pipeline, competitors, or strategy..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            className="bg-secondary border-border"
          />
          <Button onClick={handleSend} disabled={isLoading} className="bg-primary text-primary-foreground shrink-0">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </AppLayout>
  );
};

export default HalevaiChat;
