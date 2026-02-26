import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import Caregivers from "./pages/Caregivers";
import HalevaiChat from "./pages/HalevaiChat";
import Enrollment from "./pages/Enrollment";
import Campaigns from "./pages/Campaigns";
import CampaignBuilder from "./pages/CampaignBuilder";
import Competitors from "./pages/Competitors";
import Reviews from "./pages/Reviews";
import Recommendations from "./pages/Recommendations";
import Playbooks from "./pages/Playbooks";
import Briefing from "./pages/Briefing";
import TalentSourcing from "./pages/TalentSourcing";
import ContentCalendar from "./pages/ContentCalendar";
import LandingPages from "./pages/LandingPages";
import AdCreatives from "./pages/AdCreatives";
import Automations from "./pages/Automations";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/caregivers" element={<Caregivers />} />
            <Route path="/halevai" element={<HalevaiChat />} />
            <Route path="/enrollment" element={<Enrollment />} />
            <Route path="/campaigns" element={<Campaigns />} />
            <Route path="/campaign-builder" element={<CampaignBuilder />} />
            <Route path="/competitors" element={<Competitors />} />
            <Route path="/reviews" element={<Reviews />} />
            <Route path="/recommendations" element={<Recommendations />} />
            <Route path="/playbooks" element={<Playbooks />} />
            <Route path="/briefing" element={<Briefing />} />
            <Route path="/talent-sourcing" element={<TalentSourcing />} />
            <Route path="/content" element={<ContentCalendar />} />
            <Route path="/landing-pages" element={<LandingPages />} />
            <Route path="/creatives" element={<AdCreatives />} />
            <Route path="/automations" element={<Automations />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
