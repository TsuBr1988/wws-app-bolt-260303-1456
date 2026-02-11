import { supabase } from '../lib/supabase';

export interface InstagramMetrics {
  id?: string;
  date: string;
  followers: number;
  photo_posts: number;
  video_posts: number;
  story_posts: number;
  likes: number;
  photo_views: number;
  video_views: number;
  story_views: number;
  shares: number;
  comments: number;
}

export interface LinkedInMetrics {
  id?: string;
  date: string;
  followers: number;
  photo_posts: number;
  video_posts: number;
  impressions: number;
  views: number;
  clicks: number;
  comments: number;
  shares: number;
}

export const marketingService = {
  async getInstagramMetrics(startDate?: string, endDate?: string) {
    let query = supabase
      .from('marketing_instagram')
      .select('*')
      .order('date', { ascending: false });

    if (startDate) {
      query = query.gte('date', startDate);
    }
    if (endDate) {
      query = query.lte('date', endDate);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async getLinkedInMetrics(startDate?: string, endDate?: string) {
    let query = supabase
      .from('marketing_linkedin')
      .select('*')
      .order('date', { ascending: false });

    if (startDate) {
      query = query.gte('date', startDate);
    }
    if (endDate) {
      query = query.lte('date', endDate);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async upsertInstagramMetrics(metrics: InstagramMetrics) {
    const { data, error } = await supabase
      .from('marketing_instagram')
      .upsert(metrics, { onConflict: 'date' })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async upsertLinkedInMetrics(metrics: LinkedInMetrics) {
    const { data, error } = await supabase
      .from('marketing_linkedin')
      .upsert(metrics, { onConflict: 'date' })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteInstagramMetrics(id: string) {
    const { error } = await supabase
      .from('marketing_instagram')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async deleteLinkedInMetrics(id: string) {
    const { error } = await supabase
      .from('marketing_linkedin')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};
