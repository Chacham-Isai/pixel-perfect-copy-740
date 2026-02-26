import { z } from "zod";

export const addCaregiverSchema = z.object({
  full_name: z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Name too long"),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
  email: z.string().trim().email("Invalid email").max(255).optional().or(z.literal("")),
  state: z.string().max(50).optional().or(z.literal("")),
  county: z.string().max(100).optional().or(z.literal("")),
  city: z.string().max(100).optional().or(z.literal("")),
  language_primary: z.string().default("english"),
  source: z.string().default("direct"),
  notes: z.string().max(2000, "Notes too long").optional().or(z.literal("")),
});
export type AddCaregiverForm = z.infer<typeof addCaregiverSchema>;

export const campaignDetailsSchema = z.object({
  name: z.string().trim().min(2, "Campaign name is required").max(200, "Name too long"),
  type: z.string().min(1, "Type is required"),
  states: z.array(z.string()).min(1, "At least one state required"),
  county: z.string().max(100).optional().or(z.literal("")),
  language: z.string().default("english"),
  budget: z.string().optional().or(z.literal("")),
  dateFrom: z.string().optional().or(z.literal("")),
  dateTo: z.string().optional().or(z.literal("")),
  targetCPA: z.string().optional().or(z.literal("")),
  autoPause: z.string().optional().or(z.literal("")),
});
export type CampaignDetailsForm = z.infer<typeof campaignDetailsSchema>;

export const composeMessageSchema = z.object({
  to: z.string().trim().min(1, "Recipient is required"),
  subject: z.string().max(200, "Subject too long").optional().or(z.literal("")),
  body: z.string().trim().min(1, "Message cannot be empty").max(5000, "Message too long"),
});
export type ComposeMessageForm = z.infer<typeof composeMessageSchema>;

export const agencyProfileSchema = z.object({
  name: z.string().trim().min(1, "Agency name is required").max(200),
  phone: z.string().max(20).optional().or(z.literal("")),
  email: z.string().email("Invalid email").max(255).optional().or(z.literal("")),
  website_url: z.string().url("Invalid URL").max(500).optional().or(z.literal("")),
  office_address: z.string().max(500).optional().or(z.literal("")),
});
export type AgencyProfileForm = z.infer<typeof agencyProfileSchema>;

export const sourcingCampaignSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(200),
  state: z.string().max(50).optional().or(z.literal("")),
  county: z.string().max(100).optional().or(z.literal("")),
  language: z.string().default("english"),
  max: z.string().refine(v => !v || (Number(v) > 0 && Number(v) <= 500), "Must be 1-500"),
});
export type SourcingCampaignForm = z.infer<typeof sourcingCampaignSchema>;

// Helper to format Zod errors as a toast-friendly string
export function formatZodErrors(result: z.SafeParseReturnType<any, any>): string | null {
  if (result.success) return null;
  return result.error.issues.map(i => i.message).join(". ");
}
