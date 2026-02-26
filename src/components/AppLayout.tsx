import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { NotificationBell } from "@/components/NotificationBell";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import {
  LayoutDashboard, Users, Megaphone, Search, Bot, MessageSquare, Star,
  FileText, Zap, Settings, BookOpen, Newspaper, Palette, Phone, BarChart3,
  UserPlus, Inbox
} from "lucide-react";
import logo from "@/assets/logo-transparent.png";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, keywords: "home overview" },
  { label: "Caregivers", href: "/caregivers", icon: Users, keywords: "pipeline leads funnel" },
  { label: "Campaigns", href: "/campaigns", icon: Megaphone, keywords: "ads marketing spend" },
  { label: "Campaign Builder", href: "/campaign-builder", icon: Megaphone, keywords: "create new campaign" },
  { label: "Talent Sourcing", href: "/talent-sourcing", icon: Search, keywords: "recruit find candidates" },
  { label: "Halevai AI", href: "/halevai", icon: Bot, keywords: "chat ai ask strategy" },
  { label: "Inbox", href: "/inbox", icon: Inbox, keywords: "messages replies conversations" },
  { label: "Reviews", href: "/reviews", icon: Star, keywords: "reputation ratings" },
  { label: "Competitors", href: "/competitors", icon: BarChart3, keywords: "market competition pay rates" },
  { label: "Content Calendar", href: "/content", icon: FileText, keywords: "social posts schedule" },
  { label: "Landing Pages", href: "/landing-pages", icon: Palette, keywords: "pages forms conversion" },
  { label: "Ad Creatives", href: "/creatives", icon: Palette, keywords: "images ads copy" },
  { label: "Enrollment", href: "/enrollment", icon: UserPlus, keywords: "intake onboard" },
  { label: "Automations", href: "/automations", icon: Zap, keywords: "workflows triggers cron" },
  { label: "Playbooks", href: "/playbooks", icon: BookOpen, keywords: "strategies growth" },
  { label: "Recommendations", href: "/recommendations", icon: Bot, keywords: "ai suggestions" },
  { label: "Briefing", href: "/briefing", icon: Newspaper, keywords: "daily report morning" },
  { label: "Settings", href: "/settings", icon: Settings, keywords: "profile branding team integrations" },
];

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [cmdOpen, setCmdOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCmdOpen(o => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleSelect = useCallback((href: string) => {
    setCmdOpen(false);
    navigate(href);
  }, [navigate]);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full relative">
        <div
          className="fixed inset-0 pointer-events-none select-none z-0"
          style={{ backgroundImage: `url(${logo})`, backgroundRepeat: 'repeat', backgroundSize: '120px', opacity: 0.035 }}
        />
        <AppSidebar />
        <main className="flex-1 flex flex-col relative z-10">
          <header className="h-14 flex items-center justify-between border-b border-border px-4">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCmdOpen(true)}
                className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground bg-secondary/50 border border-border rounded-md px-3 py-1.5 hover:bg-secondary transition-colors"
              >
                <Search className="h-3 w-3" />
                Search...
                <kbd className="ml-2 pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium">
                  ⌘K
                </kbd>
              </button>
              <NotificationBell />
            </div>
          </header>
          <div className="flex-1 p-6">
            {children}
          </div>
        </main>

        <CommandDialog open={cmdOpen} onOpenChange={setCmdOpen}>
          <CommandInput placeholder="Search pages, actions..." />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="Navigation">
              {NAV_ITEMS.map((item) => (
                <CommandItem key={item.href} onSelect={() => handleSelect(item.href)} keywords={[item.keywords]}>
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </CommandDialog>
      </div>
    </SidebarProvider>
  );
}
