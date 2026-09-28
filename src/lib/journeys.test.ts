import { describe, it, expect } from "vitest";
import { createSeed } from "../data/seed";
import { createJourney, completeQuest, awardJourneyCards } from "./game";
import { parseState } from "./storage";
const input = { title: "发布网站", description: "一个可访问的作品网站", skillId: "engineering", stages: ["完成页面", "发布作品"], minutes: 30 };
describe("主线旅程", () => {
  it("只能按顺序完成，终点生成成果卡且不重复发奖", () => {
    let state = createJourney(createSeed(), input);
    const chain = state.chains.at(-1)!;
    const [first, last] = chain.stageIds!;
    expect(completeQuest(state, last).xp).toBe(0);
    expect(state.chains.at(-1)!.card).toBeUndefined();
    state = completeQuest(state, first).state;
    expect(state.quests.find((q) => q.id === last)!.status).toBe("available");
    state = { ...state, quests: state.quests.map((q) => q.id === first ? { ...q, actualMinutes: 12 } : q) };
    state = completeQuest(state, last).state;
    expect(state.chains.at(-1)!.card).toMatchObject({ title: input.title, result: input.description, stages: 2, minutes: 12 });
    expect(state.chains.at(-1)!.progress).toBe(100);
    const saved = state.chains.at(-1)!.card;
    expect(completeQuest(state, last).xp).toBe(0);
    expect(awardJourneyCards(state).chains.at(-1)!.card).toBe(saved);
    expect(saved!.xp).toBe(state.completions.filter((c) => chain.stageIds!.includes(c.questId)).reduce((s, c) => s + c.xp, 0));
  });
  it("旧存档保持兼容，新成果卡导入后保持完整", () => {
    expect(parseState(createSeed()).chains[0].journey).toBeUndefined();
    let state = createJourney(createSeed(), input);
    for (const id of state.chains.at(-1)!.stageIds!) state = completeQuest(state, id).state;
    const loaded = parseState(JSON.parse(JSON.stringify(state)));
    expect(loaded.chains.at(-1)).toEqual(state.chains.at(-1));
  });
  it("缺失或跳过阶段不能换取成果卡", () => {
    let state = createJourney(createSeed(), input);
    const ids = state.chains.at(-1)!.stageIds!;
    state = { ...state, quests: state.quests.filter((q) => q.id !== ids[0]).map((q) => q.id === ids[1] ? { ...q, status: "completed" as const } : q) };
    expect(awardJourneyCards(state).chains.at(-1)!.card).toBeUndefined();
  });
  it("拒绝过短旅程、空白阶段和不存在的技能", () => {
    expect(() => createJourney(createSeed(), { ...input, stages: ["一步"] })).toThrow();
    expect(() => createJourney(createSeed(), { ...input, stages: ["一步", " "] })).toThrow();
    expect(() => createJourney(createSeed(), { ...input, skillId: "missing" })).toThrow();
  });
});
