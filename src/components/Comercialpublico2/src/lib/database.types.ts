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
          fixed_amount: number
          percentage_amount: number
          total_contribution: number
          contribution_date: string
          created_at: string
        }
        Insert: {
          id?: string
          proposal_id: string
          client_name?: string
          fixed_amount?: number
          percentage_amount?: number
          contribution_date?: string
          created_at?: string
        }
        Update: {
          id?: string
          proposal_id?: string
          client_name?: string
          fixed_amount?: number
          percentage_amount?: number
          contribution_date?: string
          created_at?: string
        }
      }
      etapa_maxima_type: {
        Row: {
          etapa_maxima: 'Desclassificados no início' | 'Edital não qualificado' | 'Em negociação' | 'Proposta' | 'Lances' | 'Declinamos/ Não teve pregão' | 'Desclassificado na planilha' | 'Inabilitado' | 'Planilha aceita / Aguardando habilitação' | 'Habilitado/ Aguardando recurso' | 'Contrato assinado' | 'Suspenso' | 'Encerrado' | 'Em montagem' | 'Classificação' | 'Avaliação de efetividade (avaliação de planilha)' | 'Habilitação' | 'Relatório de divulgação' | 'Abertura de recursos' | 'Relatório final / Homologação'
        }
        Insert: {
          etapa_maxima?: 'Desclassificados no início' | 'Edital não qualificado' | 'Em negociação' | 'Proposta' | 'Lances' | 'Declinamos/ Não teve pregão' | 'Desclassificado na planilha' | 'Inabilitado' | 'Planilha aceita / Aguardando habilitação' | 'Habilitado/ Aguardando recurso' | 'Contrato assinado' | 'Suspenso' | 'Encerrado' | 'Em montagem' | 'Classificação' | 'Avaliação de efetividade (avaliação de planilha)' | 'Habilitação' | 'Relatório de divulgação' | 'Abertura de recursos' | 'Relatório final / Homologação'
        }
        Update: {
          etapa_maxima?: 'Desclassificados no início' | 'Edital não qualificado' | 'Em negociação' | 'Proposta' | 'Lances' | 'Declinamos/ Não teve pregão' | 'Desclassificado na planilha' | 'Inabilitado' | 'Planilha aceita / Aguardando habilitação' | 'Habilitado/ Aguardando recurso' | 'Contrato assinado' | 'Suspenso' | 'Encerrado' | 'Em montagem' | 'Classificação' | 'Avaliação de efetividade (avaliação de planilha)' | 'Habilitação' | 'Relatório de divulgação' | 'Abertura de recursos' | 'Relatório final / Homologação'
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
          department: string
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
          department?: string
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
          department?: string
          created_at?: string
          updated_at?: string
        }
      }
      certidoes: {
        Row: {
          id: string
          nome: string
          data_vencimento_wws: string | null
          data_vencimento_worldwide: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nome: string
          data_vencimento_wws?: string | null
          data_vencimento_worldwide?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nome?: string
          data_vencimento_wws?: string | null
          data_vencimento_worldwide?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      contracts: {
        Row: {
          id: string
          client_name: string
          city: string
          numero_pregao: string | null
          numero_contrato: string | null
          monthly_value: number
          start_date: string
          end_date: string
          contract_object: string
          is_active: boolean
          department: string
          margem_percentual: number
          reequilibrio_dissidio: boolean
          reequilibrio_ipca: boolean
          ultimo_lembrete_dissidio: string | null
          ultimo_lembrete_ipca: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_name: string
          city?: string
          numero_pregao?: string | null
          numero_contrato?: string | null
          monthly_value: number
          start_date: string
          end_date: string
          contract_object: string
          is_active?: boolean
          department?: string
          margem_percentual?: number
          reequilibrio_dissidio?: boolean
          reequilibrio_ipca?: boolean
          ultimo_lembrete_dissidio?: string | null
          ultimo_lembrete_ipca?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_name?: string
          city?: string
          numero_pregao?: string | null
          numero_contrato?: string | null
          monthly_value?: number
          start_date?: string
          end_date?: string
          contract_object?: string
          margem_percentual?: number
          is_active?: boolean
          department?: string
          reequilibrio_dissidio?: boolean
          reequilibrio_ipca?: boolean
          ultimo_lembrete_dissidio?: string | null
          ultimo_lembrete_ipca?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      contract_addendums: {
        Row: {
          id: string
          contract_id: string
          start_date: string
          end_date: string
          monthly_value: number
          observations: string
          is_punctual: boolean
          effective_start_date: string
          effective_end_date: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          contract_id: string
          start_date: string
          end_date: string
          monthly_value: number
          observations?: string
          is_punctual?: boolean
          effective_start_date: string
          effective_end_date?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          contract_id?: string
          start_date?: string
          end_date?: string
          monthly_value?: number
          observations?: string
          is_punctual?: boolean
          effective_start_date?: string
          effective_end_date?: string | null
          is_active?: boolean
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
          role: 'ADL' | 'Licitante' | 'Admin' | 'Promotor' | 'Orcamentista'
          points: number
          level: number
          hire_date: string
          participa_fundo: boolean
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
          role?: 'ADL' | 'Licitante' | 'Admin' | 'Promotor' | 'Orcamentista'
          points?: number
          level?: number
          hire_date?: string
          participa_fundo?: boolean
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
          role?: 'ADL' | 'Licitante' | 'Admin' | 'Promotor' | 'Orcamentista'
          points?: number
          level?: number
          hire_date?: string
          participa_fundo?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      monthly_targets: {
        Row: {
          id: string
          year: number
          month: number
          target_value: number
          department: string
          department: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          year: number
          month: number
          target_value: number
          department?: string
          department?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          year?: number
          month?: number
          target_value?: number
          department?: string
          department?: string
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
      tarefas: {
        Row: {
          id: string
          nome: string
          descricao: string | null
          status: 'A fazer' | 'Fazendo' | 'Feito'
          data_inclusao: string
          data_prazo: string
          criado_por: string
          responsavel: string
          department: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nome: string
          descricao?: string | null
          status?: 'A fazer' | 'Fazendo' | 'Feito'
          data_inclusao?: string
          data_prazo: string
          criado_por: string
          responsavel: string
          department?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nome?: string
          descricao?: string | null
          status?: 'A fazer' | 'Fazendo' | 'Feito'
          data_inclusao?: string
          data_prazo?: string
          criado_por?: string
          responsavel?: string
          department?: string
          created_at?: string
          updated_at?: string
        }
      }
      proposals: {
        Row: {
          id: string
          client: string
          city: string | null
          numero_pregao: string | null
          empresa: 'WWS' | 'Worldwide'
          monthly_value: number
          months: number
          total_value: number
          margem_lucro: number | null
          margem_adm: number | null
          status: 'Desclassificados no início' | 'Edital não qualificado' | 'Em negociação' | 'Proposta' | 'Lances' | 'Declinamos/ Não teve pregão' | 'Desclassificado na planilha' | 'Inabilitado' | 'Planilha aceita / Aguardando habilitação' | 'Habilitado/ Aguardando recurso' | 'Contrato assinado' | 'Suspenso' | 'Encerrado' | 'Em montagem' | 'Classificação' | 'Avaliação de efetividade (avaliação de planilha)' | 'Habilitação' | 'Relatório de divulgação' | 'Abertura de recursos' | 'Relatório final / Homologação' | 'Fechado' | 'Negociação' | 'Perdido'
          commission: number
          commission_rate: number
          closer_id: string | null
          sdr_id: string | null
          closing_date: string | null
          lost_date: string | null
          lost_reason: string | null
          lance_vencedor: number | null
          nosso_lance: number | null
          empresa_vencedora: string | null
          percentual_vencedor: string | null
          percentual_nosso_lance: string | null
          status_planilha: string
          posicao_atual: string | null
          promotor_id: string | null
          colocacao_atual: string | null
          orcamentista_id: string | null
          etapa_maxima: 'Desclassificados no início' | 'Edital não qualificado' | 'Em negociação' | 'Proposta' | 'Lances' | 'Declinamos/ Não teve pregão' | 'Desclassificado na planilha' | 'Inabilitado' | 'Planilha aceita / Aguardando habilitação' | 'Habilitado/ Aguardando recurso' | 'Contrato assinado' | 'Suspenso' | 'Encerrado' | 'Em montagem' | 'Classificação' | 'Avaliação de efetividade (avaliação de planilha)' | 'Habilitação' | 'Relatório de divulgação' | 'Abertura de recursos' | 'Relatório final / Homologação'
          department: string
          data_assinatura: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client: string
          city?: string | null
          numero_pregao?: string | null
          empresa?: 'WWS' | 'Worldwide'
          monthly_value: number
          months: number
          total_value: number
          margem_lucro?: number | null
          margem_adm?: number | null
          status?: 'Desclassificados no início' | 'Edital não qualificado' | 'Em negociação' | 'Proposta' | 'Lances' | 'Declinamos/ Não teve pregão' | 'Desclassificado na planilha' | 'Inabilitado' | 'Planilha aceita / Aguardando habilitação' | 'Habilitado/ Aguardando recurso' | 'Contrato assinado' | 'Suspenso' | 'Encerrado' | 'Em montagem' | 'Classificação' | 'Avaliação de efetividade (avaliação de planilha)' | 'Habilitação' | 'Relatório de divulgação' | 'Abertura de recursos' | 'Relatório final / Homologação' | 'Fechado' | 'Negociação' | 'Perdido'
          commission?: number
          commission_rate?: number
          closer_id?: string | null
          sdr_id?: string | null
          closing_date?: string | null
          lost_date?: string | null
          lost_reason?: string | null
          lance_vencedor?: number | null
          nosso_lance?: number | null
          empresa_vencedora?: string | null
          percentual_vencedor?: string | null
          percentual_nosso_lance?: string | null
          status_planilha?: string
          posicao_atual?: string | null
          promotor_id?: string | null
          orcamentista_id?: string | null
          etapa_maxima?: 'Desclassificados no início' | 'Edital não qualificado' | 'Em negociação' | 'Proposta' | 'Lances' | 'Declinamos/ Não teve pregão' | 'Desclassificado na planilha' | 'Inabilitado' | 'Planilha aceita / Aguardando habilitação' | 'Habilitado/ Aguardando recurso' | 'Contrato assinado' | 'Suspenso' | 'Encerrado' | 'Em montagem' | 'Classificação' | 'Avaliação de efetividade (avaliação de planilha)' | 'Habilitação' | 'Relatório de divulgação' | 'Abertura de recursos' | 'Relatório final / Homologação'
          department?: string
          data_assinatura?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client?: string
          city?: string | null
          numero_pregao?: string | null
          empresa?: 'WWS' | 'Worldwide'
          plataforma?: string | null
          monthly_value?: number
          months?: number
          total_value?: number
          margem_lucro?: number | null
          margem_adm?: number | null
          status?: 'Desclassificados no início' | 'Edital não qualificado' | 'Em negociação' | 'Proposta' | 'Lances' | 'Declinamos/ Não teve pregão' | 'Desclassificado na planilha' | 'Inabilitado' | 'Planilha aceita / Aguardando habilitação' | 'Habilitado/ Aguardando recurso' | 'Contrato assinado' | 'Suspenso' | 'Encerrado' | 'Em montagem' | 'Classificação' | 'Avaliação de efetividade (avaliação de planilha)' | 'Habilitação' | 'Relatório de divulgação' | 'Abertura de recursos' | 'Relatório final / Homologação' | 'Fechado' | 'Negociação' | 'Perdido'
          commission?: number
          commission_rate?: number
          closer_id?: string | null
          sdr_id?: string | null
          closing_date?: string | null
          lost_date?: string | null
          lost_reason?: string | null
          lance_vencedor?: number | null
          nosso_lance?: number | null
          empresa_vencedora?: string | null
          percentual_vencedor?: string | null
          percentual_nosso_lance?: string | null
          status_planilha?: string
          posicao_atual?: string | null
          promotor_id?: string | null
          observacao_proxima_acao?: string | null
          proxima_acao_texto?: string | null
          colocacao_atual?: string | null
          orcamentista_id?: string | null
          etapa_maxima?: 'Desclassificados no início' | 'Edital não qualificado' | 'Em negociação' | 'Proposta' | 'Lances' | 'Declinamos/ Não teve pregão' | 'Desclassificado na planilha' | 'Inabilitado' | 'Planilha aceita / Aguardando habilitação' | 'Habilitado/ Aguardando recurso' | 'Contrato assinado' | 'Suspenso' | 'Encerrado' | 'Em montagem' | 'Classificação' | 'Avaliação de efetividade (avaliação de planilha)' | 'Habilitação' | 'Relatório de divulgação' | 'Abertura de recursos' | 'Relatório final / Homologação'
          department?: string
          data_assinatura?: string | null
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
          department: string
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
          department?: string
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
          department?: string
          created_at?: string
          updated_at?: string
        }
      }
      notificacoes: {
        Row: {
          id: string
          cliente: string
          assunto: string
          detalhes: string | null
          data_recebimento: string
          data_limite: string
          situacao: 'A fazer' | 'Feito' | 'Não iremos responder'
          department: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          cliente: string
          assunto: string
          detalhes?: string | null
          data_recebimento: string
          data_limite: string
          situacao?: 'A fazer' | 'Feito' | 'Não iremos responder'
          department?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          cliente?: string
          assunto?: string
          detalhes?: string | null
          data_recebimento?: string
          data_limite?: string
          situacao?: 'A fazer' | 'Feito' | 'Não iremos responder'
          department?: string
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
      campaign_status: 'active' | 'paused' | 'completed'
      etapa_maxima_type: 'Desclassificados no início' | 'Edital não qualificado' | 'Em negociação' | 'Proposta' | 'Lances' | 'Declinamos/ Não teve pregão' | 'Desclassificado na planilha' | 'Inabilitado' | 'Planilha aceita / Aguardando habilitação' | 'Habilitado/ Aguardando recurso' | 'Contrato assinado' | 'Suspenso' | 'Encerrado' | 'Em montagem' | 'Classificação' | 'Avaliação de efetividade (avaliação de planilha)' | 'Habilitação' | 'Relatório de divulgação' | 'Abertura de recursos' | 'Relatório final / Homologação'
      employee_role: 'ADL' | 'Licitante' | 'Admin' | 'Promotor' | 'Orcamentista'
      empresa_type: 'WWS' | 'Worldwide'
      proposal_status: 'Desclassificados no início' | 'Edital não qualificado' | 'Em negociação' | 'Proposta' | 'Lances' | 'Declinamos/ Não teve pregão' | 'Desclassificado na planilha' | 'Inabilitado' | 'Planilha aceita / Aguardando habilitação' | 'Habilitado/ Aguardando recurso' | 'Contrato assinado' | 'Suspenso' | 'Encerrado' | 'Em montagem' | 'Classificação' | 'Avaliação de efetividade (avaliação de planilha)' | 'Habilitação' | 'Relatório de divulgação' | 'Abertura de recursos' | 'Relatório final / Homologação' | 'Fechado' | 'Negociação' | 'Perdido'
      target_type: "points" | "sales"
      challenge_status: "active" | "completed" | "expired"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}