import { padStart } from 'lodash';

export function formatIsoDate(date: Date) {
  const m = padStart(`${date.getMonth() + 1}`, 2, '0');
  const d = padStart(`${date.getDate()}`, 2, '0');
  return `${date.getFullYear()}-${m}-${d}`;
}
