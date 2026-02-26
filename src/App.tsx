import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
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
import PublicLandingPage from "./pages/PublicLandingPage";

const queryClient = new QueryClient();

const P = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute>{children}</ProtectedRoute>
);

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
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/onboarding" element={<P><Onboarding /></P>} />
            <Route path="/dashboard" element={<P><Dashboard /></P>} />
            <Route path="/caregivers" element={<P><Caregivers /></P>} />
            <Route path="/halevai" element={<P><HalevaiChat /></P>} />
            <Route path="/enrollment" element={<P><Enrollment /></P>} />
            <Route path="/campaigns" element={<P><Campaigns /></P>} />
            <Route path="/campaign-builder" element={<P><CampaignBuilder /></P>} />
            <Route path="/competitors" element={<P><Competitors /></P>} />
            <Route path="/reviews" element={<P><Reviews /></P>} />
            <Route path="/recommendations" element={<P><Recommendations /></P>} />
            <Route path="/playbooks" element={<P><Playbooks /></P>} />
            <Route path="/briefing" element={<P><Briefing /></P>} />
            <Route path="/talent-sourcing" element={<P><TalentSourcing /></P>} />
            <Route path="/content" element={<P><ContentCalendar /></P>} />
            <Route path="/landing-pages" element={<P><LandingPages /></P>} />
            <Route path="/creatives" element={<P><AdCreatives /></P>} />
            <Route path="/automations" element={<P><Automations /></P>} />
            <Route path="/settings" element={<P><Settings /></P>} />
            <Route path="/lp/:slug" element={<PublicLandingPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
