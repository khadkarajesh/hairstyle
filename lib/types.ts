export type SessionStatus =
  | "uploading"
  | "analyzing"
  | "generating"
  | "complete"
  | "failed";

export interface Session {
  id: string;
  user_id: string;
  status: SessionStatus;
  face_shape: string | null;
  selected_styles: string[] | null;
  hair_attributes: Record<string, string> | null;
  created_at: string;
}

export interface SessionStyle {
  id: string;
  session_id: string;
  style_id: string;
  image_url: string | null;
  image_url_left: string | null;
  image_url_right: string | null;
  saved: boolean;
  created_at: string;
}

// Supabase Database type — must match the generated-type format exactly
export interface Database {
  public: {
    Tables: {
      sessions: {
        Row: {
          id: string;
          user_id: string;
          status: string;
          face_shape: string | null;
          selected_styles: string[] | null;
          hair_attributes: Record<string, string> | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          status?: string;
          face_shape?: string | null;
          selected_styles?: string[] | null;
          hair_attributes?: Record<string, string> | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          status?: string;
          face_shape?: string | null;
          selected_styles?: string[] | null;
          hair_attributes?: Record<string, string> | null;
          created_at?: string;
        };
        Relationships: [];
      };
      session_styles: {
        Row: {
          id: string;
          session_id: string;
          style_id: string;
          image_url: string | null;
          image_url_left: string | null;
          image_url_right: string | null;
          saved: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          style_id: string;
          image_url?: string | null;
          image_url_left?: string | null;
          image_url_right?: string | null;
          saved?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          style_id?: string;
          image_url?: string | null;
          image_url_left?: string | null;
          image_url_right?: string | null;
          saved?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
