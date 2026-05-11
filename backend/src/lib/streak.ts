// Liczy aktualną serię (streak) — ile kolejnych dni z rzędu nawyk był wykonany.
//
// Zasady:
// - Liczymy od dziś wstecz.
// - Jeśli dziś nie ma jeszcze check-inu, zaczynamy od wczoraj
//   (nie karzemy użytkownika za to, że dzień się jeszcze nie skończył).
// - Pierwsza luka kończy serię.

function toIsoDay(date: Date): string {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

export function calculateStreak(checkinDates: Date[]): number {
  if (checkinDates.length === 0) return 0;

  const days = new Set(checkinDates.map(toIsoDay));

  const cursor = new Date();
  cursor.setUTCHours(0, 0, 0, 0);

  // Jeśli dziś jeszcze nieodhaczone, zaczynamy od wczoraj.
  if (!days.has(toIsoDay(cursor))) {
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  let streak = 0;
  while (days.has(toIsoDay(cursor))) {
    streak++;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}
