export function formatTemperature(value: number | null | undefined): string {
  return typeof value === 'number' && Number.isFinite(value) ? `${Math.round(value)}°` : '--°';
}

export function formatTime(iso: string | null | undefined): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export function formatReading(
  value: number | null | undefined,
  unit: string,
  digits = 0,
): string {
  return typeof value === 'number' && Number.isFinite(value)
    ? `${value.toFixed(digits)}${unit}`
    : `--${unit}`;
}
