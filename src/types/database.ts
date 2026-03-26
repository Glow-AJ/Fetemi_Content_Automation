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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      article_drafts: {
        Row: {
          angle: string | null
          character_count: number | null
          content: string | null
          created_at: string | null
          id: string
          image_url: string | null
          job_id: string | null
          manager_feedback: string | null
          revision_round: number | null
          selected: boolean | null
          seo_validation_score: Json | null
          status: Database["public"]["Enums"]["draft_status"] | null
          updated_at: string | null
          user_id: string
          word_count: number | null
        }
        Insert: {
          angle?: string | null
          character_count?: number | null
          content?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          job_id?: string | null
          manager_feedback?: string | null
          revision_round?: number | null
          selected?: boolean | null
          seo_validation_score?: Json | null
          status?: Database["public"]["Enums"]["draft_status"] | null
          updated_at?: string | null
          user_id: string
          word_count?: number | null
        }
        Update: {
          angle?: string | null
          character_count?: number | null
          content?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          job_id?: string | null
          manager_feedback?: string | null
          revision_round?: number | null
          selected?: boolean | null
          seo_validation_score?: Json | null
          status?: Database["public"]["Enums"]["draft_status"] | null
          updated_at?: string | null
          user_id?: string
          word_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "article_drafts_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "content_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      content_jobs: {
        Row: {
          created_at: string | null
          duplicate_warning: boolean | null
          error_message: string | null
          id: string
          input_hash: string | null
          input_type: string | null
          is_retry: boolean | null
          normalised_idea: string | null
          original_input: string
          revision_count: number | null
          search_phrase: string | null
          source_url: string | null
          status: Database["public"]["Enums"]["job_status"] | null
          updated_at: string | null
          url_type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          duplicate_warning?: boolean | null
          error_message?: string | null
          id?: string
          input_hash?: string | null
          input_type?: string | null
          is_retry?: boolean | null
          normalised_idea?: string | null
          original_input: string
          revision_count?: number | null
          search_phrase?: string | null
          source_url?: string | null
          status?: Database["public"]["Enums"]["job_status"] | null
          updated_at?: string | null
          url_type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          duplicate_warning?: boolean | null
          error_message?: string | null
          id?: string
          input_hash?: string | null
          input_type?: string | null
          is_retry?: boolean | null
          normalised_idea?: string | null
          original_input?: string
          revision_count?: number | null
          search_phrase?: string | null
          source_url?: string | null
          status?: Database["public"]["Enums"]["job_status"] | null
          updated_at?: string | null
          url_type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      job_errors: {
        Row: {
          created_at: string | null
          error_description: string | null
          execution_url: string | null
          id: string
          job_id: string | null
          message: string | null
          node_name: string | null
          raw_error: Json | null
          updated_at: string | null
          user_id: string
          workflow_name: string | null
          workflow_phase: string | null
        }
        Insert: {
          created_at?: string | null
          error_description?: string | null
          execution_url?: string | null
          id?: string
          job_id?: string | null
          message?: string | null
          node_name?: string | null
          raw_error?: Json | null
          updated_at?: string | null
          user_id: string
          workflow_name?: string | null
          workflow_phase?: string | null
        }
        Update: {
          created_at?: string | null
          error_description?: string | null
          execution_url?: string | null
          id?: string
          job_id?: string | null
          message?: string | null
          node_name?: string | null
          raw_error?: Json | null
          updated_at?: string | null
          user_id?: string
          workflow_name?: string | null
          workflow_phase?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_errors_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "content_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_status_history: {
        Row: {
          created_at: string | null
          id: string
          job_id: string | null
          status: Database["public"]["Enums"]["job_status"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          job_id?: string | null
          status: Database["public"]["Enums"]["job_status"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          job_id?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_status_history_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "content_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_sends: {
        Row: {
          created_at: string | null
          error: string | null
          id: string
          job_id: string | null
          post_id: string | null
          status: Database["public"]["Enums"]["publish_status"]
          subscriber_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          error?: string | null
          id?: string
          job_id?: string | null
          post_id?: string | null
          status: Database["public"]["Enums"]["publish_status"]
          subscriber_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          error?: string | null
          id?: string
          job_id?: string | null
          post_id?: string | null
          status?: Database["public"]["Enums"]["publish_status"]
          subscriber_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "newsletter_sends_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "content_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "newsletter_sends_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "platform_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "newsletter_sends_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "subscribers"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          job_id: string | null
          message: string | null
          read: boolean | null
          type: Database["public"]["Enums"]["notification_type"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          job_id?: string | null
          message?: string | null
          read?: boolean | null
          type: Database["public"]["Enums"]["notification_type"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          job_id?: string | null
          message?: string | null
          read?: boolean | null
          type?: Database["public"]["Enums"]["notification_type"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "content_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_connections: {
        Row: {
          created_at: string | null
          credential_reference_id: string | null
          id: string
          last_verified_at: string | null
          platform: Database["public"]["Enums"]["platform_type"]
          status: Database["public"]["Enums"]["connection_status"] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          credential_reference_id?: string | null
          id?: string
          last_verified_at?: string | null
          platform: Database["public"]["Enums"]["platform_type"]
          status?: Database["public"]["Enums"]["connection_status"] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          credential_reference_id?: string | null
          id?: string
          last_verified_at?: string | null
          platform?: Database["public"]["Enums"]["platform_type"]
          status?: Database["public"]["Enums"]["connection_status"] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      platform_posts: {
        Row: {
          character_count: number | null
          content: string | null
          created_at: string | null
          id: string
          job_id: string | null
          platform: Database["public"]["Enums"]["platform_type"]
          publish_at: string | null
          status: Database["public"]["Enums"]["post_status"] | null
          subject_line: string | null
          updated_at: string | null
          user_id: string
          word_count: number | null
        }
        Insert: {
          character_count?: number | null
          content?: string | null
          created_at?: string | null
          id?: string
          job_id?: string | null
          platform: Database["public"]["Enums"]["platform_type"]
          publish_at?: string | null
          status?: Database["public"]["Enums"]["post_status"] | null
          subject_line?: string | null
          updated_at?: string | null
          user_id: string
          word_count?: number | null
        }
        Update: {
          character_count?: number | null
          content?: string | null
          created_at?: string | null
          id?: string
          job_id?: string | null
          platform?: Database["public"]["Enums"]["platform_type"]
          publish_at?: string | null
          status?: Database["public"]["Enums"]["post_status"] | null
          subject_line?: string | null
          updated_at?: string | null
          user_id?: string
          word_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "platform_posts_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "content_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      publish_log: {
        Row: {
          created_at: string | null
          id: string
          job_id: string | null
          message: string | null
          platform: Database["public"]["Enums"]["platform_type"]
          post_id: string | null
          raw_api_response: Json | null
          success: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          job_id?: string | null
          message?: string | null
          platform: Database["public"]["Enums"]["platform_type"]
          post_id?: string | null
          raw_api_response?: Json | null
          success?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          job_id?: string | null
          message?: string | null
          platform?: Database["public"]["Enums"]["platform_type"]
          post_id?: string | null
          raw_api_response?: Json | null
          success?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "publish_log_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "content_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "publish_log_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "platform_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      seo_briefs: {
        Row: {
          competitor_urls: string[] | null
          created_at: string | null
          external_links: string[] | null
          id: string
          image_context_prompt: string | null
          internal_links: string[] | null
          job_id: string | null
          long_tail_keywords: string[] | null
          paa_questions: string[] | null
          primary_keyword: string | null
          raw_dataforseo_response: Json | null
          short_tail_keywords: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          competitor_urls?: string[] | null
          created_at?: string | null
          external_links?: string[] | null
          id?: string
          image_context_prompt?: string | null
          internal_links?: string[] | null
          job_id?: string | null
          long_tail_keywords?: string[] | null
          paa_questions?: string[] | null
          primary_keyword?: string | null
          raw_dataforseo_response?: Json | null
          short_tail_keywords?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          competitor_urls?: string[] | null
          created_at?: string | null
          external_links?: string[] | null
          id?: string
          image_context_prompt?: string | null
          internal_links?: string[] | null
          job_id?: string | null
          long_tail_keywords?: string[] | null
          paa_questions?: string[] | null
          primary_keyword?: string | null
          raw_dataforseo_response?: Json | null
          short_tail_keywords?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "seo_briefs_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "content_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          created_at: string | null
          id: string
          timezone: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          timezone?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          timezone?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      subscribers: {
        Row: {
          created_at: string | null
          email: string
          id: string
          name: string | null
          status: Database["public"]["Enums"]["subscriber_status"] | null
          subscribed_at: string | null
          unsubscribe_token: string | null
          unsubscribed_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          name?: string | null
          status?: Database["public"]["Enums"]["subscriber_status"] | null
          subscribed_at?: string | null
          unsubscribe_token?: string | null
          unsubscribed_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          name?: string | null
          status?: Database["public"]["Enums"]["subscriber_status"] | null
          subscribed_at?: string | null
          unsubscribe_token?: string | null
          unsubscribed_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      connection_status: "active" | "broken" | "not_connected"
      draft_status:
        | "generated"
        | "failed"
        | "selected"
        | "rejected"
        | "regenerating"
      job_status:
        | "submitted"
        | "seo_research"
        | "drafting"
        | "awaiting_review"
        | "adapting"
        | "ready_to_publish"
        | "scheduling"
        | "published"
        | "failed"
        | "researching"
      notification_type: "info" | "success" | "error"
      platform_type: "linkedin" | "twitter" | "email"
      post_status:
        | "pending"
        | "scheduled"
        | "ready_to_publish"
        | "published"
        | "manually_published"
        | "failed"
      publish_status: "sent" | "failed" | "bounced"
      subscriber_status: "active" | "unsubscribed"
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
      connection_status: ["active", "broken", "not_connected"],
      draft_status: [
        "generated",
        "failed",
        "selected",
        "rejected",
        "regenerating",
      ],
      job_status: [
        "submitted",
        "seo_research",
        "drafting",
        "awaiting_review",
        "adapting",
        "ready_to_publish",
        "scheduling",
        "published",
        "failed",
        "researching",
      ],
      notification_type: ["info", "success", "error"],
      platform_type: ["linkedin", "twitter", "email"],
      post_status: [
        "pending",
        "scheduled",
        "ready_to_publish",
        "published",
        "manually_published",
        "failed",
      ],
      publish_status: ["sent", "failed", "bounced"],
      subscriber_status: ["active", "unsubscribed"],
    },
  },
} as const


export type Job = Database['public']['Tables']['content_jobs']['Row'];
export type Draft = Database['public']['Tables']['article_drafts']['Row'];
export type PlatformPost = Database['public']['Tables']['platform_posts']['Row'];
export type InputType = 'url' | 'idea';
export type UrlType = 'social' | 'paywall' | 'standard';
