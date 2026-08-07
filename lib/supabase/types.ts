export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      announcements: {
        Row: { active: boolean; body: string; id: string; sort_order: number }
        Insert: { active?: boolean; body: string; id?: string; sort_order?: number }
        Update: { active?: boolean; body?: string; id?: string; sort_order?: number }
        Relationships: []
      }
      booth_queue: {
        Row: {
          booth_id: number
          created_at: string
          id: string
          position: number
          served: boolean
          student_id: string
          token: string
        }
        Insert: {
          booth_id: number
          created_at?: string
          id?: string
          position: number
          served?: boolean
          student_id: string
          token: string
        }
        Update: {
          booth_id?: number
          created_at?: string
          id?: string
          position?: number
          served?: boolean
          student_id?: string
          token?: string
        }
        Relationships: []
      }
      booths: {
        Row: {
          avg_minutes: number
          current_student_id: string | null
          current_token: string | null
          id: number
          name: string
          photographer: string
          served_today: number
          status: string
        }
        Insert: {
          avg_minutes?: number
          current_student_id?: string | null
          current_token?: string | null
          id: number
          name: string
          photographer: string
          served_today?: number
          status?: string
        }
        Update: {
          avg_minutes?: number
          current_student_id?: string | null
          current_token?: string | null
          id?: number
          name?: string
          photographer?: string
          served_today?: number
          status?: string
        }
        Relationships: []
      }
      departments: {
        Row: { code: string; color: string; name: string; short: string; sort_order: number }
        Insert: { code: string; color: string; name: string; short: string; sort_order?: number }
        Update: { code?: string; color?: string; name?: string; short?: string; sort_order?: number }
        Relationships: []
      }
      event_settings: {
        Row: {
          auto_assign: boolean
          college: string
          drive_connected: boolean
          drive_root_folder: string | null
          stream_live: boolean
          stream_url: string | null
          duplicate_block: boolean
          event_date: string
          holding_capacity: number
          id: number
          name: string
          queue_warn_at: number
          status: string
          tagline: string
          tv_ticker: boolean
          venue: string
        }
        Insert: {
          auto_assign?: boolean
          college: string
          drive_connected?: boolean
          drive_root_folder?: string | null
          stream_live?: boolean
          stream_url?: string | null
          duplicate_block?: boolean
          event_date: string
          holding_capacity?: number
          id?: number
          name: string
          queue_warn_at?: number
          status: string
          tagline: string
          tv_ticker?: boolean
          venue: string
        }
        Update: {
          auto_assign?: boolean
          college?: string
          drive_connected?: boolean
          drive_root_folder?: string | null
          stream_live?: boolean
          stream_url?: string | null
          duplicate_block?: boolean
          event_date?: string
          holding_capacity?: number
          id?: number
          name?: string
          queue_warn_at?: number
          status?: string
          tagline?: string
          tv_ticker?: boolean
          venue?: string
        }
        Relationships: []
      }
      media: {
        Row: {
          captured_at: string
          category: Database["public"]["Enums"]["media_category"]
          drive_file_id: string | null
          drive_folder_id: string | null
          drive_thumb_url: string | null
          drive_view_url: string | null
          imported_by: string | null
          original_name: string | null
          taken_at: string | null
          dept_code: string | null
          hue: number
          id: string
          likes: number
          photographer: string
          ratio: number
          storage_bucket: string | null
          storage_path: string | null
          student_id: string | null
          title: string
        }
        Insert: {
          captured_at?: string
          category: Database["public"]["Enums"]["media_category"]
          drive_file_id?: string | null
          drive_folder_id?: string | null
          drive_thumb_url?: string | null
          drive_view_url?: string | null
          imported_by?: string | null
          original_name?: string | null
          taken_at?: string | null
          dept_code?: string | null
          hue?: number
          id?: string
          likes?: number
          photographer: string
          ratio?: number
          storage_bucket?: string | null
          storage_path?: string | null
          student_id?: string | null
          title: string
        }
        Update: {
          captured_at?: string
          category?: Database["public"]["Enums"]["media_category"]
          drive_file_id?: string | null
          drive_folder_id?: string | null
          drive_thumb_url?: string | null
          drive_view_url?: string | null
          imported_by?: string | null
          original_name?: string | null
          taken_at?: string | null
          dept_code?: string | null
          hue?: number
          id?: string
          likes?: number
          photographer?: string
          ratio?: number
          storage_bucket?: string | null
          storage_path?: string | null
          student_id?: string | null
          title?: string
        }
        Relationships: []
      }
      scans: {
        Row: {
          created_at: string
          detail: string | null
          id: string
          kind: Database["public"]["Enums"]["scan_kind"]
          station: string | null
          student_id: string
          volunteer_id: string | null
        }
        Insert: {
          created_at?: string
          detail?: string | null
          id?: string
          kind: Database["public"]["Enums"]["scan_kind"]
          station?: string | null
          student_id: string
          volunteer_id?: string | null
        }
        Update: {
          created_at?: string
          detail?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["scan_kind"]
          station?: string | null
          student_id?: string
          volunteer_id?: string | null
        }
        Relationships: []
      }
      stage_appearances: {
        Row: {
          ended_at: string | null
          id: string
          started_at: string
          student_id: string
          volunteer_id: string | null
        }
        Insert: {
          ended_at?: string | null
          id?: string
          started_at?: string
          student_id: string
          volunteer_id?: string | null
        }
        Update: {
          ended_at?: string | null
          id?: string
          started_at?: string
          student_id?: string
          volunteer_id?: string | null
        }
        Relationships: []
      }
      students: {
        Row: {
          attendance: boolean
          batch: string
          booth_done: boolean
          booth_done_at: string | null
          certificate_done: boolean
          certificate_done_at: string | null
          award: string | null
          cgpa: number | null
          checked_in_at: string | null
          father_name: string | null
          honours: boolean
          minor: boolean
          mother_name: string | null
          seat_no: number | null
          created_at: string
          dept_code: string
          hub_token: string
          hue: number
          id: string
          lunch_done: boolean
          lunch_done_at: string | null
          name: string
          phone: string | null
          photo_count: number
          photo_url: string | null
          qr_issued: boolean
          reg_no: string
          stage: Database["public"]["Enums"]["ceremony_stage"]
          stage_done: boolean
          stage_done_at: string | null
          updated_at: string
        }
        Insert: {
          attendance?: boolean
          batch?: string
          booth_done?: boolean
          booth_done_at?: string | null
          certificate_done?: boolean
          certificate_done_at?: string | null
          award?: string | null
          cgpa?: number | null
          checked_in_at?: string | null
          father_name?: string | null
          honours?: boolean
          minor?: boolean
          mother_name?: string | null
          seat_no?: number | null
          created_at?: string
          dept_code: string
          hub_token?: string
          hue?: number
          id?: string
          lunch_done?: boolean
          lunch_done_at?: string | null
          name: string
          phone?: string | null
          photo_count?: number
          photo_url?: string | null
          qr_issued?: boolean
          reg_no: string
          stage?: Database["public"]["Enums"]["ceremony_stage"]
          stage_done?: boolean
          stage_done_at?: string | null
          updated_at?: string
        }
        Update: {
          attendance?: boolean
          batch?: string
          booth_done?: boolean
          booth_done_at?: string | null
          certificate_done?: boolean
          certificate_done_at?: string | null
          award?: string | null
          cgpa?: number | null
          checked_in_at?: string | null
          father_name?: string | null
          honours?: boolean
          minor?: boolean
          mother_name?: string | null
          seat_no?: number | null
          created_at?: string
          dept_code?: string
          hub_token?: string
          hue?: number
          id?: string
          lunch_done?: boolean
          lunch_done_at?: string | null
          name?: string
          phone?: string | null
          photo_count?: number
          photo_url?: string | null
          qr_issued?: boolean
          reg_no?: string
          stage?: Database["public"]["Enums"]["ceremony_stage"]
          stage_done?: boolean
          stage_done_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      timeline_items: {
        Row: {
          detail: string
          id: string
          sort_order: number
          status: string
          time_label: string
          title: string
        }
        Insert: {
          detail: string
          id?: string
          sort_order?: number
          status?: string
          time_label: string
          title: string
        }
        Update: {
          detail?: string
          id?: string
          sort_order?: number
          status?: string
          time_label?: string
          title?: string
        }
        Relationships: []
      }
      volunteer_invites: {
        Row: {
          claimed_at: string | null
          created_at: string
          created_by: string | null
          email: string
          id: string
          name: string | null
          role: Database["public"]["Enums"]["volunteer_role"]
          station: string | null
        }
        Insert: {
          claimed_at?: string | null
          created_at?: string
          created_by?: string | null
          email: string
          id?: string
          name?: string | null
          role?: Database["public"]["Enums"]["volunteer_role"]
          station?: string | null
        }
        Update: {
          claimed_at?: string | null
          created_at?: string
          created_by?: string | null
          email?: string
          id?: string
          name?: string | null
          role?: Database["public"]["Enums"]["volunteer_role"]
          station?: string | null
        }
        Relationships: []
      }
      volunteers: {
        Row: {
          avg_seconds: number
          created_at: string
          email: string
          hue: number
          id: string
          name: string
          online: boolean
          role: Database["public"]["Enums"]["volunteer_role"]
          scans_today: number
          shift_ends: string | null
          station: string | null
        }
        Insert: {
          avg_seconds?: number
          created_at?: string
          email: string
          hue?: number
          id: string
          name: string
          online?: boolean
          role?: Database["public"]["Enums"]["volunteer_role"]
          scans_today?: number
          shift_ends?: string | null
          station?: string | null
        }
        Update: {
          avg_seconds?: number
          created_at?: string
          email?: string
          hue?: number
          id?: string
          name?: string
          online?: boolean
          role?: Database["public"]["Enums"]["volunteer_role"]
          scans_today?: number
          shift_ends?: string | null
          station?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      booth_status: {
        Row: {
          avg_minutes: number | null
          current_hue: number | null
          current_name: string | null
          current_reg_no: string | null
          current_student_id: string | null
          current_token: string | null
          est_wait: number | null
          id: number | null
          name: string | null
          photographer: string | null
          served_today: number | null
          status: string | null
          waiting: number | null
        }
        Relationships: []
      }
      department_stats: {
        Row: {
          booth: number | null
          certificate: number | null
          checked_in: number | null
          code: string | null
          color: string | null
          lunch: number | null
          name: string | null
          short: string | null
          sort_order: number | null
          stage: number | null
          total: number | null
        }
        Relationships: []
      }
      event_stats: {
        Row: {
          booth_done: number | null
          certificate_done: number | null
          checked_in: number | null
          lunch_done: number | null
          on_stage: number | null
          photos: number | null
          stage_done: number | null
          total: number | null
          waiting: number | null
        }
        Relationships: []
      }
      hourly_flow: {
        Row: {
          booth: number | null
          checkin: number | null
          hour: string | null
          lunch: number | null
          stage: number | null
        }
        Relationships: []
      }
      recent_activity: {
        Row: {
          created_at: string | null
          detail: string | null
          id: string | null
          kind: Database["public"]["Enums"]["scan_kind"] | null
          station: string | null
          student_hue: number | null
          student_name: string | null
          student_reg_no: string | null
          volunteer_name: string | null
          volunteer_role: Database["public"]["Enums"]["volunteer_role"] | null
        }
        Relationships: []
      }
    }
    Functions: {
      assign_booth: {
        Args: { p_student_id: string }
        Returns: { booth_id: number; est_wait: number; token: string }[]
      }
      check_in_student: {
        Args: { p_station?: string; p_student_id: string }
        Returns: Database["public"]["Tables"]["students"]["Row"]
      }
      collect_certificate: {
        Args: { p_student_id: string }
        Returns: Database["public"]["Tables"]["students"]["Row"]
      }
      complete_booth: {
        Args: { p_photos?: number; p_student_id: string }
        Returns: Database["public"]["Tables"]["students"]["Row"]
      }
      complete_stage: {
        Args: { p_photos?: number; p_student_id: string }
        Returns: Database["public"]["Tables"]["students"]["Row"]
      }
      get_student_hub: {
        Args: { p_token: string }
        Returns: Json
      }
      self_join_booth_queue: {
        Args: { p_token: string }
        Returns: Json
      }
      student_by_hub_token: {
        Args: { p_token: string }
        Returns: Database["public"]["Tables"]["students"]["Row"][]
      }
      redeem_lunch: {
        Args: { p_student_id: string }
        Returns: Database["public"]["Tables"]["students"]["Row"]
      }
    }
    Enums: {
      ceremony_stage:
        | "registered"
        | "checked-in"
        | "waiting"
        | "on-stage"
        | "stage-done"
        | "booth"
        | "complete"
      media_category: "Stage" | "Booth" | "Candid" | "Group"
      scan_kind:
        | "check-in"
        | "stage"
        | "booth-assign"
        | "booth-complete"
        | "lunch"
        | "certificate"
      volunteer_role:
        | "admin"
        | "registration"
        | "stage"
        | "booth"
        | "counter"
        | "media"
        | "viewer"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database["public"]

export type Tables<
  T extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"]),
> = (DefaultSchema["Tables"] & DefaultSchema["Views"])[T] extends { Row: infer R } ? R : never

export type TablesInsert<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T] extends { Insert: infer I } ? I : never

export type TablesUpdate<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T] extends { Update: infer U } ? U : never

export type Enums<T extends keyof DefaultSchema["Enums"]> = DefaultSchema["Enums"][T]

/* ── Convenience aliases used across the app ──────────────── */
export type StudentRow = Tables<"students">
export type DepartmentRow = Tables<"departments">
export type VolunteerRow = Tables<"volunteers">
export type BoothRow = Tables<"booths">
export type BoothQueueRow = Tables<"booth_queue">
export type MediaRow = Tables<"media">
export type ScanRow = Tables<"scans">
export type TimelineRow = Tables<"timeline_items">
export type AnnouncementRow = Tables<"announcements">
export type EventSettingsRow = Tables<"event_settings">

export type EventStats = Tables<"event_stats">
export type DepartmentStats = Tables<"department_stats">
export type BoothStatus = Tables<"booth_status">
export type HourlyFlow = Tables<"hourly_flow">
export type RecentActivity = Tables<"recent_activity">

export type CeremonyStage = Enums<"ceremony_stage">
export type VolunteerRole = Enums<"volunteer_role">
export type MediaCategory = Enums<"media_category">
export type ScanKind = Enums<"scan_kind">
