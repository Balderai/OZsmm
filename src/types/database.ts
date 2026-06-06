export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      firms: {
        Row: {
          id: string;
          name: string;
          legal_name: string | null;
          logo_url: string | null;
          brand_color: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          legal_name?: string | null;
          logo_url?: string | null;
          brand_color?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["firms"]["Insert"]>;
      };
      profiles: {
        Row: {
          id: string;
          firm_id: string;
          role: "accountant" | "client";
          full_name: string;
          email: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          firm_id: string;
          role: "accountant" | "client";
          full_name: string;
          email: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      clients: {
        Row: {
          id: string;
          firm_id: string;
          company_name: string;
          tax_number: string | null;
          contact_name: string | null;
          contact_email: string | null;
          contact_phone: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          firm_id: string;
          company_name: string;
          tax_number?: string | null;
          contact_name?: string | null;
          contact_email?: string | null;
          contact_phone?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["clients"]["Insert"]>;
      };
      client_memberships: {
        Row: {
          id: string;
          firm_id: string;
          client_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          firm_id: string;
          client_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["client_memberships"]["Insert"]>;
      };
      documents: {
        Row: {
          id: string;
          firm_id: string;
          client_id: string;
          folder_type: "declarations" | "accruals" | "documents_photos";
          origin: "accountant_shared" | "client_uploaded";
          title: string;
          description: string | null;
          storage_bucket: string;
          storage_path: string;
          mime_type: string | null;
          file_size_bytes: number | null;
          status: "active" | "archived" | "deleted";
          created_by: string | null;
          shared_by: string | null;
          shared_at: string | null;
          due_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["documents"]["Row"]> &
          Pick<
            Database["public"]["Tables"]["documents"]["Row"],
            "firm_id" | "client_id" | "folder_type" | "origin" | "title" | "storage_path"
          >;
        Update: Partial<Database["public"]["Tables"]["documents"]["Insert"]>;
      };
      document_views: {
        Row: {
          id: string;
          firm_id: string;
          document_id: string;
          user_id: string;
          viewed_at: string;
        };
        Insert: {
          id?: string;
          firm_id: string;
          document_id: string;
          user_id: string;
          viewed_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["document_views"]["Insert"]>;
      };
      document_requests: {
        Row: {
          id: string;
          firm_id: string;
          client_id: string;
          folder_type: "declarations" | "accruals" | "documents_photos";
          title: string;
          description: string | null;
          status: "open" | "submitted" | "resolved" | "cancelled";
          due_at: string | null;
          created_by: string;
          resolved_by: string | null;
          resolved_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["document_requests"]["Row"]> &
          Pick<Database["public"]["Tables"]["document_requests"]["Row"], "firm_id" | "client_id" | "title" | "created_by">;
        Update: Partial<Database["public"]["Tables"]["document_requests"]["Insert"]>;
      };
      notifications: {
        Row: {
          id: string;
          firm_id: string;
          client_id: string | null;
          recipient_user_id: string | null;
          category:
            | "document_shared"
            | "document_request"
            | "reminder"
            | "request_completed"
            | "system";
          title: string;
          body: string;
          action_url: string | null;
          related_document_id: string | null;
          related_request_id: string | null;
          due_at: string | null;
          read_at: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["notifications"]["Row"]> &
          Pick<Database["public"]["Tables"]["notifications"]["Row"], "firm_id" | "category" | "title" | "body">;
        Update: Partial<Database["public"]["Tables"]["notifications"]["Insert"]>;
      };
      push_subscriptions: {
        Row: {
          id: string;
          firm_id: string;
          user_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          user_agent: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          firm_id: string;
          user_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          user_agent?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["push_subscriptions"]["Insert"]>;
      };
      audit_logs: {
        Row: {
          id: string;
          firm_id: string | null;
          actor_user_id: string | null;
          action: string;
          entity_type: string;
          entity_id: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          firm_id?: string | null;
          actor_user_id?: string | null;
          action: string;
          entity_type: string;
          entity_id?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["audit_logs"]["Insert"]>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      app_role: "accountant" | "client";
      folder_type: "declarations" | "accruals" | "documents_photos";
      notification_category:
        | "document_shared"
        | "document_request"
        | "reminder"
        | "request_completed"
        | "system";
    };
  };
};
