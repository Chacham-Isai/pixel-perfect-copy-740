import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import PlaceholderPage from "./pages/PlaceholderPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<PlaceholderPage title="Dashboard" description="Your agency's command center with AI-powered insights." />} />
          <Route path="/halevai" element={<PlaceholderPage title="Halevai AI" description="Your AI copilot for home care growth strategy." />} />
          <Route path="/recommendations" element={<PlaceholderPage title="Recommendations" description="AI-generated growth recommendations tailored to your agency." />} />
          <Route path="/playbooks" element={<PlaceholderPage title="Playbooks" description="Step-by-step growth playbooks powered by industry best practices." />} />
          <Route path="/briefing" element={<PlaceholderPage title="Daily Briefing" description="Your morning intelligence report on agency performance." />} />
          <Route path="/caregivers" element={<PlaceholderPage title="Caregivers" description="Full pipeline view of your caregiver recruitment funnel." />} />
          <Route path="/enrollment" element={<PlaceholderPage title="Enrollment Tracker" description="Track patient enrollment from referral to active." />} />
          <Route path="/campaigns" element={<PlaceholderPage title="Campaigns" description="Manage and monitor your recruitment marketing campaigns." />} />
          <Route path="/campaign-builder" element={<PlaceholderPage title="Campaign Builder" description="Build multi-channel recruitment campaigns with AI assistance." />} />
          <Route path="/landing-pages" element={<PlaceholderPage title="Landing Pages" description="Create high-converting recruitment landing pages." />} />
          <Route path="/content" element={<PlaceholderPage title="Content Calendar" description="Plan and schedule your content marketing strategy." />} />
          <Route path="/creatives" element={<PlaceholderPage title="Ad Creatives" description="AI-generated ad creatives for your campaigns." />} />
          <Route path="/talent-sourcing" element={<PlaceholderPage title="Talent Sourcing" description="Autonomous AI agents finding qualified caregivers 24/7." />} />
          <Route path="/competitors" element={<PlaceholderPage title="Competitors" description="Real-time competitive intelligence and market monitoring." />} />
          <Route path="/reviews" element={<PlaceholderPage title="Reviews" description="Monitor and manage your agency's online reputation." />} />
          <Route path="/automations" element={<PlaceholderPage title="Automations" description="Configure workflows and automation rules." />} />
          <Route path="/settings" element={<PlaceholderPage title="Settings" description="Manage your agency profile and preferences." />} />
          <Route path="/onboarding" element={<PlaceholderPage title="Onboarding" description="Set up your agency profile to get started." />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
