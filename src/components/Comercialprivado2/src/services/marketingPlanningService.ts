import { supabase } from '../lib/supabase';

export interface MarketingPlanningPost {
  id: string;
  name: string;
  platforms: string[];
  post_date: string;
  idea: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface CreateMarketingPlanningPost {
  name: string;
  platforms: string[];
  post_date: string;
  idea?: string;
}

export const marketingPlanningService = {
  async getPostsByDateRange(startDate: string, endDate: string): Promise<MarketingPlanningPost[]> {
    const { data, error } = await supabase
      .from('marketing_planning_posts')
      .select('*')
      .gte('post_date', startDate)
      .lte('post_date', endDate)
      .order('post_date', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getPostsByMonth(year: number, month: number): Promise<MarketingPlanningPost[]> {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;

    return this.getPostsByDateRange(startDate, endDate);
  },

  async createPost(post: CreateMarketingPlanningPost): Promise<MarketingPlanningPost> {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('marketing_planning_posts')
      .insert({
        ...post,
        created_by: user?.id || null
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }
    return data;
  },

  async updatePost(id: string, updates: Partial<CreateMarketingPlanningPost>): Promise<MarketingPlanningPost> {
    const { data, error } = await supabase
      .from('marketing_planning_posts')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deletePost(id: string): Promise<void> {
    const { error } = await supabase
      .from('marketing_planning_posts')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};
