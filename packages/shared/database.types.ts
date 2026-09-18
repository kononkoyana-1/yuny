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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      dictionary_entries: {
        Row: {
          compact: string[]
          created_at: string
          headword: string
          hsk_level: number | null
          id: number
          reading: string | null
          reading_plain: string | null
          senses: Json
        }
        Insert: {
          compact?: string[]
          created_at?: string
          headword: string
          hsk_level?: number | null
          id?: number
          reading?: string | null
          reading_plain?: string | null
          senses: Json
        }
        Update: {
          compact?: string[]
          created_at?: string
          headword?: string
          hsk_level?: number | null
          id?: number
          reading?: string | null
          reading_plain?: string | null
          senses?: Json
        }
        Relationships: []
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
        Relationships: []
      }
      hsk_words: {
        Row: {
          level: number
          word: string
        }
        Insert: {
          level: number
          word: string
        }
        Update: {
          level?: number
          word?: string
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
      lessons: {
        Row: {
          created_at: string
          error_code: string | null
          generation: number
          id: string
          module_id: string
          position: number
          status: Database["public"]["Enums"]["lesson_status"]
          updated_at: string
          user_id: string
          vocabulary_ids: string[]
        }
        Insert: {
          created_at?: string
          error_code?: string | null
          generation?: number
          id?: string
          module_id: string
          position: number
          status?: Database["public"]["Enums"]["lesson_status"]
          updated_at?: string
          user_id: string
          vocabulary_ids: string[]
        }
        Update: {
          created_at?: string
          error_code?: string | null
          generation?: number
          id?: string
          module_id?: string
          position?: number
          status?: Database["public"]["Enums"]["lesson_status"]
          updated_at?: string
          user_id?: string
          vocabulary_ids?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
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
      module_grammar: {
        Row: {
          created_at: string
          examples: string[]
          explanation: string
          id: string
          module_id: string
          point: string
          position: number
          user_id: string
        }
        Insert: {
          created_at?: string
          examples?: string[]
          explanation: string
          id?: string
          module_id: string
          point: string
          position: number
          user_id: string
        }
        Update: {
          created_at?: string
          examples?: string[]
          explanation?: string
          id?: string
          module_id?: string
          point?: string
          position?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "module_grammar_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      module_materials: {
        Row: {
          created_at: string
          filename: string
          id: string
          mime_type: string
          module_id: string
          position: number
          size_bytes: number
          storage_path: string
          user_id: string
        }
        Insert: {
          created_at?: string
          filename: string
          id?: string
          mime_type: string
          module_id: string
          position: number
          size_bytes: number
          storage_path: string
          user_id: string
        }
        Update: {
          created_at?: string
          filename?: string
          id?: string
          mime_type?: string
          module_id?: string
          position?: number
          size_bytes?: number
          storage_path?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "module_materials_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      module_vocabulary: {
        Row: {
          created_at: string
          dictionary_entry_id: number | null
          hsk_level: number | null
          id: string
          meaning_ru: string
          module_id: string
          position: number
          reading: string | null
          sense_hint: string
          user_id: string
          word: string
        }
        Insert: {
          created_at?: string
          dictionary_entry_id?: number | null
          hsk_level?: number | null
          id?: string
          meaning_ru: string
          module_id: string
          position: number
          reading?: string | null
          sense_hint: string
          user_id: string
          word: string
        }
        Update: {
          created_at?: string
          dictionary_entry_id?: number | null
          hsk_level?: number | null
          id?: string
          meaning_ru?: string
          module_id?: string
          position?: number
          reading?: string | null
          sense_hint?: string
          user_id?: string
          word?: string
        }
        Relationships: [
          {
            foreignKeyName: "module_vocabulary_dictionary_entry_id_fkey"
            columns: ["dictionary_entry_id"]
            isOneToOne: false
            referencedRelation: "dictionary_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "module_vocabulary_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      modules: {
        Row: {
          context: string | null
          created_at: string
          error_code: string | null
          id: string
          status: Database["public"]["Enums"]["module_status"]
          title: string | null
          topic: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          context?: string | null
          created_at?: string
          error_code?: string | null
          id?: string
          status?: Database["public"]["Enums"]["module_status"]
          title?: string | null
          topic?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          context?: string | null
          created_at?: string
          error_code?: string | null
          id?: string
          status?: Database["public"]["Enums"]["module_status"]
          title?: string | null
          topic?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string
          hsk_level: number | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string
          hsk_level?: number | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string
          hsk_level?: number | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      task_answer_keys: {
        Row: {
          answer_key: Json
          created_at: string
          task_id: string
        }
        Insert: {
          answer_key: Json
          created_at?: string
          task_id: string
        }
        Update: {
          answer_key?: Json
          created_at?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_answer_keys_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: true
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          content: Json
          created_at: string
          id: string
          lesson_id: string
          module_id: string
          position: number
          type: Database["public"]["Enums"]["task_type"]
          user_id: string
        }
        Insert: {
          content: Json
          created_at?: string
          id?: string
          lesson_id: string
          module_id: string
          position: number
          type: Database["public"]["Enums"]["task_type"]
          user_id: string
        }
        Update: {
          content?: Json
          created_at?: string
          id?: string
          lesson_id?: string
          module_id?: string
          position?: number
          type?: Database["public"]["Enums"]["task_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      dict_backfill_hsk_level: { Args: never; Returns: number }
      dict_first_reading_plain: { Args: { p_reading: string }; Returns: string }
      dict_like_prefix: { Args: { p_text: string }; Returns: string }
      dict_pinyin_plain: { Args: { p_text: string }; Returns: string }
      dict_reading: { Args: { p_reading: string }; Returns: string }
      dictionary_search: {
        Args: { p_limit?: number; p_offset?: number; p_query: string }
        Returns: {
          compact: string[]
          headword: string
          hsk_level: number
          id: number
          rank: number
          reading: string
          senses: Json
        }[]
      }
    }
    Enums: {
      job_kind: "module_parse" | "lesson_generate"
      job_status: "queued" | "running" | "done" | "failed"
      lesson_status: "pending" | "generating" | "ready" | "failed"
      material_kind: "pdf" | "image" | "text" | "url"
      material_status: "queued" | "processing" | "ready" | "failed"
      module_status: "parsing" | "ready" | "failed"
      task_type:
        | "reading_truefalse"
        | "open_questions"
        | "translation"
        | "word_cards"
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
    Enums: {
      job_kind: ["module_parse", "lesson_generate"],
      job_status: ["queued", "running", "done", "failed"],
      lesson_status: ["pending", "generating", "ready", "failed"],
      material_kind: ["pdf", "image", "text", "url"],
      material_status: ["queued", "processing", "ready", "failed"],
      module_status: ["parsing", "ready", "failed"],
      task_type: [
        "reading_truefalse",
        "open_questions",
        "translation",
        "word_cards",
      ],
    },
  },
} as const
