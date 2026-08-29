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
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      activities: {
        Row: {
          created_at: string
          id: string
          mission_id: string
          payload: Json
          position: number
          status: Database["public"]["Enums"]["activity_status"]
          type: Database["public"]["Enums"]["activity_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          mission_id: string
          payload?: Json
          position?: number
          status?: Database["public"]["Enums"]["activity_status"]
          type: Database["public"]["Enums"]["activity_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          mission_id?: string
          payload?: Json
          position?: number
          status?: Database["public"]["Enums"]["activity_status"]
          type?: Database["public"]["Enums"]["activity_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activities_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_answer_keys: {
        Row: {
          activity_id: string
          created_at: string
          key: Json
        }
        Insert: {
          activity_id: string
          created_at?: string
          key: Json
        }
        Update: {
          activity_id?: string
          created_at?: string
          key?: Json
        }
        Relationships: [
          {
            foreignKeyName: "activity_answer_keys_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: true
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_responses: {
        Row: {
          activity_id: string
          created_at: string
          id: string
          payload: Json
          submitted_at: string
          user_id: string
        }
        Insert: {
          activity_id: string
          created_at?: string
          id?: string
          payload?: Json
          submitted_at?: string
          user_id: string
        }
        Update: {
          activity_id?: string
          created_at?: string
          id?: string
          payload?: Json
          submitted_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_responses_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_answers: {
        Row: {
          created_at: string
          goal_id: string
          id: string
          question_id: string
          selected_index: number
          user_id: string
        }
        Insert: {
          created_at?: string
          goal_id: string
          id?: string
          question_id: string
          selected_index: number
          user_id: string
        }
        Update: {
          created_at?: string
          goal_id?: string
          id?: string
          question_id?: string
          selected_index?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_answers_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "assessment_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_questions: {
        Row: {
          cefr_level: Database["public"]["Enums"]["cefr_level"] | null
          correct_index: number
          created_at: string
          difficulty: number
          id: string
          knowledge_item_id: string | null
          language: string
          options: string[]
          position: number
          prompt: string
          skill: Database["public"]["Enums"]["skill"]
        }
        Insert: {
          cefr_level?: Database["public"]["Enums"]["cefr_level"] | null
          correct_index: number
          created_at?: string
          difficulty?: number
          id?: string
          knowledge_item_id?: string | null
          language: string
          options: string[]
          position?: number
          prompt: string
          skill: Database["public"]["Enums"]["skill"]
        }
        Update: {
          cefr_level?: Database["public"]["Enums"]["cefr_level"] | null
          correct_index?: number
          created_at?: string
          difficulty?: number
          id?: string
          knowledge_item_id?: string | null
          language?: string
          options?: string[]
          position?: number
          prompt?: string
          skill?: Database["public"]["Enums"]["skill"]
        }
        Relationships: [
          {
            foreignKeyName: "assessment_questions_knowledge_item_id_fkey"
            columns: ["knowledge_item_id"]
            isOneToOne: false
            referencedRelation: "knowledge_items"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_results: {
        Row: {
          created_at: string
          focus_areas: string[]
          goal_id: string
          id: string
          learning_state_id: string
          needs_work_skill: Database["public"]["Enums"]["skill"]
          priority_label: string
          stronger_skill: Database["public"]["Enums"]["skill"]
          user_id: string
        }
        Insert: {
          created_at?: string
          focus_areas: string[]
          goal_id: string
          id?: string
          learning_state_id: string
          needs_work_skill: Database["public"]["Enums"]["skill"]
          priority_label: string
          stronger_skill: Database["public"]["Enums"]["skill"]
          user_id: string
        }
        Update: {
          created_at?: string
          focus_areas?: string[]
          goal_id?: string
          id?: string
          learning_state_id?: string
          needs_work_skill?: Database["public"]["Enums"]["skill"]
          priority_label?: string
          stronger_skill?: Database["public"]["Enums"]["skill"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_results_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_results_learning_state_id_fkey"
            columns: ["learning_state_id"]
            isOneToOne: false
            referencedRelation: "learning_states"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_sessions: {
        Row: {
          budget_seconds: number
          created_at: string
          current_cefr: Database["public"]["Enums"]["cefr_level"]
          declared_cefr: Database["public"]["Enums"]["cefr_level"]
          ended_at: string | null
          goal_id: string
          id: string
          served_count: number
          started_at: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          budget_seconds?: number
          created_at?: string
          current_cefr: Database["public"]["Enums"]["cefr_level"]
          declared_cefr: Database["public"]["Enums"]["cefr_level"]
          ended_at?: string | null
          goal_id: string
          id?: string
          served_count?: number
          started_at?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          budget_seconds?: number
          created_at?: string
          current_cefr?: Database["public"]["Enums"]["cefr_level"]
          declared_cefr?: Database["public"]["Enums"]["cefr_level"]
          ended_at?: string | null
          goal_id?: string
          id?: string
          served_count?: number
          started_at?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_sessions_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      content_sources: {
        Row: {
          author: string
          created_at: string
          id: string
          license: string
          license_url: string | null
          parser: string
          parser_config: Json
          source_url: string
          status: string
          status_error: string | null
          title: string
          updated_at: string
        }
        Insert: {
          author: string
          created_at?: string
          id?: string
          license: string
          license_url?: string | null
          parser: string
          parser_config?: Json
          source_url: string
          status?: string
          status_error?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          author?: string
          created_at?: string
          id?: string
          license?: string
          license_url?: string | null
          parser?: string
          parser_config?: Json
          source_url?: string
          status?: string
          status_error?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      content_unit_topics: {
        Row: {
          content_unit_id: string
          topic_id: string
        }
        Insert: {
          content_unit_id: string
          topic_id: string
        }
        Update: {
          content_unit_id?: string
          topic_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_unit_topics_content_unit_id_fkey"
            columns: ["content_unit_id"]
            isOneToOne: false
            referencedRelation: "content_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_unit_topics_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      content_units: {
        Row: {
          cefr_level: Database["public"]["Enums"]["cefr_level"] | null
          created_at: string
          external_id: string
          id: string
          kind: string
          parsed_at: string | null
          parsed_blocks: Json | null
          part_title: string | null
          position: number
          raw_fetched_at: string | null
          raw_html: string | null
          source_id: string
          status: string
          title: string
          unit_url: string | null
          updated_at: string
          word_count: number | null
        }
        Insert: {
          cefr_level?: Database["public"]["Enums"]["cefr_level"] | null
          created_at?: string
          external_id: string
          id?: string
          kind: string
          parsed_at?: string | null
          parsed_blocks?: Json | null
          part_title?: string | null
          position?: number
          raw_fetched_at?: string | null
          raw_html?: string | null
          source_id: string
          status?: string
          title: string
          unit_url?: string | null
          updated_at?: string
          word_count?: number | null
        }
        Update: {
          cefr_level?: Database["public"]["Enums"]["cefr_level"] | null
          created_at?: string
          external_id?: string
          id?: string
          kind?: string
          parsed_at?: string | null
          parsed_blocks?: Json | null
          part_title?: string | null
          position?: number
          raw_fetched_at?: string | null
          raw_html?: string | null
          source_id?: string
          status?: string
          title?: string
          unit_url?: string | null
          updated_at?: string
          word_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "content_units_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "content_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          id: string
          name: string
          payload: Json
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          payload?: Json
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          payload?: Json
          user_id?: string | null
        }
        Relationships: []
      }
      evidence: {
        Row: {
          activity_id: string | null
          created_at: string
          goal_id: string
          id: string
          knowledge_item_id: string | null
          payload: Json
          skill: Database["public"]["Enums"]["skill"]
          strength: Database["public"]["Enums"]["evidence_strength"]
          user_id: string
        }
        Insert: {
          activity_id?: string | null
          created_at?: string
          goal_id: string
          id?: string
          knowledge_item_id?: string | null
          payload?: Json
          skill: Database["public"]["Enums"]["skill"]
          strength: Database["public"]["Enums"]["evidence_strength"]
          user_id: string
        }
        Update: {
          activity_id?: string | null
          created_at?: string
          goal_id?: string
          id?: string
          knowledge_item_id?: string | null
          payload?: Json
          skill?: Database["public"]["Enums"]["skill"]
          strength?: Database["public"]["Enums"]["evidence_strength"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "evidence_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evidence_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evidence_knowledge_item_id_fkey"
            columns: ["knowledge_item_id"]
            isOneToOne: false
            referencedRelation: "knowledge_items"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback: {
        Row: {
          activity_response_id: string
          created_at: string
          example: string | null
          id: string
          improve: string
          user_id: string
          went_well: string
        }
        Insert: {
          activity_response_id: string
          created_at?: string
          example?: string | null
          id?: string
          improve: string
          user_id: string
          went_well: string
        }
        Update: {
          activity_response_id?: string
          created_at?: string
          example?: string | null
          id?: string
          improve?: string
          user_id?: string
          went_well?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_activity_response_id_fkey"
            columns: ["activity_response_id"]
            isOneToOne: true
            referencedRelation: "activity_responses"
            referencedColumns: ["id"]
          },
        ]
      }
      generated_exercises: {
        Row: {
          created_at: string
          id: string
          knowledge_item_id: string
          payload: Json
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          knowledge_item_id: string
          payload: Json
          status?: string
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          knowledge_item_id?: string
          payload?: Json
          status?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "generated_exercises_knowledge_item_id_fkey"
            columns: ["knowledge_item_id"]
            isOneToOne: false
            referencedRelation: "knowledge_items"
            referencedColumns: ["id"]
          },
        ]
      }
      goal_outcomes: {
        Row: {
          created_at: string
          description: string
          goal_id: string
          id: string
          label: string
          position: number
          user_id: string
        }
        Insert: {
          created_at?: string
          description: string
          goal_id: string
          id?: string
          label: string
          position?: number
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string
          goal_id?: string
          id?: string
          label?: string
          position?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goal_outcomes_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          created_at: string
          daily_minutes: number
          deadline: string
          declared_cefr: Database["public"]["Enums"]["cefr_level"] | null
          id: string
          raw_input: string
          readiness_label: string | null
          readiness_reason: string | null
          required_cefr: Database["public"]["Enums"]["cefr_level"] | null
          status: Database["public"]["Enums"]["goal_status"]
          target_language: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          daily_minutes: number
          deadline: string
          declared_cefr?: Database["public"]["Enums"]["cefr_level"] | null
          id?: string
          raw_input: string
          readiness_label?: string | null
          readiness_reason?: string | null
          required_cefr?: Database["public"]["Enums"]["cefr_level"] | null
          status?: Database["public"]["Enums"]["goal_status"]
          target_language: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          daily_minutes?: number
          deadline?: string
          declared_cefr?: Database["public"]["Enums"]["cefr_level"] | null
          id?: string
          raw_input?: string
          readiness_label?: string | null
          readiness_reason?: string | null
          required_cefr?: Database["public"]["Enums"]["cefr_level"] | null
          status?: Database["public"]["Enums"]["goal_status"]
          target_language?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      jobs: {
        Row: {
          created_at: string
          error_code: string | null
          id: string
          input: Json
          kind: Database["public"]["Enums"]["job_kind"]
          result: Json | null
          status: Database["public"]["Enums"]["job_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          error_code?: string | null
          id?: string
          input?: Json
          kind: Database["public"]["Enums"]["job_kind"]
          result?: Json | null
          status?: Database["public"]["Enums"]["job_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          error_code?: string | null
          id?: string
          input?: Json
          kind?: Database["public"]["Enums"]["job_kind"]
          result?: Json | null
          status?: Database["public"]["Enums"]["job_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      knowledge_items: {
        Row: {
          content_unit_id: string
          created_at: string
          data: Json
          dedup_key: string
          id: string
          kind: string
          origin: string
          status: string
          updated_at: string
        }
        Insert: {
          content_unit_id: string
          created_at?: string
          data: Json
          dedup_key: string
          id?: string
          kind: string
          origin: string
          status?: string
          updated_at?: string
        }
        Update: {
          content_unit_id?: string
          created_at?: string
          data?: Json
          dedup_key?: string
          id?: string
          kind?: string
          origin?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_items_content_unit_id_fkey"
            columns: ["content_unit_id"]
            isOneToOne: false
            referencedRelation: "content_units"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_states: {
        Row: {
          assessed_cefr: Database["public"]["Enums"]["cefr_level"] | null
          cefr_confidence: number | null
          created_at: string
          goal_id: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assessed_cefr?: Database["public"]["Enums"]["cefr_level"] | null
          cefr_confidence?: number | null
          created_at?: string
          goal_id: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assessed_cefr?: Database["public"]["Enums"]["cefr_level"] | null
          cefr_confidence?: number | null
          created_at?: string
          goal_id?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_states_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: true
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      mascot_states: {
        Row: {
          created_at: string
          growth_progress: number
          id: string
          mood: Database["public"]["Enums"]["mascot_mood"]
          stage: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          growth_progress?: number
          id?: string
          mood?: Database["public"]["Enums"]["mascot_mood"]
          stage?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          growth_progress?: number
          id?: string
          mood?: Database["public"]["Enums"]["mascot_mood"]
          stage?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      materials: {
        Row: {
          created_at: string
          extracted_text: string | null
          id: string
          kind: Database["public"]["Enums"]["material_kind"]
          source_url: string | null
          status: Database["public"]["Enums"]["material_status"]
          storage_path: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          extracted_text?: string | null
          id?: string
          kind: Database["public"]["Enums"]["material_kind"]
          source_url?: string | null
          status?: Database["public"]["Enums"]["material_status"]
          storage_path?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          extracted_text?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["material_kind"]
          source_url?: string | null
          status?: Database["public"]["Enums"]["material_status"]
          storage_path?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      missions: {
        Row: {
          content_unit_id: string | null
          created_at: string
          estimated_minutes: number
          goal_id: string
          id: string
          primary_skill: Database["public"]["Enums"]["skill"]
          purpose: string
          roadmap_module_id: string | null
          status: Database["public"]["Enums"]["mission_status"]
          title: string
          updated_at: string
          user_id: string
          why: string
        }
        Insert: {
          content_unit_id?: string | null
          created_at?: string
          estimated_minutes: number
          goal_id: string
          id?: string
          primary_skill: Database["public"]["Enums"]["skill"]
          purpose: string
          roadmap_module_id?: string | null
          status?: Database["public"]["Enums"]["mission_status"]
          title: string
          updated_at?: string
          user_id: string
          why: string
        }
        Update: {
          content_unit_id?: string | null
          created_at?: string
          estimated_minutes?: number
          goal_id?: string
          id?: string
          primary_skill?: Database["public"]["Enums"]["skill"]
          purpose?: string
          roadmap_module_id?: string | null
          status?: Database["public"]["Enums"]["mission_status"]
          title?: string
          updated_at?: string
          user_id?: string
          why?: string
        }
        Relationships: [
          {
            foreignKeyName: "missions_content_unit_id_fkey"
            columns: ["content_unit_id"]
            isOneToOne: false
            referencedRelation: "content_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "missions_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "missions_roadmap_module_id_fkey"
            columns: ["roadmap_module_id"]
            isOneToOne: false
            referencedRelation: "roadmap_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string
          id: string
          native_language: string
          ui_language: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string
          id: string
          native_language?: string
          ui_language?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string
          id?: string
          native_language?: string
          ui_language?: string
          updated_at?: string
        }
        Relationships: []
      }
      public_resources: {
        Row: {
          created_at: string
          description: string
          id: string
          language: string
          skills: Database["public"]["Enums"]["skill"][]
          source_url: string
          title: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          language: string
          skills?: Database["public"]["Enums"]["skill"][]
          source_url: string
          title: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          language?: string
          skills?: Database["public"]["Enums"]["skill"][]
          source_url?: string
          title?: string
        }
        Relationships: []
      }
      recommendations: {
        Row: {
          created_at: string
          goal_id: string
          id: string
          mission_id: string | null
          reason: string
          skills_affected: Database["public"]["Enums"]["skill"][]
          user_id: string
        }
        Insert: {
          created_at?: string
          goal_id: string
          id?: string
          mission_id?: string | null
          reason: string
          skills_affected?: Database["public"]["Enums"]["skill"][]
          user_id: string
        }
        Update: {
          created_at?: string
          goal_id?: string
          id?: string
          mission_id?: string | null
          reason?: string
          skills_affected?: Database["public"]["Enums"]["skill"][]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recommendations_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recommendations_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
        ]
      }
      roadmap_modules: {
        Row: {
          created_at: string
          goal_id: string
          id: string
          kind: string
          position: number
          status: string
          target_cefr: Database["public"]["Enums"]["cefr_level"]
          title: string
          topic_id: string | null
          updated_at: string
          user_id: string
          why: string
        }
        Insert: {
          created_at?: string
          goal_id: string
          id?: string
          kind?: string
          position: number
          status?: string
          target_cefr: Database["public"]["Enums"]["cefr_level"]
          title: string
          topic_id?: string | null
          updated_at?: string
          user_id: string
          why: string
        }
        Update: {
          created_at?: string
          goal_id?: string
          id?: string
          kind?: string
          position?: number
          status?: string
          target_cefr?: Database["public"]["Enums"]["cefr_level"]
          title?: string
          topic_id?: string | null
          updated_at?: string
          user_id?: string
          why?: string
        }
        Relationships: [
          {
            foreignKeyName: "roadmap_modules_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roadmap_modules_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_states: {
        Row: {
          confidence: number
          created_at: string
          id: string
          learning_state_id: string
          level: number
          skill: Database["public"]["Enums"]["skill"]
          trend: Database["public"]["Enums"]["skill_trend"]
          updated_at: string
          user_id: string
        }
        Insert: {
          confidence: number
          created_at?: string
          id?: string
          learning_state_id: string
          level: number
          skill: Database["public"]["Enums"]["skill"]
          trend?: Database["public"]["Enums"]["skill_trend"]
          updated_at?: string
          user_id: string
        }
        Update: {
          confidence?: number
          created_at?: string
          id?: string
          learning_state_id?: string
          level?: number
          skill?: Database["public"]["Enums"]["skill"]
          trend?: Database["public"]["Enums"]["skill_trend"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "skill_states_learning_state_id_fkey"
            columns: ["learning_state_id"]
            isOneToOne: false
            referencedRelation: "learning_states"
            referencedColumns: ["id"]
          },
        ]
      }
      topics: {
        Row: {
          category: string
          created_at: string
          id: string
          label: string
          slug: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          label: string
          slug: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          label?: string
          slug?: string
          updated_at?: string
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
      activity_status: "pending" | "in_progress" | "completed"
      activity_type:
        | "vocabulary_choice"
        | "vocabulary_recall"
        | "grammar_practice"
        | "reading_comprehension"
        | "listening_comprehension"
        | "speaking_response"
        | "speaking_roleplay"
        | "writing_response"
      cefr_level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2"
      evidence_strength: "weak" | "moderate" | "strong"
      goal_status: "draft" | "active" | "paused" | "completed"
      job_kind:
        | "goal_analyze"
        | "assessment_evaluate"
        | "mission_generate"
        | "material_ingest"
        | "speaking_assess"
      job_status: "queued" | "running" | "done" | "failed"
      mascot_mood: "neutral" | "thinking" | "celebrating" | "resting"
      material_kind: "pdf" | "image" | "text" | "url"
      material_status: "queued" | "processing" | "ready" | "failed"
      mission_status: "pending" | "active" | "completed" | "skipped"
      skill:
        | "speaking"
        | "listening"
        | "vocabulary"
        | "grammar"
        | "reading"
        | "writing"
      skill_trend: "improving" | "stable" | "declining"
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
      activity_status: ["pending", "in_progress", "completed"],
      activity_type: [
        "vocabulary_choice",
        "vocabulary_recall",
        "grammar_practice",
        "reading_comprehension",
        "listening_comprehension",
        "speaking_response",
        "speaking_roleplay",
        "writing_response",
      ],
      cefr_level: ["A1", "A2", "B1", "B2", "C1", "C2"],
      evidence_strength: ["weak", "moderate", "strong"],
      goal_status: ["draft", "active", "paused", "completed"],
      job_kind: [
        "goal_analyze",
        "assessment_evaluate",
        "mission_generate",
        "material_ingest",
        "speaking_assess",
      ],
      job_status: ["queued", "running", "done", "failed"],
      mascot_mood: ["neutral", "thinking", "celebrating", "resting"],
      material_kind: ["pdf", "image", "text", "url"],
      material_status: ["queued", "processing", "ready", "failed"],
      mission_status: ["pending", "active", "completed", "skipped"],
      skill: [
        "speaking",
        "listening",
        "vocabulary",
        "grammar",
        "reading",
        "writing",
      ],
      skill_trend: ["improving", "stable", "declining"],
    },
  },
} as const
