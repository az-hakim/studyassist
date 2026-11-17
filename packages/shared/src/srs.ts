/**
 * Spaced-repetition engine.
 *
 * Pure, deterministic functions with no I/O so the same logic can run in the
 * browser, in tests and in Edge Functions. All dates are ISO-8601 strings,
 * which is what Postgres returns for `timestamptz`.
 */

export type Rating = "easy" | "medium" | "hard" | "needs_revision";

export type Signal =
  | { kind: "quiz"; scorePct: number }
  | { kind: "card"; rating: Rating }
  | { kind: "confidence"; level: 1 | 2 | 3 };

export type Bucket = "needs_revision" | "due_today" | "mastered" | "ok";

export interface TopicMemory {
  /** Stable key, e.g. `${spaceId}::${normalised topic name}`. */
  topicId: string;
  /** 0–100. */
  strength: number;
  /** Days between the last review and the next one. */
  intervalDays: number;
  lastStudiedAt: string;
  nextReviewAt: string;
  /** Human sentence stored alongside the row (see `reasonFor`). */
  reason: string;
  /** Consecutive successful reviews. */
  streak: number;
  reviews: number;
  lastSignal: Signal;
}

export const RATING_DELTAS: Readonly<Record<Rating, number>> = {
  easy: 8,
  medium: 3,
  hard: -6,
  needs_revision: -12,
};

export const DEFAULT_STRENGTH = 40;
export const MIN_STRENGTH = 0;
export const MAX_STRENGTH = 100;
export const DAY_MS = 86_400_000;

/**
 * Strength → review interval in days. Interpolated between the anchors the
 * product spec calls out: ~1 day below 40, 3 days at 60, 7 days at 80,
 * 14+ days at 90 or above.
 */
const INTERVAL_ANCHORS: ReadonlyArray<readonly [strength: number, days: number]> = [
  [0, 1],
  [40, 1],
  [50, 2],
  [60, 3],
  [70, 5],
  [80, 7],
  [90, 14],
  [100, 21],
];

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

export function clampStrength(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_STRENGTH;
  return Math.min(MAX_STRENGTH, Math.max(MIN_STRENGTH, Math.round(value)));
}

function assertValidDate(date: Date): void {
  if (Number.isNaN(date.getTime())) {
    throw new TypeError("updateMemory received an invalid Date");
  }
}

export function intervalForStrength(strength: number): number {
  const value = clampStrength(strength);
  const lastAnchor = INTERVAL_ANCHORS[INTERVAL_ANCHORS.length - 1];
  if (!lastAnchor) return 21;

  for (let index = 1; index < INTERVAL_ANCHORS.length; index += 1) {
    const previous = INTERVAL_ANCHORS[index - 1];
    const current = INTERVAL_ANCHORS[index];
    if (!previous || !current) break;
    const [strengthLow, daysLow] = previous;
    const [strengthHigh, daysHigh] = current;
    if (value <= strengthHigh) {
      const span = strengthHigh - strengthLow;
      const ratio = span === 0 ? 0 : (value - strengthLow) / span;
      return round1(daysLow + ratio * (daysHigh - daysLow));
    }
  }

  return lastAnchor[1];
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

export function createMemory(topicId: string, now: Date = new Date()): TopicMemory {
  assertValidDate(now);
  return {
    topicId,
    strength: DEFAULT_STRENGTH,
    intervalDays: 1,
    lastStudiedAt: now.toISOString(),
    nextReviewAt: addDays(now, 1).toISOString(),
    reason: "New topic — take a quiz or rate a card to set your baseline.",
    streak: 0,
    reviews: 0,
    lastSignal: { kind: "confidence", level: 2 },
  };
}

/**
 * Apply one learning signal and return the next memory state.
 * Strength is blended (60% new evidence, 40% prior) for quizzes and nudged by
 * fixed deltas for card ratings, then the review interval is recomputed.
 */
export function updateMemory(
  prev: TopicMemory,
  signal: Signal,
  now: Date = new Date(),
): TopicMemory {
  assertValidDate(now);

  const previousStrength = clampStrength(prev.strength);
  let strength = previousStrength;
  let streak = Math.max(0, prev.streak || 0);
  let intervalMultiplier = 1;

  switch (signal.kind) {
    case "quiz": {
      const score = clampStrength(signal.scorePct);
      strength = clampStrength(score * 0.6 + previousStrength * 0.4);
      streak = score >= 70 ? streak + 1 : 0;
      break;
    }
    case "card": {
      strength = clampStrength(previousStrength + RATING_DELTAS[signal.rating]);
      streak = signal.rating === "hard" || signal.rating === "needs_revision" ? 0 : streak + 1;
      break;
    }
    case "confidence": {
      if (signal.level === 1) {
        strength = clampStrength(previousStrength - 10);
        streak = 0;
        intervalMultiplier = 0.5;
      } else if (signal.level === 3) {
        strength = clampStrength(previousStrength + 8);
        streak += 1;
        intervalMultiplier = 1.5;
      } else {
        streak += 1;
      }
      break;
    }
  }

  const intervalDays = round1(Math.max(0.5, intervalForStrength(strength) * intervalMultiplier));

  const next: TopicMemory = {
    ...prev,
    strength,
    intervalDays,
    lastStudiedAt: now.toISOString(),
    nextReviewAt: addDays(now, intervalDays).toISOString(),
    streak,
    reviews: (prev.reviews || 0) + 1,
    lastSignal: signal,
    reason: "",
  };

  next.reason = reasonFor(next, now);
  return next;
}

/** "today" | "yesterday" | "3 days ago" — always relative to `now`. */
export function timeAgo(iso: string, now: Date = new Date()): string {
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return "recently";
  const days = Math.max(0, Math.floor((now.getTime() - then.getTime()) / DAY_MS));
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  return `${days} days ago`;
}

/**
 * A concrete, human sentence naming the most recent signal. Never generic:
 * it always includes the signal and when it happened.
 */
export function reasonFor(mem: TopicMemory, now: Date = new Date()): string {
  if (mem.reviews === 0) {
    return "New topic — take a quiz or rate a card to set your baseline.";
  }

  const when = timeAgo(mem.lastStudiedAt, now);
  const signal = mem.lastSignal;

  switch (signal.kind) {
    case "quiz": {
      const score = clampStrength(signal.scorePct);
      const verdict =
        score >= 80 ? "a strong result" : score >= 60 ? "solid progress" : "a signal to revise";
      return `You scored ${score}% on a quiz ${when} — ${verdict}.`;
    }
    case "card": {
      if (signal.rating === "needs_revision") {
        return `You marked a flashcard as needing revision ${when}.`;
      }
      if (signal.rating === "easy") return `You rated a flashcard Easy ${when}.`;
      if (signal.rating === "medium") return `You rated a flashcard Medium ${when}.`;
      return `You rated a flashcard Hard ${when}.`;
    }
    case "confidence": {
      const level = signal.level === 1 ? "unsure" : signal.level === 2 ? "okay" : "confident";
      return `You checked in feeling ${level} ${when}.`;
    }
  }
}

/**
 * Where a topic belongs in the revision dashboard.
 * - weak topics always need revision, even if not due yet
 * - strong topics that are not due are mastered
 */
export function bucket(mem: TopicMemory, now: Date = new Date()): Bucket {
  if (mem.reviews === 0) return "due_today";
  if (mem.strength < 50) return "needs_revision";

  const next = new Date(mem.nextReviewAt).getTime();
  if (Number.isNaN(next)) return "due_today";
  if (next <= now.getTime()) return "due_today";
  if (mem.strength >= 80 && mem.intervalDays >= 7) return "mastered";
  return "ok";
}

/** Days until the next review (negative when overdue). */
export function daysUntilReview(mem: TopicMemory, now: Date = new Date()): number {
  const next = new Date(mem.nextReviewAt).getTime();
  if (Number.isNaN(next)) return 0;
  return Math.ceil((next - now.getTime()) / DAY_MS);
}
