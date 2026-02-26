import {
  LayoutDashboard, Bot, Lightbulb, BookOpen, Newspaper,
  Users, ClipboardList, Megaphone, PenTool, Globe, CalendarDays, Image,
  Search, Shield, Star,
  Zap, Settings, LogOut
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { NavLink } from "@/components/NavLink";
import { Link } from "react-router-dom";
import logo from "@/assets/logo-transparent.png";

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

export function AppSidebar() {
  const { signOut } = useAuth();
  return (
    <Sidebar className="border-r border-border">
      <Link to="/dashboard" className="p-5 flex items-center gap-3 hover:opacity-80 transition-opacity">
        <img src={logo} alt="Halevai.ai" className="h-12 w-auto" />
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
                {section.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-md transition-colors"
                        activeClassName="text-primary bg-primary/10 hover:text-primary"
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        <span>{item.title}</span>
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
