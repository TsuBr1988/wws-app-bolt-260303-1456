import { supabase } from '../lib/supabase';

export interface SystemConfig {
  id: number;
  minimum_wage: number;
  updated_at: string;
}

const FALLBACK_MINIMUM_WAGE = 1621.00;
let legacySystemConfigAvailable: boolean | null = null;

const isMissingLegacySystemConfigTable = (error: unknown): boolean => {
  const message = String((error as any)?.message || '');
  return message.includes('relation "public.system_config" does not exist');
};

const parseMinimumWage = (value: unknown): number | null => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

async function getFromSystemConfigurations(): Promise<number | null> {
  const { data, error } = await supabase
    .from('system_configurations')
    .select('config_data')
    .eq('config_type', 'minimum_wage')
    .maybeSingle();

  if (error) return null;

  const configData = data?.config_data as any;
  return (
    parseMinimumWage(configData?.minimum_wage) ??
    parseMinimumWage(configData?.value) ??
    parseMinimumWage(configData)
  );
}

async function getFromLegacySystemConfig(): Promise<number | null> {
  if (legacySystemConfigAvailable === false) {
    return null;
  }

  const { data, error } = await supabase
    .from('system_config')
    .select('minimum_wage')
    .eq('id', 1)
    .maybeSingle();

  if (error) {
    if (isMissingLegacySystemConfigTable(error)) {
      legacySystemConfigAvailable = false;
    } else {
      console.warn('⚠️ Error fetching minimum wage from legacy table:', error.message);
    }
    return null;
  }

  legacySystemConfigAvailable = true;

  return parseMinimumWage(data?.minimum_wage);
}

export async function getMinimumWage(): Promise<number> {
  try {
    const timeoutPromise = new Promise<number>((resolve) => {
      setTimeout(() => {
        console.warn('⏱️ Minimum wage fetch timeout, using fallback');
        resolve(FALLBACK_MINIMUM_WAGE);
      }, 5000);
    });

    const fetchPromise = (async () => {
      const fromCurrentTable = await getFromSystemConfigurations();
      if (fromCurrentTable !== null) {
        console.log('✅ Minimum wage loaded from system_configurations:', fromCurrentTable);
        return fromCurrentTable;
      }

      const fromLegacyTable = await getFromLegacySystemConfig();
      if (fromLegacyTable !== null) {
        console.log('✅ Minimum wage loaded from system_config:', fromLegacyTable);
        return fromLegacyTable;
      }

      console.warn('⚠️ No minimum wage data found, using fallback');
      return FALLBACK_MINIMUM_WAGE;
    })();

    return await Promise.race([fetchPromise, timeoutPromise]);
  } catch (error) {
    console.error('❌ Exception fetching minimum wage, using fallback:', error);
    return FALLBACK_MINIMUM_WAGE;
  }
}

export async function updateMinimumWage(minimumWage: number): Promise<{ success: boolean; error?: string }> {
  try {
    const nowIso = new Date().toISOString();

    const { error: currentTableError } = await supabase
      .from('system_configurations')
      .upsert(
        {
          config_type: 'minimum_wage',
          config_data: {
            minimum_wage: minimumWage,
            updated_at: nowIso,
          },
          updated_at: nowIso,
        },
        { onConflict: 'config_type' }
      );

    if (!currentTableError) {
      return { success: true };
    }

    const { error: legacyError } = await supabase
      .from('system_config')
      .upsert(
        {
          id: 1,
          minimum_wage: minimumWage,
          updated_at: nowIso,
        },
        { onConflict: 'id' }
      );

    if (legacyError) {
      console.error('Error updating minimum wage:', legacyError);
      return { success: false, error: legacyError.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating minimum wage:', error);
    return { success: false, error: String(error) };
  }
}
