import { describe, expect, it } from "vitest";
import { createSeed } from "../data/seed";
import { completeQuest } from "./game";
import { taskCoins } from "./economy";
import { parseState } from "./storage";
import type { GameState } from "../types/game";
function addWork(s: GameState, id: string, minutes: number, actualMinutes = 0) {
  return {
    ...s,
    quests: [
      ...s.quests,
      {
        ...s.quests[0],
        id,
        type: "side" as const,
        status: "available" as const,
        estimatedMinutes: minutes,
        actualMinutes,
      },
    ],
  };
}
describe("6 小时劳动对应 240 币", () => {
  it("上调收益后保留旧倍率的零头，不重算旧收入", () => {
    const s = createSeed();
    s.collection.coins = 301;
    s.completions.push({
      ...s.completions[0],
      id: "old-rate",
      questId: "old-rate",
      rewardMinutes: 2,
      coins: 1,
    });
    const next = completeQuest(
      addWork(parseState(s), "new-rate", 1),
      "new-rate",
    ).state;
    // 2 * 200 / 360 + 1 * 240 / 360 = 1.777...; no second whole coin yet.
    expect(next.collection.coins).toBe(301);
    expect(next.completions.at(-1)!.rewardCoinsPerDay).toBe(240);
    const loaded = parseState(JSON.parse(JSON.stringify(next)));
    expect(
      completeQuest(addWork(loaded, "new-again", 1), "new-again").state
        .collection.coins,
    ).toBe(302);
  });
  it("完整一天恰好 240 币，不受旧 XP 或难度影响", () => {
    const initial = addWork(createSeed(), "day", 360);
    initial.quests.at(-1)!.xpReward = 9999;
    const result = completeQuest(initial, "day");
    expect(result.coins).toBe(240);
    expect(result.state.collection.coins).toBe(540);
    expect(completeQuest(result.state, "day").coins).toBe(0);
  });
  it("拆成 72 个五分钟任务仍是 240 币，余数在重载后累计", () => {
    let s = createSeed();
    for (let i = 0; i < 72; i++) {
      s = completeQuest(addWork(s, `work-${i}`, 5), `work-${i}`).state;
      if (i === 20) s = parseState(JSON.parse(JSON.stringify(s)));
    }
    expect(s.collection.coins).toBe(540);
    expect(
      s.completions
        .filter((c) => c.rewardMinutes !== undefined)
        .reduce((sum, c) => sum + c.coins!, 0),
    ).toBe(240);
  });
  it("有已记录时长时按实际劳动结算，未计时按预计时长确认", () => {
    let s = addWork(createSeed(), "actual", 60, 180);
    expect(taskCoins(s, s.quests.at(-1)!)).toBe(120);
    s = completeQuest(s, "actual").state;
    s = completeQuest(addWork(s, "estimate", 180), "estimate").state;
    expect(s.collection.coins).toBe(540);
    expect(s.completions.at(-2)!.rewardMinutes).toBe(180);
  });
  it("跨日不丢零头；旧存档历史不重发币", () => {
    const now = new Date("2026-10-01T12:00:00+08:00");
    let s = completeQuest(addWork(createSeed(), "one", 1), "one", now).state;
    expect(s.collection.coins).toBe(300);
    s = parseState(JSON.parse(JSON.stringify(s)));
    const next = new Date(now.getTime() + 86400000);
    s = completeQuest(addWork(s, "two", 1), "two", next).state;
    expect(s.collection.coins).toBe(301);
    expect(s.completions.at(-1)!.coins).toBe(1);
  });
});
