import { format, subMonths, startOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface MonthData {
  monthYm: string; // YYYY-MM format
  monthLabel: string; // MMM/YY format
  date: Date;
}

export function getLast12Months(referenceDate: Date = new Date()): MonthData[] {
  const months: MonthData[] = [];
  
  for (let i = 11; i >= 0; i--) {
    const date = startOfMonth(subMonths(referenceDate, i));
    const monthYm = format(date, 'yyyy-MM');
    const monthLabel = format(date, 'MMM/yy', { locale: ptBR });
    
    months.push({
      monthYm,
      monthLabel,
      date
    });
  }
  
  return months;
}

export function formatMonthLabel(yearMonth: string): string {
  const [year, month] = yearMonth.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, 1);
  return format(date, 'MMM/yy', { locale: ptBR });
}

export function getCurrentYearMonth(): string {
  return format(new Date(), 'yyyy-MM');
}

export function getMonthsInRange(startYm: string, endYm: string): MonthData[] {
  const months: MonthData[] = [];

  const [startYear, startMonth] = startYm.split('-').map(Number);
  const [endYear, endMonth] = endYm.split('-').map(Number);

  const startDate = new Date(startYear, startMonth - 1, 1);
  const endDate = new Date(endYear, endMonth - 1, 1);

  let currentDate = startDate;

  while (currentDate <= endDate) {
    const monthYm = format(currentDate, 'yyyy-MM');
    const monthLabel = format(currentDate, 'MMM/yy', { locale: ptBR });

    months.push({
      monthYm,
      monthLabel,
      date: new Date(currentDate)
    });

    currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
  }

  return months;
}

export function convertMonthYmsToMonthData(monthYms: string[]): MonthData[] {
  return monthYms.map(monthYm => {
    const [year, month] = monthYm.split('-').map(Number);
    const date = new Date(year, month - 1, 1);
    const monthLabel = format(date, 'MMM/yy', { locale: ptBR });

    return {
      monthYm,
      monthLabel,
      date
    };
  });
}