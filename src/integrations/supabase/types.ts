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
      cijfers_instellingen: {
        Row: {
          updated_at: string
          uurloon_allin: number | null
          vestiging: string
          wg_lasten_factor: number
        }
        Insert: {
          updated_at?: string
          uurloon_allin?: number | null
          vestiging: string
          wg_lasten_factor?: number
        }
        Update: {
          updated_at?: string
          uurloon_allin?: number | null
          vestiging?: string
          wg_lasten_factor?: number
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
      eitje_connection: {
        Row: {
          created_at: string
          id: string
          laatste_fout: string | null
          laatste_sync_op: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          laatste_fout?: string | null
          laatste_sync_op?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          laatste_fout?: string | null
          laatste_sync_op?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      eitje_environments: {
        Row: {
          created_at: string
          eitje_environment_id: string
          eitje_naam: string | null
          id: string
          updated_at: string
          vestiging: string | null
        }
        Insert: {
          created_at?: string
          eitje_environment_id: string
          eitje_naam?: string | null
          id?: string
          updated_at?: string
          vestiging?: string | null
        }
        Update: {
          created_at?: string
          eitje_environment_id?: string
          eitje_naam?: string | null
          id?: string
          updated_at?: string
          vestiging?: string | null
        }
        Relationships: []
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
      foh_category_order: {
        Row: {
          category: string
          created_at: string
          department: string
          id: string
          location: string
          phase: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          department?: string
          id?: string
          location: string
          phase: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          department?: string
          id?: string
          location?: string
          phase?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      foh_daily_templates: {
        Row: {
          category: string
          created_at: string
          day_of_week: number | null
          department: string
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
          department?: string
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
          department?: string
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
          department: string
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
          department?: string
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
          department?: string
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
      ingredienten_master: {
        Row: {
          created_at: string
          id: string
          naam: string
        }
        Insert: {
          created_at?: string
          id?: string
          naam: string
        }
        Update: {
          created_at?: string
          id?: string
          naam?: string
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
      kassa_afdrachten: {
        Row: {
          created_at: string
          created_by: string | null
          date: string
          extra: Json
          id: string
          kassa_lade_denominations: Json
          kassa_lade_total: number
          location: string
          naam: string
          opmerkingen: string | null
          total: number
          type: string
          week_number: number
          wisselkas_denominations: Json
          wisselkas_total: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          date?: string
          extra?: Json
          id?: string
          kassa_lade_denominations?: Json
          kassa_lade_total?: number
          location: string
          naam: string
          opmerkingen?: string | null
          total?: number
          type: string
          week_number: number
          wisselkas_denominations?: Json
          wisselkas_total?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          date?: string
          extra?: Json
          id?: string
          kassa_lade_denominations?: Json
          kassa_lade_total?: number
          location?: string
          naam?: string
          opmerkingen?: string | null
          total?: number
          type?: string
          week_number?: number
          wisselkas_denominations?: Json
          wisselkas_total?: number
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
      lightspeed_connections: {
        Row: {
          access_token: string | null
          created_at: string
          id: string
          laatste_fout: string | null
          laatste_sync_op: string | null
          merchant_id: string
          refresh_token: string | null
          refreshing_until: string | null
          status: string
          token_expires_at: string | null
          updated_at: string
          vestiging: string
        }
        Insert: {
          access_token?: string | null
          created_at?: string
          id?: string
          laatste_fout?: string | null
          laatste_sync_op?: string | null
          merchant_id: string
          refresh_token?: string | null
          refreshing_until?: string | null
          status?: string
          token_expires_at?: string | null
          updated_at?: string
          vestiging: string
        }
        Update: {
          access_token?: string | null
          created_at?: string
          id?: string
          laatste_fout?: string | null
          laatste_sync_op?: string | null
          merchant_id?: string
          refresh_token?: string | null
          refreshing_until?: string | null
          status?: string
          token_expires_at?: string | null
          updated_at?: string
          vestiging?: string
        }
        Relationships: []
      }
      lightspeed_oauth_states: {
        Row: {
          code_verifier: string
          created_at: string
          expires_at: string
          state: string
          vestiging: string
        }
        Insert: {
          code_verifier: string
          created_at?: string
          expires_at?: string
          state: string
          vestiging: string
        }
        Update: {
          code_verifier?: string
          created_at?: string
          expires_at?: string
          state?: string
          vestiging?: string
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
          foto_url: string | null
          id: string
          melder_id: string | null
          melder_naam: string | null
          melder_user_id: string | null
          plek: string | null
          prioriteit: string
          status: string
          titel: string
          toelichting: string | null
          vestiging: string
        }
        Insert: {
          aangemaakt_op?: string
          bijgewerkt_op?: string
          foto_url?: string | null
          id?: string
          melder_id?: string | null
          melder_naam?: string | null
          melder_user_id?: string | null
          plek?: string | null
          prioriteit?: string
          status?: string
          titel: string
          toelichting?: string | null
          vestiging: string
        }
        Update: {
          aangemaakt_op?: string
          bijgewerkt_op?: string
          foto_url?: string | null
          id?: string
          melder_id?: string | null
          melder_naam?: string | null
          melder_user_id?: string | null
          plek?: string | null
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
      omzet_uren: {
        Row: {
          aantal_bonnen: number
          created_at: string
          id: string
          is_demo: boolean
          omzet_excl: number
          omzet_incl: number
          updated_at: string
          uur: number
          vestiging: string
          werkdag: string
        }
        Insert: {
          aantal_bonnen?: number
          created_at?: string
          id?: string
          is_demo?: boolean
          omzet_excl?: number
          omzet_incl?: number
          updated_at?: string
          uur: number
          vestiging: string
          werkdag: string
        }
        Update: {
          aantal_bonnen?: number
          created_at?: string
          id?: string
          is_demo?: boolean
          omzet_excl?: number
          omzet_incl?: number
          updated_at?: string
          uur?: number
          vestiging?: string
          werkdag?: string
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
          color: string
          created_at: string
          id: string
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          color?: string
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
          housing_not_needed: boolean
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
          housing_not_needed?: boolean
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
          housing_not_needed?: boolean
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
          function_group: string | null
          id: string
          location_id: string
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          function_group?: string | null
          id?: string
          location_id: string
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          function_group?: string | null
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
      print_jobs: {
        Row: {
          aangemaakt_door: string | null
          created_at: string
          foutmelding: string | null
          geprint_op: string | null
          id: string
          label_omschrijving: string | null
          recipe_id: string | null
          status: string
          zpl: string
        }
        Insert: {
          aangemaakt_door?: string | null
          created_at?: string
          foutmelding?: string | null
          geprint_op?: string | null
          id?: string
          label_omschrijving?: string | null
          recipe_id?: string | null
          status?: string
          zpl: string
        }
        Update: {
          aangemaakt_door?: string | null
          created_at?: string
          foutmelding?: string | null
          geprint_op?: string | null
          id?: string
          label_omschrijving?: string | null
          recipe_id?: string | null
          status?: string
          zpl?: string
        }
        Relationships: [
          {
            foreignKeyName: "print_jobs_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
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
          mag_cijfers_zien: boolean
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
          mag_cijfers_zien?: boolean
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
          mag_cijfers_zien?: boolean
          nationality?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      recept_ingredienten: {
        Row: {
          created_at: string
          eenheid: string | null
          hoeveelheid: string | null
          id: string
          ingredient_id: string | null
          naam: string
          recept_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          eenheid?: string | null
          hoeveelheid?: string | null
          id?: string
          ingredient_id?: string | null
          naam: string
          recept_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          eenheid?: string | null
          hoeveelheid?: string | null
          id?: string
          ingredient_id?: string | null
          naam?: string
          recept_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "recept_ingredienten_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredienten_master"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recept_ingredienten_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "v_ingredienten_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recept_ingredienten_recept_id_fkey"
            columns: ["recept_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
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
          arbeid_minuten: number | null
          bereiding: string | null
          category: string
          created_at: string | null
          created_by: string
          description: string | null
          foto_url: string | null
          id: string
          is_gearchiveerd: boolean
          location: string | null
          name: string
          porties: number | null
          prep_time_minutes: number | null
          tht_dagen: number
          type: string
          updated_at: string | null
        }
        Insert: {
          arbeid_minuten?: number | null
          bereiding?: string | null
          category: string
          created_at?: string | null
          created_by?: string
          description?: string | null
          foto_url?: string | null
          id?: string
          is_gearchiveerd?: boolean
          location?: string | null
          name: string
          porties?: number | null
          prep_time_minutes?: number | null
          tht_dagen?: number
          type?: string
          updated_at?: string | null
        }
        Update: {
          arbeid_minuten?: number | null
          bereiding?: string | null
          category?: string
          created_at?: string | null
          created_by?: string
          description?: string | null
          foto_url?: string | null
          id?: string
          is_gearchiveerd?: boolean
          location?: string | null
          name?: string
          porties?: number | null
          prep_time_minutes?: number | null
          tht_dagen?: number
          type?: string
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
      sticker_producten: {
        Row: {
          created_at: string
          id: string
          keer_geprint: number
          laatst_geprint: string
          laatst_tht_dagen: number | null
          laatst_type: string | null
          naam: string
        }
        Insert: {
          created_at?: string
          id?: string
          keer_geprint?: number
          laatst_geprint?: string
          laatst_tht_dagen?: number | null
          laatst_type?: string | null
          naam: string
        }
        Update: {
          created_at?: string
          id?: string
          keer_geprint?: number
          laatst_geprint?: string
          laatst_tht_dagen?: number | null
          laatst_type?: string | null
          naam?: string
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
      sync_leases: {
        Row: {
          bron: string
          expires_at: string | null
          holder: string | null
          lease_token: string | null
          updated_at: string
        }
        Insert: {
          bron: string
          expires_at?: string | null
          holder?: string | null
          lease_token?: string | null
          updated_at?: string
        }
        Update: {
          bron?: string
          expires_at?: string | null
          holder?: string | null
          lease_token?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      sync_runs: {
        Row: {
          bonnen_verwerkt: number | null
          bron: string
          details: Json | null
          foutmelding: string | null
          gestart_op: string
          id: string
          klaar_op: string | null
          periode_tot: string | null
          periode_van: string | null
          state: Json | null
          status: string
          type: string
          vestiging: string | null
        }
        Insert: {
          bonnen_verwerkt?: number | null
          bron?: string
          details?: Json | null
          foutmelding?: string | null
          gestart_op?: string
          id?: string
          klaar_op?: string | null
          periode_tot?: string | null
          periode_van?: string | null
          state?: Json | null
          status?: string
          type: string
          vestiging?: string | null
        }
        Update: {
          bonnen_verwerkt?: number | null
          bron?: string
          details?: Json | null
          foutmelding?: string | null
          gestart_op?: string
          id?: string
          klaar_op?: string | null
          periode_tot?: string | null
          periode_van?: string | null
          state?: Json | null
          status?: string
          type?: string
          vestiging?: string | null
        }
        Relationships: []
      }
      terschelling_events: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          last_seen_at: string
          location: string | null
          name: string
          source_url: string | null
          start_date: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          last_seen_at?: string
          location?: string | null
          name: string
          source_url?: string | null
          start_date: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          last_seen_at?: string
          location?: string | null
          name?: string
          source_url?: string | null
          start_date?: string
          updated_at?: string
        }
        Relationships: []
      }
      ticket_comments: {
        Row: {
          aangemaakt_op: string
          auteur_id: string | null
          auteur_naam: string | null
          auteur_user_id: string | null
          id: string
          tekst: string
          ticket_id: string
        }
        Insert: {
          aangemaakt_op?: string
          auteur_id?: string | null
          auteur_naam?: string | null
          auteur_user_id?: string | null
          id?: string
          tekst: string
          ticket_id: string
        }
        Update: {
          aangemaakt_op?: string
          auteur_id?: string | null
          auteur_naam?: string | null
          auteur_user_id?: string | null
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
      uren_dagen: {
        Row: {
          created_at: string
          eitje_omzet_dag: number | null
          geplande_uren: number
          gewerkte_uren: number
          id: string
          is_demo: boolean
          loonkosten: number | null
          loonkosten_bron: string | null
          updated_at: string
          vestiging: string
          werkdag: string
        }
        Insert: {
          created_at?: string
          eitje_omzet_dag?: number | null
          geplande_uren?: number
          gewerkte_uren?: number
          id?: string
          is_demo?: boolean
          loonkosten?: number | null
          loonkosten_bron?: string | null
          updated_at?: string
          vestiging: string
          werkdag: string
        }
        Update: {
          created_at?: string
          eitje_omzet_dag?: number | null
          geplande_uren?: number
          gewerkte_uren?: number
          id?: string
          is_demo?: boolean
          loonkosten?: number | null
          loonkosten_bron?: string | null
          updated_at?: string
          vestiging?: string
          werkdag?: string
        }
        Relationships: []
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
      waste_pickups: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          acknowledged_reason: string | null
          created_at: string
          escalation_sent_at: string | null
          fraction: string
          id: string
          location: string
          pickup_date: string
          sluit_task_id: string | null
          source: string
          tussen_task_id: string | null
          updated_at: string
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          acknowledged_reason?: string | null
          created_at?: string
          escalation_sent_at?: string | null
          fraction: string
          id?: string
          location?: string
          pickup_date: string
          sluit_task_id?: string | null
          source: string
          tussen_task_id?: string | null
          updated_at?: string
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          acknowledged_reason?: string | null
          created_at?: string
          escalation_sent_at?: string | null
          fraction?: string
          id?: string
          location?: string
          pickup_date?: string
          sluit_task_id?: string | null
          source?: string
          tussen_task_id?: string | null
          updated_at?: string
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
          housing_not_needed: boolean | null
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
          housing_not_needed?: boolean | null
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
          housing_not_needed?: boolean | null
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
      v_cijfers_dag: {
        Row: {
          aantal_bonnen: number | null
          is_demo: boolean | null
          omzet_excl: number | null
          omzet_incl: number | null
          vestiging: string | null
          werkdag: string | null
        }
        Relationships: []
      }
      v_cijfers_uur_weekdag: {
        Row: {
          gem_omzet: number | null
          isodow: number | null
          n_dagen: number | null
          uur: number | null
          vestiging: string | null
        }
        Relationships: []
      }
      v_ingredienten_stats: {
        Row: {
          aantal_recepten: number | null
          id: string | null
          laatst_gebruikt: string | null
          naam: string | null
        }
        Relationships: []
      }
      v_lightspeed_status: {
        Row: {
          laatste_fout: string | null
          laatste_sync_op: string | null
          merchant_id: string | null
          status: string | null
          token_expires_at: string | null
          token_geldig: boolean | null
          updated_at: string | null
          vestiging: string | null
        }
        Insert: {
          laatste_fout?: string | null
          laatste_sync_op?: string | null
          merchant_id?: string | null
          status?: string | null
          token_expires_at?: string | null
          token_geldig?: never
          updated_at?: string | null
          vestiging?: string | null
        }
        Update: {
          laatste_fout?: string | null
          laatste_sync_op?: string | null
          merchant_id?: string | null
          status?: string | null
          token_expires_at?: string | null
          token_geldig?: never
          updated_at?: string | null
          vestiging?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      claim_next_print_job: {
        Args: never
        Returns: {
          id: string
          label_omschrijving: string
          zpl: string
        }[]
      }
      current_user_location: { Args: never; Returns: string }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      email_queue_dispatch: { Args: never; Returns: undefined }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      foh_rename_category: {
        Args: {
          _department: string
          _location: string
          _new: string
          _old: string
          _phase: string
        }
        Returns: undefined
      }
      generate_order_number: { Args: never; Returns: string }
      get_user_location: { Args: { _user_id: string }; Returns: string }
      get_user_role: {
        Args: { uid: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_waste_tasks_token: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      ingredienten_merge: {
        Args: { _drop: string[]; _keep: string }
        Returns: number
      }
      is_manager_same_location: {
        Args: { _profile_user_id: string }
        Returns: boolean
      }
      mag_cijfers_zien: { Args: { _uid: string }; Returns: boolean }
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
      rpc_cijfers_heatmap: {
        Args: { p_tot: string; p_van: string; p_vestigingen: string[] }
        Returns: {
          gem_omzet: number
          isodow: number
          n_dagen: number
          uur: number
        }[]
      }
      rpc_cijfers_samenvatting: {
        Args: { p_tot: string; p_van: string; p_vestigingen: string[] }
        Returns: Json
      }
      rpc_cijfers_tijdreeks: {
        Args: {
          p_granulariteit: string
          p_tot: string
          p_van: string
          p_vestigingen: string[]
        }
        Returns: {
          bonnen: number
          bucket: string
          omzet: number
          vestiging: string
        }[]
      }
      rpc_cijfers_weekdag_vergelijk: {
        Args: { p_tot: string; p_van: string; p_vestigingen: string[] }
        Returns: {
          delta_pct: number
          gem_periode: number
          gem_referentie: number
          isodow: number
        }[]
      }
      rpc_demo_data_wissen: { Args: never; Returns: number }
      rpc_heeft_demo_data: { Args: never; Returns: boolean }
      sticker_producten_bump: {
        Args: { _naam: string; _tht: number; _type: string }
        Returns: string
      }
      sync_lease_acquire: {
        Args: { _bron: string; _holder: string; _seconds: number }
        Returns: string
      }
      sync_lease_release: {
        Args: { _bron: string; _token: string }
        Returns: undefined
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
        | "staff"
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
        "staff",
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
