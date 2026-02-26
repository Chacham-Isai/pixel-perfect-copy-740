import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Tables } from "@/integrations/supabase/types";

export type Agency = Tables<"agencies">;
export type Caregiver = Tables<"caregivers">;
export type Campaign = Tables<"campaigns">;
export type Competitor = Tables<"competitors">;
export type Review = Tables<"reviews">;
export type ContentPost = Tables<"content_posts">;
export type LandingPage = Tables<"landing_pages">;
export type SourcingCampaign = Tables<"sourcing_campaigns">;
export type SourcedCandidate = Tables<"sourced_candidates">;
export type AutomationConfig = Tables<"automation_configs">;
export type Recommendation = Tables<"halevai_recommendations">;
export type Playbook = Tables<"growth_playbooks">;
export type ActivityLog = Tables<"activity_log">;
export type AdCreative = Tables<"ad_creatives">;
export type BusinessConfig = Tables<"business_config">;

function useAgencyQuery<T>(
  key: string,
  table: string,
  options?: { orderBy?: string; ascending?: boolean; limit?: number; filters?: Record<string, any> }
) {
  const { agencyId } = useAuth();
  return useQuery({
    queryKey: [key, agencyId],
    queryFn: async () => {
      if (!agencyId) return [];
      let q = supabase.from(table as any).select("*").eq("agency_id", agencyId);
      if (options?.filters) {
        Object.entries(options.filters).forEach(([k, v]) => {
          if (Array.isArray(v)) q = q.in(k, v);
          else q = q.eq(k, v);
        });
      }
      if (options?.orderBy) q = q.order(options.orderBy, { ascending: options.ascending ?? false });
      if (options?.limit) q = q.limit(options.limit);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as T[];
    },
    enabled: !!agencyId,
  });
}

export const useAgency = () => {
  const { agencyId } = useAuth();
  return useQuery({
    queryKey: ["agency", agencyId],
    queryFn: async () => {
      if (!agencyId) return null;
      const { data, error } = await supabase.from("agencies").select("*").eq("id", agencyId).maybeSingle();
      if (error) throw error;
      return data as Agency | null;
    },
    enabled: !!agencyId,
  });
};

export const useCaregivers = () => useAgencyQuery<Caregiver>("caregivers", "caregivers", { orderBy: "created_at" });
export const useCampaigns = () => useAgencyQuery<Campaign>("campaigns", "campaigns", { orderBy: "created_at" });
export const useCompetitors = () => useAgencyQuery<Competitor>("competitors", "competitors", { orderBy: "created_at" });
export const useReviews = () => useAgencyQuery<Review>("reviews", "reviews", { orderBy: "created_at" });
export const useContentPosts = () => useAgencyQuery<ContentPost>("content_posts", "content_posts", { orderBy: "scheduled_date" });
export const useLandingPages = () => useAgencyQuery<LandingPage>("landing_pages", "landing_pages");
export const useSourcingCampaigns = () => useAgencyQuery<SourcingCampaign>("sourcing_campaigns", "sourcing_campaigns", { orderBy: "created_at" });
export const useSourcedCandidates = () => useAgencyQuery<SourcedCandidate>("sourced_candidates", "sourced_candidates", { orderBy: "created_at" });
export const useAutomations = () => useAgencyQuery<AutomationConfig>("automations", "automation_configs");
export const useRecommendations = () => useAgencyQuery<Recommendation>("recommendations", "halevai_recommendations", { orderBy: "created_at" });
export const usePlaybooks = () => useAgencyQuery<Playbook>("playbooks", "growth_playbooks");
export const useActivityLog = () => useAgencyQuery<ActivityLog>("activity_log", "activity_log", { orderBy: "created_at", limit: 20 });
export const useAdCreatives = () => useAgencyQuery<AdCreative>("ad_creatives", "ad_creatives", { orderBy: "created_at" });
export const useBusinessConfig = () => {
  const { agencyId } = useAuth();
  return useQuery({
    queryKey: ["business_config", agencyId],
    queryFn: async () => {
      if (!agencyId) return null;
      const { data, error } = await supabase.from("business_config").select("*").eq("agency_id", agencyId).maybeSingle();
      if (error) throw error;
      return data as BusinessConfig | null;
    },
    enabled: !!agencyId,
  });
};

// New table hooks
export const useReferralSources = () => useAgencyQuery<any>("referral_sources", "referral_sources", { orderBy: "created_at" });
export const useCampaignTemplates = () => useAgencyQuery<any>("campaign_templates", "saved_campaign_templates", { orderBy: "created_at" });
export const useCampaignSequences = () => useAgencyQuery<any>("campaign_sequences", "campaign_sequences", { orderBy: "created_at" });
export const useSequenceSteps = (sequenceId?: string) => {
  const { agencyId } = useAuth();
  return useQuery({
    queryKey: ["sequence_steps", agencyId, sequenceId],
    queryFn: async () => {
      if (!agencyId || !sequenceId) return [];
      const { data, error } = await supabase.from("sequence_steps" as any).select("*").eq("agency_id", agencyId).eq("sequence_id", sequenceId).order("step_number");
      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: !!agencyId && !!sequenceId,
  });
};
export const useSequenceEnrollments = () => useAgencyQuery<any>("sequence_enrollments", "sequence_enrollments", { orderBy: "started_at" });
export const useCampaignPackages = () => useAgencyQuery<any>("campaign_packages", "campaign_packages", { orderBy: "created_at" });
export const useLandingPageEvents = () => useAgencyQuery<any>("landing_page_events", "landing_page_events", { orderBy: "created_at" });
export const useReviewRequests = () => useAgencyQuery<any>("review_requests", "review_requests", { orderBy: "sent_at" });

export const useAgencyMembers = () => {
  const { agencyId } = useAuth();
  return useQuery({
    queryKey: ["agency_members", agencyId],
    queryFn: async () => {
      if (!agencyId) return [];
      const { data, error } = await supabase
        .from("agency_members")
        .select("*")
        .eq("agency_id", agencyId);
      if (error) throw error;
      return data;
    },
    enabled: !!agencyId,
  });
};

export const usePayRateIntel = () => {
  const { agencyId } = useAuth();
  return useQuery({
    queryKey: ["pay_rate_intel", agencyId],
    queryFn: async () => {
      if (!agencyId) return null;
      const { data, error } = await supabase
        .from("pay_rate_intel" as any)
        .select("*")
        .eq("agency_id", agencyId)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as any;
    },
    enabled: !!agencyId,
  });
};

export const useToggleAutomation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("automation_configs").update({ active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["automations"] }),
  });
};
