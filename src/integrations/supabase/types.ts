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
      candidate_interviews: {
        Row: {
          ai_feedback: Json | null
          audio_file_url: string | null
          candidate_id: string
          created_at: string
          election_id: string
          id: string
          interview_date: string | null
          interview_score: number | null
          transcript: string | null
          updated_at: string
        }
        Insert: {
          ai_feedback?: Json | null
          audio_file_url?: string | null
          candidate_id: string
          created_at?: string
          election_id: string
          id?: string
          interview_date?: string | null
          interview_score?: number | null
          transcript?: string | null
          updated_at?: string
        }
        Update: {
          ai_feedback?: Json | null
          audio_file_url?: string | null
          candidate_id?: string
          created_at?: string
          election_id?: string
          id?: string
          interview_date?: string | null
          interview_score?: number | null
          transcript?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      candidates: {
        Row: {
          ai_ranking: number | null
          ai_score: number | null
          application_files: string[] | null
          created_at: string
          election_id: string
          evaluation_data: Json | null
          form_responses: Json | null
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
          form_responses?: Json | null
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
          form_responses?: Json | null
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
          application_form_fields: Json | null
          auto_end: boolean | null
          auto_start: boolean | null
          blockchain_verification: boolean | null
          created_at: string
          created_by: string
          custom_form_schema: Json | null
          deleted_at: string | null
          description: string | null
          eligibility_criteria: Json | null
          end_date: string
          id: string
          is_public: boolean | null
          max_candidates: number | null
          positions: Json | null
          published_at: string | null
          require_approval: boolean | null
          start_date: string
          status: string
          title: string
          updated_at: string
          voter_list_uploaded: boolean | null
          voting_algorithm: string | null
          voting_ended_at: string | null
          voting_started_at: string | null
        }
        Insert: {
          ai_evaluation_enabled?: boolean | null
          application_form_fields?: Json | null
          auto_end?: boolean | null
          auto_start?: boolean | null
          blockchain_verification?: boolean | null
          created_at?: string
          created_by: string
          custom_form_schema?: Json | null
          deleted_at?: string | null
          description?: string | null
          eligibility_criteria?: Json | null
          end_date: string
          id?: string
          is_public?: boolean | null
          max_candidates?: number | null
          positions?: Json | null
          published_at?: string | null
          require_approval?: boolean | null
          start_date: string
          status?: string
          title: string
          updated_at?: string
          voter_list_uploaded?: boolean | null
          voting_algorithm?: string | null
          voting_ended_at?: string | null
          voting_started_at?: string | null
        }
        Update: {
          ai_evaluation_enabled?: boolean | null
          application_form_fields?: Json | null
          auto_end?: boolean | null
          auto_start?: boolean | null
          blockchain_verification?: boolean | null
          created_at?: string
          created_by?: string
          custom_form_schema?: Json | null
          deleted_at?: string | null
          description?: string | null
          eligibility_criteria?: Json | null
          end_date?: string
          id?: string
          is_public?: boolean | null
          max_candidates?: number | null
          positions?: Json | null
          published_at?: string | null
          require_approval?: boolean | null
          start_date?: string
          status?: string
          title?: string
          updated_at?: string
          voter_list_uploaded?: boolean | null
          voting_algorithm?: string | null
          voting_ended_at?: string | null
          voting_started_at?: string | null
        }
        Relationships: []
      }
      eligible_voters: {
        Row: {
          additional_info: Json | null
          created_at: string
          election_id: string
          eligible_posts: Json | null
          email: string
          full_name: string | null
          google_email: string | null
          has_voted: boolean | null
          house: string | null
          id: string
          residence: string | null
          updated_at: string
          voted_at: string | null
          voter_id_number: string | null
          year_class: string | null
        }
        Insert: {
          additional_info?: Json | null
          created_at?: string
          election_id: string
          eligible_posts?: Json | null
          email: string
          full_name?: string | null
          google_email?: string | null
          has_voted?: boolean | null
          house?: string | null
          id?: string
          residence?: string | null
          updated_at?: string
          voted_at?: string | null
          voter_id_number?: string | null
          year_class?: string | null
        }
        Update: {
          additional_info?: Json | null
          created_at?: string
          election_id?: string
          eligible_posts?: Json | null
          email?: string
          full_name?: string | null
          google_email?: string | null
          has_voted?: boolean | null
          house?: string | null
          id?: string
          residence?: string | null
          updated_at?: string
          voted_at?: string | null
          voter_id_number?: string | null
          year_class?: string | null
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
      email_templates: {
        Row: {
          body_html: string
          body_text: string | null
          created_at: string
          id: string
          subject: string
          template_name: string
          updated_at: string
          variables: Json | null
        }
        Insert: {
          body_html: string
          body_text?: string | null
          created_at?: string
          id?: string
          subject: string
          template_name: string
          updated_at?: string
          variables?: Json | null
        }
        Update: {
          body_html?: string
          body_text?: string | null
          created_at?: string
          id?: string
          subject?: string
          template_name?: string
          updated_at?: string
          variables?: Json | null
        }
        Relationships: []
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
      failed_login_attempts: {
        Row: {
          attempted_at: string
          email: string
          id: string
          ip_address: string
          user_agent: string | null
        }
        Insert: {
          attempted_at?: string
          email: string
          id?: string
          ip_address: string
          user_agent?: string | null
        }
        Update: {
          attempted_at?: string
          email?: string
          id?: string
          ip_address?: string
          user_agent?: string | null
        }
        Relationships: []
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
      rate_limits: {
        Row: {
          created_at: string
          endpoint: string
          id: string
          identifier: string
          request_count: number
          window_start: string
        }
        Insert: {
          created_at?: string
          endpoint: string
          id?: string
          identifier: string
          request_count?: number
          window_start?: string
        }
        Update: {
          created_at?: string
          endpoint?: string
          id?: string
          identifier?: string
          request_count?: number
          window_start?: string
        }
        Relationships: []
      }
      request_logs: {
        Row: {
          endpoint: string
          error_message: string | null
          id: string
          ip_address: string | null
          method: string
          request_body: Json | null
          response_time_ms: number | null
          status_code: number | null
          timestamp: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          endpoint: string
          error_message?: string | null
          id?: string
          ip_address?: string | null
          method: string
          request_body?: Json | null
          response_time_ms?: number | null
          status_code?: number | null
          timestamp?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          endpoint?: string
          error_message?: string | null
          id?: string
          ip_address?: string | null
          method?: string
          request_body?: Json | null
          response_time_ms?: number | null
          status_code?: number | null
          timestamp?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      security_audit_log: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          ip_address: string | null
          resource_id: string | null
          resource_type: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          resource_id?: string | null
          resource_type: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          resource_id?: string | null
          resource_type?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      smtp_config: {
        Row: {
          created_at: string
          from_email: string
          from_name: string | null
          host: string
          id: string
          is_active: boolean | null
          password: string
          password_encrypted: string | null
          port: number
          updated_at: string
          username: string
        }
        Insert: {
          created_at?: string
          from_email: string
          from_name?: string | null
          host: string
          id?: string
          is_active?: boolean | null
          password: string
          password_encrypted?: string | null
          port?: number
          updated_at?: string
          username: string
        }
        Update: {
          created_at?: string
          from_email?: string
          from_name?: string | null
          host?: string
          id?: string
          is_active?: boolean | null
          password?: string
          password_encrypted?: string | null
          port?: number
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          ip_address: string | null
          is_active: boolean | null
          last_activity: string
          session_token: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          ip_address?: string | null
          is_active?: boolean | null
          last_activity?: string
          session_token: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          ip_address?: string | null
          is_active?: boolean | null
          last_activity?: string
          session_token?: string
          user_agent?: string | null
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
      vote_results: {
        Row: {
          candidate_id: string
          created_at: string
          election_id: string
          id: string
          percentage: number | null
          position: string
          rank: number | null
          updated_at: string
          vote_count: number
        }
        Insert: {
          candidate_id: string
          created_at?: string
          election_id: string
          id?: string
          percentage?: number | null
          position: string
          rank?: number | null
          updated_at?: string
          vote_count?: number
        }
        Update: {
          candidate_id?: string
          created_at?: string
          election_id?: string
          id?: string
          percentage?: number | null
          position?: string
          rank?: number | null
          updated_at?: string
          vote_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "vote_results_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vote_results_election_id_fkey"
            columns: ["election_id"]
            isOneToOne: false
            referencedRelation: "elections"
            referencedColumns: ["id"]
          },
        ]
      }
      vote_submissions: {
        Row: {
          created_at: string
          election_id: string
          id: string
          ip_address: string | null
          submission_hash: string
          user_agent: string | null
          voter_email: string
          voter_id: string | null
        }
        Insert: {
          created_at?: string
          election_id: string
          id?: string
          ip_address?: string | null
          submission_hash: string
          user_agent?: string | null
          voter_email: string
          voter_id?: string | null
        }
        Update: {
          created_at?: string
          election_id?: string
          id?: string
          ip_address?: string | null
          submission_hash?: string
          user_agent?: string | null
          voter_email?: string
          voter_id?: string | null
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
      calculate_vote_results: {
        Args: { p_election_id: string }
        Returns: undefined
      }
      check_login_attempts: {
        Args: { p_email: string; p_ip_address: string }
        Returns: Json
      }
      check_voting_eligibility: {
        Args: { p_election_id: string; p_voter_email: string }
        Returns: Json
      }
      cleanup_old_rate_limits: { Args: never; Returns: undefined }
      get_latest_block: {
        Args: never
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
        SetofOptions: {
          from: "*"
          to: "vote_blocks"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_smtp_password: { Args: { config_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      update_election_status: {
        Args: { p_election_id: string; p_new_status: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "candidate" | "voter"
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
      app_role: ["admin", "candidate", "voter"],
    },
  },
} as const
