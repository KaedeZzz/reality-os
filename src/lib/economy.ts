import type { GameState, Quest } from "../types/game";

export const WORKDAY_MINUTES = 360;
export const WORKDAY_COINS = 240;
export const WORKDAY_RULE = `${WORKDAY_MINUTES / 60} 小时有效劳动 = ${WORKDAY_COINS} 币`;
const LEGACY_WORKDAY_COINS = 200;
export const coinsForMinutes = (minutes: number) =>
  Math.floor((Math.max(0, minutes) * WORKDAY_COINS) / WORKDAY_MINUTES + 1e-8);

export function rewardMinutes(
  quest: Pick<Quest, "actualMinutes" | "estimatedMinutes">,
) {
  return quest.actualMinutes > 0 ? quest.actualMinutes : quest.estimatedMinutes;
}

// Only new settlements participate. Fractions carry across tasks and days;
// splitting a task cannot mint extra coins, and old history is never paid again.
export function taskCoins(
  state: GameState,
  quest: Pick<Quest, "actualMinutes" | "estimatedMinutes">,
) {
  const priorCredits = state.completions.reduce(
    (sum, c) =>
      sum +
      (c.rewardMinutes ?? 0) * (c.rewardCoinsPerDay ?? LEGACY_WORKDAY_COINS),
    0,
  );
  // Snapshot each settlement's rate so a later raise preserves earned fractions
  // without repricing or paying historical work a second time.
  const floorCoins = (credits: number) =>
    Math.floor(credits / WORKDAY_MINUTES + 1e-8);
  return (
    floorCoins(priorCredits + rewardMinutes(quest) * WORKDAY_COINS) -
    floorCoins(priorCredits)
  );
}
