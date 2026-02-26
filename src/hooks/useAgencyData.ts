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
export const usePlaybooks = () => {
  const { agencyId } = useAuth();
  return useQuery({
    queryKey: ["playbooks", agencyId],
    queryFn: async () => {
      if (!agencyId) return [];
      const { data, error } = await supabase
        .from("growth_playbooks")
        .select("*")
        .or(`agency_id.eq.${agencyId},agency_id.is.null`);
      if (error) throw error;
      return (data || []) as Playbook[];
    },
    enabled: !!agencyId,
  });
};
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

// === Phase 1: Messaging & Integration hooks ===

export const useApiKeys = () => {
  const { agencyId } = useAuth();
  return useQuery({
    queryKey: ["api_keys", agencyId],
    queryFn: async () => {
      if (!agencyId) return [];
      const { data, error } = await supabase
        .from("api_keys" as any)
        .select("*")
        .eq("agency_id", agencyId);
      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: !!agencyId,
  });
};

export const useMessageLog = (limit = 50) => {
  const { agencyId } = useAuth();
  return useQuery({
    queryKey: ["message_log", agencyId, limit],
    queryFn: async () => {
      if (!agencyId) return [];
      const { data, error } = await supabase
        .from("message_log" as any)
        .select("*")
        .eq("agency_id", agencyId)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: !!agencyId,
  });
};

export const useSaveApiKey = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ agencyId, keyName, keyValue }: { agencyId: string; keyName: string; keyValue: string }) => {
      const { error } = await supabase
        .from("api_keys" as any)
        .upsert(
          { agency_id: agencyId, key_name: keyName, key_value: keyValue, connected: false, updated_at: new Date().toISOString() },
          { onConflict: "agency_id,key_name" }
        );
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["api_keys"] }),
  });
};

export const useTestConnection = () => {
  return useMutation({
    mutationFn: async ({ agencyId, keyName }: { agencyId: string; keyName: string }) => {
      // Call edge function to test the connection
      const { data, error } = await supabase.functions.invoke("send-message", {
        body: {
          agency_id: agencyId,
          channel: keyName.startsWith("twilio") ? "sms" : "email",
          to: "test",
          body: "Connection test",
          template: "__test__",
        },
      });
      if (error) throw error;
      return data;
    },
  });
};

export const useAgentActivityLog = () => useAgencyQuery<any>("agent_activity_log", "agent_activity_log", { orderBy: "created_at", limit: 50 });
export const usePhoneScreens = () => useAgencyQuery<any>("phone_screens", "phone_screens", { orderBy: "created_at" });

// === Phase 2: Inbound Messaging hooks ===

export const useConversationThreads = () =>
  useAgencyQuery<any>("conversation_threads", "conversation_threads", { orderBy: "last_message_at" });

export const useUnreadCount = () => {
  const { agencyId } = useAuth();
  return useQuery({
    queryKey: ["unread_count", agencyId],
    queryFn: async () => {
      if (!agencyId) return 0;
      const { data, error } = await supabase
        .from("conversation_threads" as any)
        .select("unread_count")
        .eq("agency_id", agencyId)
        .eq("status", "open");
      if (error) throw error;
      return (data || []).reduce((sum: number, t: any) => sum + (t.unread_count || 0), 0);
    },
    enabled: !!agencyId,
  });
};

export const useThreadMessages = (
  contactPhone: string | null,
  contactEmail: string | null,
  channel: string
) => {
  const { agencyId } = useAuth();
  return useQuery({
    queryKey: ["thread_messages", agencyId, contactPhone, contactEmail, channel],
    queryFn: async () => {
      if (!agencyId) return [];
      const contact = channel === "sms" ? contactPhone : contactEmail;
      if (!contact) return [];

      // Fetch outbound messages from message_log
      const contactField = channel === "sms" ? "to_contact" : "to_contact";
      const { data: outbound } = await supabase
        .from("message_log" as any)
        .select("id, channel, to_contact, subject, body, status, created_at")
        .eq("agency_id", agencyId)
        .eq("channel", channel)
        .ilike(contactField, `%${contact.slice(-10)}%`)
        .order("created_at", { ascending: true });

      // Fetch inbound messages
      const fromField = "from_contact";
      const { data: inbound } = await supabase
        .from("inbound_messages" as any)
        .select("id, channel, from_contact, subject, body, created_at")
        .eq("agency_id", agencyId)
        .eq("channel", channel)
        .ilike(fromField, `%${contact.slice(-10)}%`)
        .order("created_at", { ascending: true });

      // Merge and sort chronologically
      const merged = [
        ...(outbound || []).map((m: any) => ({ ...m, direction: "outbound" })),
        ...(inbound || []).map((m: any) => ({ ...m, direction: "inbound", status: "received" })),
      ].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

      return merged;
    },
    enabled: !!agencyId && !!(contactPhone || contactEmail),
  });
};

export const useInboundMessages = () =>
  useAgencyQuery<any>("inbound_messages", "inbound_messages", { orderBy: "created_at", limit: 50 });
