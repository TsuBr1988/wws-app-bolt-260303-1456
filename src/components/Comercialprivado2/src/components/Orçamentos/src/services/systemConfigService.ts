import { supabase } from '../lib/supabase';

export interface SystemConfig {
  id: number;
  minimum_wage: number;
  updated_at: string;
}

const FALLBACK_MINIMUM_WAGE = 1621.00;

export async function getMinimumWage(): Promise<number> {
  try {
    const timeoutPromise = new Promise<number>((resolve) => {
      setTimeout(() => {
        console.warn('⏱️ Minimum wage fetch timeout, using fallback');
        resolve(FALLBACK_MINIMUM_WAGE);
      }, 5000);
    });

    const fetchPromise = supabase
      .from('system_config')
      .select('minimum_wage')
      .eq('id', 1)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) {
          console.warn('⚠️ Error fetching minimum wage, using fallback:', error.message);
          return FALLBACK_MINIMUM_WAGE;
        }

        if (!data) {
          console.warn('⚠️ No minimum wage data found, using fallback');
          return FALLBACK_MINIMUM_WAGE;
        }

        const wage = Number(data.minimum_wage);
        console.log('✅ Minimum wage loaded:', wage);
        return wage;
      });

    return await Promise.race([fetchPromise, timeoutPromise]);
  } catch (error) {
    console.error('❌ Exception fetching minimum wage, using fallback:', error);
    return FALLBACK_MINIMUM_WAGE;
  }
}

export async function updateMinimumWage(minimumWage: number): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('system_config')
      .upsert(
        {
          id: 1,
          minimum_wage: minimumWage,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );

    if (error) {
      console.error('Error updating minimum wage:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating minimum wage:', error);
    return { success: false, error: String(error) };
  }
}
