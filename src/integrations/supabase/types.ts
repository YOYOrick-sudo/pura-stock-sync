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
      accommodation_assignments: {
        Row: {
          accommodation_id: string
          candidate_id: string
          created_at: string
          created_by: string | null
          end_date: string | null
          id: string
          notes: string | null
          start_date: string
          status: string
        }
        Insert: {
          accommodation_id: string
          candidate_id: string
          created_at?: string
          created_by?: string | null
          end_date?: string | null
          id?: string
          notes?: string | null
          start_date: string
          status?: string
        }
        Update: {
          accommodation_id?: string
          candidate_id?: string
          created_at?: string
          created_by?: string | null
          end_date?: string | null
          id?: string
          notes?: string | null
          start_date?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "accommodation_assignments_accommodation_id_fkey"
            columns: ["accommodation_id"]
            isOneToOne: false
            referencedRelation: "accommodation_occupancy"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accommodation_assignments_accommodation_id_fkey"
            columns: ["accommodation_id"]
            isOneToOne: false
            referencedRelation: "accommodations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accommodation_assignments_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      accommodations: {
        Row: {
          address: string | null
          amenities: string[] | null
          capacity: number
          created_at: string
          description: string | null
          house_rules_template_id: string | null
          id: string
          is_active: boolean
          location: string | null
          name: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          amenities?: string[] | null
          capacity: number
          created_at?: string
          description?: string | null
          house_rules_template_id?: string | null
          id?: string
          is_active?: boolean
          location?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          amenities?: string[] | null
          capacity?: number
          created_at?: string
          description?: string | null
          house_rules_template_id?: string | null
          id?: string
          is_active?: boolean
          location?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_house_rules_template"
            columns: ["house_rules_template_id"]
            isOneToOne: false
            referencedRelation: "document_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_suggestions: {
        Row: {
          created_at: string
          created_task_id: string | null
          feedback_note: string | null
          id: string
          impact_score: number | null
          location: string
          reasoning: string
          suggestion_text: string
          suggestion_type: string
          temperature: number
          user_feedback: string | null
          weather_condition: string
        }
        Insert: {
          created_at?: string
          created_task_id?: string | null
          feedback_note?: string | null
          id?: string
          impact_score?: number | null
          location: string
          reasoning: string
          suggestion_text: string
          suggestion_type: string
          temperature: number
          user_feedback?: string | null
          weather_condition: string
        }
        Update: {
          created_at?: string
          created_task_id?: string | null
          feedback_note?: string | null
          id?: string
          impact_score?: number | null
          location?: string
          reasoning?: string
          suggestion_text?: string
          suggestion_type?: string
          temperature?: number
          user_feedback?: string | null
          weather_condition?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_suggestions_created_task_id_fkey"
            columns: ["created_task_id"]
            isOneToOne: false
            referencedRelation: "foh_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      application_status_log: {
        Row: {
          action_type: string
          application_id: string
          changed_by: string | null
          created_at: string
          id: string
          new_status: string
          notes: string | null
          previous_status: string | null
        }
        Insert: {
          action_type: string
          application_id: string
          changed_by?: string | null
          created_at?: string
          id?: string
          new_status: string
          notes?: string | null
          previous_status?: string | null
        }
        Update: {
          action_type?: string
          application_id?: string
          changed_by?: string | null
          created_at?: string
          id?: string
          new_status?: string
          notes?: string | null
          previous_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "application_status_log_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      applications: {
        Row: {
          candidate_id: string
          contract_signed: boolean
          created_at: string
          created_by: string | null
          house_rules_sent: boolean
          housing_arranged: boolean
          housing_required: boolean
          id: string
          last_contact_at: string | null
          next_action_at: string | null
          next_action_type: string | null
          onboarding_docs_sent: boolean
          owner_user_id: string | null
          position: string
          priority: number
          season: string | null
          source: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["application_status"]
          target_location: string | null
          updated_at: string
        }
        Insert: {
          candidate_id: string
          contract_signed?: boolean
          created_at?: string
          created_by?: string | null
          house_rules_sent?: boolean
          housing_arranged?: boolean
          housing_required?: boolean
          id?: string
          last_contact_at?: string | null
          next_action_at?: string | null
          next_action_type?: string | null
          onboarding_docs_sent?: boolean
          owner_user_id?: string | null
          position: string
          priority?: number
          season?: string | null
          source?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          target_location?: string | null
          updated_at?: string
        }
        Update: {
          candidate_id?: string
          contract_signed?: boolean
          created_at?: string
          created_by?: string | null
          house_rules_sent?: boolean
          housing_arranged?: boolean
          housing_required?: boolean
          id?: string
          last_contact_at?: string | null
          next_action_at?: string | null
          next_action_type?: string | null
          onboarding_docs_sent?: boolean
          owner_user_id?: string | null
          position?: string
          priority?: number
          season?: string | null
          source?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          target_location?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      candidates: {
        Row: {
          created_at: string
          cv_url: string | null
          date_of_birth: string | null
          email: string | null
          first_name: string
          id: string
          last_name: string
          nationality: string | null
          notes: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          cv_url?: string | null
          date_of_birth?: string | null
          email?: string | null
          first_name: string
          id?: string
          last_name: string
          nationality?: string | null
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          cv_url?: string | null
          date_of_birth?: string | null
          email?: string | null
          first_name?: string
          id?: string
          last_name?: string
          nationality?: string | null
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      document_templates: {
        Row: {
          accommodation_id: string | null
          content: string
          created_at: string
          id: string
          is_active: boolean
          location: string | null
          name: string
          type: string
          updated_at: string
        }
        Insert: {
          accommodation_id?: string | null
          content: string
          created_at?: string
          id?: string
          is_active?: boolean
          location?: string | null
          name: string
          type: string
          updated_at?: string
        }
        Update: {
          accommodation_id?: string | null
          content?: string
          created_at?: string
          id?: string
          is_active?: boolean
          location?: string | null
          name?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_templates_accommodation_id_fkey"
            columns: ["accommodation_id"]
            isOneToOne: false
            referencedRelation: "accommodation_occupancy"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_templates_accommodation_id_fkey"
            columns: ["accommodation_id"]
            isOneToOne: false
            referencedRelation: "accommodations"
            referencedColumns: ["id"]
          },
        ]
      }
      foh_daily_templates: {
        Row: {
          category: string
          created_at: string
          description: string | null
          estimated_minutes: number | null
          id: string
          is_active: boolean
          location: string
          phase: string
          priority: number
          repeat_type: string | null
          sort_order: number | null
          template_name: string
          title: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          estimated_minutes?: number | null
          id?: string
          is_active?: boolean
          location: string
          phase: string
          priority?: number
          repeat_type?: string | null
          sort_order?: number | null
          template_name?: string
          title: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          estimated_minutes?: number | null
          id?: string
          is_active?: boolean
          location?: string
          phase?: string
          priority?: number
          repeat_type?: string | null
          sort_order?: number | null
          template_name?: string
          title?: string
        }
        Relationships: []
      }
      foh_employees: {
        Row: {
          created_at: string
          id: string
          location: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          location: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          location?: string
          name?: string
        }
        Relationships: []
      }
      foh_tasks: {
        Row: {
          archived: boolean
          assigned_employee_id: string | null
          category: string
          completed: boolean
          completed_at: string | null
          completed_by: string | null
          created_at: string
          description: string | null
          due_date: string
          estimated_minutes: number | null
          id: string
          location: string
          phase: string | null
          priority: number
          repeat_type: string | null
          sort_order: number | null
          template_id: string | null
          title: string
        }
        Insert: {
          archived?: boolean
          assigned_employee_id?: string | null
          category?: string
          completed?: boolean
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          description?: string | null
          due_date: string
          estimated_minutes?: number | null
          id?: string
          location: string
          phase?: string | null
          priority?: number
          repeat_type?: string | null
          sort_order?: number | null
          template_id?: string | null
          title: string
        }
        Update: {
          archived?: boolean
          assigned_employee_id?: string | null
          category?: string
          completed?: boolean
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          description?: string | null
          due_date?: string
          estimated_minutes?: number | null
          id?: string
          location?: string
          phase?: string | null
          priority?: number
          repeat_type?: string | null
          sort_order?: number | null
          template_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_foh_tasks_employee"
            columns: ["assigned_employee_id"]
            isOneToOne: false
            referencedRelation: "foh_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "foh_tasks_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "foh_daily_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      handover_memos: {
        Row: {
          created_at: string
          created_by: string
          id: string
          location: string
          message: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          location: string
          message: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          location?: string
          message?: string
          updated_at?: string
        }
        Relationships: []
      }
      internal_order_items: {
        Row: {
          created_at: string | null
          id: string
          order_id: string
          product_name: string
          quantity: number
          unit: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          order_id: string
          product_name: string
          quantity: number
          unit?: string
        }
        Update: {
          created_at?: string | null
          id?: string
          order_id?: string
          product_name?: string
          quantity?: number
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "internal_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "internal_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      internal_orders: {
        Row: {
          approved_by: string | null
          created_at: string | null
          delivery_date: string
          from_location: string
          id: string
          notes: string | null
          order_number: string
          received_at: string | null
          receiver_notes: string | null
          requested_by: string
          status: string
          to_location: string
          updated_at: string | null
        }
        Insert: {
          approved_by?: string | null
          created_at?: string | null
          delivery_date: string
          from_location: string
          id?: string
          notes?: string | null
          order_number: string
          received_at?: string | null
          receiver_notes?: string | null
          requested_by: string
          status?: string
          to_location: string
          updated_at?: string | null
        }
        Update: {
          approved_by?: string | null
          created_at?: string | null
          delivery_date?: string
          from_location?: string
          id?: string
          notes?: string | null
          order_number?: string
          received_at?: string | null
          receiver_notes?: string | null
          requested_by?: string
          status?: string
          to_location?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      kitchen_tasks: {
        Row: {
          assigned_to: string | null
          category: string
          completed: boolean | null
          completed_at: string | null
          completed_by: string | null
          created_at: string | null
          created_by: string
          description: string | null
          due_date: string | null
          frequency: string
          id: string
          location: string
          title: string
        }
        Insert: {
          assigned_to?: string | null
          category: string
          completed?: boolean | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          created_by: string
          description?: string | null
          due_date?: string | null
          frequency: string
          id?: string
          location: string
          title: string
        }
        Update: {
          assigned_to?: string | null
          category?: string
          completed?: boolean | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          due_date?: string | null
          frequency?: string
          id?: string
          location?: string
          title?: string
        }
        Relationships: []
      }
      mep_planning: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          created_at: string | null
          date: string
          id: string
          location: string
          notes: string | null
          quantity: number
          recipe_id: string
          status: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string | null
          date: string
          id?: string
          location: string
          notes?: string | null
          quantity?: number
          recipe_id: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string | null
          date?: string
          id?: string
          location?: string
          notes?: string | null
          quantity?: number
          recipe_id?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mep_planning_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          link: string | null
          location: string
          message: string
          read: boolean
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          link?: string | null
          location: string
          message: string
          read?: boolean
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          link?: string | null
          location?: string
          message?: string
          read?: boolean
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      recipe_steps: {
        Row: {
          created_at: string | null
          duration_minutes: number | null
          id: string
          instruction: string
          recipe_id: string
          step_number: number
        }
        Insert: {
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          instruction: string
          recipe_id: string
          step_number: number
        }
        Update: {
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          instruction?: string
          recipe_id?: string
          step_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "recipe_steps_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipes: {
        Row: {
          category: string
          created_at: string | null
          created_by: string
          description: string | null
          id: string
          location: string
          name: string
          prep_time_minutes: number | null
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          created_by: string
          description?: string | null
          id?: string
          location: string
          name: string
          prep_time_minutes?: number | null
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          created_by?: string
          description?: string | null
          id?: string
          location?: string
          name?: string
          prep_time_minutes?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      sent_documents: {
        Row: {
          acknowledged_at: string | null
          application_id: string
          channel: string
          document_url: string | null
          generated_content: string
          id: string
          sent_at: string
          sent_by: string | null
          template_id: string
        }
        Insert: {
          acknowledged_at?: string | null
          application_id: string
          channel: string
          document_url?: string | null
          generated_content: string
          id?: string
          sent_at?: string
          sent_by?: string | null
          template_id: string
        }
        Update: {
          acknowledged_at?: string | null
          application_id?: string
          channel?: string
          document_url?: string | null
          generated_content?: string
          id?: string
          sent_at?: string
          sent_by?: string | null
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sent_documents_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sent_documents_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "document_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_members: {
        Row: {
          active: boolean
          created_at: string | null
          created_by: string
          id: string
          location: string
          name: string
          role: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string | null
          created_by: string
          id?: string
          location: string
          name: string
          role?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string | null
          created_by?: string
          id?: string
          location?: string
          name?: string
          role?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          location: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          location: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          location?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      weather_data: {
        Row: {
          condition: string
          date: string
          fetched_at: string
          id: string
          location: string
          precipitation: number | null
          temperature: number
          wind_speed: number | null
        }
        Insert: {
          condition: string
          date: string
          fetched_at?: string
          id?: string
          location: string
          precipitation?: number | null
          temperature: number
          wind_speed?: number | null
        }
        Update: {
          condition?: string
          date?: string
          fetched_at?: string
          id?: string
          location?: string
          precipitation?: number | null
          temperature?: number
          wind_speed?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      accommodation_occupancy: {
        Row: {
          available_spots: number | null
          capacity: number | null
          current_occupancy: number | null
          id: string | null
          location: string | null
          name: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      current_user_location: { Args: never; Returns: string }
      generate_order_number: { Args: never; Returns: string }
      get_user_location: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "manager" | "kitchen_staff" | "hr"
      application_status:
        | "received"
        | "screening"
        | "interview_scheduled"
        | "trial_scheduled"
        | "offer_sent"
        | "hired"
        | "rejected"
        | "reserve"
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
      app_role: ["admin", "manager", "kitchen_staff", "hr"],
      application_status: [
        "received",
        "screening",
        "interview_scheduled",
        "trial_scheduled",
        "offer_sent",
        "hired",
        "rejected",
        "reserve",
      ],
    },
  },
} as const
