export function calculateMonthsBetween(startDate: Date, endDate: Date): number {
  return Math.max(0, (endDate.getFullYear() - startDate.getFullYear()) * 12
    + (endDate.getMonth() - startDate.getMonth()));
}

export function calculateContractDuration(startDate: string | Date, endDate: string | Date): number {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;

  return calculateMonthsBetween(start, end);
}

export function calculateMonthsRemaining(endDate: string | Date): number {
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
  const now = new Date();

  return calculateMonthsBetween(now, end);
}
