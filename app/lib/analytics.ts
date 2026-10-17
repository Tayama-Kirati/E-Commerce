// Day keys use the server's local calendar date (not UTC) so the window and the rows agree
const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** Fills every day in the window so charts don't skip days without sales. */
export function bucketByDay<T extends { createdAt: Date }>(rows: T[], days: number, value: (r: T) => number, now = new Date()) {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (days - 1));

  const buckets = new Map<string, { date: string; revenue: number; orders: number }>();
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const key = dayKey(d);
    buckets.set(key, { date: key, revenue: 0, orders: 0 });
  }
  for (const r of rows) {
    const key = dayKey(r.createdAt);
    const b = buckets.get(key);
    if (b) {
      b.revenue += value(r);
      b.orders += 1;
    }
  }
  return [...buckets.values()];
}

export function periodDays(raw: string | null, fallback = 30) {
  const n = Number(raw);
  return [7, 30, 90, 365].includes(n) ? n : fallback;
}

export function pctChange(current: number, previous: number) {
  if (!previous) return current ? 100 : 0;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}
