import { supabase } from '../lib/supabase';

export interface Action {
  id: string;
  descricao: string;
  responsavel: string;
  data_prazo: string;
  status: 'a_fazer' | 'fazendo' | 'feito';
  created_at: string;
  updated_at: string;
}

export interface CreateAction {
  descricao: string;
  responsavel: string;
  data_prazo: string;
  status: 'a_fazer' | 'fazendo' | 'feito';
}

export interface ActionComment {
  id: string;
  action_id: string;
  author_name: string;
  comment_text: string;
  created_at: string;
}

export interface CreateActionComment {
  action_id: string;
  author_name: string;
  comment_text: string;
}

export const actionsService = {
  async getAllActions(): Promise<Action[]> {
    const { data, error } = await supabase
      .from('actions')
      .select('*')
      .order('data_prazo', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getActionById(id: string): Promise<Action> {
    const { data, error } = await supabase
      .from('actions')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async createAction(action: CreateAction): Promise<Action> {
    const { data, error } = await supabase
      .from('actions')
      .insert(action)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateAction(id: string, updates: Partial<CreateAction>): Promise<Action> {
    const { data, error } = await supabase
      .from('actions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteAction(id: string): Promise<void> {
    const { error } = await supabase
      .from('actions')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async getCommentsByActionId(actionId: string): Promise<ActionComment[]> {
    const { data, error } = await supabase
      .from('action_comments')
      .select('*')
      .eq('action_id', actionId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async createComment(comment: CreateActionComment): Promise<ActionComment> {
    const { data, error } = await supabase
      .from('action_comments')
      .insert(comment)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getCommentsCount(actionId: string): Promise<number> {
    const { count, error } = await supabase
      .from('action_comments')
      .select('*', { count: 'exact', head: true })
      .eq('action_id', actionId);

    if (error) throw error;
    return count || 0;
  }
};
