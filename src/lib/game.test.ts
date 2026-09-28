import { describe, expect, it } from "vitest";
import { createSeed } from "../data/seed";
import {
  addSkillXp,
  calculateLevel,
  completeQuest,
  dailyScore,
  difficultySuggestion,
  dateKey,
  ensureDay,
  isQuestUnlocked,
  levelProgress,
  questReward,
  suggestXp,
  trivialMultiplier,
  xpRequiredForLevel,
} from "./game";
import { parseState } from "./storage";
describe("旧存档经验曲线兼容", () => {
  it("每一级使用递增的经验需求", () => {
    expect(xpRequiredForLevel(1)).toBe(100);
    expect(xpRequiredForLevel(2)).toBe(283);
    expect(xpRequiredForLevel(10)).toBe(3162);
  });
  it("累计 XP 在准确边界升级，并保留余量", () => {
    expect(calculateLevel(0)).toBe(1);
    expect(calculateLevel(99)).toBe(1);
    expect(calculateLevel(100)).toBe(2);
    expect(calculateLevel(382)).toBe(2);
    expect(calculateLevel(383)).toBe(3);
    expect(levelProgress(400).current).toBe(17);
  });
  it("处理负数与多级跃迁", () => {
    expect(calculateLevel(-1)).toBe(1);
    const sum = Array.from({ length: 20 }, (_, i) =>
      xpRequiredForLevel(i + 1),
    ).reduce((a, b) => a + b, 0);
    expect(calculateLevel(sum)).toBe(21);
  });
});
describe("旧定价兼容与任务结算", () => {
  it("根据难度和时间建议奖励", () => {
    expect(suggestXp("hard", 45)).toBe(220);
    expect(suggestXp("easy", 45)).toBe(40);
    expect(suggestXp("boss", 90)).toBe(750);
  });
  it("前五个全额，之后五个半额，再之后两成", () => {
    expect(trivialMultiplier(4)).toBe(1);
    expect(trivialMultiplier(5)).toBe(0.5);
    expect(trivialMultiplier(9)).toBe(0.5);
    expect(trivialMultiplier(10)).toBe(0.2);
  });
  it("两分钟的高奖励任务受上限约束，也执行轻量递减", () => {
    expect(
      questReward(
        { difficulty: "boss", estimatedMinutes: 2, xpReward: 500 },
        0,
      ),
    ).toBe(16);
    expect(
      questReward(
        { difficulty: "boss", estimatedMinutes: 2, xpReward: 500 },
        10,
      ),
    ).toBe(3);
  });
  it("同一任务不能重复领取游戏币", () => {
    const initial = createSeed();
    const first = completeQuest(initial, "q1");
    const second = completeQuest(first.state, "q1");
    expect(first.coins).toBe(30);
    expect(first.xp).toBe(0);
    expect(second.xp).toBe(0);
    expect(second.state.profile.totalXp).toBe(initial.profile.totalXp);
    expect(second.state.completions.length).toBe(
      initial.completions.length + 1,
    );
  });
  it("只发游戏币和更新完成记录，不再增加 XP", () => {
    const s = createSeed(),
      result = completeQuest(s, "q1");
    expect(result.state.skills.find((a) => a.id === "research")!.xp).toBe(
      s.skills.find((a) => a.id === "research")!.xp,
    );
    expect(result.state.season.seasonXp).toBe(s.season.seasonXp);
    expect(result.state.runs.find((r) => r.date === dateKey())!.earnedXp).toBe(
      0,
    );
    expect(result.state.runs.find((r) => r.date === dateKey())!.score).toBe(33);
  });
});
describe("任务链与技能成长", () => {
  it("前置完成后解锁下一步，禁止越过依赖", () => {
    const s = createSeed();
    expect(
      isQuestUnlocked(
        s.quests.find((q) => q.id === "chain-3")!,
        s.quests,
      ),
    ).toBe(false);
    expect(completeQuest(s, "chain-3").xp).toBe(0);
    const result = completeQuest(s, "chain-2");
    expect(result.state.quests.find((q) => q.id === "chain-3")!.status).toBe(
      "available",
    );
  });
  it("技能 XP 使用与角色相同的曲线", () => {
    const skill = { ...createSeed().skills[0], xp: 90 };
    const result = addSkillXp(skill, 30);
    expect(result.xp).toBe(120);
    expect(result.level).toBe(2);
    expect(result.xpToNextLevel).toBe(263);
  });
  it("行动方向不再受等级限制", () => {
    const s = createSeed();
    s.skills.find((a) => a.id === "engineering")!.xp = 0;
    s.skills.find((a) => a.id === "engineering")!.level = 1;
    s.skills.find((a) => a.id === "python")!.unlocked = false;
    s.quests[0] = { ...s.quests[0], skillId: "engineering", xpReward: 100 };
    const result = completeQuest(s, "q1");
    expect(result.state.skills.find((a) => a.id === "python")!.unlocked).toBe(
      true,
    );
  });
});
describe("每日循环", () => {
  it("赛季结束后仍可赚币，旧经验保持不变", () => {
    const s = createSeed();
    s.season.endDate = "2000-01-01";
    const result = completeQuest(s, "q1");
    expect(result.coins).toBe(30);
    expect(result.xp).toBe(0);
    expect(result.state.season.seasonXp).toBe(s.season.seasonXp);
  });
  it("难度建议按日期读取最新任务，而不是数组插入位置", () => {
    const s = createSeed();
    s.quests = Array.from({ length: 10 }, (_, i) => ({
      ...s.quests[0],
      id: `suggestion-${i}`,
      status: i < 5 ? ("skipped" as const) : ("completed" as const),
      createdAt: `2026-09-${String(28 - i).padStart(2, "0")}T10:00:00.000Z`,
      completedAt: undefined,
    }));
    expect(difficultySuggestion(s)).toBe(null);
  });
  it("按主任务比例计算，不超 100%", () => {
    expect(dailyScore(2, 3)).toBe(67);
    expect(dailyScore(0, 0)).toBe(0);
    expect(dailyScore(4, 3)).toBe(100);
  });
  it("跨日生成最多三个主任务，不扣 XP，历史保留", () => {
    const s = completeQuest(createSeed(), "q1").state;
    const next = new Date();
    next.setDate(next.getDate() + 1);
    const rolled = ensureDay(s, next);
    expect(rolled.runs.at(-1)!.dailyQuestIds.length).toBeLessThanOrEqual(3);
    expect(rolled.profile.totalXp).toBe(s.profile.totalXp);
    expect(
      rolled.quests.some(
        (q) =>
          q.id !== "q1" &&
          q.title === s.quests[0].title &&
          q.status === "available",
      ),
    ).toBe(true);
    expect(ensureDay(rolled, next).quests.length).toBe(rolled.quests.length);
  });
});
describe("存档校验", () => {
  it("接受正在运行的专注计时毫秒时间戳，刷新后保留", () => {
    const s = createSeed();
    s.timer = {
      questId: "q1",
      durationSeconds: 1500,
      remainingSeconds: 1500,
      startedAt: Date.now(),
    };
    expect(parseState(JSON.parse(JSON.stringify(s))).timer).toEqual(s.timer);
  });
  it("接受完整版本的存档", () => {
    expect(parseState(JSON.parse(JSON.stringify(createSeed()))).version).toBe(
      1,
    );
  });
  it("拒绝损坏或未来格式", () => {
    expect(() => parseState({ version: 999 })).toThrow();
  });
  it("拒绝循环依赖，防止导入后无限循环", () => {
    const s = createSeed();
    s.quests[0].parentQuestId = s.quests[1].id;
    s.quests[1].parentQuestId = s.quests[0].id;
    expect(() => parseState(s)).toThrow("循环");
  });
});


