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
      badges: {
        Row: {
          id: string
          name: string
          icon: string
          color: string
          description: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          icon: string
          color: string
          description: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          icon?: string
          color?: string
          description?: string
          created_at?: string
        }
      }
      bonus_contributions: {
        Row: {
          id: string
          proposal_id: string
          client_name: string
          contract_value: number
          fixed_amount: number
          percentage_amount: number
          total_contribution: number
          contribution_date: string
          created_at: string
        }
        Insert: {
          id?: string
          proposal_id: string
          client_name: string
          contract_value: number
          fixed_amount?: number
          percentage_amount?: number
          total_contribution?: number
          contribution_date?: string
          created_at?: string
        }
        Update: {
          id?: string
          proposal_id?: string
          client_name?: string
          contract_value?: number
          fixed_amount?: number
          percentage_amount?: number
          total_contribution?: number
          contribution_date?: string
          created_at?: string
        }
      }
      budget_posts: {
        Row: {
          id: string
          budget_id: string
          post_name: string
          role_id: string | null
          scale_id: string | null
          turn: string
          city_id: string | null
          salary_additions: any | null
          total_cost: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          budget_id: string
          post_name: string
          role_id?: string | null
          scale_id?: string | null
          turn: string
          city_id?: string | null
          salary_additions?: any | null
          total_cost?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          budget_id?: string
          post_name?: string
          role_id?: string | null
          scale_id?: string | null
          turn?: string
          city_id?: string | null
          salary_additions?: any | null
          total_cost?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      campaigns: {
        Row: {
          id: string
          title: string
          description: string
          start_date: string
          end_date: string
          target_points: number
          participants: number
          status: 'active' | 'paused' | 'completed'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          start_date: string
          end_date: string
          target_points?: number
          participants?: number
          status?: 'active' | 'paused' | 'completed'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          start_date?: string
          end_date?: string
          target_points?: number
          participants?: number
          status?: 'active' | 'paused' | 'completed'
          created_at?: string
          updated_at?: string
        }
      }
      employee_badges: {
        Row: {
          id: string
          employee_id: string
          badge_id: string
          earned_at: string
        }
        Insert: {
          id?: string
          employee_id: string
          badge_id: string
          earned_at?: string
        }
        Update: {
          id?: string
          employee_id?: string
          badge_id?: string
          earned_at?: string
        }
      }
      challenges: {
        Row: {
          id: string
          title: string
          description: string | null
          start_date: string
          end_date: string
          prize: string
          target_type: "points" | "sales" | "mql" | "visitas_agendadas" | "contratos_assinados" | "pontos_educacao"
          target_value: number
          status: "active" | "completed" | "expired"
          participants_ids: string[] | null
          winner_ids: string[] | null
          completion_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          start_date: string
          end_date: string
          prize: string
          target_type: "points" | "sales" | "mql" | "visitas_agendadas" | "contratos_assinados" | "pontos_educacao"
          target_value: number
          status?: "active" | "completed" | "expired"
          participants_ids?: string[] | null
          winner_ids?: string[] | null
          completion_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          start_date?: string
          end_date?: string
          prize?: string
          target_type?: "points" | "sales" | "mql" | "visitas_agendadas" | "contratos_assinados" | "pontos_educacao"
          target_value?: number
          status?: "active" | "completed" | "expired"
          participants_ids?: string[] | null
          winner_ids?: string[] | null
          completion_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      employees: {
        Row: {
          id: string
          user_id: string | null
          name: string
          email: string
          avatar: string
          department: string
          position: string
          role: 'SDR' | 'Closer' | 'Admin'
          points: number
          level: number
          admission_date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          name: string
          email: string
          avatar?: string
          department?: string
          position: string
          role?: 'SDR' | 'Closer' | 'Admin'
          points?: number
          level?: number
          admission_date?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          name?: string
          email?: string
          avatar?: string
          department?: string
          position?: string
          role?: 'SDR' | 'Closer' | 'Admin'
          points?: number
          level?: number
          admission_date?: string
          created_at?: string
          updated_at?: string
        }
      }
      probability_scores: {
        Row: {
          id: string
          proposal_id: string
          economic_buyer: number
          metrics: number
          decision_criteria: number
          decision_process: number
          identify_pain: number
          champion: number
          competition: number
          engagement: number
          total_score: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          proposal_id: string
          economic_buyer?: number
          metrics?: number
          decision_criteria?: number
          decision_process?: number
          identify_pain?: number
          champion?: number
          competition?: number
          engagement?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          proposal_id?: string
          economic_buyer?: number
          metrics?: number
          decision_criteria?: number
          decision_process?: number
          identify_pain?: number
          champion?: number
          competition?: number
          engagement?: number
          created_at?: string
          updated_at?: string
        }
      }
      proposals: {
        Row: {
          id: string
          client: string
          monthly_value: number
          months: number
          total_value: number
          status: 'Proposta' | 'Negociação' | 'Fechado' | 'Perdido'
          commission: number
          commission_rate: number
          closer_id: string | null
          sdr_id: string | null
          closing_date: string | null
          lost_date: string | null
          lost_reason: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client: string
          monthly_value: number
          months: number
          total_value: number
          status?: 'Proposta' | 'Negociação' | 'Fechado' | 'Perdido'
          commission?: number
          commission_rate?: number
          closer_id?: string | null
          sdr_id?: string | null
          closing_date?: string | null
          lost_date?: string | null
          lost_reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client?: string
          monthly_value?: number
          months?: number
          total_value?: number
          status?: 'Proposta' | 'Negociação' | 'Fechado' | 'Perdido'
          commission?: number
          commission_rate?: number
          closer_id?: string | null
          sdr_id?: string | null
          closing_date?: string | null
          lost_date?: string | null
          lost_reason?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      recognitions: {
        Row: {
          id: string
          from_employee_id: string
          to_employee_id: string
          message: string
          points: number
          is_public: boolean
          created_at: string
        }
        Insert: {
          id?: string
          from_employee_id: string
          to_employee_id: string
          message: string
          points?: number
          is_public?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          from_employee_id?: string
          to_employee_id?: string
          message?: string
          points?: number
          is_public?: boolean
          created_at?: string
        }
      }
      rewards: {
        Row: {
          id: string
          name: string
          description: string
          points: number
          category: string
          image: string
          stock: number
          is_available: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          points: number
          category: string
          image?: string
          stock?: number
          is_available?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          points?: number
          category?: string
          image?: string
          stock?: number
          is_available?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      system_configurations: {
        Row: {
          id: string
          config_type: string
          config_data: any
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          config_type: string
          config_data: any
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          config_type?: string
          config_data?: any
          created_at?: string
          updated_at?: string
        }
      }
      weekly_performance: {
        Row: {
          id: string
          employee_id: string
          week_ending_date: string
          tarefas: number
          pontos_educacao: number
          propostas_apresentadas: number
          contrato_assinado: number
          mql: number
          visitas_agendadas: number
          total_points: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          employee_id: string
          week_ending_date: string
          tarefas?: number
          pontos_educacao?: number
          propostas_apresentadas?: number
          contrato_assinado?: number
          mql?: number
          visitas_agendadas?: number
          total_points?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          employee_id?: string
          week_ending_date?: string
          tarefas?: number
          pontos_educacao?: number
          propostas_apresentadas?: number
          contrato_assinado?: number
          mql?: number
          visitas_agendadas?: number
          total_points?: number
          created_at?: string
          updated_at?: string
        }
      }
      budget_cities: {
        Row: {
          id: string
          name: string
          iss_rate: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          iss_rate: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          iss_rate?: number
          is_active?: boolean
          created_at?: string
        }
      }
      budget_cities_iss: {
        Row: {
          id: string
          city_name: string
          iss_percent: number
          is_active: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: string
          city_name: string
          iss_percent: number
          is_active?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: string
          city_name?: string
          iss_percent?: number
          is_active?: boolean | null
          created_at?: string | null
        }
      }
      budget_uniforms: {
        Row: {
          id: string
          item_name: string
          life_time_months: number
          qty_per_collaborator: number
          unit_value: number
          is_active: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: string
          item_name: string
          life_time_months: number
          qty_per_collaborator: number
          unit_value: number
          is_active?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: string
          item_name?: string
          life_time_months?: number
          qty_per_collaborator?: number
          unit_value?: number
          is_active?: boolean | null
          created_at?: string | null
        }
      }
      prospection_users: {
        Row: {
          id: string
          name: string
          email: string | null
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          email?: string | null
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string | null
          active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      prospection_weekly: {
        Row: {
          id: string
          user_id: string
          week_start: string
          tag: string | null
          emails_sent: number
          emails_replied: number
          calls_made: number
          calls_connected: number
          whatsapp_sent: number
          whatsapp_connected: number
          linkedin_msgs: number
          linkedin_connected: number
          meetings_scheduled: number
          meetings_held: number
          positive_connections: number
          disqualifications: number
          active_contacts: number
          new_contacts: number
          unique_contacts_activated: number
          unique_contacts_active: number
          mql: number
          sql: number
          new_clients: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          week_start: string
          tag?: string | null
          emails_sent?: number
          emails_replied?: number
          calls_made?: number
          calls_connected?: number
          whatsapp_sent?: number
          whatsapp_connected?: number
          linkedin_msgs?: number
          linkedin_connected?: number
          meetings_scheduled?: number
          meetings_held?: number
          positive_connections?: number
          disqualifications?: number
          active_contacts?: number
          new_contacts?: number
          unique_contacts_activated?: number
          unique_contacts_active?: number
          mql?: number
          sql?: number
          new_clients?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          week_start?: string
          tag?: string | null
          emails_sent?: number
          emails_replied?: number
          calls_made?: number
          calls_connected?: number
          whatsapp_sent?: number
          whatsapp_connected?: number
          linkedin_msgs?: number
          linkedin_connected?: number
          meetings_scheduled?: number
          meetings_held?: number
          positive_connections?: number
          disqualifications?: number
          active_contacts?: number
          new_contacts?: number
          unique_contacts_activated?: number
          unique_contacts_active?: number
          mql?: number
          sql?: number
          new_clients?: number
          created_at?: string
          updated_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          assignee_id: string
          created_by: string | null
          created_at: string
          updated_at: string
          due_date: string
          status: 'a_fazer' | 'fazendo' | 'feito'
          title: string
          description: string
          finished_at: string | null
        }
        Insert: {
          id?: string
          assignee_id: string
          created_by?: string | null
          created_at?: string
          updated_at?: string
          due_date: string
          status?: 'a_fazer' | 'fazendo' | 'feito'
          title: string
          description: string
          finished_at?: string | null
        }
        Update: {
          id?: string
          assignee_id?: string
          created_by?: string | null
          created_at?: string
          updated_at?: string
          due_date?: string
          status?: 'a_fazer' | 'fazendo' | 'feito'
          title?: string
          description?: string
          finished_at?: string | null
        }
      }
      prospection_ingest_images: {
        Row: {
          id: string
          user_id: string
          kind: 'conexoes' | 'perfil' | 'metas'
          period_start: string | null
          period_end: string | null
          week_start: string | null
          image_url: string | null
          ocr_raw: string | null
          parsed_payload: any | null
          status: 'uploaded' | 'parsed' | 'confirmed'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          kind: 'conexoes' | 'perfil' | 'metas'
          period_start?: string | null
          period_end?: string | null
          week_start?: string | null
          image_url?: string | null
          ocr_raw?: string | null
          parsed_payload?: any | null
          status?: 'uploaded' | 'parsed' | 'confirmed'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          kind?: 'conexoes' | 'perfil' | 'metas'
          period_start?: string | null
          period_end?: string | null
          week_start?: string | null
          image_url?: string | null
          ocr_raw?: string | null
          parsed_payload?: any | null
          status?: 'uploaded' | 'parsed' | 'confirmed'
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      employee_role: 'SDR' | 'Closer' | 'Admin'
      proposal_status: 'Proposta' | 'Negociação' | 'Fechado' | 'Perdido'
      target_type: "points" | "sales"
      challenge_status: "active" | "completed" | "expired"
      prospection_image_kind: 'conexoes' | 'perfil' | 'metas'
      prospection_status: 'uploaded' | 'parsed' | 'confirmed'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}