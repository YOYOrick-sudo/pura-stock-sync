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
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      employee_documents: {
        Row: {
          created_at: string | null
          expires_at: string | null
          file_name: string
          file_url: string
          id: string
          type: string
          uploaded_by: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          file_name: string
          file_url: string
          id?: string
          type: string
          uploaded_by?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          file_name?: string
          file_url?: string
          id?: string
          type?: string
          uploaded_by?: string | null
          user_id?: string
        }
        Relationships: []
      }
      foh_daily_templates: {
        Row: {
          category: string
          created_at: string
          day_of_week: number | null
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
          day_of_week?: number | null
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
          day_of_week?: number | null
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
          day_of_week: number | null
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
          day_of_week?: number | null
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
          day_of_week?: number | null
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
      idea_box_submissions: {
        Row: {
          created_at: string
          id: string
          idea_text: string
          location: string
        }
        Insert: {
          created_at?: string
          id?: string
          idea_text: string
          location: string
        }
        Update: {
          created_at?: string
          id?: string
          idea_text?: string
          location?: string
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
      leave_requests: {
        Row: {
          created_at: string
          decided_at: string | null
          decided_by: string | null
          end_date: string
          id: string
          reason: string | null
          start_date: string
          status: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          end_date: string
          id?: string
          reason?: string | null
          start_date: string
          status?: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          end_date?: string
          id?: string
          reason?: string | null
          start_date?: string
          status?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      maintenance_settings: {
        Row: {
          id: string
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      maintenance_tickets: {
        Row: {
          aangemaakt_op: string
          bijgewerkt_op: string
          id: string
          melder_id: string
          prioriteit: string
          status: string
          titel: string
          toelichting: string | null
          vestiging: string
        }
        Insert: {
          aangemaakt_op?: string
          bijgewerkt_op?: string
          id?: string
          melder_id: string
          prioriteit?: string
          status?: string
          titel: string
          toelichting?: string | null
          vestiging: string
        }
        Update: {
          aangemaakt_op?: string
          bijgewerkt_op?: string
          id?: string
          melder_id?: string
          prioriteit?: string
          status?: string
          titel?: string
          toelichting?: string | null
          vestiging?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_tickets_melder_id_fkey"
            columns: ["melder_id"]
            isOneToOne: false
            referencedRelation: "maintenance_users"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_users: {
        Row: {
          actief: boolean
          created_at: string
          id: string
          naam: string
          pincode_hash: string
          rol: string
          updated_at: string
          vestiging: string
        }
        Insert: {
          actief?: boolean
          created_at?: string
          id?: string
          naam: string
          pincode_hash: string
          rol?: string
          updated_at?: string
          vestiging?: string
        }
        Update: {
          actief?: boolean
          created_at?: string
          id?: string
          naam?: string
          pincode_hash?: string
          rol?: string
          updated_at?: string
          vestiging?: string
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
      personeel_history: {
        Row: {
          count: number
          created_at: string
          date: string
          id: string
          location_id: string | null
          team_name: string
        }
        Insert: {
          count: number
          created_at?: string
          date: string
          id?: string
          location_id?: string | null
          team_name: string
        }
        Update: {
          count?: number
          created_at?: string
          date?: string
          id?: string
          location_id?: string | null
          team_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "personeel_history_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "personeel_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      personeel_housing: {
        Row: {
          address: string | null
          capacity: number | null
          color: string
          contact_name: string | null
          cost_per_month: number | null
          created_at: string
          description: string | null
          facilities: string[]
          id: string
          name: string
          notes: string | null
          room_size_m2: number | null
          rooms: number | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          address?: string | null
          capacity?: number | null
          color?: string
          contact_name?: string | null
          cost_per_month?: number | null
          created_at?: string
          description?: string | null
          facilities?: string[]
          id?: string
          name: string
          notes?: string | null
          room_size_m2?: number | null
          rooms?: number | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          address?: string | null
          capacity?: number | null
          color?: string
          contact_name?: string | null
          cost_per_month?: number | null
          created_at?: string
          description?: string | null
          facilities?: string[]
          id?: string
          name?: string
          notes?: string | null
          room_size_m2?: number | null
          rooms?: number | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      personeel_locations: {
        Row: {
          created_at: string
          id: string
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      personeel_people: {
        Row: {
          competence: string | null
          created_at: string
          days_per_week: number | null
          deleted_at: string | null
          end_date: string
          housing_id: string | null
          id: string
          location_id: string | null
          name: string
          notes: string | null
          pay: string | null
          room_id: string | null
          start_date: string
          team_id: string | null
          updated_at: string
          updated_by: string | null
          user_id: string | null
        }
        Insert: {
          competence?: string | null
          created_at?: string
          days_per_week?: number | null
          deleted_at?: string | null
          end_date: string
          housing_id?: string | null
          id?: string
          location_id?: string | null
          name: string
          notes?: string | null
          pay?: string | null
          room_id?: string | null
          start_date: string
          team_id?: string | null
          updated_at?: string
          updated_by?: string | null
          user_id?: string | null
        }
        Update: {
          competence?: string | null
          created_at?: string
          days_per_week?: number | null
          deleted_at?: string | null
          end_date?: string
          housing_id?: string | null
          id?: string
          location_id?: string | null
          name?: string
          notes?: string | null
          pay?: string | null
          room_id?: string | null
          start_date?: string
          team_id?: string | null
          updated_at?: string
          updated_by?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "personeel_people_housing_id_fkey"
            columns: ["housing_id"]
            isOneToOne: false
            referencedRelation: "personeel_housing"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "personeel_people_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "personeel_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "personeel_people_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "personeel_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "personeel_people_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "personeel_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      personeel_people_locations: {
        Row: {
          created_at: string
          id: string
          location_id: string
          person_id: string
          team_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          location_id: string
          person_id: string
          team_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          location_id?: string
          person_id?: string
          team_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "personeel_people_locations_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "personeel_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "personeel_people_locations_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "personeel_people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "personeel_people_locations_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "personeel_people_full"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "personeel_people_locations_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "personeel_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      personeel_rooms: {
        Row: {
          capacity: number
          cost_per_person: number | null
          cost_private: number | null
          created_at: string
          housing_id: string
          id: string
          name: string
          notes: string | null
          size_m2: number | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          capacity?: number
          cost_per_person?: number | null
          cost_private?: number | null
          created_at?: string
          housing_id: string
          id?: string
          name: string
          notes?: string | null
          size_m2?: number | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          capacity?: number
          cost_per_person?: number | null
          cost_private?: number | null
          created_at?: string
          housing_id?: string
          id?: string
          name?: string
          notes?: string | null
          size_m2?: number | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "personeel_rooms_housing_id_fkey"
            columns: ["housing_id"]
            isOneToOne: false
            referencedRelation: "personeel_housing"
            referencedColumns: ["id"]
          },
        ]
      }
      personeel_teams: {
        Row: {
          created_at: string
          id: string
          location_id: string
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          location_id: string
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          location_id?: string
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "personeel_teams_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "personeel_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          date_of_birth: string | null
          emergency_contact: string | null
          first_name: string
          id: string
          last_name: string
          nationality: string | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          date_of_birth?: string | null
          emergency_contact?: string | null
          first_name?: string
          id?: string
          last_name?: string
          nationality?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          date_of_birth?: string | null
          emergency_contact?: string | null
          first_name?: string
          id?: string
          last_name?: string
          nationality?: string | null
          phone?: string | null
          updated_at?: string
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
      schedules: {
        Row: {
          break_minutes: number | null
          created_at: string
          created_by: string | null
          date: string
          end_time: string
          id: string
          location: string
          notes: string | null
          shift_type: string | null
          start_time: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          break_minutes?: number | null
          created_at?: string
          created_by?: string | null
          date: string
          end_time: string
          id?: string
          location: string
          notes?: string | null
          shift_type?: string | null
          start_time: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          break_minutes?: number | null
          created_at?: string
          created_by?: string | null
          date?: string
          end_time?: string
          id?: string
          location?: string
          notes?: string | null
          shift_type?: string | null
          start_time?: string
          status?: string
          updated_at?: string
          user_id?: string
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
      shift_swap_requests: {
        Row: {
          created_at: string
          decided_at: string | null
          decided_by: string | null
          id: string
          message: string | null
          requester_id: string
          schedule_id: string
          status: string
          target_schedule_id: string | null
          target_user_id: string
        }
        Insert: {
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          id?: string
          message?: string | null
          requester_id: string
          schedule_id: string
          status?: string
          target_schedule_id?: string | null
          target_user_id: string
        }
        Update: {
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          id?: string
          message?: string | null
          requester_id?: string
          schedule_id?: string
          status?: string
          target_schedule_id?: string | null
          target_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shift_swap_requests_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "schedules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_swap_requests_target_schedule_id_fkey"
            columns: ["target_schedule_id"]
            isOneToOne: false
            referencedRelation: "schedules"
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
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      ticket_comments: {
        Row: {
          aangemaakt_op: string
          auteur_id: string
          id: string
          tekst: string
          ticket_id: string
        }
        Insert: {
          aangemaakt_op?: string
          auteur_id: string
          id?: string
          tekst: string
          ticket_id: string
        }
        Update: {
          aangemaakt_op?: string
          auteur_id?: string
          id?: string
          tekst?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_comments_auteur_id_fkey"
            columns: ["auteur_id"]
            isOneToOne: false
            referencedRelation: "maintenance_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_comments_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "maintenance_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      time_registrations: {
        Row: {
          approved_by: string | null
          break_taken_minutes: number | null
          clock_in: string
          clock_out: string | null
          created_at: string
          id: string
          location: string
          schedule_id: string | null
          status: string
          user_id: string
        }
        Insert: {
          approved_by?: string | null
          break_taken_minutes?: number | null
          clock_in: string
          clock_out?: string | null
          created_at?: string
          id?: string
          location: string
          schedule_id?: string | null
          status?: string
          user_id: string
        }
        Update: {
          approved_by?: string | null
          break_taken_minutes?: number | null
          clock_in?: string
          clock_out?: string | null
          created_at?: string
          id?: string
          location?: string
          schedule_id?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_registrations_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          contract_type: string | null
          created_at: string | null
          hired_date: string | null
          id: string
          is_active: boolean
          location: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          contract_type?: string | null
          created_at?: string | null
          hired_date?: string | null
          id?: string
          is_active?: boolean
          location: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          contract_type?: string | null
          created_at?: string | null
          hired_date?: string | null
          id?: string
          is_active?: boolean
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
      personeel_people_full: {
        Row: {
          assignments: Json | null
          competence: string | null
          created_at: string | null
          days_per_week: number | null
          deleted_at: string | null
          end_date: string | null
          housing_id: string | null
          id: string | null
          location_id: string | null
          name: string | null
          notes: string | null
          pay: string | null
          room_id: string | null
          start_date: string | null
          team_id: string | null
          updated_at: string | null
          updated_by: string | null
          user_id: string | null
        }
        Insert: {
          assignments?: never
          competence?: string | null
          created_at?: string | null
          days_per_week?: number | null
          deleted_at?: string | null
          end_date?: string | null
          housing_id?: string | null
          id?: string | null
          location_id?: string | null
          name?: string | null
          notes?: string | null
          pay?: string | null
          room_id?: string | null
          start_date?: string | null
          team_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
          user_id?: string | null
        }
        Update: {
          assignments?: never
          competence?: string | null
          created_at?: string | null
          days_per_week?: number | null
          deleted_at?: string | null
          end_date?: string | null
          housing_id?: string | null
          id?: string | null
          location_id?: string | null
          name?: string | null
          notes?: string | null
          pay?: string | null
          room_id?: string | null
          start_date?: string | null
          team_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "personeel_people_housing_id_fkey"
            columns: ["housing_id"]
            isOneToOne: false
            referencedRelation: "personeel_housing"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "personeel_people_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "personeel_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "personeel_people_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "personeel_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "personeel_people_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "personeel_teams"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      current_user_location: { Args: never; Returns: string }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      generate_order_number: { Args: never; Returns: string }
      get_user_location: { Args: { _user_id: string }; Returns: string }
      get_user_role: {
        Args: { uid: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_manager_same_location: {
        Args: { _profile_user_id: string }
        Returns: boolean
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "manager"
        | "kitchen_staff"
        | "hr"
        | "owner"
        | "team_lead"
        | "employee"
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
      app_role: [
        "admin",
        "manager",
        "kitchen_staff",
        "hr",
        "owner",
        "team_lead",
        "employee",
      ],
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
