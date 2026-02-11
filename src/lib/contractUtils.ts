import { format, parseISO, differenceInDays, addMonths, isWithinInterval } from 'date-fns';

export interface Contract {
  id: string;
  client_name: string;
  city?: string;
  numero_pregao?: string;
  numero_contrato?: string;
  monthly_value: number;
  start_date: string;
  end_date: string;
  contract_object: string;
  is_active: boolean;
  empresa: string;
  tipo?: string;
  department: string;
  margem_percentual?: number;
  proposal_id?: string;
  reequilibrio_dissidio: boolean;
  reequilibrio_ipca: boolean;
  ultimo_lembrete_dissidio?: string;
  ultimo_lembrete_ipca?: string;
  created_at: string;
  updated_at: string;
}

export interface ContractAddendum {
  id: string;
  contract_id: string;
  start_date: string;
  end_date: string;
  effective_start_date?: string;
  effective_end_date?: string;
  monthly_value: number;
  observations: string;
  is_punctual: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ContractWithAddendums extends Contract {
  addendums?: ContractAddendum[];
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatDateBR(dateString: string): string {
  try {
    const date = parseISO(dateString);
    return format(date, 'dd/MM/yyyy');
  } catch {
    return dateString;
  }
}

export function isInformativeAddendum(addendum: ContractAddendum): boolean {
  return addendum.monthly_value === 0 && addendum.observations.startsWith('[ADITIVO INFORMATIVO]');
}

export function getActivePunctualAddendum(
  addendums: ContractAddendum[],
  referenceDate: Date = new Date()
): ContractAddendum | null {
  if (!addendums || addendums.length === 0) return null;

  const punctualAddendums = addendums.filter(
    (a) => a.is_punctual && !isInformativeAddendum(a)
  );

  for (const addendum of punctualAddendums) {
    const startDate = parseISO(addendum.start_date);
    const endDate = parseISO(addendum.end_date);

    if (isWithinInterval(referenceDate, { start: startDate, end: endDate })) {
      return addendum;
    }
  }

  return null;
}

export function getMostRecentPermanentAddendum(
  addendums: ContractAddendum[]
): ContractAddendum | null {
  if (!addendums || addendums.length === 0) return null;

  const permanentAddendums = addendums
    .filter((a) => !a.is_punctual && !isInformativeAddendum(a))
    .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());

  return permanentAddendums[0] || null;
}

export function getCurrentValue(contract: ContractWithAddendums, referenceDate: Date = new Date()): number {
  if (!contract.addendums || contract.addendums.length === 0) {
    return contract.monthly_value;
  }

  const activePunctual = getActivePunctualAddendum(contract.addendums, referenceDate);
  if (activePunctual) {
    return activePunctual.monthly_value;
  }

  const mostRecentPermanent = getMostRecentPermanentAddendum(contract.addendums);
  if (mostRecentPermanent) {
    return mostRecentPermanent.monthly_value;
  }

  return contract.monthly_value;
}

export function getCurrentEndDate(contract: ContractWithAddendums): string {
  if (!contract.addendums || contract.addendums.length === 0) {
    return contract.end_date;
  }

  const permanentAddendums = contract.addendums.filter(
    (a) => !a.is_punctual && !isInformativeAddendum(a)
  );

  if (permanentAddendums.length === 0) {
    return contract.end_date;
  }

  const latestEndDate = permanentAddendums.reduce((latest, addendum) => {
    const endDate = new Date(addendum.end_date);
    return endDate > new Date(latest) ? addendum.end_date : latest;
  }, contract.end_date);

  return latestEndDate;
}

export function getDaysUntilEnd(endDateString: string): number {
  const endDate = parseISO(endDateString);
  const today = new Date();
  return differenceInDays(endDate, today);
}

export function isContractExpired(contract: ContractWithAddendums): boolean {
  const currentEndDate = getCurrentEndDate(contract);
  const daysUntilEnd = getDaysUntilEnd(currentEndDate);
  return daysUntilEnd <= 0;
}

export function isContractEndingSoon(contract: ContractWithAddendums, daysThreshold: number = 90): boolean {
  const currentEndDate = getCurrentEndDate(contract);
  const daysUntilEnd = getDaysUntilEnd(currentEndDate);
  return daysUntilEnd >= 0 && daysUntilEnd <= daysThreshold;
}

export function getPunctualAddendumEndingSoon(
  contract: ContractWithAddendums,
  daysThreshold: number = 5
): ContractAddendum | null {
  const activePunctual = getActivePunctualAddendum(contract.addendums || []);
  if (!activePunctual) return null;

  const daysUntilEnd = getDaysUntilEnd(activePunctual.end_date);
  if (daysUntilEnd >= 0 && daysUntilEnd <= daysThreshold) {
    return activePunctual;
  }

  return null;
}

export function getClosestEndDate(contract: ContractWithAddendums): {
  date: string;
  type: 'contract' | 'punctual';
  daysRemaining: number;
} | null {
  const currentEndDate = getCurrentEndDate(contract);
  const contractDaysRemaining = getDaysUntilEnd(currentEndDate);

  const activePunctual = getActivePunctualAddendum(contract.addendums || []);

  if (activePunctual) {
    const punctualDaysRemaining = getDaysUntilEnd(activePunctual.end_date);

    if (punctualDaysRemaining >= 0 && punctualDaysRemaining < contractDaysRemaining) {
      return {
        date: activePunctual.end_date,
        type: 'punctual',
        daysRemaining: punctualDaysRemaining,
      };
    }
  }

  if (contractDaysRemaining >= 0) {
    return {
      date: currentEndDate,
      type: 'contract',
      daysRemaining: contractDaysRemaining,
    };
  }

  return null;
}

export function calculateDurationInMonths(startDate: string, endDate: string): number {
  const start = parseISO(startDate);
  const end = parseISO(endDate);

  let months = (end.getFullYear() - start.getFullYear()) * 12;
  months += end.getMonth() - start.getMonth();

  return months;
}

export function shouldShowDissidioReminder(contract: Contract): boolean {
  const today = new Date();
  const currentYear = today.getFullYear();
  const reminderDate = new Date(currentYear, 0, 10); // January 10

  if (!contract.reequilibrio_dissidio) return false;

  if (!contract.ultimo_lembrete_dissidio) {
    return today >= reminderDate;
  }

  const lastReminder = parseISO(contract.ultimo_lembrete_dissidio);
  return lastReminder.getFullYear() < currentYear && today >= reminderDate;
}

export function shouldShowIPCAReminder(contract: Contract): boolean {
  if (!contract.reequilibrio_ipca) return false;

  const startDate = parseISO(contract.start_date);
  const today = new Date();

  const firstReminderDate = addMonths(startDate, 10);

  if (!contract.ultimo_lembrete_ipca) {
    return today >= firstReminderDate;
  }

  const lastReminder = parseISO(contract.ultimo_lembrete_ipca);
  const nextReminderDate = addMonths(lastReminder, 12);

  return today >= nextReminderDate;
}

export function getValueForMonth(
  contract: ContractWithAddendums,
  monthDate: Date
): number {
  const startDate = parseISO(contract.start_date);
  const currentEndDate = parseISO(getCurrentEndDate(contract));

  if (monthDate < startDate || monthDate > currentEndDate) {
    return 0;
  }

  if (!contract.addendums || contract.addendums.length === 0) {
    return contract.monthly_value;
  }

  const activePunctual = getActivePunctualAddendum(contract.addendums, monthDate);
  if (activePunctual) {
    return activePunctual.monthly_value;
  }

  const permanentAddendums = contract.addendums
    .filter((a) => !a.is_punctual && !isInformativeAddendum(a))
    .filter((a) => parseISO(a.start_date) <= monthDate)
    .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());

  if (permanentAddendums.length > 0) {
    return permanentAddendums[0].monthly_value;
  }

  return contract.monthly_value;
}
