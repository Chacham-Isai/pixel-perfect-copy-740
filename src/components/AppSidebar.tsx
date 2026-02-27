import {
  LayoutDashboard, Bot, Lightbulb, BookOpen, Newspaper,
  Users, ClipboardList, Megaphone, PenTool, Globe, CalendarDays, Image,
  Search, Shield, Star, Inbox,
  Zap, Settings, LogOut
} from "lucide-react";
import { useEffect } from "react";
import { useUnreadCount } from "@/hooks/useAgencyData";
import { useAuth } from "@/hooks/useAuth";
import { hasPermission } from "@/lib/permissions";
import { NavLink } from "@/components/NavLink";
import { Link, useLocation } from "react-router-dom";
import logo from "@/assets/care-at-home-logo.png";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";

const navSections = [
  {
    label: "CORE",
    items: [
      { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
      { title: "Inbox", url: "/inbox", icon: Inbox },
      { title: "Halevai AI", url: "/halevai", icon: Bot },
      { title: "Recommendations", url: "/recommendations", icon: Lightbulb },
      { title: "Playbooks", url: "/playbooks", icon: BookOpen },
      { title: "Daily Briefing", url: "/briefing", icon: Newspaper },
    ],
  },
  {
    label: "PIPELINE",
    items: [
      { title: "Caregivers", url: "/caregivers", icon: Users },
      { title: "Enrollment Tracker", url: "/enrollment", icon: ClipboardList },
      { title: "Campaigns", url: "/campaigns", icon: Megaphone },
      { title: "Campaign Builder", url: "/campaign-builder", icon: PenTool },
      { title: "Landing Pages", url: "/landing-pages", icon: Globe },
      { title: "Content Calendar", url: "/content", icon: CalendarDays },
      { title: "Ad Creatives", url: "/creatives", icon: Image },
    ],
  },
  {
    label: "RECRUITMENT AGENTS",
    items: [
      { title: "Talent Sourcing", url: "/talent-sourcing", icon: Search },
    ],
  },
  {
    label: "INTEL",
    items: [
      { title: "Competitors", url: "/competitors", icon: Shield },
      { title: "Reviews", url: "/reviews", icon: Star },
    ],
  },
  {
    label: "SYSTEM",
    items: [
      { title: "Automations", url: "/automations", icon: Zap },
      { title: "Settings", url: "/settings", icon: Settings },
    ],
  },
];

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
  "/briefing": "Daily Briefing",
  "/settings": "Settings",
  "/onboarding": "Onboarding",
};

export function AppSidebar() {
  const { signOut, agencyRole } = useAuth();
  const { data: unreadCount } = useUnreadCount();
  const canManageSettings = hasPermission(agencyRole, "manage_api_keys");
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname.replace(/\/+$/, "") || "/";
    const title = PAGE_TITLES[path];
    const id = window.setTimeout(() => {
      document.title = title ? `${title} | Halevai.ai` : "Halevai.ai";
    }, 0);
    return () => window.clearTimeout(id);
  }, [location.pathname]);
  return (
    <Sidebar className="border-r border-border">
      <Link to="/dashboard" className="p-5 flex items-center gap-3 hover:opacity-80 transition-opacity">
        <img src={logo} alt="Halevai.ai" className="h-16 w-auto" />
        <span className="text-xl font-bold halevai-text">halevai.ai</span>
      </Link>

      <SidebarContent>
        {navSections.map((section) => (
          <SidebarGroup key={section.label}>
            <SidebarGroupLabel className="text-xs font-data tracking-widest text-muted-foreground/60 px-4">
              {section.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items
                  .filter(item => {
                    // Hide Automations and Settings for non-admin roles
                    if (item.url === "/automations" && !hasPermission(agencyRole, "run_automations")) return false;
                    if (item.url === "/settings" && !canManageSettings && item.url === "/settings") return false;
                    return true;
                  })
                  .map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-md transition-colors"
                        activeClassName="text-primary bg-primary/10 hover:text-primary"
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        <span>{item.title}</span>
                        {item.title === "Inbox" && (unreadCount || 0) > 0 && (
                          <span className="ml-auto inline-flex items-center justify-center h-4 min-w-[16px] px-1 text-[10px] font-bold rounded-full bg-primary text-primary-foreground">
                            {unreadCount}
                          </span>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-border">
        <button onClick={signOut} className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors w-full px-2 py-2 rounded-md hover:bg-secondary/50">
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}
