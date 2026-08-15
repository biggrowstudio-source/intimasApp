export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          user_id: string
          first_name: string
          last_name: string
          photo_url: string | null
          city: string | null
          birthday: string | null
          bio: string | null
          role: 'ambassador' | 'moderator' | 'admin' | 'super_admin'
          points: number
          level_id: string | null
          is_suspended: boolean
          ambassador_code: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          first_name: string
          last_name: string
          photo_url?: string | null
          city?: string | null
          birthday?: string | null
          bio?: string | null
          role?: 'ambassador' | 'moderator' | 'admin' | 'super_admin'
          points?: number
          level_id?: string | null
          is_suspended?: boolean
          ambassador_code?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      document_categories: {
        Row: { id: string; name: string; slug: string; created_at: string }
        Insert: { id?: string; name: string; slug: string; created_at?: string }
        Update: Partial<{ name: string; slug: string }>
      }
      documents: {
        Row: {
          id: string
          title: string
          description: string | null
          content: string | null
          category_id: string | null
          file_path: string | null
          thumbnail: string | null
          is_featured: boolean
          link: string | null
          sku: string | null
          price: number | null
          color: string | null
          size: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          content?: string | null
          category_id?: string | null
          file_path?: string | null
          thumbnail?: string | null
          is_featured?: boolean
          link?: string | null
          sku?: string | null
          price?: number | null
          color?: string | null
          size?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['documents']['Insert']>
      }
      favorites: {
        Row: { id: string; user_id: string; document_id: string; created_at: string }
        Insert: { id?: string; user_id: string; document_id: string; created_at?: string }
        Update: Partial<{ document_id: string }>
      }
      posts: {
        Row: {
          id: string
          author_id: string
          content: string
          image: string | null
          video: string | null
          likes_count: number
          comments_count: number
          visibility: 'public' | 'ambassadors' | 'private'
          is_hidden: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          author_id: string
          content: string
          image?: string | null
          video?: string | null
          likes_count?: number
          comments_count?: number
          visibility?: 'public' | 'ambassadors' | 'private'
          is_hidden?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['posts']['Insert']>
      }
      comments: {
        Row: {
          id: string
          post_id: string
          author_id: string
          content: string
          created_at: string
        }
        Insert: { id?: string; post_id: string; author_id: string; content: string; created_at?: string }
        Update: Partial<{ content: string }>
      }
      likes: {
        Row: { id: string; post_id: string; user_id: string; created_at: string }
        Insert: { id?: string; post_id: string; user_id: string; created_at?: string }
        Update: Partial<{ post_id: string }>
      }
      planner_events: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          start_date: string
          end_date: string | null
          type: 'personal' | 'workshop' | 'meeting' | 'reminder'
          status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
          color: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          start_date: string
          end_date?: string | null
          type?: 'personal' | 'workshop' | 'meeting' | 'reminder'
          status?: 'pending' | 'in_progress' | 'completed' | 'cancelled'
          color?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['planner_events']['Insert']>
      }
      tasks: {
        Row: {
          id: string
          user_id: string
          title: string
          completed: boolean
          priority: 'low' | 'medium' | 'high'
          due_date: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          completed?: boolean
          priority?: 'low' | 'medium' | 'high'
          due_date?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['tasks']['Insert']>
      }
      workshops: {
        Row: {
          id: string
          title: string
          description: string | null
          category: string | null
          date: string
          location: string | null
          capacity: number
          status: 'available' | 'full' | 'finished' | 'cancelled'
          image: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          category?: string | null
          date: string
          location?: string | null
          capacity?: number
          status?: 'available' | 'full' | 'finished' | 'cancelled'
          image?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['workshops']['Insert']>
      }
      workshop_registrations: {
        Row: {
          id: string
          workshop_id: string
          user_id: string
          status: 'registered' | 'attended' | 'cancelled'
          reason: string | null
          created_at: string
        }
        Insert: {
          id?: string
          workshop_id: string
          user_id: string
          status?: 'registered' | 'attended' | 'cancelled'
          reason?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['workshop_registrations']['Insert']>
      }
      resource_categories: {
        Row: { id: string; name: string; slug: string; created_at: string }
        Insert: { id?: string; name: string; slug: string; created_at?: string }
        Update: Partial<{ name: string; slug: string }>
      }
      resources: {
        Row: {
          id: string
          title: string
          description: string | null
          category_id: string | null
          type: 'video' | 'template' | 'image' | 'presentation' | 'file'
          file_path: string
          thumbnail: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          category_id?: string | null
          type: 'video' | 'template' | 'image' | 'presentation' | 'file'
          file_path: string
          thumbnail?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['resources']['Insert']>
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: 'system' | 'workshop' | 'community' | 'planner' | 'recognition'
          title: string
          body: string | null
          data: Json | null
          read_at: string | null
          archived_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'system' | 'workshop' | 'community' | 'planner' | 'recognition'
          title: string
          body?: string | null
          data?: Json | null
          read_at?: string | null
          archived_at?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['notifications']['Insert']>
      }
      levels: {
        Row: {
          id: string
          name: string
          min_points: number
          order: number
        }
        Insert: { id?: string; name: string; min_points: number; order: number }
        Update: Partial<{ name: string; min_points: number; order: number }>
      }
      badges: {
        Row: {
          id: string
          name: string
          description: string | null
          icon: string | null
          points_required: number
        }
        Insert: { id?: string; name: string; description?: string | null; icon?: string | null; points_required?: number }
        Update: Partial<Database['public']['Tables']['badges']['Insert']>
      }
      user_badges: {
        Row: { id: string; user_id: string; badge_id: string; awarded_at: string }
        Insert: { id?: string; user_id: string; badge_id: string; awarded_at?: string }
        Update: Partial<{ badge_id: string }>
      }
      achievements: {
        Row: { id: string; user_id: string; key: string; progress: number; target: number; completed_at: string | null; created_at: string }
        Insert: { id?: string; user_id: string; key: string; progress?: number; target: number; completed_at?: string | null; created_at?: string }
        Update: Partial<Database['public']['Tables']['achievements']['Insert']>
      }
      user_points: {
        Row: { id: string; user_id: string; points: number; reason: string; created_at: string }
        Insert: { id?: string; user_id: string; points: number; reason: string; created_at?: string }
        Update: Partial<{ points: number; reason: string }>
      }
      settings: {
        Row: { id: string; key: string; value: Json; updated_at: string }
        Insert: { id?: string; key: string; value: Json; updated_at?: string }
        Update: Partial<{ key: string; value: Json }>
      }
      womens_circle_groups: {
        Row: {
          id: string
          name: string
          description: string | null
          topic: string | null
          is_private: boolean
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          topic?: string | null
          is_private?: boolean
          created_by: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['womens_circle_groups']['Insert']>
      }
      womens_circle_members: {
        Row: { id: string; group_id: string; user_id: string; joined_at: string }
        Insert: { id?: string; group_id: string; user_id: string; joined_at?: string }
        Update: Partial<{ group_id: string }>
      }
      help_articles: {
        Row: { id: string; title: string; content: string; category: string; created_at: string }
        Insert: { id?: string; title: string; content: string; category: string; created_at?: string }
        Update: Partial<{ title: string; content: string; category: string }>
      }
      help_faqs: {
        Row: { id: string; question: string; answer: string; order: number }
        Insert: { id?: string; question: string; answer: string; order?: number }
        Update: Partial<{ question: string; answer: string; order: number }>
      }
      reports: {
        Row: {
          id: string
          reporter_id: string
          target_type: 'post' | 'comment' | 'user'
          target_id: string
          reason: string
          status: 'pending' | 'reviewed' | 'dismissed'
          created_at: string
        }
        Insert: {
          id?: string
          reporter_id: string
          target_type: 'post' | 'comment' | 'user'
          target_id: string
          reason: string
          status?: 'pending' | 'reviewed' | 'dismissed'
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['reports']['Insert']>
      }
      orders: {
        Row: {
          id: string
          order_number: string
          ambassador_id: string
          ambassador_name: string
          ambassador_code: string | null
          client_name: string
          client_phone: string
          client_email: string | null
          shipping_street: string
          shipping_city: string
          shipping_state: string
          shipping_zip: string | null
          shipping_country: string
          status: 'pending' | 'approved' | 'rejected' | 'dispatched'
          rejection_reason: string | null
          notes: string | null
          total_amount: number
          commission_rate: number
          commission_amount: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_number: string
          ambassador_id: string
          ambassador_name: string
          ambassador_code?: string | null
          client_name: string
          client_phone: string
          client_email?: string | null
          shipping_street: string
          shipping_city: string
          shipping_state: string
          shipping_zip?: string | null
          shipping_country?: string
          status?: 'pending' | 'approved' | 'rejected' | 'dispatched'
          rejection_reason?: string | null
          notes?: string | null
          total_amount?: number
          commission_rate?: number
          commission_amount?: number
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['orders']['Insert']>
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string | null
          product_name: string
          product_sku: string | null
          color: string | null
          size: string | null
          quantity: number
          unit_price: number
          subtotal: number
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          product_id?: string | null
          product_name: string
          product_sku?: string | null
          color?: string | null
          size?: string | null
          quantity?: number
          unit_price?: number
          subtotal?: number
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['order_items']['Insert']>
      }
    }
    Enums: {
      user_role: 'ambassador' | 'moderator' | 'admin' | 'super_admin'
    }
  }
}
