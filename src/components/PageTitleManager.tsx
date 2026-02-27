import { useEffect } from "react";
import { useLocation } from "react-router-dom";

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

export function PageTitleManager() {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname.replace(/\/+$/, "") || "/";
    const title = PAGE_TITLES[path];
    document.title = title ? `${title} | Halevai.ai` : "Halevai.ai";
  }, [location.pathname]);

  return null;
}
