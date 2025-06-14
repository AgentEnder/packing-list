import type { Database } from './database-types.js';
export declare function getSupabaseClient(): import("@supabase/supabase-js").SupabaseClient<Database, "public", {
    Tables: {
        default_item_rules: {
            Row: {
                calculation: import("./database-types.js").Json;
                category_id: string | null;
                conditions: import("./database-types.js").Json | null;
                created_at: string | null;
                id: string;
                is_deleted: boolean | null;
                name: string;
                notes: string | null;
                pack_ids: import("./database-types.js").Json | null;
                rule_id: string;
                subcategory_id: string | null;
                updated_at: string | null;
                user_id: string;
                version: number | null;
            };
            Insert: {
                calculation: import("./database-types.js").Json;
                category_id?: string | null;
                conditions?: import("./database-types.js").Json | null;
                created_at?: string | null;
                id?: string;
                is_deleted?: boolean | null;
                name: string;
                notes?: string | null;
                pack_ids?: import("./database-types.js").Json | null;
                rule_id: string;
                subcategory_id?: string | null;
                updated_at?: string | null;
                user_id: string;
                version?: number | null;
            };
            Update: {
                calculation?: import("./database-types.js").Json;
                category_id?: string | null;
                conditions?: import("./database-types.js").Json | null;
                created_at?: string | null;
                id?: string;
                is_deleted?: boolean | null;
                name?: string;
                notes?: string | null;
                pack_ids?: import("./database-types.js").Json | null;
                rule_id?: string;
                subcategory_id?: string | null;
                updated_at?: string | null;
                user_id?: string;
                version?: number | null;
            };
            Relationships: [];
        };
        rule_packs: {
            Row: {
                author: import("./database-types.js").Json;
                color: string | null;
                created_at: string | null;
                description: string | null;
                icon: string | null;
                id: string;
                is_deleted: boolean | null;
                metadata: import("./database-types.js").Json;
                name: string;
                pack_id: string;
                primary_category_id: string | null;
                stats: import("./database-types.js").Json;
                updated_at: string | null;
                user_id: string;
                version: number | null;
            };
            Insert: {
                author: import("./database-types.js").Json;
                color?: string | null;
                created_at?: string | null;
                description?: string | null;
                icon?: string | null;
                id?: string;
                is_deleted?: boolean | null;
                metadata: import("./database-types.js").Json;
                name: string;
                pack_id: string;
                primary_category_id?: string | null;
                stats: import("./database-types.js").Json;
                updated_at?: string | null;
                user_id: string;
                version?: number | null;
            };
            Update: {
                author?: import("./database-types.js").Json;
                color?: string | null;
                created_at?: string | null;
                description?: string | null;
                icon?: string | null;
                id?: string;
                is_deleted?: boolean | null;
                metadata?: import("./database-types.js").Json;
                name?: string;
                pack_id?: string;
                primary_category_id?: string | null;
                stats?: import("./database-types.js").Json;
                updated_at?: string | null;
                user_id?: string;
                version?: number | null;
            };
            Relationships: [];
        };
        sync_changes: {
            Row: {
                created_at: string | null;
                data: import("./database-types.js").Json;
                device_id: string | null;
                entity_id: string;
                entity_type: string;
                id: string;
                operation: string;
                user_id: string;
                version: number;
            };
            Insert: {
                created_at?: string | null;
                data: import("./database-types.js").Json;
                device_id?: string | null;
                entity_id: string;
                entity_type: string;
                id?: string;
                operation: string;
                user_id: string;
                version: number;
            };
            Update: {
                created_at?: string | null;
                data?: import("./database-types.js").Json;
                device_id?: string | null;
                entity_id?: string;
                entity_type?: string;
                id?: string;
                operation?: string;
                user_id?: string;
                version?: number;
            };
            Relationships: [];
        };
        trip_default_item_rules: {
            Row: {
                created_at: string | null;
                id: string;
                is_deleted: boolean | null;
                rule_id: string;
                trip_id: string;
                updated_at: string | null;
                version: number | null;
            };
            Insert: {
                created_at?: string | null;
                id?: string;
                is_deleted?: boolean | null;
                rule_id: string;
                trip_id: string;
                updated_at?: string | null;
                version?: number | null;
            };
            Update: {
                created_at?: string | null;
                id?: string;
                is_deleted?: boolean | null;
                rule_id?: string;
                trip_id?: string;
                updated_at?: string | null;
                version?: number | null;
            };
            Relationships: [{
                foreignKeyName: "trip_default_item_rules_trip_id_fkey";
                columns: ["trip_id"];
                isOneToOne: false;
                referencedRelation: "trips";
                referencedColumns: ["id"];
            }];
        };
        trip_items: {
            Row: {
                category: string | null;
                created_at: string | null;
                day_index: number | null;
                id: string;
                is_deleted: boolean | null;
                name: string;
                notes: string | null;
                packed: boolean | null;
                person_id: string | null;
                quantity: number | null;
                trip_id: string;
                updated_at: string | null;
                version: number | null;
            };
            Insert: {
                category?: string | null;
                created_at?: string | null;
                day_index?: number | null;
                id?: string;
                is_deleted?: boolean | null;
                name: string;
                notes?: string | null;
                packed?: boolean | null;
                person_id?: string | null;
                quantity?: number | null;
                trip_id: string;
                updated_at?: string | null;
                version?: number | null;
            };
            Update: {
                category?: string | null;
                created_at?: string | null;
                day_index?: number | null;
                id?: string;
                is_deleted?: boolean | null;
                name?: string;
                notes?: string | null;
                packed?: boolean | null;
                person_id?: string | null;
                quantity?: number | null;
                trip_id?: string;
                updated_at?: string | null;
                version?: number | null;
            };
            Relationships: [{
                foreignKeyName: "trip_items_person_id_fkey";
                columns: ["person_id"];
                isOneToOne: false;
                referencedRelation: "trip_people";
                referencedColumns: ["id"];
            }, {
                foreignKeyName: "trip_items_trip_id_fkey";
                columns: ["trip_id"];
                isOneToOne: false;
                referencedRelation: "trips";
                referencedColumns: ["id"];
            }];
        };
        trip_people: {
            Row: {
                age: number | null;
                created_at: string | null;
                gender: string | null;
                id: string;
                is_deleted: boolean | null;
                name: string;
                settings: import("./database-types.js").Json | null;
                trip_id: string;
                updated_at: string | null;
                version: number | null;
            };
            Insert: {
                age?: number | null;
                created_at?: string | null;
                gender?: string | null;
                id?: string;
                is_deleted?: boolean | null;
                name: string;
                settings?: import("./database-types.js").Json | null;
                trip_id: string;
                updated_at?: string | null;
                version?: number | null;
            };
            Update: {
                age?: number | null;
                created_at?: string | null;
                gender?: string | null;
                id?: string;
                is_deleted?: boolean | null;
                name?: string;
                settings?: import("./database-types.js").Json | null;
                trip_id?: string;
                updated_at?: string | null;
                version?: number | null;
            };
            Relationships: [{
                foreignKeyName: "trip_people_trip_id_fkey";
                columns: ["trip_id"];
                isOneToOne: false;
                referencedRelation: "trips";
                referencedColumns: ["id"];
            }];
        };
        trip_rule_overrides: {
            Row: {
                created_at: string | null;
                id: string;
                is_deleted: boolean | null;
                override_data: import("./database-types.js").Json;
                rule_id: string;
                trip_id: string;
                updated_at: string | null;
                version: number | null;
            };
            Insert: {
                created_at?: string | null;
                id?: string;
                is_deleted?: boolean | null;
                override_data: import("./database-types.js").Json;
                rule_id: string;
                trip_id: string;
                updated_at?: string | null;
                version?: number | null;
            };
            Update: {
                created_at?: string | null;
                id?: string;
                is_deleted?: boolean | null;
                override_data?: import("./database-types.js").Json;
                rule_id?: string;
                trip_id?: string;
                updated_at?: string | null;
                version?: number | null;
            };
            Relationships: [{
                foreignKeyName: "trip_rule_overrides_trip_id_fkey";
                columns: ["trip_id"];
                isOneToOne: false;
                referencedRelation: "trips";
                referencedColumns: ["id"];
            }];
        };
        trips: {
            Row: {
                created_at: string | null;
                days: import("./database-types.js").Json | null;
                description: string | null;
                id: string;
                is_deleted: boolean | null;
                last_synced_at: string | null;
                settings: import("./database-types.js").Json | null;
                title: string;
                trip_events: import("./database-types.js").Json | null;
                updated_at: string | null;
                user_id: string;
                version: number | null;
            };
            Insert: {
                created_at?: string | null;
                days?: import("./database-types.js").Json | null;
                description?: string | null;
                id?: string;
                is_deleted?: boolean | null;
                last_synced_at?: string | null;
                settings?: import("./database-types.js").Json | null;
                title: string;
                trip_events?: import("./database-types.js").Json | null;
                updated_at?: string | null;
                user_id: string;
                version?: number | null;
            };
            Update: {
                created_at?: string | null;
                days?: import("./database-types.js").Json | null;
                description?: string | null;
                id?: string;
                is_deleted?: boolean | null;
                last_synced_at?: string | null;
                settings?: import("./database-types.js").Json | null;
                title?: string;
                trip_events?: import("./database-types.js").Json | null;
                updated_at?: string | null;
                user_id?: string;
                version?: number | null;
            };
            Relationships: [];
        };
        user_profiles: {
            Row: {
                created_at: string | null;
                id: string;
                preferences: import("./database-types.js").Json | null;
                updated_at: string | null;
            };
            Insert: {
                created_at?: string | null;
                id: string;
                preferences?: import("./database-types.js").Json | null;
                updated_at?: string | null;
            };
            Update: {
                created_at?: string | null;
                id?: string;
                preferences?: import("./database-types.js").Json | null;
                updated_at?: string | null;
            };
            Relationships: [];
        };
    };
    Views: { [_ in never]: never; };
    Functions: {
        cleanup_e2e_test_users: {
            Args: Record<PropertyKey, never>;
            Returns: undefined;
        };
        create_e2e_test_user: {
            Args: {
                p_email: string;
                p_password?: string;
                p_name?: string;
                p_provider?: string;
            };
            Returns: string;
        };
        get_user_rule_packs: {
            Args: {
                user_uuid?: string;
            };
            Returns: {
                pack_id: string;
                name: string;
                description: string;
                author: import("./database-types.js").Json;
                metadata: import("./database-types.js").Json;
                stats: import("./database-types.js").Json;
                primary_category_id: string;
                icon: string;
                color: string;
                created_at: string;
                updated_at: string;
            }[];
        };
        get_user_trips_summary: {
            Args: {
                user_uuid?: string;
            };
            Returns: {
                trip_id: string;
                title: string;
                description: string;
                created_at: string;
                updated_at: string;
                total_items: number;
                packed_items: number;
                total_people: number;
            }[];
        };
        reset_e2e_test_data: {
            Args: Record<PropertyKey, never>;
            Returns: undefined;
        };
    };
    Enums: { [_ in never]: never; };
    CompositeTypes: { [_ in never]: never; };
}>;
export declare function isSupabaseAvailable(): boolean;
export declare const supabase: import("@supabase/supabase-js").SupabaseClient<Database, "public", {
    Tables: {
        default_item_rules: {
            Row: {
                calculation: import("./database-types.js").Json;
                category_id: string | null;
                conditions: import("./database-types.js").Json | null;
                created_at: string | null;
                id: string;
                is_deleted: boolean | null;
                name: string;
                notes: string | null;
                pack_ids: import("./database-types.js").Json | null;
                rule_id: string;
                subcategory_id: string | null;
                updated_at: string | null;
                user_id: string;
                version: number | null;
            };
            Insert: {
                calculation: import("./database-types.js").Json;
                category_id?: string | null;
                conditions?: import("./database-types.js").Json | null;
                created_at?: string | null;
                id?: string;
                is_deleted?: boolean | null;
                name: string;
                notes?: string | null;
                pack_ids?: import("./database-types.js").Json | null;
                rule_id: string;
                subcategory_id?: string | null;
                updated_at?: string | null;
                user_id: string;
                version?: number | null;
            };
            Update: {
                calculation?: import("./database-types.js").Json;
                category_id?: string | null;
                conditions?: import("./database-types.js").Json | null;
                created_at?: string | null;
                id?: string;
                is_deleted?: boolean | null;
                name?: string;
                notes?: string | null;
                pack_ids?: import("./database-types.js").Json | null;
                rule_id?: string;
                subcategory_id?: string | null;
                updated_at?: string | null;
                user_id?: string;
                version?: number | null;
            };
            Relationships: [];
        };
        rule_packs: {
            Row: {
                author: import("./database-types.js").Json;
                color: string | null;
                created_at: string | null;
                description: string | null;
                icon: string | null;
                id: string;
                is_deleted: boolean | null;
                metadata: import("./database-types.js").Json;
                name: string;
                pack_id: string;
                primary_category_id: string | null;
                stats: import("./database-types.js").Json;
                updated_at: string | null;
                user_id: string;
                version: number | null;
            };
            Insert: {
                author: import("./database-types.js").Json;
                color?: string | null;
                created_at?: string | null;
                description?: string | null;
                icon?: string | null;
                id?: string;
                is_deleted?: boolean | null;
                metadata: import("./database-types.js").Json;
                name: string;
                pack_id: string;
                primary_category_id?: string | null;
                stats: import("./database-types.js").Json;
                updated_at?: string | null;
                user_id: string;
                version?: number | null;
            };
            Update: {
                author?: import("./database-types.js").Json;
                color?: string | null;
                created_at?: string | null;
                description?: string | null;
                icon?: string | null;
                id?: string;
                is_deleted?: boolean | null;
                metadata?: import("./database-types.js").Json;
                name?: string;
                pack_id?: string;
                primary_category_id?: string | null;
                stats?: import("./database-types.js").Json;
                updated_at?: string | null;
                user_id?: string;
                version?: number | null;
            };
            Relationships: [];
        };
        sync_changes: {
            Row: {
                created_at: string | null;
                data: import("./database-types.js").Json;
                device_id: string | null;
                entity_id: string;
                entity_type: string;
                id: string;
                operation: string;
                user_id: string;
                version: number;
            };
            Insert: {
                created_at?: string | null;
                data: import("./database-types.js").Json;
                device_id?: string | null;
                entity_id: string;
                entity_type: string;
                id?: string;
                operation: string;
                user_id: string;
                version: number;
            };
            Update: {
                created_at?: string | null;
                data?: import("./database-types.js").Json;
                device_id?: string | null;
                entity_id?: string;
                entity_type?: string;
                id?: string;
                operation?: string;
                user_id?: string;
                version?: number;
            };
            Relationships: [];
        };
        trip_default_item_rules: {
            Row: {
                created_at: string | null;
                id: string;
                is_deleted: boolean | null;
                rule_id: string;
                trip_id: string;
                updated_at: string | null;
                version: number | null;
            };
            Insert: {
                created_at?: string | null;
                id?: string;
                is_deleted?: boolean | null;
                rule_id: string;
                trip_id: string;
                updated_at?: string | null;
                version?: number | null;
            };
            Update: {
                created_at?: string | null;
                id?: string;
                is_deleted?: boolean | null;
                rule_id?: string;
                trip_id?: string;
                updated_at?: string | null;
                version?: number | null;
            };
            Relationships: [{
                foreignKeyName: "trip_default_item_rules_trip_id_fkey";
                columns: ["trip_id"];
                isOneToOne: false;
                referencedRelation: "trips";
                referencedColumns: ["id"];
            }];
        };
        trip_items: {
            Row: {
                category: string | null;
                created_at: string | null;
                day_index: number | null;
                id: string;
                is_deleted: boolean | null;
                name: string;
                notes: string | null;
                packed: boolean | null;
                person_id: string | null;
                quantity: number | null;
                trip_id: string;
                updated_at: string | null;
                version: number | null;
            };
            Insert: {
                category?: string | null;
                created_at?: string | null;
                day_index?: number | null;
                id?: string;
                is_deleted?: boolean | null;
                name: string;
                notes?: string | null;
                packed?: boolean | null;
                person_id?: string | null;
                quantity?: number | null;
                trip_id: string;
                updated_at?: string | null;
                version?: number | null;
            };
            Update: {
                category?: string | null;
                created_at?: string | null;
                day_index?: number | null;
                id?: string;
                is_deleted?: boolean | null;
                name?: string;
                notes?: string | null;
                packed?: boolean | null;
                person_id?: string | null;
                quantity?: number | null;
                trip_id?: string;
                updated_at?: string | null;
                version?: number | null;
            };
            Relationships: [{
                foreignKeyName: "trip_items_person_id_fkey";
                columns: ["person_id"];
                isOneToOne: false;
                referencedRelation: "trip_people";
                referencedColumns: ["id"];
            }, {
                foreignKeyName: "trip_items_trip_id_fkey";
                columns: ["trip_id"];
                isOneToOne: false;
                referencedRelation: "trips";
                referencedColumns: ["id"];
            }];
        };
        trip_people: {
            Row: {
                age: number | null;
                created_at: string | null;
                gender: string | null;
                id: string;
                is_deleted: boolean | null;
                name: string;
                settings: import("./database-types.js").Json | null;
                trip_id: string;
                updated_at: string | null;
                version: number | null;
            };
            Insert: {
                age?: number | null;
                created_at?: string | null;
                gender?: string | null;
                id?: string;
                is_deleted?: boolean | null;
                name: string;
                settings?: import("./database-types.js").Json | null;
                trip_id: string;
                updated_at?: string | null;
                version?: number | null;
            };
            Update: {
                age?: number | null;
                created_at?: string | null;
                gender?: string | null;
                id?: string;
                is_deleted?: boolean | null;
                name?: string;
                settings?: import("./database-types.js").Json | null;
                trip_id?: string;
                updated_at?: string | null;
                version?: number | null;
            };
            Relationships: [{
                foreignKeyName: "trip_people_trip_id_fkey";
                columns: ["trip_id"];
                isOneToOne: false;
                referencedRelation: "trips";
                referencedColumns: ["id"];
            }];
        };
        trip_rule_overrides: {
            Row: {
                created_at: string | null;
                id: string;
                is_deleted: boolean | null;
                override_data: import("./database-types.js").Json;
                rule_id: string;
                trip_id: string;
                updated_at: string | null;
                version: number | null;
            };
            Insert: {
                created_at?: string | null;
                id?: string;
                is_deleted?: boolean | null;
                override_data: import("./database-types.js").Json;
                rule_id: string;
                trip_id: string;
                updated_at?: string | null;
                version?: number | null;
            };
            Update: {
                created_at?: string | null;
                id?: string;
                is_deleted?: boolean | null;
                override_data?: import("./database-types.js").Json;
                rule_id?: string;
                trip_id?: string;
                updated_at?: string | null;
                version?: number | null;
            };
            Relationships: [{
                foreignKeyName: "trip_rule_overrides_trip_id_fkey";
                columns: ["trip_id"];
                isOneToOne: false;
                referencedRelation: "trips";
                referencedColumns: ["id"];
            }];
        };
        trips: {
            Row: {
                created_at: string | null;
                days: import("./database-types.js").Json | null;
                description: string | null;
                id: string;
                is_deleted: boolean | null;
                last_synced_at: string | null;
                settings: import("./database-types.js").Json | null;
                title: string;
                trip_events: import("./database-types.js").Json | null;
                updated_at: string | null;
                user_id: string;
                version: number | null;
            };
            Insert: {
                created_at?: string | null;
                days?: import("./database-types.js").Json | null;
                description?: string | null;
                id?: string;
                is_deleted?: boolean | null;
                last_synced_at?: string | null;
                settings?: import("./database-types.js").Json | null;
                title: string;
                trip_events?: import("./database-types.js").Json | null;
                updated_at?: string | null;
                user_id: string;
                version?: number | null;
            };
            Update: {
                created_at?: string | null;
                days?: import("./database-types.js").Json | null;
                description?: string | null;
                id?: string;
                is_deleted?: boolean | null;
                last_synced_at?: string | null;
                settings?: import("./database-types.js").Json | null;
                title?: string;
                trip_events?: import("./database-types.js").Json | null;
                updated_at?: string | null;
                user_id?: string;
                version?: number | null;
            };
            Relationships: [];
        };
        user_profiles: {
            Row: {
                created_at: string | null;
                id: string;
                preferences: import("./database-types.js").Json | null;
                updated_at: string | null;
            };
            Insert: {
                created_at?: string | null;
                id: string;
                preferences?: import("./database-types.js").Json | null;
                updated_at?: string | null;
            };
            Update: {
                created_at?: string | null;
                id?: string;
                preferences?: import("./database-types.js").Json | null;
                updated_at?: string | null;
            };
            Relationships: [];
        };
    };
    Views: { [_ in never]: never; };
    Functions: {
        cleanup_e2e_test_users: {
            Args: Record<PropertyKey, never>;
            Returns: undefined;
        };
        create_e2e_test_user: {
            Args: {
                p_email: string;
                p_password?: string;
                p_name?: string;
                p_provider?: string;
            };
            Returns: string;
        };
        get_user_rule_packs: {
            Args: {
                user_uuid?: string;
            };
            Returns: {
                pack_id: string;
                name: string;
                description: string;
                author: import("./database-types.js").Json;
                metadata: import("./database-types.js").Json;
                stats: import("./database-types.js").Json;
                primary_category_id: string;
                icon: string;
                color: string;
                created_at: string;
                updated_at: string;
            }[];
        };
        get_user_trips_summary: {
            Args: {
                user_uuid?: string;
            };
            Returns: {
                trip_id: string;
                title: string;
                description: string;
                created_at: string;
                updated_at: string;
                total_items: number;
                packed_items: number;
                total_people: number;
            }[];
        };
        reset_e2e_test_data: {
            Args: Record<PropertyKey, never>;
            Returns: undefined;
        };
    };
    Enums: { [_ in never]: never; };
    CompositeTypes: { [_ in never]: never; };
}>;
//# sourceMappingURL=supabase-client.d.ts.map