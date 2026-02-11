/**
 * Componente: ExistingKPIs
 * 
 * Propósito: Replica os 4 KPIs existentes do Dashboard na aba KPIs
 * - Ticket Médio, CAC, ROI, LTV/CAC
 * - Mantém mesma funcionalidade e aparência
 * - Reutiliza código do CommercialKPIs
 */

import React from 'react';
import { CommercialKPIs } from '../Dashboard/CommercialKPIs';

export const ExistingKPIs: React.FC = () => {
  return (
    <CommercialKPIs />
  );
};