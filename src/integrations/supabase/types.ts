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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      assets: {
        Row: {
          created_at: string
          duration_ms: number
          expires_at: string
          filename: string
          has_video: boolean
          height: number | null
          id: string
          kind: string
          mime_type: string
          project_id: string
          role: string
          size_bytes: number
          storage_path: string
          user_id: string
          width: number | null
        }
        Insert: {
          created_at?: string
          duration_ms: number
          expires_at?: string
          filename: string
          has_video?: boolean
          height?: number | null
          id?: string
          kind?: string
          mime_type: string
          project_id: string
          role?: string
          size_bytes: number
          storage_path: string
          user_id: string
          width?: number | null
        }
        Update: {
          created_at?: string
          duration_ms?: number
          expires_at?: string
          filename?: string
          has_video?: boolean
          height?: number | null
          id?: string
          kind?: string
          mime_type?: string
          project_id?: string
          role?: string
          size_bytes?: number
          storage_path?: string
          user_id?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "assets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      caption_docs: {
        Row: {
          asset_id: string | null
          language: string
          length_mode: string
          project_id: string
          revision: number
          segments: Json
          style: Json | null
          updated_at: string
          user_id: string
          words: Json
        }
        Insert: {
          asset_id?: string | null
          language: string
          length_mode: string
          project_id: string
          revision?: number
          segments?: Json
          style?: Json | null
          updated_at?: string
          user_id: string
          words?: Json
        }
        Update: {
          asset_id?: string | null
          language?: string
          length_mode?: string
          project_id?: string
          revision?: number
          segments?: Json
          style?: Json | null
          updated_at?: string
          user_id?: string
          words?: Json
        }
        Relationships: [
          {
            foreignKeyName: "caption_docs_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "caption_docs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          duration_ms: number | null
          error_code: string | null
          id: string
          name: string
          outcome: string | null
          tool: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          duration_ms?: number | null
          error_code?: string | null
          id?: string
          name: string
          outcome?: string | null
          tool?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          duration_ms?: number | null
          error_code?: string | null
          id?: string
          name?: string
          outcome?: string | null
          tool?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      jobs: {
        Row: {
          asset_id: string | null
          created_at: string
          duration_ms: number | null
          error_code: string | null
          finished_at: string | null
          id: string
          params: Json
          project_id: string
          status: string
          type: string
          user_id: string
        }
        Insert: {
          asset_id?: string | null
          created_at?: string
          duration_ms?: number | null
          error_code?: string | null
          finished_at?: string | null
          id?: string
          params?: Json
          project_id: string
          status?: string
          type: string
          user_id: string
        }
        Update: {
          asset_id?: string | null
          created_at?: string
          duration_ms?: number | null
          error_code?: string | null
          finished_at?: string | null
          id?: string
          params?: Json
          project_id?: string
          status?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      preferences: {
        Row: {
          caption_language: string
          caption_length_mode: string
          caption_style: Json | null
          custom_words: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          caption_language?: string
          caption_length_mode?: string
          caption_style?: Json | null
          custom_words?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          caption_language?: string
          caption_length_mode?: string
          caption_style?: Json | null
          custom_words?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          first_intent: string | null
          last_sign_in_at: string | null
          terms_accepted_at: string | null
          terms_version: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          first_intent?: string | null
          last_sign_in_at?: string | null
          terms_accepted_at?: string | null
          terms_version?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          first_intent?: string | null
          last_sign_in_at?: string | null
          terms_accepted_at?: string | null
          terms_version?: string | null
          user_id?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          created_at: string
          duration_ms: number | null
          id: string
          last_tool: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_ms?: number | null
          id?: string
          last_tool?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          duration_ms?: number | null
          id?: string
          last_tool?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      usage_ledger: {
        Row: {
          created_at: string
          id: string
          job_id: string
          period_start: string
          seconds: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          job_id: string
          period_start: string
          seconds: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          job_id?: string
          period_start?: string
          seconds?: number
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
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
