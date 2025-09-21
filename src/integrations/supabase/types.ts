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
      candidates: {
        Row: {
          created_at: string
          election_id: string
          id: string
          platform_statement: string | null
          position: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          election_id: string
          id?: string
          platform_statement?: string | null
          position?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          election_id?: string
          id?: string
          platform_statement?: string | null
          position?: string | null
          status?: string
          updated_at?: string
          user_id?: string
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
      elections: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
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
          created_at?: string
          created_by: string
          description?: string | null
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
          created_at?: string
          created_by?: string
          description?: string | null
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
