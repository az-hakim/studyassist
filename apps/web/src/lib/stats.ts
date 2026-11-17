import type { TopicMemory } from "@studybuddy/shared";

export interface DatedItem {
  at: string;
}

function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Consecutive days (ending today or yesterday) with any study activity. */
export function currentStreak(items: DatedItem[], now: Date = new Date()): number {
  const days = new Set(items.map((item) => dayKey(new Date(item.at))));
  if (days.size === 0) return 0;

  const cursor = new Date(now);
  if (!days.has(dayKey(cursor))) {
    cursor.setUTCDate(cursor.getUTCDate() - 1);
    if (!days.has(dayKey(cursor))) return 0;
  }

  let streak = 0;
  while (days.has(dayKey(cursor))) {
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}

export function activeDaysThisWeek(items: DatedItem[], now: Date = new Date()): number {
  const start = new Date(now);
  start.setUTCHours(0, 0, 0, 0);
  start.setUTCDate(start.getUTCDate() - 6);
  const recent = new Set(
    items
      .map((item) => new Date(item.at))
      .filter((date) => !Number.isNaN(date.getTime()) && date >= start)
      .map(dayKey),
  );
  return recent.size;
}

export function averageStrength(memories: TopicMemory[]): number {
  if (memories.length === 0) return 0;
  return Math.round(memories.reduce((sum, memory) => sum + memory.strength, 0) / memories.length);
}

export function groupBy<T, K extends string>(items: T[], key: (item: T) => K): Record<K, T[]> {
  const groups = {} as Record<K, T[]>;
  for (const item of items) {
    const group = key(item);
    groups[group] = groups[group] ? [...groups[group], item] : [item];
  }
  return groups;
}

export function lastNDays(count: number, now: Date = new Date()): string[] {
  const days: string[] = [];
  for (let index = count - 1; index >= 0; index -= 1) {
    const date = new Date(now);
    date.setUTCDate(date.getUTCDate() - index);
    days.push(dayKey(date));
  }
  return days;
}
