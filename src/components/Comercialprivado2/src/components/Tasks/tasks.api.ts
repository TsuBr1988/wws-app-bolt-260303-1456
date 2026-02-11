import { supabase } from '../../lib/supabase';

export interface Task {
  id: string;
  assignee_id: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  due_date: string;
  status: 'a_fazer' | 'fazendo' | 'feito';
  title: string;
  description: string;
  finished_at?: string;
}

export interface TaskCounts {
  total: number;
  dueIn5: number;
  dueIn1: number;
}

export interface TaskFormData {
  title: string;
  description: string;
  due_date: string;
  status: 'a_fazer' | 'fazendo' | 'feito';
  assignee_id: string;
}

// List tasks by assignee with optional filters
export const listTasksByAssignee = async (
  assigneeId: string, 
  options: {
    statuses?: string[];
    limit?: number;
    offset?: number;
  } = {}
): Promise<{ data: Task[]; error?: string }> => {
  try {
    let query = supabase
      .from('tasks')
      .select('*')
      .eq('assignee_id', assigneeId);

    if (options.statuses && options.statuses.length > 0) {
      query = query.in('status', options.statuses);
    }

    // Order by: status priority (a_fazer > fazendo > feito), then due_date asc, then created_at desc
    query = query.order('status', { ascending: true })
                 .order('due_date', { ascending: true })
                 .order('created_at', { ascending: false });

    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching tasks:', error);
      return { data: [], error: error.message };
    }

    return { data: data || [], error: undefined };
  } catch (err) {
    console.error('Unexpected error fetching tasks:', err);
    return { data: [], error: 'Erro inesperado ao buscar tarefas' };
  }
};

// Get task counts for an assignee
export const getCounts = async (assigneeId: string): Promise<{ data: TaskCounts; error?: string }> => {
  try {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const in5DaysStr = new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const in1DayStr = new Date(today.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Get total count
    const { count: total, error: totalError } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('assignee_id', assigneeId);

    if (totalError) throw totalError;

    // Get due in 5 days count (status != 'feito' and due_date <= today+5)
    const { count: dueIn5, error: dueIn5Error } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('assignee_id', assigneeId)
      .neq('status', 'feito')
      .lte('due_date', in5DaysStr);

    if (dueIn5Error) throw dueIn5Error;

    // Get due in 1 day count (status != 'feito' and due_date <= today+1)
    const { count: dueIn1, error: dueIn1Error } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('assignee_id', assigneeId)
      .neq('status', 'feito')
      .lte('due_date', in1DayStr);

    if (dueIn1Error) throw dueIn1Error;

    return {
      data: {
        total: total || 0,
        dueIn5: dueIn5 || 0,
        dueIn1: dueIn1 || 0
      },
      error: undefined
    };
  } catch (err) {
    console.error('Error getting task counts:', err);
    return {
      data: { total: 0, dueIn5: 0, dueIn1: 0 },
      error: err instanceof Error ? err.message : 'Erro ao buscar contadores'
    };
  }
};

// Create new task
export const createTask = async (taskData: TaskFormData): Promise<{ data?: Task; error?: string }> => {
  try {
    const payload = {
      title: taskData.title,
      description: taskData.description,
      due_date: taskData.due_date,
      status: taskData.status,
      assignee_id: taskData.assignee_id,
      created_by: null, // Can be enhanced with user authentication
      finished_at: taskData.status === 'feito' ? new Date().toISOString() : null
    };

    const { data, error } = await supabase
      .from('tasks')
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error('Error creating task:', error);
      return { error: error.message };
    }

    return { data, error: undefined };
  } catch (err) {
    console.error('Unexpected error creating task:', err);
    return { error: err instanceof Error ? err.message : 'Erro inesperado ao criar tarefa' };
  }
};

// Update existing task
export const updateTask = async (id: string, taskData: Partial<TaskFormData>): Promise<{ data?: Task; error?: string }> => {
  try {
    const payload: any = { ...taskData };
    
    // If changing status to 'feito' and finished_at is not set, set it now
    if (taskData.status === 'feito') {
      // Let the trigger handle finished_at automatically
    }

    const { data, error } = await supabase
      .from('tasks')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating task:', error);
      return { error: error.message };
    }

    return { data, error: undefined };
  } catch (err) {
    console.error('Unexpected error updating task:', err);
    return { error: err instanceof Error ? err.message : 'Erro inesperado ao atualizar tarefa' };
  }
};

// Delete task
export const deleteTask = async (id: string): Promise<{ error?: string }> => {
  try {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting task:', error);
      return { error: error.message };
    }

    return { error: undefined };
  } catch (err) {
    console.error('Unexpected error deleting task:', err);
    return { error: err instanceof Error ? err.message : 'Erro inesperado ao excluir tarefa' };
  }
};

// Get completed tasks series for last 30 days (for chart)
export const getDoneSeriesLast30Days = async (): Promise<{ 
  data: { [assigneeId: string]: Array<{ date: string; count: number }> }; 
  error?: string 
}> => {
  try {
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('tasks')
      .select('assignee_id, finished_at')
      .eq('status', 'feito')
      .gte('finished_at', thirtyDaysAgoStr)
      .not('finished_at', 'is', null);

    if (error) {
      console.error('Error fetching done tasks series:', error);
      return { data: {}, error: error.message };
    }

    // Group by assignee and date
    const grouped: { [assigneeId: string]: { [date: string]: number } } = {};
    
    (data || []).forEach(task => {
      if (!task.finished_at) return;
      
      const finishedDate = new Date(task.finished_at).toISOString().split('T')[0];
      
      if (!grouped[task.assignee_id]) {
        grouped[task.assignee_id] = {};
      }
      
      if (!grouped[task.assignee_id][finishedDate]) {
        grouped[task.assignee_id][finishedDate] = 0;
      }
      
      grouped[task.assignee_id][finishedDate]++;
    });

    // Convert to array format with all 30 days
    const result: { [assigneeId: string]: Array<{ date: string; count: number }> } = {};
    
    Object.keys(grouped).forEach(assigneeId => {
      result[assigneeId] = [];
      
      for (let i = 29; i >= 0; i--) {
        const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
        const dateStr = date.toISOString().split('T')[0];
        const count = grouped[assigneeId][dateStr] || 0;
        
        result[assigneeId].push({ date: dateStr, count });
      }
    });

    return { data: result, error: undefined };
  } catch (err) {
    console.error('Unexpected error fetching done series:', err);
    return { data: {}, error: err instanceof Error ? err.message : 'Erro inesperado' };
  }
};