export function parseDate(value: string): Date {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

export function formatTime(value: string) {
  return parseDate(value).toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDate(value: string) {
  const date = parseDate(value);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (sameDay(date, today)) return 'Hoy';
  if (sameDay(date, yesterday)) return 'Ayer';

  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year:
      date.getFullYear() === today.getFullYear() ? undefined : 'numeric',
  });
}

export function formatDateTime(value: string) {
  return `${formatDate(value)} · ${formatTime(value)}`;
}

export function formatFullDate(value: string) {
  return parseDate(value).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
