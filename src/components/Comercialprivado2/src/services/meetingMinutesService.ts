import { supabase } from '../lib/supabase';

export interface MeetingMinute {
  id: string;
  title: string;
  date: string;
  content: string;
  participants: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateMeetingMinute {
  title: string;
  date: string;
  content: string;
  participants?: string;
}

export const meetingMinutesService = {
  async getAllMeetingMinutes(): Promise<MeetingMinute[]> {
    const { data, error } = await supabase
      .from('meeting_minutes')
      .select('*')
      .order('date', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getMeetingMinuteById(id: string): Promise<MeetingMinute> {
    const { data, error } = await supabase
      .from('meeting_minutes')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async createMeetingMinute(minute: CreateMeetingMinute): Promise<MeetingMinute> {
    const { data, error } = await supabase
      .from('meeting_minutes')
      .insert(minute)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateMeetingMinute(id: string, updates: Partial<CreateMeetingMinute>): Promise<MeetingMinute> {
    const { data, error } = await supabase
      .from('meeting_minutes')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteMeetingMinute(id: string): Promise<void> {
    const { error } = await supabase
      .from('meeting_minutes')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};
