export function formatDurationLabel(ms: number, t: (key: string) => string): string {
  const totalMinutes = Math.floor(ms / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  const parts: string[] = [];
  if (days > 0) parts.push(`${days} ${t('tracking.durationDays')}`);
  if (hours > 0) parts.push(`${hours} ${t('tracking.durationHours')}`);
  if (minutes > 0 || parts.length === 0) parts.push(`${minutes} ${t('tracking.durationMinutes')}`);
  return parts.join(' ');
}
