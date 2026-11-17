import { describe, expect, it } from "vitest";

import {
  DEFAULT_STRENGTH,
  addDays,
  bucket,
  clampStrength,
  createMemory,
  daysUntilReview,
  intervalForStrength,
  reasonFor,
  timeAgo,
  updateMemory,
  type Signal,
  type TopicMemory,
} from "./srs";

const NOW = new Date("2026-01-15T09:00:00.000Z");
const DAY = 86_400_000;

function memoryAt(strength: number, overrides: Partial<TopicMemory> = {}): TopicMemory {
  return {
    ...createMemory("space::algebra", NOW),
    strength,
    reviews: 3,
    streak: 2,
    lastStudiedAt: new Date(NOW.getTime() - 2 * DAY).toISOString(),
    lastSignal: { kind: "quiz", scorePct: 70 },
    ...overrides,
  };
}

describe("clampStrength", () => {
  it("clamps below zero", () => {
    expect(clampStrength(-30)).toBe(0);
  });

  it("clamps above one hundred", () => {
    expect(clampStrength(130)).toBe(100);
  });

  it("rounds to whole numbers", () => {
    expect(clampStrength(62.6)).toBe(63);
  });

  it("falls back to the default for non-finite input", () => {
    expect(clampStrength(Number.NaN)).toBe(DEFAULT_STRENGTH);
  });
});

describe("intervalForStrength", () => {
  it("keeps a one day interval below 40", () => {
    expect(intervalForStrength(0)).toBe(1);
    expect(intervalForStrength(39)).toBe(1);
  });

  it("gives 3 days at 60", () => {
    expect(intervalForStrength(60)).toBe(3);
  });

  it("gives 7 days at 80", () => {
    expect(intervalForStrength(80)).toBe(7);
  });

  it("gives at least 14 days at 90+", () => {
    expect(intervalForStrength(90)).toBe(14);
    expect(intervalForStrength(100)).toBe(21);
  });

  it("interpolates between anchors", () => {
    expect(intervalForStrength(55)).toBe(2.5);
    expect(intervalForStrength(76)).toBe(6.2);
  });
});

describe("createMemory", () => {
  it("starts new topics at strength 40 with a one day interval", () => {
    const memory = createMemory("space::algebra", NOW);
    expect(memory.strength).toBe(40);
    expect(memory.intervalDays).toBe(1);
    expect(memory.reviews).toBe(0);
    expect(memory.streak).toBe(0);
    expect(memory.nextReviewAt).toBe(addDays(NOW, 1).toISOString());
  });

  it("explains that a baseline signal is needed", () => {
    expect(createMemory("space::algebra", NOW).reason).toContain("New topic");
  });

  it("rejects an invalid date", () => {
    expect(() => createMemory("x", new Date("nope"))).toThrow(TypeError);
  });
});

describe("updateMemory with quiz signals", () => {
  it("blends 60% new score with 40% prior strength", () => {
    const next = updateMemory(createMemory("t", NOW), { kind: "quiz", scorePct: 100 }, NOW);
    expect(next.strength).toBe(76);
    expect(next.intervalDays).toBe(6.2);
  });

  it("lowers strength for weak scores", () => {
    const next = updateMemory(createMemory("t", NOW), { kind: "quiz", scorePct: 50 }, NOW);
    expect(next.strength).toBe(46);
    expect(next.intervalDays).toBe(1.6);
  });

  it("clamps scores above 100", () => {
    const next = updateMemory(memoryAt(40), { kind: "quiz", scorePct: 150 }, NOW);
    expect(next.strength).toBe(76);
  });

  it("clamps negative scores to zero", () => {
    const next = updateMemory(memoryAt(40), { kind: "quiz", scorePct: -25 }, NOW);
    expect(next.strength).toBe(16);
  });

  it("keeps the streak alive at exactly 70 percent", () => {
    const next = updateMemory(memoryAt(50), { kind: "quiz", scorePct: 70 }, NOW);
    expect(next.streak).toBe(3);
  });

  it("resets the streak below 70 percent", () => {
    const next = updateMemory(memoryAt(50), { kind: "quiz", scorePct: 69 }, NOW);
    expect(next.streak).toBe(0);
  });

  it("schedules the next review from the given date", () => {
    const next = updateMemory(memoryAt(60), { kind: "quiz", scorePct: 80 }, NOW);
    expect(next.nextReviewAt).toBe(addDays(NOW, next.intervalDays).toISOString());
  });
});

describe("updateMemory with card signals", () => {
  it("adds 8 points for Easy", () => {
    const next = updateMemory(memoryAt(40), { kind: "card", rating: "easy" }, NOW);
    expect(next.strength).toBe(48);
    expect(next.intervalDays).toBe(1.8);
    expect(next.streak).toBe(3);
  });

  it("adds 3 points for Medium", () => {
    expect(updateMemory(memoryAt(40), { kind: "card", rating: "medium" }, NOW).strength).toBe(43);
  });

  it("removes 6 points for Hard and resets the streak", () => {
    const next = updateMemory(memoryAt(40), { kind: "card", rating: "hard" }, NOW);
    expect(next.strength).toBe(34);
    expect(next.streak).toBe(0);
  });

  it("removes 12 points for Needs revision", () => {
    const next = updateMemory(memoryAt(40), { kind: "card", rating: "needs_revision" }, NOW);
    expect(next.strength).toBe(28);
  });

  it("never drops below zero", () => {
    const next = updateMemory(memoryAt(5), { kind: "card", rating: "needs_revision" }, NOW);
    expect(next.strength).toBe(0);
  });

  it("never exceeds one hundred", () => {
    const next = updateMemory(memoryAt(98), { kind: "card", rating: "easy" }, NOW);
    expect(next.strength).toBe(100);
    expect(next.intervalDays).toBe(21);
  });
});

describe("updateMemory with confidence signals", () => {
  it("penalises unsure check-ins and halves the interval", () => {
    const next = updateMemory(memoryAt(60), { kind: "confidence", level: 1 }, NOW);
    expect(next.strength).toBe(50);
    expect(next.intervalDays).toBe(1);
    expect(next.streak).toBe(0);
  });

  it("keeps strength and interval for an okay check-in", () => {
    const next = updateMemory(memoryAt(60), { kind: "confidence", level: 2 }, NOW);
    expect(next.strength).toBe(60);
    expect(next.intervalDays).toBe(3);
    expect(next.streak).toBe(3);
  });

  it("rewards confident check-ins and stretches the interval", () => {
    const next = updateMemory(memoryAt(60), { kind: "confidence", level: 3 }, NOW);
    expect(next.strength).toBe(68);
    expect(next.intervalDays).toBe(6.9);
    expect(next.streak).toBe(3);
  });

  it("multiplies the computed interval by 1.5 for level 3", () => {
    const next = updateMemory(memoryAt(76), { kind: "confidence", level: 3 }, NOW);
    expect(next.strength).toBe(84);
    expect(next.intervalDays).toBe(14.7);
  });
});

describe("updateMemory bookkeeping", () => {
  it("increments the review counter", () => {
    const next = updateMemory(memoryAt(40, { reviews: 7 }), { kind: "card", rating: "easy" }, NOW);
    expect(next.reviews).toBe(8);
  });

  it("does not mutate the previous memory", () => {
    const prev = memoryAt(40);
    const snapshot = JSON.stringify(prev);
    updateMemory(prev, { kind: "quiz", scorePct: 90 }, NOW);
    expect(JSON.stringify(prev)).toBe(snapshot);
  });

  it("records the most recent signal", () => {
    const signal: Signal = { kind: "card", rating: "hard" };
    expect(updateMemory(memoryAt(40), signal, NOW).lastSignal).toEqual(signal);
  });

  it("returns an invalid-date guard", () => {
    expect(() => updateMemory(memoryAt(40), { kind: "quiz", scorePct: 80 }, new Date("bad"))).toThrow(
      TypeError,
    );
  });
});

describe("bucket", () => {
  it("puts a brand new topic in the due list", () => {
    expect(bucket(createMemory("t", NOW), NOW)).toBe("due_today");
  });

  it("flags weak topics as needing revision even when not due", () => {
    const memory = memoryAt(30, { nextReviewAt: addDays(NOW, 5).toISOString() });
    expect(bucket(memory, NOW)).toBe("needs_revision");
  });

  it("marks strong, long-interval topics as mastered", () => {
    const memory = memoryAt(80, {
      intervalDays: 7,
      nextReviewAt: addDays(NOW, 3).toISOString(),
    });
    expect(bucket(memory, NOW)).toBe("mastered");
  });

  it("returns ok for mid-strength topics that are not due", () => {
    const memory = memoryAt(65, { nextReviewAt: addDays(NOW, 2).toISOString() });
    expect(bucket(memory, NOW)).toBe("ok");
  });

  it("moves overdue topics to due_today", () => {
    const memory = memoryAt(85, { nextReviewAt: new Date(NOW.getTime() - DAY).toISOString() });
    expect(bucket(memory, NOW)).toBe("due_today");
  });

  it("treats a topic due right now as due", () => {
    const memory = memoryAt(70, { nextReviewAt: NOW.toISOString() });
    expect(bucket(memory, NOW)).toBe("due_today");
  });

  it("treats an unparseable review date as due", () => {
    const memory = memoryAt(70, { nextReviewAt: "not-a-date" });
    expect(bucket(memory, NOW)).toBe("due_today");
  });

  it("keeps 50 percent in the ok bucket when not due", () => {
    const memory = memoryAt(50, { nextReviewAt: addDays(NOW, 2).toISOString() });
    expect(bucket(memory, NOW)).toBe("ok");
  });
});

describe("reasonFor", () => {
  it("names the most recent quiz signal and score", () => {
    const memory = memoryAt(60, {
      lastStudiedAt: new Date(NOW.getTime() - 3 * DAY).toISOString(),
      lastSignal: { kind: "quiz", scorePct: 58 },
    });
    expect(reasonFor(memory, NOW)).toBe(
      "You scored 58% on a quiz 3 days ago — a signal to revise.",
    );
  });

  it("celebrates strong quiz results", () => {
    const memory = memoryAt(80, {
      lastStudiedAt: NOW.toISOString(),
      lastSignal: { kind: "quiz", scorePct: 92 },
    });
    expect(reasonFor(memory, NOW)).toBe("You scored 92% on a quiz today — a strong result.");
  });

  it("describes easy card ratings", () => {
    const memory = memoryAt(60, {
      lastStudiedAt: new Date(NOW.getTime() - DAY).toISOString(),
      lastSignal: { kind: "card", rating: "easy" },
    });
    expect(reasonFor(memory, NOW)).toBe("You rated a flashcard Easy yesterday.");
  });

  it("describes needs-revision ratings", () => {
    const memory = memoryAt(40, {
      lastStudiedAt: new Date(NOW.getTime() - 2 * DAY).toISOString(),
      lastSignal: { kind: "card", rating: "needs_revision" },
    });
    expect(reasonFor(memory, NOW)).toBe(
      "You marked a flashcard as needing revision 2 days ago.",
    );
  });

  it("describes confidence check-ins", () => {
    const memory = memoryAt(60, {
      lastStudiedAt: NOW.toISOString(),
      lastSignal: { kind: "confidence", level: 3 },
    });
    expect(reasonFor(memory, NOW)).toBe("You checked in feeling confident today.");
  });

  it("describes unsure check-ins", () => {
    const memory = memoryAt(60, {
      lastStudiedAt: NOW.toISOString(),
      lastSignal: { kind: "confidence", level: 1 },
    });
    expect(reasonFor(memory, NOW)).toBe("You checked in feeling unsure today.");
  });

  it("has a dedicated message before the first review", () => {
    expect(reasonFor(createMemory("t", NOW), NOW)).toContain("New topic");
  });

  it("updates the stored reason after a new signal", () => {
    const next = updateMemory(memoryAt(40), { kind: "quiz", scorePct: 75 }, NOW);
    expect(next.reason).toBe("You scored 75% on a quiz today — solid progress.");
  });
});

describe("timeAgo and daysUntilReview", () => {
  it("says today for the same moment", () => {
    expect(timeAgo(NOW.toISOString(), NOW)).toBe("today");
  });

  it("says yesterday for one day back", () => {
    expect(timeAgo(new Date(NOW.getTime() - DAY).toISOString(), NOW)).toBe("yesterday");
  });

  it("counts days for older events", () => {
    expect(timeAgo(new Date(NOW.getTime() - 5 * DAY).toISOString(), NOW)).toBe("5 days ago");
  });

  it("handles invalid timestamps", () => {
    expect(timeAgo("nope", NOW)).toBe("recently");
  });

  it("counts whole days until the next review", () => {
    const memory = memoryAt(60, { nextReviewAt: addDays(NOW, 2).toISOString() });
    expect(daysUntilReview(memory, NOW)).toBe(2);
  });

  it("returns a negative number for overdue topics", () => {
    const memory = memoryAt(40, { nextReviewAt: new Date(NOW.getTime() - 2 * DAY).toISOString() });
    expect(daysUntilReview(memory, NOW)).toBe(-2);
  });
});
