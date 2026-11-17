export function feedbackForScore(scorePct: number): string {
  if (scorePct >= 90) {
    return "Excellent. Space the next review out and try a harder application question.";
  }
  if (scorePct >= 75) {
    return "Solid. Revisit the missed questions and re-test in three days.";
  }
  if (scorePct >= 50) {
    return "Halfway. Read each explanation, then rebuild the topic from a blank page before retrying.";
  }
  return "Start with the lesson, then retry a shorter quiz so progress is visible quickly.";
}
