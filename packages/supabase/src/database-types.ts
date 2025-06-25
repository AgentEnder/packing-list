export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      default_item_rules: {
        Row: {
          calculation: Json
          category_id: string | null
          conditions: Json | null
          created_at: string | null
          id: string
          is_deleted: boolean | null
          name: string
          notes: string | null
          original_rule_id: string | null
          pack_ids: Json | null
          rule_id: string
          subcategory_id: string | null
          updated_at: string | null
          user_id: string
          version: number | null
        }
        Insert: {
          calculation: Json
          category_id?: string | null
          conditions?: Json | null
          created_at?: string | null
          id?: string
          is_deleted?: boolean | null
          name: string
          notes?: string | null
          original_rule_id?: string | null
          pack_ids?: Json | null
          rule_id: string
          subcategory_id?: string | null
          updated_at?: string | null
          user_id: string
          version?: number | null
        }
        Update: {
          calculation?: Json
          category_id?: string | null
          conditions?: Json | null
          created_at?: string | null
          id?: string
          is_deleted?: boolean | null
          name?: string
          notes?: string | null
          original_rule_id?: string | null
          pack_ids?: Json | null
          rule_id?: string
          subcategory_id?: string | null
          updated_at?: string | null
          user_id?: string
          version?: number | null
        }
        Relationships: []
      }
      rule_packs: {
        Row: {
          author: Json
          color: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_deleted: boolean | null
          metadata: Json
          name: string
          pack_id: string
          primary_category_id: string | null
          stats: Json
          updated_at: string | null
          user_id: string
          version: number | null
        }
        Insert: {
          author: Json
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_deleted?: boolean | null
          metadata: Json
          name: string
          pack_id: string
          primary_category_id?: string | null
          stats: Json
          updated_at?: string | null
          user_id: string
          version?: number | null
        }
        Update: {
          author?: Json
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_deleted?: boolean | null
          metadata?: Json
          name?: string
          pack_id?: string
          primary_category_id?: string | null
          stats?: Json
          updated_at?: string | null
          user_id?: string
          version?: number | null
        }
        Relationships: []
      }
      sync_changes: {
        Row: {
          created_at: string | null
          data: Json
          device_id: string | null
          entity_id: string
          entity_type: string
          id: string
          operation: string
          user_id: string
          version: number
        }
        Insert: {
          created_at?: string | null
          data: Json
          device_id?: string | null
          entity_id: string
          entity_type: string
          id?: string
          operation: string
          user_id: string
          version: number
        }
        Update: {
          created_at?: string | null
          data?: Json
          device_id?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          operation?: string
          user_id?: string
          version?: number
        }
        Relationships: []
      }
      trip_default_item_rules: {
        Row: {
          created_at: string | null
          id: string
          is_deleted: boolean | null
          rule_id: string
          trip_id: string
          updated_at: string | null
          user_id: string
          version: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_deleted?: boolean | null
          rule_id: string
          trip_id: string
          updated_at?: string | null
          user_id: string
          version?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_deleted?: boolean | null
          rule_id?: string
          trip_id?: string
          updated_at?: string | null
          user_id?: string
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_trip_default_item_rules_rule_id"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "default_item_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_default_item_rules_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_items: {
        Row: {
          category: string | null
          created_at: string | null
          day_index: number | null
          id: string
          is_deleted: boolean | null
          name: string
          notes: string | null
          packed: boolean | null
          person_id: string | null
          quantity: number | null
          rule_hash: string | null
          rule_id: string | null
          trip_id: string
          updated_at: string | null
          version: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          day_index?: number | null
          id?: string
          is_deleted?: boolean | null
          name: string
          notes?: string | null
          packed?: boolean | null
          person_id?: string | null
          quantity?: number | null
          rule_hash?: string | null
          rule_id?: string | null
          trip_id: string
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          day_index?: number | null
          id?: string
          is_deleted?: boolean | null
          name?: string
          notes?: string | null
          packed?: boolean | null
          person_id?: string | null
          quantity?: number | null
          rule_hash?: string | null
          rule_id?: string | null
          trip_id?: string
          updated_at?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "trip_items_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "trip_people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_items_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_people: {
        Row: {
          age: number | null
          created_at: string | null
          gender: string | null
          id: string
          is_deleted: boolean | null
          name: string
          settings: Json | null
          trip_id: string
          updated_at: string | null
          version: number | null
        }
        Insert: {
          age?: number | null
          created_at?: string | null
          gender?: string | null
          id?: string
          is_deleted?: boolean | null
          name: string
          settings?: Json | null
          trip_id: string
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          age?: number | null
          created_at?: string | null
          gender?: string | null
          id?: string
          is_deleted?: boolean | null
          name?: string
          settings?: Json | null
          trip_id?: string
          updated_at?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "trip_people_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_rule_overrides: {
        Row: {
          created_at: string | null
          id: string
          is_deleted: boolean | null
          override_data: Json
          rule_id: string
          trip_id: string
          updated_at: string | null
          version: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_deleted?: boolean | null
          override_data: Json
          rule_id: string
          trip_id: string
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_deleted?: boolean | null
          override_data?: Json
          rule_id?: string
          trip_id?: string
          updated_at?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "trip_rule_overrides_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trips: {
        Row: {
          created_at: string | null
          days: Json | null
          description: string | null
          id: string
          is_deleted: boolean | null
          last_synced_at: string | null
          settings: Json | null
          title: string
          trip_events: Json | null
          updated_at: string | null
          user_id: string
          version: number | null
        }
        Insert: {
          created_at?: string | null
          days?: Json | null
          description?: string | null
          id?: string
          is_deleted?: boolean | null
          last_synced_at?: string | null
          settings?: Json | null
          title: string
          trip_events?: Json | null
          updated_at?: string | null
          user_id: string
          version?: number | null
        }
        Update: {
          created_at?: string | null
          days?: Json | null
          description?: string | null
          id?: string
          is_deleted?: boolean | null
          last_synced_at?: string | null
          settings?: Json | null
          title?: string
          trip_events?: Json | null
          updated_at?: string | null
          user_id?: string
          version?: number | null
        }
        Relationships: []
      }
      user_people: {
        Row: {
          age: number | null
          created_at: string | null
          gender: string | null
          id: string
          is_deleted: boolean | null
          is_user_profile: boolean | null
          name: string
          settings: Json | null
          updated_at: string | null
          user_id: string
          version: number | null
        }
        Insert: {
          age?: number | null
          created_at?: string | null
          gender?: string | null
          id?: string
          is_deleted?: boolean | null
          is_user_profile?: boolean | null
          name: string
          settings?: Json | null
          updated_at?: string | null
          user_id: string
          version?: number | null
        }
        Update: {
          age?: number | null
          created_at?: string | null
          gender?: string | null
          id?: string
          is_deleted?: boolean | null
          is_user_profile?: boolean | null
          name?: string
          settings?: Json | null
          updated_at?: string | null
          user_id?: string
          version?: number | null
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          created_at: string | null
          id: string
          preferences: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id: string
          preferences?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          preferences?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_e2e_test_users: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_e2e_test_user: {
        Args: {
          p_email: string
          p_password?: string
          p_name?: string
          p_provider?: string
        }
        Returns: string
      }
      get_user_trips_summary: {
        Args: { user_uuid?: string }
        Returns: {
          trip_id: string
          title: string
          description: string
          created_at: string
          updated_at: string
          total_items: number
          packed_items: number
          total_people: number
        }[]
      }
      reset_e2e_test_data: {
        Args: Record<PropertyKey, never>
        Returns: undefined
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

