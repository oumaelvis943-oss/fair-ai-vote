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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      ai_audit_trail: {
        Row: {
          ai_model_version: string
          candidate_id: string
          confidence_score: number | null
          decision_type: string
          id: string
          input_data: Json
          output_data: Json
          processing_time_ms: number | null
          timestamp: string | null
        }
        Insert: {
          ai_model_version?: string
          candidate_id: string
          confidence_score?: number | null
          decision_type: string
          id?: string
          input_data: Json
          output_data: Json
          processing_time_ms?: number | null
          timestamp?: string | null
        }
        Update: {
          ai_model_version?: string
          candidate_id?: string
          confidence_score?: number | null
          decision_type?: string
          id?: string
          input_data?: Json
          output_data?: Json
          processing_time_ms?: number | null
          timestamp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_audit_trail_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      candidate_applications: {
        Row: {
          candidate_id: string
          created_at: string | null
          criterion_id: string
          id: string
          normalized_score: number | null
          response_data: Json
          updated_at: string | null
        }
        Insert: {
          candidate_id: string
          created_at?: string | null
          criterion_id: string
          id?: string
          normalized_score?: number | null
          response_data?: Json
          updated_at?: string | null
        }
        Update: {
          candidate_id?: string
          created_at?: string | null
          criterion_id?: string
          id?: string
          normalized_score?: number | null
          response_data?: Json
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "candidate_applications_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_applications_criterion_id_fkey"
            columns: ["criterion_id"]
            isOneToOne: false
            referencedRelation: "candidate_evaluation_criteria"
            referencedColumns: ["id"]
          },
        ]
      }
      candidate_evaluation_criteria: {
        Row: {
          created_at: string | null
          criterion_name: string
          criterion_type: string
          election_id: string
          id: string
          is_required: boolean | null
          options: Json | null
          weight: number
        }
        Insert: {
          created_at?: string | null
          criterion_name: string
          criterion_type: string
          election_id: string
          id?: string
          is_required?: boolean | null
          options?: Json | null
          weight?: number
        }
        Update: {
          created_at?: string | null
          criterion_name?: string
          criterion_type?: string
          election_id?: string
          id?: string
          is_required?: boolean | null
          options?: Json | null
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "candidate_evaluation_criteria_election_id_fkey"
            columns: ["election_id"]
            isOneToOne: false
            referencedRelation: "elections"
            referencedColumns: ["id"]
          },
        ]
      }
      candidates: {
        Row: {
          ai_ranking: number | null
          ai_score: number | null
          application_files: string[] | null
          created_at: string
          election_id: string
          evaluation_data: Json | null
          id: string
          platform_statement: string | null
          position: string | null
          status: string
          updated_at: string
          user_id: string
          verification_status: string | null
        }
        Insert: {
          ai_ranking?: number | null
          ai_score?: number | null
          application_files?: string[] | null
          created_at?: string
          election_id: string
          evaluation_data?: Json | null
          id?: string
          platform_statement?: string | null
          position?: string | null
          status?: string
          updated_at?: string
          user_id: string
          verification_status?: string | null
        }
        Update: {
          ai_ranking?: number | null
          ai_score?: number | null
          application_files?: string[] | null
          created_at?: string
          election_id?: string
          evaluation_data?: Json | null
          id?: string
          platform_statement?: string | null
          position?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          verification_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "candidates_election_id_fkey"
            columns: ["election_id"]
            isOneToOne: false
            referencedRelation: "elections"
            referencedColumns: ["id"]
          },
        ]
      }
      election_analytics: {
        Row: {
          additional_data: Json | null
          candidate_id: string | null
          election_id: string
          id: string
          metric_type: string
          metric_value: number
          timestamp: string
        }
        Insert: {
          additional_data?: Json | null
          candidate_id?: string | null
          election_id: string
          id?: string
          metric_type: string
          metric_value?: number
          timestamp?: string
        }
        Update: {
          additional_data?: Json | null
          candidate_id?: string | null
          election_id?: string
          id?: string
          metric_type?: string
          metric_value?: number
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "election_analytics_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "election_analytics_election_id_fkey"
            columns: ["election_id"]
            isOneToOne: false
            referencedRelation: "elections"
            referencedColumns: ["id"]
          },
        ]
      }
      election_reports: {
        Row: {
          created_at: string | null
          election_id: string
          generated_by: string
          id: string
          report_data: Json
          report_type: string
        }
        Insert: {
          created_at?: string | null
          election_id: string
          generated_by: string
          id?: string
          report_data?: Json
          report_type: string
        }
        Update: {
          created_at?: string | null
          election_id?: string
          generated_by?: string
          id?: string
          report_data?: Json
          report_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "election_reports_election_id_fkey"
            columns: ["election_id"]
            isOneToOne: false
            referencedRelation: "elections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "election_reports_generated_by_fkey"
            columns: ["generated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      elections: {
        Row: {
          ai_evaluation_enabled: boolean | null
          blockchain_verification: boolean | null
          created_at: string
          created_by: string
          custom_form_schema: Json | null
          description: string | null
          eligibility_criteria: Json | null
          end_date: string
          id: string
          is_public: boolean | null
          max_candidates: number | null
          positions: Json | null
          require_approval: boolean | null
          start_date: string
          status: string
          title: string
          updated_at: string
          voter_list_uploaded: boolean | null
          voting_algorithm: string | null
        }
        Insert: {
          ai_evaluation_enabled?: boolean | null
          blockchain_verification?: boolean | null
          created_at?: string
          created_by: string
          custom_form_schema?: Json | null
          description?: string | null
          eligibility_criteria?: Json | null
          end_date: string
          id?: string
          is_public?: boolean | null
          max_candidates?: number | null
          positions?: Json | null
          require_approval?: boolean | null
          start_date: string
          status?: string
          title: string
          updated_at?: string
          voter_list_uploaded?: boolean | null
          voting_algorithm?: string | null
        }
        Update: {
          ai_evaluation_enabled?: boolean | null
          blockchain_verification?: boolean | null
          created_at?: string
          created_by?: string
          custom_form_schema?: Json | null
          description?: string | null
          eligibility_criteria?: Json | null
          end_date?: string
          id?: string
          is_public?: boolean | null
          max_candidates?: number | null
          positions?: Json | null
          require_approval?: boolean | null
          start_date?: string
          status?: string
          title?: string
          updated_at?: string
          voter_list_uploaded?: boolean | null
          voting_algorithm?: string | null
        }
        Relationships: []
      }
      eligible_voters: {
        Row: {
          additional_info: Json | null
          created_at: string
          election_id: string
          email: string
          full_name: string | null
          id: string
          updated_at: string
          voter_id_number: string | null
        }
        Insert: {
          additional_info?: Json | null
          created_at?: string
          election_id: string
          email: string
          full_name?: string | null
          id?: string
          updated_at?: string
          voter_id_number?: string | null
        }
        Update: {
          additional_info?: Json | null
          created_at?: string
          election_id?: string
          email?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          voter_id_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "eligible_voters_election_id_fkey"
            columns: ["election_id"]
            isOneToOne: false
            referencedRelation: "elections"
            referencedColumns: ["id"]
          },
        ]
      }
      encrypted_votes: {
        Row: {
          block_id: string | null
          created_at: string
          digital_signature: string
          election_id: string
          encrypted_vote: string
          id: string
          timestamp: string
          verification_status: string
          vote_hash: string
          voter_public_key: string
        }
        Insert: {
          block_id?: string | null
          created_at?: string
          digital_signature: string
          election_id: string
          encrypted_vote: string
          id?: string
          timestamp?: string
          verification_status?: string
          vote_hash: string
          voter_public_key: string
        }
        Update: {
          block_id?: string | null
          created_at?: string
          digital_signature?: string
          election_id?: string
          encrypted_vote?: string
          id?: string
          timestamp?: string
          verification_status?: string
          vote_hash?: string
          voter_public_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "encrypted_votes_block_id_fkey"
            columns: ["block_id"]
            isOneToOne: false
            referencedRelation: "vote_blocks"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          election_id: string | null
          id: string
          message: string
          read: boolean | null
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          election_id?: string | null
          id?: string
          message: string
          read?: boolean | null
          title: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          election_id?: string | null
          id?: string
          message?: string
          read?: boolean | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          role?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_verification: {
        Row: {
          created_at: string | null
          id: string
          status: string
          user_id: string
          verification_data: Json
          verification_type: string
          verified_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          status?: string
          user_id: string
          verification_data?: Json
          verification_type: string
          verified_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          status?: string
          user_id?: string
          verification_data?: Json
          verification_type?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_verification_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      vote_audit_trail: {
        Row: {
          election_id: string | null
          event_data: Json | null
          event_type: string
          id: string
          ip_address: string | null
          timestamp: string
          user_agent: string | null
          voter_id: string | null
        }
        Insert: {
          election_id?: string | null
          event_data?: Json | null
          event_type: string
          id?: string
          ip_address?: string | null
          timestamp?: string
          user_agent?: string | null
          voter_id?: string | null
        }
        Update: {
          election_id?: string | null
          event_data?: Json | null
          event_type?: string
          id?: string
          ip_address?: string | null
          timestamp?: string
          user_agent?: string | null
          voter_id?: string | null
        }
        Relationships: []
      }
      vote_blocks: {
        Row: {
          block_hash: string
          block_number: number
          created_at: string
          id: string
          merkle_root: string
          nonce: string
          previous_block_hash: string | null
          timestamp: string
          votes_count: number
        }
        Insert: {
          block_hash: string
          block_number: number
          created_at?: string
          id?: string
          merkle_root: string
          nonce: string
          previous_block_hash?: string | null
          timestamp?: string
          votes_count?: number
        }
        Update: {
          block_hash?: string
          block_number?: number
          created_at?: string
          id?: string
          merkle_root?: string
          nonce?: string
          previous_block_hash?: string | null
          timestamp?: string
          votes_count?: number
        }
        Relationships: []
      }
      votes: {
        Row: {
          candidate_id: string
          created_at: string
          election_id: string
          id: string
          vote_hash: string
          voter_id: string
        }
        Insert: {
          candidate_id: string
          created_at?: string
          election_id: string
          id?: string
          vote_hash: string
          voter_id: string
        }
        Update: {
          candidate_id?: string
          created_at?: string
          election_id?: string
          id?: string
          vote_hash?: string
          voter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "votes_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_election_id_fkey"
            columns: ["election_id"]
            isOneToOne: false
            referencedRelation: "elections"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_candidate_ai_score: {
        Args: { candidate_uuid: string }
        Returns: number
      }
      get_latest_block: {
        Args: Record<PropertyKey, never>
        Returns: {
          block_hash: string
          block_number: number
          created_at: string
          id: string
          merkle_root: string
          nonce: string
          previous_block_hash: string | null
          timestamp: string
          votes_count: number
        }
      }
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
    Enums: {},
  },
} as const
