import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { NotificationBell } from "@/components/NotificationBell";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command";
import {
  LayoutDashboard, Users, Megaphone, Search, Bot, MessageSquare, Star,
  FileText, Zap, Settings, BookOpen, Newspaper, Palette, Phone, BarChart3,
  UserPlus, Inbox, User, Target
} from "lucide-react";
import logo from "@/assets/logo-transparent.png";
import { useCaregivers, useCampaigns } from "@/hooks/useAgencyData";

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

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/caregivers": "Caregivers",
  "/campaigns": "Campaigns",
  "/campaign-builder": "Campaign Builder",
  "/talent-sourcing": "Talent Sourcing",
  "/halevai": "Halevai AI",
  "/inbox": "Inbox",
  "/reviews": "Reviews",
  "/competitors": "Competitors",
  "/content": "Content Calendar",
  "/landing-pages": "Landing Pages",
  "/creatives": "Ad Creatives",
  "/enrollment": "Enrollment",
  "/automations": "Automations",
  "/playbooks": "Playbooks",
  "/recommendations": "Recommendations",
  "/briefing": "Briefing",
  "/settings": "Settings",
  "/onboarding": "Onboarding",
};

export function AppLayout({ children }: AppLayoutProps) {
  const [cmdOpen, setCmdOpen] = useState(false);
  const [cmdSearch, setCmdSearch] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const { data: caregivers } = useCaregivers();
  const { data: campaigns } = useCampaigns();

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

  // Centralized page title management
  useEffect(() => {
    const title = PAGE_TITLES[location.pathname];
    document.title = title ? `${title} | Halevai.ai` : "Halevai.ai";
  }, [location.pathname]);

  const handleSelect = useCallback((href: string) => {
    setCmdOpen(false);
    setCmdSearch("");
    navigate(href);
  }, [navigate]);

  // Filter entities based on search
  const searchLower = cmdSearch.toLowerCase();
  const matchedCaregivers = cmdSearch.length >= 2
    ? (caregivers || []).filter(c =>
        c.full_name.toLowerCase().includes(searchLower) ||
        (c.phone || "").includes(searchLower) ||
        (c.email || "").toLowerCase().includes(searchLower)
      ).slice(0, 5)
    : [];

  const matchedCampaigns = cmdSearch.length >= 2
    ? (campaigns || []).filter(c =>
        c.campaign_name.toLowerCase().includes(searchLower) ||
        (c.state || "").toLowerCase().includes(searchLower)
      ).slice(0, 5)
    : [];

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

        <CommandDialog open={cmdOpen} onOpenChange={(open) => { setCmdOpen(open); if (!open) setCmdSearch(""); }}>
          <CommandInput placeholder="Search pages, caregivers, campaigns..." value={cmdSearch} onValueChange={setCmdSearch} />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>

            {matchedCaregivers.length > 0 && (
              <>
                <CommandGroup heading="Caregivers">
                  {matchedCaregivers.map((c) => (
                    <CommandItem key={c.id} onSelect={() => handleSelect("/caregivers")} keywords={[c.full_name, c.phone || "", c.email || ""]}>
                      <User className="mr-2 h-4 w-4 text-primary" />
                      <span>{c.full_name}</span>
                      <span className="ml-auto text-xs text-muted-foreground">{c.status} · {c.lead_tier || "—"}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
                <CommandSeparator />
              </>
            )}

            {matchedCampaigns.length > 0 && (
              <>
                <CommandGroup heading="Campaigns">
                  {matchedCampaigns.map((c) => (
                    <CommandItem key={c.id} onSelect={() => handleSelect("/campaigns")} keywords={[c.campaign_name, c.state || ""]}>
                      <Target className="mr-2 h-4 w-4 text-primary" />
                      <span>{c.campaign_name}</span>
                      <span className="ml-auto text-xs text-muted-foreground">{c.status} · {c.state || "—"}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
                <CommandSeparator />
              </>
            )}

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
