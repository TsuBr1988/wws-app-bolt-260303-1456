import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkCreci() {
  const { data, error } = await supabase
    .from('contracts')
    .select('*')
    .ilike('client_name', '%CRECI%')
    .single();

  if (error) {
    console.error('Erro:', error);
    return;
  }

  if (!data) {
    console.log('Contrato CRECI não encontrado');
    return;
  }

  const startDate = new Date(data.start_date);
  const endDate = new Date(data.end_date);

  const diffTime = endDate.getTime() - startDate.getTime();
  const diffDays = diffTime / (1000 * 60 * 60 * 24);
  const diffMonths30 = Math.ceil(diffDays / 30);

  const totalMonthsExact = (endDate.getFullYear() - startDate.getFullYear()) * 12
    + (endDate.getMonth() - startDate.getMonth());

  console.log('\n=== CONTRATO CRECI ===');
  console.log('Cliente:', data.client_name);
  console.log('Data Início:', startDate.toLocaleDateString('pt-BR'));
  console.log('Data Fim:', endDate.toLocaleDateString('pt-BR'));
  console.log('\n=== CÁLCULOS ===');
  console.log('Diferença em dias:', Math.ceil(diffDays));
  console.log('Meses (dividindo por 30):', diffMonths30);
  console.log('Meses (cálculo exato ano/mês):', totalMonthsExact);
  console.log('\n=== DADOS ===');
  console.log('Valor Mensal:', data.monthly_value);
  console.log('Valor Global:', data.monthly_value * diffMonths30);
  console.log('Margem %:', data.margem_percentual);
}

checkCreci();
