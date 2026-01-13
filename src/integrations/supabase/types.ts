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
      calendar_contacts: {
        Row: {
          address: string | null
          brand_notes: string | null
          company_name: string
          contact_name: string | null
          created_at: string | null
          cta_style: string | null
          email: string | null
          emoji_style: string | null
          facebook_url: string | null
          forbidden_words: string[] | null
          google_business_url: string | null
          id: string
          instagram_url: string | null
          linkedin_url: string | null
          phone: string | null
          tone_style: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          brand_notes?: string | null
          company_name: string
          contact_name?: string | null
          created_at?: string | null
          cta_style?: string | null
          email?: string | null
          emoji_style?: string | null
          facebook_url?: string | null
          forbidden_words?: string[] | null
          google_business_url?: string | null
          id?: string
          instagram_url?: string | null
          linkedin_url?: string | null
          phone?: string | null
          tone_style?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          brand_notes?: string | null
          company_name?: string
          contact_name?: string | null
          created_at?: string | null
          cta_style?: string | null
          email?: string | null
          emoji_style?: string | null
          facebook_url?: string | null
          forbidden_words?: string[] | null
          google_business_url?: string | null
          id?: string
          instagram_url?: string | null
          linkedin_url?: string | null
          phone?: string | null
          tone_style?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      calendar_posts: {
        Row: {
          ai_copy_prompt: string | null
          ai_generated: boolean | null
          ai_image_prompt: string | null
          calendar_id: string
          copy: string | null
          created_at: string
          day_of_month: number | null
          id: string
          image_source: string | null
          image_url: string | null
          month_name: string
          month_year: number
          objective: string | null
          post_format: string | null
          post_order: number | null
          theme_context: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          ai_copy_prompt?: string | null
          ai_generated?: boolean | null
          ai_image_prompt?: string | null
          calendar_id: string
          copy?: string | null
          created_at?: string
          day_of_month?: number | null
          id?: string
          image_source?: string | null
          image_url?: string | null
          month_name: string
          month_year: number
          objective?: string | null
          post_format?: string | null
          post_order?: number | null
          theme_context?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          ai_copy_prompt?: string | null
          ai_generated?: boolean | null
          ai_image_prompt?: string | null
          calendar_id?: string
          copy?: string | null
          created_at?: string
          day_of_month?: number | null
          id?: string
          image_source?: string | null
          image_url?: string | null
          month_name?: string
          month_year?: number
          objective?: string | null
          post_format?: string | null
          post_order?: number | null
          theme_context?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_posts_calendar_id_fkey"
            columns: ["calendar_id"]
            isOneToOne: false
            referencedRelation: "content_calendars"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          created_at: string | null
          id: string
          name: string
          workspace_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          workspace_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          workspace_id?: string | null
        }
        Relationships: []
      }
      competencia_reports: {
        Row: {
          beneficiary_name: string
          created_at: string
          id: string
          nif: string | null
          pdf_path: string | null
          period_end: string | null
          period_start: string | null
          report_data: Json | null
          report_date: string
          status: string
          updated_at: string
          website_url: string
          word_path: string | null
        }
        Insert: {
          beneficiary_name: string
          created_at?: string
          id?: string
          nif?: string | null
          pdf_path?: string | null
          period_end?: string | null
          period_start?: string | null
          report_data?: Json | null
          report_date?: string
          status?: string
          updated_at?: string
          website_url: string
          word_path?: string | null
        }
        Update: {
          beneficiary_name?: string
          created_at?: string
          id?: string
          nif?: string | null
          pdf_path?: string | null
          period_end?: string | null
          period_start?: string | null
          report_data?: Json | null
          report_date?: string
          status?: string
          updated_at?: string
          website_url?: string
          word_path?: string | null
        }
        Relationships: []
      }
      content_calendar_edits: {
        Row: {
          action: string
          calendar_id: string
          created_at: string | null
          details: Json | null
          id: string
          performed_by: string | null
          template_name: string | null
        }
        Insert: {
          action: string
          calendar_id: string
          created_at?: string | null
          details?: Json | null
          id?: string
          performed_by?: string | null
          template_name?: string | null
        }
        Update: {
          action?: string
          calendar_id?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          performed_by?: string | null
          template_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_calendar_edits_calendar_id_fkey"
            columns: ["calendar_id"]
            isOneToOne: false
            referencedRelation: "content_calendars"
            referencedColumns: ["id"]
          },
        ]
      }
      content_calendar_responsibles: {
        Row: {
          calendar_id: string
          created_at: string | null
          id: string
          team_member_id: string
        }
        Insert: {
          calendar_id: string
          created_at?: string | null
          id?: string
          team_member_id: string
        }
        Update: {
          calendar_id?: string
          created_at?: string | null
          id?: string
          team_member_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_calendar_responsibles_calendar_id_fkey"
            columns: ["calendar_id"]
            isOneToOne: false
            referencedRelation: "content_calendars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_calendar_responsibles_team_member_id_fkey"
            columns: ["team_member_id"]
            isOneToOne: false
            referencedRelation: "team_members_calendar"
            referencedColumns: ["id"]
          },
        ]
      }
      content_calendars: {
        Row: {
          agencies: string[]
          approval_status: string | null
          approved_at: string | null
          approved_via: string | null
          calendar_contact_id: string
          channel: string
          created_at: string | null
          feedback_status: string | null
          id: string
          month_end: string
          month_start: string
          pdf_generated_at: string | null
          pdf_url: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          agencies?: string[]
          approval_status?: string | null
          approved_at?: string | null
          approved_via?: string | null
          calendar_contact_id: string
          channel: string
          created_at?: string | null
          feedback_status?: string | null
          id?: string
          month_end: string
          month_start: string
          pdf_generated_at?: string | null
          pdf_url?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          agencies?: string[]
          approval_status?: string | null
          approved_at?: string | null
          approved_via?: string | null
          calendar_contact_id?: string
          channel?: string
          created_at?: string | null
          feedback_status?: string | null
          id?: string
          month_end?: string
          month_start?: string
          pdf_generated_at?: string | null
          pdf_url?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_calendars_calendar_contact_id_fkey"
            columns: ["calendar_contact_id"]
            isOneToOne: false
            referencedRelation: "calendar_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      content_profiles: {
        Row: {
          brand_summary: string | null
          confidence_score: number | null
          contact_id: string
          created_at: string
          hashtags_base: Json | null
          id: string
          last_analyzed_at: string | null
          source_data: Json | null
          tone_guidelines: Json | null
          updated_at: string
          visual_style: Json | null
          vocabulary: Json | null
        }
        Insert: {
          brand_summary?: string | null
          confidence_score?: number | null
          contact_id: string
          created_at?: string
          hashtags_base?: Json | null
          id?: string
          last_analyzed_at?: string | null
          source_data?: Json | null
          tone_guidelines?: Json | null
          updated_at?: string
          visual_style?: Json | null
          vocabulary?: Json | null
        }
        Update: {
          brand_summary?: string | null
          confidence_score?: number | null
          contact_id?: string
          created_at?: string
          hashtags_base?: Json | null
          id?: string
          last_analyzed_at?: string | null
          source_data?: Json | null
          tone_guidelines?: Json | null
          updated_at?: string
          visual_style?: Json | null
          vocabulary?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "content_profiles_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: true
            referencedRelation: "calendar_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          calendar_id: string | null
          content_json: Json
          created_at: string
          id: string
          updated_at: string
          visible_months: string[] | null
        }
        Insert: {
          calendar_id?: string | null
          content_json: Json
          created_at?: string
          id?: string
          updated_at?: string
          visible_months?: string[] | null
        }
        Update: {
          calendar_id?: string | null
          content_json?: Json
          created_at?: string
          id?: string
          updated_at?: string
          visible_months?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_calendar_id_fkey"
            columns: ["calendar_id"]
            isOneToOne: false
            referencedRelation: "content_calendars"
            referencedColumns: ["id"]
          },
        ]
      }
      ecommerce_reports: {
        Row: {
          beneficiary_name: string
          created_at: string
          id: string
          nif: string | null
          pdf_path: string | null
          period_end: string | null
          period_start: string | null
          report_data: Json | null
          report_date: string
          service_end: string | null
          service_start: string | null
          status: string
          updated_at: string
          website_url: string
          word_path: string | null
        }
        Insert: {
          beneficiary_name: string
          created_at?: string
          id?: string
          nif?: string | null
          pdf_path?: string | null
          period_end?: string | null
          period_start?: string | null
          report_data?: Json | null
          report_date?: string
          service_end?: string | null
          service_start?: string | null
          status?: string
          updated_at?: string
          website_url: string
          word_path?: string | null
        }
        Update: {
          beneficiary_name?: string
          created_at?: string
          id?: string
          nif?: string | null
          pdf_path?: string | null
          period_end?: string | null
          period_start?: string | null
          report_data?: Json | null
          report_date?: string
          service_end?: string | null
          service_start?: string | null
          status?: string
          updated_at?: string
          website_url?: string
          word_path?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          id: string
          name: string | null
          workspace_id: string
        }
        Insert: {
          created_at?: string | null
          id: string
          name?: string | null
          workspace_id?: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string | null
          workspace_id?: string
        }
        Relationships: []
      }
      proposals: {
        Row: {
          created_at: string
          document_id: string
          id: string
          notified_at: string | null
          proposal_json: Json
          status: string
          submitted_at: string | null
          token: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          document_id: string
          id?: string
          notified_at?: string | null
          proposal_json?: Json
          status?: string
          submitted_at?: string | null
          token: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          document_id?: string
          id?: string
          notified_at?: string | null
          proposal_json?: Json
          status?: string
          submitted_at?: string | null
          token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "proposals_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      seguimiento_reports: {
        Row: {
          beneficiary_name: string
          created_at: string
          id: string
          nif: string | null
          pdf_path: string | null
          period_end: string | null
          period_start: string | null
          report_data: Json | null
          report_date: string
          status: string
          updated_at: string
          website_url: string
          word_path: string | null
        }
        Insert: {
          beneficiary_name: string
          created_at?: string
          id?: string
          nif?: string | null
          pdf_path?: string | null
          period_end?: string | null
          period_start?: string | null
          report_data?: Json | null
          report_date?: string
          status?: string
          updated_at?: string
          website_url: string
          word_path?: string | null
        }
        Update: {
          beneficiary_name?: string
          created_at?: string
          id?: string
          nif?: string | null
          pdf_path?: string | null
          period_end?: string | null
          period_start?: string | null
          report_data?: Json | null
          report_date?: string
          status?: string
          updated_at?: string
          website_url?: string
          word_path?: string | null
        }
        Relationships: []
      }
      seo_web_reports: {
        Row: {
          beneficiary: string | null
          case_key: string | null
          created_at: string
          id: string
          image_hash: string | null
          meta: Json | null
          missing: string[] | null
          pdf_path: string | null
          report_date: string | null
          service_period: string | null
          site_url: string
          status: string
          updated_at: string
          vision_report_id: string | null
          word_path: string | null
        }
        Insert: {
          beneficiary?: string | null
          case_key?: string | null
          created_at?: string
          id?: string
          image_hash?: string | null
          meta?: Json | null
          missing?: string[] | null
          pdf_path?: string | null
          report_date?: string | null
          service_period?: string | null
          site_url: string
          status?: string
          updated_at?: string
          vision_report_id?: string | null
          word_path?: string | null
        }
        Update: {
          beneficiary?: string | null
          case_key?: string | null
          created_at?: string
          id?: string
          image_hash?: string | null
          meta?: Json | null
          missing?: string[] | null
          pdf_path?: string | null
          report_date?: string | null
          service_period?: string | null
          site_url?: string
          status?: string
          updated_at?: string
          vision_report_id?: string | null
          word_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "seo_web_reports_vision_report_id_fkey"
            columns: ["vision_report_id"]
            isOneToOne: false
            referencedRelation: "vision_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      share_links: {
        Row: {
          can_propose: boolean
          can_view: boolean
          created_at: string
          document_id: string
          expires_at: string | null
          id: string
          token: string
        }
        Insert: {
          can_propose?: boolean
          can_view?: boolean
          created_at?: string
          document_id: string
          expires_at?: string | null
          id?: string
          token: string
        }
        Update: {
          can_propose?: boolean
          can_view?: boolean
          created_at?: string
          document_id?: string
          expires_at?: string | null
          id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "share_links_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members_calendar: {
        Row: {
          created_at: string | null
          email: string
          id: string
          is_active: boolean | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          is_active?: boolean | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          is_active?: boolean | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vision_reports: {
        Row: {
          case_id: string
          created_at: string
          id: string
          missing: string[]
          report_data: Json
          updated_at: string
        }
        Insert: {
          case_id: string
          created_at?: string
          id?: string
          missing?: string[]
          report_data?: Json
          updated_at?: string
        }
        Update: {
          case_id?: string
          created_at?: string
          id?: string
          missing?: string[]
          report_data?: Json
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_workspace: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "manager" | "member"
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
      app_role: ["admin", "manager", "member"],
    },
  },
} as const
