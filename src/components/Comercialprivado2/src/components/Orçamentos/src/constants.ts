import { SalaryTable, Scales, EncargosGroup } from './types';

export const TABELA_SALARIAL: SalaryTable = {
  COPEIRA: 1729.04,
  LIMPADOR_VIDRO: 1882.34,
  RECEPCIONISTA: 1864.72,
  PORTEIRO: 2021.12,
  AUX_DP: 1864.72,
  ZELADORIA: 2197.31,
  TEC_DES: 2244.83,
  AUX_DES: 1717.2,
  AUX_MAN: 1766.58,
  DEMAIS: 1766.58,
  HIDROJATISTA: 2152.94,
  OP_VAR: 2455.92,
  OP_EMP: 2455.92,
  OP_VAC: 2455.92,
  COVEIRO: 2488.37,
};

export const ESCALAS: Scales = {
  S_SEXTA_44: { nome: '2ª a 6ª (44h)', dias: 22, multiplier: 1.0, vrDays: 22, vtDays: 22 },
  S_SABADO_44: { nome: '2ª a Sábado (44h)', dias: 25, multiplier: 1.0, vrDays: 25, vtDays: 25 },
  S_SEXTA_12: { nome: '2ª a 6ª (12h Diária)', dias: 22, multiplier: 1.37, vrDays: 22, vtDays: 22 },
  S_DOMINGO_8: { nome: '2ª a Domingo (8h Diária)', dias: 31, multiplier: 1.37, vrDays: 31, vtDays: 31 },
  S_DOMINGO_12D: { nome: 'Escala 12x36', dias: 31, multiplier: 2.0, vrDays: 15.5, vtDays: 15.5 },
  '12x36': { nome: 'Escala 12x36', dias: 31, multiplier: 2.0, vrDays: 15.5, vtDays: 15.5 }, // Alias para S_DOMINGO_12D
  S_DIARIA: { nome: 'Diária', dias: 1, multiplier: 0.05, vrDays: 1, vtDays: 1 },
};

export const FUNCOES = [
  { value: 'COPEIRA', label: 'COPEIRA' },
  { value: 'LIMPADOR_VIDRO', label: 'LIMPADOR DE VIDRO' },
  { value: 'RECEPCIONISTA', label: 'RECEPCIONISTA' },
  { value: 'PORTEIRO', label: 'PORTEIRO/CONTROLADOR DE ACESSO' },
  { value: 'AUX_DP', label: 'AUX. DE DEPARTAMENTO PESSOAL' },
  { value: 'ZELADORIA', label: 'ZELADORIA EM PRÉDIOS/PÚBLICOS' },
  { value: 'TEC_DES', label: 'TÉCNICO EM DESENTUPIMENTO' },
  { value: 'AUX_DES', label: 'AUX. DE DESENTUPIMENTO' },
  { value: 'AUX_MAN', label: 'AUX. DE MANUTENÇÃO' },
  { value: 'DEMAIS', label: 'DEMAIS FUNÇÕES' },
  { value: 'HIDROJATISTA', label: 'HIDROJATISTA (PRESSÃO ACIMA DE 4.000 PSI)' },
  { value: 'OP_VAR', label: 'OP. DE VARREDEIRA MOTORIZADA' },
  { value: 'OP_EMP', label: 'OP. DE EMPILHADEIRA' },
  { value: 'OP_VAC', label: 'OP. DE VÁCUO' },
  { value: 'COVEIRO', label: 'COVEIRO/SEPULTADOR' },
];

export const CIDADES = [
  { value: 2.0, label: 'ÁGUAS DE SANTA BÁRBARA - 2,0%' },
  { value: 3.0, label: 'AMERICANA - 3,0%' },
  { value: 5.0, label: 'CAMPINAS - 5,0%' },
  { value: 5.0, label: 'SÃO PAULO - 5,0%' },
  { value: 5.0, label: 'VOTORANTIM - 5,0%' },
];

export const GRUPOS_ENCARGOS: EncargosGroup[] = [
  {
    g: 'GRUPO A - ENCARGOS SOCIAIS BÁSICOS',
    i: [
      { d: 'INSS - Previdência Social', p: 0.2 },
      { d: 'SESI / SESC', p: 0.015 },
      { d: 'SENAI / SENAC', p: 0.01 },
      { d: 'INCRA', p: 0.002 },
      { d: 'SEBRAE', p: 0.006 },
      { d: 'Salário Educação', p: 0.025 },
      { d: 'Seguro Acidente de Trabalho', p: 0.03 },
      { d: 'FGTS', p: 0.08 },
    ],
  },
  {
    g: 'GRUPO B - TEMPO REMUNERADO E NÃO TRABALHADO',
    i: [
      { d: 'Férias (sem abono)', p: 0.091518 },
      { d: 'Enfermidades (≤15 dias)', p: 0.006916 },
      { d: 'Ausências Legais', p: 0.009524 },
      { d: 'Licença Paternidade', p: 0.004178 },
      { d: 'Acidente de Trabalho', p: 0.006347 },
      { d: 'Aviso Prévio Trabalhado', p: 0.000254 },
    ],
  },
  {
    g: 'GRUPO C - ADICIONAL DE FÉRIAS E 13º SALÁRIO',
    i: [
      { d: 'Adicional de Férias', p: 0.030506 },
      { d: '13º Salário', p: 0.093839 },
    ],
  },
  {
    g: 'GRUPO D - OBRIGAÇÕES RESCISÓRIAS',
    i: [
      { d: 'Aviso Prévio Indenizado', p: 0.005303 },
      { d: 'Incidência do FGTS sobre aviso prévio', p: 0.004103 },
      { d: 'Incidência da Multa FGTS (Depósitos)', p: 0.012863 },
      { d: 'Incidência da multa FGTS (Aviso Indenizado)', p: 0.002222 },
      { d: 'Incidência da multa FGTS (Aviso Trabalhado)', p: 0.000004 },
    ],
  },
  {
    g: 'GRUPO E - APROVISIONAMENTO DE CASOS ESPECIAIS',
    i: [
      { d: 'Incidência Grupo A sobre Licença Maternidade', p: 0.00327 },
      { d: 'Incidência FGTS sobre Acidente Trabalho', p: 0.000015 },
      { d: 'Abono Pecuniário', p: 0.001305 },
      { d: 'Reflexo Aviso Indenizado s/ Férias e 13º', p: 0.009972 },
      { d: 'Incidência FGTS s/ Reflexo Aviso no 13º', p: 0.000342 },
    ],
  },
  {
    g: 'GRUPO F - INCIDÊNCIAS CUMULATIVAS',
    i: [
      { d: 'Encargos Grupo A sobre B', p: 0.043695 },
      { d: 'Encargos Grupo A sobre C', p: 0.045759 },
    ],
  },
];
