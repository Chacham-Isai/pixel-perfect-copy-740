export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      activity_log: {
        Row: {
          action: string
          actor: string | null
          agency_id: string
          created_at: string | null
          details: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          metadata: Json | null
        }
        Insert: {
          action: string
          actor?: string | null
          agency_id: string
          created_at?: string | null
          details?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
        }
        Update: {
          action?: string
          actor?: string | null
          agency_id?: string
          created_at?: string | null
          details?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_creatives: {
        Row: {
          agency_id: string
          body_copy: string | null
          campaign_id: string | null
          created_at: string | null
          headline: string | null
          id: string
          image_url: string | null
          prompt: string | null
          user_id: string | null
        }
        Insert: {
          agency_id: string
          body_copy?: string | null
          campaign_id?: string | null
          created_at?: string | null
          headline?: string | null
          id?: string
          image_url?: string | null
          prompt?: string | null
          user_id?: string | null
        }
        Update: {
          agency_id?: string
          body_copy?: string | null
          campaign_id?: string | null
          created_at?: string | null
          headline?: string | null
          id?: string
          image_url?: string | null
          prompt?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_creatives_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_creatives_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      agencies: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          logo_url: string | null
          name: string
          office_address: string | null
          phone: string | null
          plan: string | null
          primary_state: string | null
          slug: string
          states: string[]
          updated_at: string | null
          website_url: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          name: string
          office_address?: string | null
          phone?: string | null
          plan?: string | null
          primary_state?: string | null
          slug: string
          states?: string[]
          updated_at?: string | null
          website_url?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          office_address?: string | null
          phone?: string | null
          plan?: string | null
          primary_state?: string | null
          slug?: string
          states?: string[]
          updated_at?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      agency_members: {
        Row: {
          agency_id: string
          id: string
          invited_by: string | null
          joined_at: string | null
          role: Database["public"]["Enums"]["agency_role"]
          user_id: string
        }
        Insert: {
          agency_id: string
          id?: string
          invited_by?: string | null
          joined_at?: string | null
          role?: Database["public"]["Enums"]["agency_role"]
          user_id: string
        }
        Update: {
          agency_id?: string
          id?: string
          invited_by?: string | null
          joined_at?: string | null
          role?: Database["public"]["Enums"]["agency_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agency_members_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_configs: {
        Row: {
          actions_this_week: number | null
          active: boolean | null
          agency_id: string
          automation_key: string
          config: Json | null
          created_at: string | null
          description: string | null
          id: string
          label: string
          last_run_at: string | null
        }
        Insert: {
          actions_this_week?: number | null
          active?: boolean | null
          agency_id: string
          automation_key: string
          config?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          label: string
          last_run_at?: string | null
        }
        Update: {
          actions_this_week?: number | null
          active?: boolean | null
          agency_id?: string
          automation_key?: string
          config?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          label?: string
          last_run_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "automation_configs_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      business_config: {
        Row: {
          accent_color: string | null
          agency_id: string
          business_name: string | null
          created_at: string | null
          email: string | null
          facebook_url: string | null
          id: string
          industry: string | null
          instagram_url: string | null
          linkedin_url: string | null
          logo_url: string | null
          phone: string | null
          primary_color: string | null
          secondary_color: string | null
          tagline: string | null
          website_url: string | null
        }
        Insert: {
          accent_color?: string | null
          agency_id: string
          business_name?: string | null
          created_at?: string | null
          email?: string | null
          facebook_url?: string | null
          id?: string
          industry?: string | null
          instagram_url?: string | null
          linkedin_url?: string | null
          logo_url?: string | null
          phone?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          tagline?: string | null
          website_url?: string | null
        }
        Update: {
          accent_color?: string | null
          agency_id?: string
          business_name?: string | null
          created_at?: string | null
          email?: string | null
          facebook_url?: string | null
          id?: string
          industry?: string | null
          instagram_url?: string | null
          linkedin_url?: string | null
          logo_url?: string | null
          phone?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          tagline?: string | null
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_config_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: true
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_packages: {
        Row: {
          agency_id: string
          campaign_id: string | null
          content: Json | null
          created_at: string | null
          id: string
          platforms: Json | null
          recommendation_id: string | null
          status: string | null
          tracking_urls: Json | null
          utm_params: Json | null
        }
        Insert: {
          agency_id: string
          campaign_id?: string | null
          content?: Json | null
          created_at?: string | null
          id?: string
          platforms?: Json | null
          recommendation_id?: string | null
          status?: string | null
          tracking_urls?: Json | null
          utm_params?: Json | null
        }
        Update: {
          agency_id?: string
          campaign_id?: string | null
          content?: Json | null
          created_at?: string | null
          id?: string
          platforms?: Json | null
          recommendation_id?: string | null
          status?: string | null
          tracking_urls?: Json | null
          utm_params?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_packages_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_packages_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_packages_recommendation_id_fkey"
            columns: ["recommendation_id"]
            isOneToOne: false
            referencedRelation: "halevai_recommendations"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_sequences: {
        Row: {
          active: boolean | null
          agency_id: string
          created_at: string | null
          id: string
          name: string
          target_language: string | null
          target_state: string | null
          trigger_type: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          agency_id: string
          created_at?: string | null
          id?: string
          name: string
          target_language?: string | null
          target_state?: string | null
          trigger_type?: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          agency_id?: string
          created_at?: string | null
          id?: string
          name?: string
          target_language?: string | null
          target_state?: string | null
          trigger_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_sequences_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          agency_id: string
          ai_prompt: string | null
          ai_recommendations: string | null
          campaign_name: string
          campaign_type: Database["public"]["Enums"]["campaign_type"] | null
          caregivers_generated: number | null
          channel: string | null
          clicks: number | null
          conversions: number | null
          cost_per_conversion: number | null
          county: string | null
          created_at: string | null
          date_from: string | null
          date_to: string | null
          enrollment_conversion_rate: number | null
          id: string
          impressions: number | null
          pause_spend_threshold: number | null
          spend: number | null
          state: string | null
          status: string | null
          target_cac: number | null
          target_language: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          agency_id: string
          ai_prompt?: string | null
          ai_recommendations?: string | null
          campaign_name: string
          campaign_type?: Database["public"]["Enums"]["campaign_type"] | null
          caregivers_generated?: number | null
          channel?: string | null
          clicks?: number | null
          conversions?: number | null
          cost_per_conversion?: number | null
          county?: string | null
          created_at?: string | null
          date_from?: string | null
          date_to?: string | null
          enrollment_conversion_rate?: number | null
          id?: string
          impressions?: number | null
          pause_spend_threshold?: number | null
          spend?: number | null
          state?: string | null
          status?: string | null
          target_cac?: number | null
          target_language?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          agency_id?: string
          ai_prompt?: string | null
          ai_recommendations?: string | null
          campaign_name?: string
          campaign_type?: Database["public"]["Enums"]["campaign_type"] | null
          caregivers_generated?: number | null
          channel?: string | null
          clicks?: number | null
          conversions?: number | null
          cost_per_conversion?: number | null
          county?: string | null
          created_at?: string | null
          date_from?: string | null
          date_to?: string | null
          enrollment_conversion_rate?: number | null
          id?: string
          impressions?: number | null
          pause_spend_threshold?: number | null
          spend?: number | null
          state?: string | null
          status?: string | null
          target_cac?: number | null
          target_language?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      caregiver_activities: {
        Row: {
          action_type: string
          agency_id: string
          caregiver_id: string
          created_at: string | null
          created_by: string | null
          id: string
          note: string | null
        }
        Insert: {
          action_type: string
          agency_id: string
          caregiver_id: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          note?: string | null
        }
        Update: {
          action_type?: string
          agency_id?: string
          caregiver_id?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          note?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "caregiver_activities_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "caregiver_activities_caregiver_id_fkey"
            columns: ["caregiver_id"]
            isOneToOne: false
            referencedRelation: "caregivers"
            referencedColumns: ["id"]
          },
        ]
      }
      caregivers: {
        Row: {
          agency_id: string
          assigned_to: string | null
          authorization_date: string | null
          auto_followup_count: number | null
          availability: string | null
          background_check_status: string | null
          campaign_id: string | null
          case_manager_name: string | null
          city: string | null
          county: string | null
          county_rep_name: string | null
          created_at: string | null
          currently_caregiving: boolean | null
          email: string | null
          enrollment_started_at: string | null
          follow_up_date: string | null
          full_name: string
          has_transportation: boolean | null
          hourly_rate: number | null
          id: string
          landing_page_id: string | null
          language_primary: string | null
          languages_spoken: string[] | null
          last_contacted_at: string | null
          lead_score: number | null
          lead_tier: string | null
          monthly_revenue: number | null
          notes: string | null
          patient_age: number | null
          patient_county: string | null
          patient_hours_approved: number | null
          patient_medicaid_id: string | null
          patient_medicaid_status: string | null
          patient_name: string | null
          patient_needs_assessment: boolean | null
          patient_relationship: string | null
          phone: string | null
          referrer: string | null
          relationship_to_patient: string | null
          score_reasoning: string | null
          source: Database["public"]["Enums"]["lead_source"] | null
          start_of_care_date: string | null
          state: string | null
          status: Database["public"]["Enums"]["lead_status"] | null
          updated_at: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
          weekly_hours: number | null
          years_caregiving_experience: number | null
        }
        Insert: {
          agency_id: string
          assigned_to?: string | null
          authorization_date?: string | null
          auto_followup_count?: number | null
          availability?: string | null
          background_check_status?: string | null
          campaign_id?: string | null
          case_manager_name?: string | null
          city?: string | null
          county?: string | null
          county_rep_name?: string | null
          created_at?: string | null
          currently_caregiving?: boolean | null
          email?: string | null
          enrollment_started_at?: string | null
          follow_up_date?: string | null
          full_name: string
          has_transportation?: boolean | null
          hourly_rate?: number | null
          id?: string
          landing_page_id?: string | null
          language_primary?: string | null
          languages_spoken?: string[] | null
          last_contacted_at?: string | null
          lead_score?: number | null
          lead_tier?: string | null
          monthly_revenue?: number | null
          notes?: string | null
          patient_age?: number | null
          patient_county?: string | null
          patient_hours_approved?: number | null
          patient_medicaid_id?: string | null
          patient_medicaid_status?: string | null
          patient_name?: string | null
          patient_needs_assessment?: boolean | null
          patient_relationship?: string | null
          phone?: string | null
          referrer?: string | null
          relationship_to_patient?: string | null
          score_reasoning?: string | null
          source?: Database["public"]["Enums"]["lead_source"] | null
          start_of_care_date?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["lead_status"] | null
          updated_at?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          weekly_hours?: number | null
          years_caregiving_experience?: number | null
        }
        Update: {
          agency_id?: string
          assigned_to?: string | null
          authorization_date?: string | null
          auto_followup_count?: number | null
          availability?: string | null
          background_check_status?: string | null
          campaign_id?: string | null
          case_manager_name?: string | null
          city?: string | null
          county?: string | null
          county_rep_name?: string | null
          created_at?: string | null
          currently_caregiving?: boolean | null
          email?: string | null
          enrollment_started_at?: string | null
          follow_up_date?: string | null
          full_name?: string
          has_transportation?: boolean | null
          hourly_rate?: number | null
          id?: string
          landing_page_id?: string | null
          language_primary?: string | null
          languages_spoken?: string[] | null
          last_contacted_at?: string | null
          lead_score?: number | null
          lead_tier?: string | null
          monthly_revenue?: number | null
          notes?: string | null
          patient_age?: number | null
          patient_county?: string | null
          patient_hours_approved?: number | null
          patient_medicaid_id?: string | null
          patient_medicaid_status?: string | null
          patient_name?: string | null
          patient_needs_assessment?: boolean | null
          patient_relationship?: string | null
          phone?: string | null
          referrer?: string | null
          relationship_to_patient?: string | null
          score_reasoning?: string | null
          source?: Database["public"]["Enums"]["lead_source"] | null
          start_of_care_date?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["lead_status"] | null
          updated_at?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          weekly_hours?: number | null
          years_caregiving_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "caregivers_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      competitors: {
        Row: {
          agency_id: string
          avg_rating: number | null
          created_at: string | null
          estimated_monthly_spend: number | null
          id: string
          markets: string[] | null
          name: string
          notes: string | null
          pay_rate_max: number | null
          pay_rate_min: number | null
          review_count: number | null
          state: string | null
          website: string | null
        }
        Insert: {
          agency_id: string
          avg_rating?: number | null
          created_at?: string | null
          estimated_monthly_spend?: number | null
          id?: string
          markets?: string[] | null
          name: string
          notes?: string | null
          pay_rate_max?: number | null
          pay_rate_min?: number | null
          review_count?: number | null
          state?: string | null
          website?: string | null
        }
        Update: {
          agency_id?: string
          avg_rating?: number | null
          created_at?: string | null
          estimated_monthly_spend?: number | null
          id?: string
          markets?: string[] | null
          name?: string
          notes?: string | null
          pay_rate_max?: number | null
          pay_rate_min?: number | null
          review_count?: number | null
          state?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "competitors_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      content_posts: {
        Row: {
          agency_id: string
          ai_generated: boolean | null
          body: string | null
          campaign_id: string | null
          county: string | null
          created_at: string | null
          hashtags: string[] | null
          id: string
          image_url: string | null
          language: string | null
          platform: string | null
          post_type: string | null
          scheduled_date: string | null
          state: string | null
          status: string | null
          title: string
        }
        Insert: {
          agency_id: string
          ai_generated?: boolean | null
          body?: string | null
          campaign_id?: string | null
          county?: string | null
          created_at?: string | null
          hashtags?: string[] | null
          id?: string
          image_url?: string | null
          language?: string | null
          platform?: string | null
          post_type?: string | null
          scheduled_date?: string | null
          state?: string | null
          status?: string | null
          title: string
        }
        Update: {
          agency_id?: string
          ai_generated?: boolean | null
          body?: string | null
          campaign_id?: string | null
          county?: string | null
          created_at?: string | null
          hashtags?: string[] | null
          id?: string
          image_url?: string | null
          language?: string | null
          platform?: string | null
          post_type?: string | null
          scheduled_date?: string | null
          state?: string | null
          status?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_posts_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_posts_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_briefings: {
        Row: {
          agency_id: string
          content: Json | null
          created_at: string | null
          date: string
          id: string
          user_id: string | null
        }
        Insert: {
          agency_id: string
          content?: Json | null
          created_at?: string | null
          date?: string
          id?: string
          user_id?: string | null
        }
        Update: {
          agency_id?: string
          content?: Json | null
          created_at?: string | null
          date?: string
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_briefings_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      growth_playbooks: {
        Row: {
          active: boolean | null
          agency_id: string | null
          best_for: string | null
          category: string | null
          created_at: string | null
          description: string | null
          estimated_cost: string | null
          estimated_results: string | null
          estimated_time: string | null
          id: string
          name: string
          steps: Json | null
          variables: Json | null
        }
        Insert: {
          active?: boolean | null
          agency_id?: string | null
          best_for?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          estimated_cost?: string | null
          estimated_results?: string | null
          estimated_time?: string | null
          id?: string
          name: string
          steps?: Json | null
          variables?: Json | null
        }
        Update: {
          active?: boolean | null
          agency_id?: string | null
          best_for?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          estimated_cost?: string | null
          estimated_results?: string | null
          estimated_time?: string | null
          id?: string
          name?: string
          steps?: Json | null
          variables?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "growth_playbooks_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      halevai_conversations: {
        Row: {
          agency_id: string
          created_at: string | null
          id: string
          title: string | null
          user_id: string
        }
        Insert: {
          agency_id: string
          created_at?: string | null
          id?: string
          title?: string | null
          user_id: string
        }
        Update: {
          agency_id?: string
          created_at?: string | null
          id?: string
          title?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "halevai_conversations_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      halevai_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "halevai_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "halevai_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      halevai_recommendations: {
        Row: {
          action_data: Json | null
          action_type: string | null
          agency_id: string
          approved_at: string | null
          category: string | null
          created_at: string | null
          data_points: Json | null
          description: string | null
          dismissed_at: string | null
          dismissed_reason: string | null
          expires_at: string | null
          id: string
          impact_estimate: string | null
          priority: string | null
          reasoning: string | null
          status: string | null
          title: string
          type: string | null
          user_id: string | null
        }
        Insert: {
          action_data?: Json | null
          action_type?: string | null
          agency_id: string
          approved_at?: string | null
          category?: string | null
          created_at?: string | null
          data_points?: Json | null
          description?: string | null
          dismissed_at?: string | null
          dismissed_reason?: string | null
          expires_at?: string | null
          id?: string
          impact_estimate?: string | null
          priority?: string | null
          reasoning?: string | null
          status?: string | null
          title: string
          type?: string | null
          user_id?: string | null
        }
        Update: {
          action_data?: Json | null
          action_type?: string | null
          agency_id?: string
          approved_at?: string | null
          category?: string | null
          created_at?: string | null
          data_points?: Json | null
          description?: string | null
          dismissed_at?: string | null
          dismissed_reason?: string | null
          expires_at?: string | null
          id?: string
          impact_estimate?: string | null
          priority?: string | null
          reasoning?: string | null
          status?: string | null
          title?: string
          type?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "halevai_recommendations_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      landing_page_events: {
        Row: {
          agency_id: string
          created_at: string | null
          event_type: string
          id: string
          landing_page_id: string
          metadata: Json | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          agency_id: string
          created_at?: string | null
          event_type: string
          id?: string
          landing_page_id: string
          metadata?: Json | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          agency_id?: string
          created_at?: string | null
          event_type?: string
          id?: string
          landing_page_id?: string
          metadata?: Json | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "landing_page_events_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "landing_page_events_landing_page_id_fkey"
            columns: ["landing_page_id"]
            isOneToOne: false
            referencedRelation: "landing_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      landing_pages: {
        Row: {
          agency_id: string
          benefits: Json | null
          campaign_id: string | null
          conversion_rate: number | null
          county: string | null
          created_at: string | null
          faq: Json | null
          form_submissions: number | null
          hero_cta_text: string | null
          hero_headline: string | null
          hero_subheadline: string | null
          id: string
          language: string | null
          pay_rate_highlight: string | null
          published: boolean | null
          slug: string
          state: string | null
          testimonials: Json | null
          title: string
          views: number | null
        }
        Insert: {
          agency_id: string
          benefits?: Json | null
          campaign_id?: string | null
          conversion_rate?: number | null
          county?: string | null
          created_at?: string | null
          faq?: Json | null
          form_submissions?: number | null
          hero_cta_text?: string | null
          hero_headline?: string | null
          hero_subheadline?: string | null
          id?: string
          language?: string | null
          pay_rate_highlight?: string | null
          published?: boolean | null
          slug: string
          state?: string | null
          testimonials?: Json | null
          title: string
          views?: number | null
        }
        Update: {
          agency_id?: string
          benefits?: Json | null
          campaign_id?: string | null
          conversion_rate?: number | null
          county?: string | null
          created_at?: string | null
          faq?: Json | null
          form_submissions?: number | null
          hero_cta_text?: string | null
          hero_headline?: string | null
          hero_subheadline?: string | null
          id?: string
          language?: string | null
          pay_rate_highlight?: string | null
          published?: boolean | null
          slug?: string
          state?: string | null
          testimonials?: Json | null
          title?: string
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "landing_pages_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "landing_pages_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          address: string | null
          agency_id: string
          city: string | null
          county: string | null
          created_at: string | null
          gbp_connected: boolean | null
          id: string
          name: string
          phone: string | null
          service_counties: string[] | null
          state: string | null
        }
        Insert: {
          address?: string | null
          agency_id: string
          city?: string | null
          county?: string | null
          created_at?: string | null
          gbp_connected?: boolean | null
          id?: string
          name: string
          phone?: string | null
          service_counties?: string[] | null
          state?: string | null
        }
        Update: {
          address?: string | null
          agency_id?: string
          city?: string | null
          county?: string | null
          created_at?: string | null
          gbp_connected?: boolean | null
          id?: string
          name?: string
          phone?: string | null
          service_counties?: string[] | null
          state?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "locations_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          agency_id: string
          body: string | null
          created_at: string | null
          id: string
          link: string | null
          metadata: Json | null
          read: boolean | null
          title: string
          type: string | null
          user_id: string
        }
        Insert: {
          agency_id: string
          body?: string | null
          created_at?: string | null
          id?: string
          link?: string | null
          metadata?: Json | null
          read?: boolean | null
          title: string
          type?: string | null
          user_id: string
        }
        Update: {
          agency_id?: string
          body?: string | null
          created_at?: string | null
          id?: string
          link?: string | null
          metadata?: Json | null
          read?: boolean | null
          title?: string
          type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding: {
        Row: {
          agency_id: string
          agency_name: string | null
          ai_strategy: Json | null
          budget_tier: string | null
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          current_step: number | null
          id: string
          monthly_caregiver_target: number | null
          monthly_patient_target: number | null
          pay_rates: Json | null
          primary_goal: string | null
          program_types: string[] | null
          service_counties: Json | null
          states: string[] | null
          strategy_generated: boolean | null
          unique_selling_points: string[] | null
          user_id: string
        }
        Insert: {
          agency_id: string
          agency_name?: string | null
          ai_strategy?: Json | null
          budget_tier?: string | null
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          current_step?: number | null
          id?: string
          monthly_caregiver_target?: number | null
          monthly_patient_target?: number | null
          pay_rates?: Json | null
          primary_goal?: string | null
          program_types?: string[] | null
          service_counties?: Json | null
          states?: string[] | null
          strategy_generated?: boolean | null
          unique_selling_points?: string[] | null
          user_id: string
        }
        Update: {
          agency_id?: string
          agency_name?: string | null
          ai_strategy?: Json | null
          budget_tier?: string | null
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          current_step?: number | null
          id?: string
          monthly_caregiver_target?: number | null
          monthly_patient_target?: number | null
          pay_rates?: Json | null
          primary_goal?: string | null
          program_types?: string[] | null
          service_counties?: Json | null
          states?: string[] | null
          strategy_generated?: boolean | null
          unique_selling_points?: string[] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      pay_rate_intel: {
        Row: {
          agency_id: string
          analysis_summary: string | null
          competitor_count: number | null
          county: string | null
          created_at: string | null
          id: string
          market_avg_rate: number | null
          market_max_rate: number | null
          market_min_rate: number | null
          medicaid_reimbursement_rate: number | null
          recommended_rate: number | null
          sources: Json | null
          state: string | null
          updated_at: string | null
        }
        Insert: {
          agency_id: string
          analysis_summary?: string | null
          competitor_count?: number | null
          county?: string | null
          created_at?: string | null
          id?: string
          market_avg_rate?: number | null
          market_max_rate?: number | null
          market_min_rate?: number | null
          medicaid_reimbursement_rate?: number | null
          recommended_rate?: number | null
          sources?: Json | null
          state?: string | null
          updated_at?: string | null
        }
        Update: {
          agency_id?: string
          analysis_summary?: string | null
          competitor_count?: number | null
          county?: string | null
          created_at?: string | null
          id?: string
          market_avg_rate?: number | null
          market_max_rate?: number | null
          market_min_rate?: number | null
          medicaid_reimbursement_rate?: number | null
          recommended_rate?: number | null
          sources?: Json | null
          state?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pay_rate_intel_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      phone_screens: {
        Row: {
          agency_id: string
          agent_provider: string | null
          ai_recommendation: string | null
          ai_score: number | null
          ai_summary: string | null
          call_id: string | null
          caregiver_id: string | null
          created_at: string | null
          duration_seconds: number | null
          id: string
          phone_number: string | null
          screening_answers: Json | null
          sourced_candidate_id: string | null
          status: string | null
          transcript: string | null
        }
        Insert: {
          agency_id: string
          agent_provider?: string | null
          ai_recommendation?: string | null
          ai_score?: number | null
          ai_summary?: string | null
          call_id?: string | null
          caregiver_id?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          id?: string
          phone_number?: string | null
          screening_answers?: Json | null
          sourced_candidate_id?: string | null
          status?: string | null
          transcript?: string | null
        }
        Update: {
          agency_id?: string
          agent_provider?: string | null
          ai_recommendation?: string | null
          ai_score?: number | null
          ai_summary?: string | null
          call_id?: string | null
          caregiver_id?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          id?: string
          phone_number?: string | null
          screening_answers?: Json | null
          sourced_candidate_id?: string | null
          status?: string | null
          transcript?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "phone_screens_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "phone_screens_caregiver_id_fkey"
            columns: ["caregiver_id"]
            isOneToOne: false
            referencedRelation: "caregivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "phone_screens_sourced_candidate_id_fkey"
            columns: ["sourced_candidate_id"]
            isOneToOne: false
            referencedRelation: "sourced_candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      referral_sources: {
        Row: {
          agency_id: string
          county: string | null
          created_at: string | null
          discovered_by: string
          id: string
          language_community: string | null
          name: string
          notes: string | null
          source_type: string
          state: string | null
          url: string | null
        }
        Insert: {
          agency_id: string
          county?: string | null
          created_at?: string | null
          discovered_by?: string
          id?: string
          language_community?: string | null
          name: string
          notes?: string | null
          source_type?: string
          state?: string | null
          url?: string | null
        }
        Update: {
          agency_id?: string
          county?: string | null
          created_at?: string | null
          discovered_by?: string
          id?: string
          language_community?: string | null
          name?: string
          notes?: string | null
          source_type?: string
          state?: string | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referral_sources_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      review_requests: {
        Row: {
          agency_id: string
          caregiver_id: string
          clicked_at: string | null
          completed_at: string | null
          id: string
          max_reminders: number | null
          reminder_count: number | null
          review_link: string | null
          sent_at: string | null
          status: string | null
        }
        Insert: {
          agency_id: string
          caregiver_id: string
          clicked_at?: string | null
          completed_at?: string | null
          id?: string
          max_reminders?: number | null
          reminder_count?: number | null
          review_link?: string | null
          sent_at?: string | null
          status?: string | null
        }
        Update: {
          agency_id?: string
          caregiver_id?: string
          clicked_at?: string | null
          completed_at?: string | null
          id?: string
          max_reminders?: number | null
          reminder_count?: number | null
          review_link?: string | null
          sent_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "review_requests_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_requests_caregiver_id_fkey"
            columns: ["caregiver_id"]
            isOneToOne: false
            referencedRelation: "caregivers"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          agency_id: string
          created_at: string | null
          id: string
          rating: number | null
          responded: boolean | null
          response_text: string | null
          review_text: string | null
          reviewer_name: string | null
          source: string | null
        }
        Insert: {
          agency_id: string
          created_at?: string | null
          id?: string
          rating?: number | null
          responded?: boolean | null
          response_text?: string | null
          review_text?: string | null
          reviewer_name?: string | null
          source?: string | null
        }
        Update: {
          agency_id?: string
          created_at?: string | null
          id?: string
          rating?: number | null
          responded?: boolean | null
          response_text?: string | null
          review_text?: string | null
          reviewer_name?: string | null
          source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_campaign_templates: {
        Row: {
          agency_id: string
          campaign_type: string | null
          channel: string | null
          content: Json | null
          created_at: string | null
          id: string
          performance_rating: string | null
          state: string | null
          tags: string[] | null
          target_language: string | null
          title: string
        }
        Insert: {
          agency_id: string
          campaign_type?: string | null
          channel?: string | null
          content?: Json | null
          created_at?: string | null
          id?: string
          performance_rating?: string | null
          state?: string | null
          tags?: string[] | null
          target_language?: string | null
          title: string
        }
        Update: {
          agency_id?: string
          campaign_type?: string | null
          channel?: string | null
          content?: Json | null
          created_at?: string | null
          id?: string
          performance_rating?: string | null
          state?: string | null
          tags?: string[] | null
          target_language?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_campaign_templates_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      sequence_enrollments: {
        Row: {
          agency_id: string
          caregiver_id: string
          completed_at: string | null
          current_step: number | null
          id: string
          sequence_id: string
          started_at: string | null
          status: string | null
        }
        Insert: {
          agency_id: string
          caregiver_id: string
          completed_at?: string | null
          current_step?: number | null
          id?: string
          sequence_id: string
          started_at?: string | null
          status?: string | null
        }
        Update: {
          agency_id?: string
          caregiver_id?: string
          completed_at?: string | null
          current_step?: number | null
          id?: string
          sequence_id?: string
          started_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sequence_enrollments_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sequence_enrollments_caregiver_id_fkey"
            columns: ["caregiver_id"]
            isOneToOne: false
            referencedRelation: "caregivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sequence_enrollments_sequence_id_fkey"
            columns: ["sequence_id"]
            isOneToOne: false
            referencedRelation: "campaign_sequences"
            referencedColumns: ["id"]
          },
        ]
      }
      sequence_steps: {
        Row: {
          active: boolean | null
          agency_id: string
          ai_generated: boolean | null
          body: string | null
          channel: string
          delay_hours: number
          id: string
          sequence_id: string
          step_number: number
          subject: string | null
        }
        Insert: {
          active?: boolean | null
          agency_id: string
          ai_generated?: boolean | null
          body?: string | null
          channel?: string
          delay_hours?: number
          id?: string
          sequence_id: string
          step_number?: number
          subject?: string | null
        }
        Update: {
          active?: boolean | null
          agency_id?: string
          ai_generated?: boolean | null
          body?: string | null
          channel?: string
          delay_hours?: number
          id?: string
          sequence_id?: string
          step_number?: number
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sequence_steps_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sequence_steps_sequence_id_fkey"
            columns: ["sequence_id"]
            isOneToOne: false
            referencedRelation: "campaign_sequences"
            referencedColumns: ["id"]
          },
        ]
      }
      sourced_candidates: {
        Row: {
          agency_id: string
          city: string | null
          county: string | null
          created_at: string | null
          current_employer: string | null
          current_pay_rate: number | null
          currently_caregiving: boolean | null
          email: string | null
          enrichment_data: Json | null
          enrichment_status: string | null
          full_name: string
          id: string
          languages_spoken: string[] | null
          match_score: number | null
          notes: string | null
          outreach_status: string | null
          phone: string | null
          phone_screen_status: string | null
          promoted_to_caregiver_id: string | null
          source_platform: string | null
          sourcing_campaign_id: string | null
          state: string | null
          updated_at: string | null
          years_experience: number | null
        }
        Insert: {
          agency_id: string
          city?: string | null
          county?: string | null
          created_at?: string | null
          current_employer?: string | null
          current_pay_rate?: number | null
          currently_caregiving?: boolean | null
          email?: string | null
          enrichment_data?: Json | null
          enrichment_status?: string | null
          full_name: string
          id?: string
          languages_spoken?: string[] | null
          match_score?: number | null
          notes?: string | null
          outreach_status?: string | null
          phone?: string | null
          phone_screen_status?: string | null
          promoted_to_caregiver_id?: string | null
          source_platform?: string | null
          sourcing_campaign_id?: string | null
          state?: string | null
          updated_at?: string | null
          years_experience?: number | null
        }
        Update: {
          agency_id?: string
          city?: string | null
          county?: string | null
          created_at?: string | null
          current_employer?: string | null
          current_pay_rate?: number | null
          currently_caregiving?: boolean | null
          email?: string | null
          enrichment_data?: Json | null
          enrichment_status?: string | null
          full_name?: string
          id?: string
          languages_spoken?: string[] | null
          match_score?: number | null
          notes?: string | null
          outreach_status?: string | null
          phone?: string | null
          phone_screen_status?: string | null
          promoted_to_caregiver_id?: string | null
          source_platform?: string | null
          sourcing_campaign_id?: string | null
          state?: string | null
          updated_at?: string | null
          years_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sourced_candidates_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sourced_candidates_promoted_to_caregiver_id_fkey"
            columns: ["promoted_to_caregiver_id"]
            isOneToOne: false
            referencedRelation: "caregivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sourced_candidates_sourcing_campaign_id_fkey"
            columns: ["sourcing_campaign_id"]
            isOneToOne: false
            referencedRelation: "sourcing_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      sourcing_campaigns: {
        Row: {
          agency_id: string
          candidates_enriched: number | null
          candidates_found: number | null
          candidates_pushed: number | null
          county: string | null
          created_at: string | null
          criteria: Json | null
          id: string
          last_run_at: string | null
          max_candidates: number | null
          name: string
          schedule: string | null
          state: string | null
          status: string | null
          target_language: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          agency_id: string
          candidates_enriched?: number | null
          candidates_found?: number | null
          candidates_pushed?: number | null
          county?: string | null
          created_at?: string | null
          criteria?: Json | null
          id?: string
          last_run_at?: string | null
          max_candidates?: number | null
          name: string
          schedule?: string | null
          state?: string | null
          status?: string | null
          target_language?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          agency_id?: string
          candidates_enriched?: number | null
          candidates_found?: number | null
          candidates_pushed?: number | null
          county?: string | null
          created_at?: string | null
          criteria?: Json | null
          id?: string
          last_run_at?: string | null
          max_candidates?: number | null
          name?: string
          schedule?: string | null
          state?: string | null
          status?: string | null
          target_language?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sourcing_campaigns_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_agency_id: { Args: never; Returns: string }
      get_user_agency_role: {
        Args: { _agency_id: string; _user_id: string }
        Returns: Database["public"]["Enums"]["agency_role"]
      }
      has_agency_role: {
        Args: {
          _agency_id: string
          _role: Database["public"]["Enums"]["agency_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_agency_member: {
        Args: { _agency_id: string; _user_id: string }
        Returns: boolean
      }
      is_owner_or_admin: {
        Args: { _agency_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      agency_role:
        | "owner"
        | "admin"
        | "operations_manager"
        | "intake_coordinator"
        | "viewer"
      campaign_type: "recruitment" | "marketing" | "social" | "community"
      lead_source:
        | "indeed"
        | "ziprecruiter"
        | "care_com"
        | "craigslist"
        | "facebook"
        | "referral"
        | "community"
        | "organic"
        | "direct"
        | "poaching"
        | "other"
      lead_status:
        | "new"
        | "contacted"
        | "intake_started"
        | "enrollment_pending"
        | "authorized"
        | "active"
        | "lost"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      agency_role: [
        "owner",
        "admin",
        "operations_manager",
        "intake_coordinator",
        "viewer",
      ],
      campaign_type: ["recruitment", "marketing", "social", "community"],
      lead_source: [
        "indeed",
        "ziprecruiter",
        "care_com",
        "craigslist",
        "facebook",
        "referral",
        "community",
        "organic",
        "direct",
        "poaching",
        "other",
      ],
      lead_status: [
        "new",
        "contacted",
        "intake_started",
        "enrollment_pending",
        "authorized",
        "active",
        "lost",
      ],
    },
  },
} as const
