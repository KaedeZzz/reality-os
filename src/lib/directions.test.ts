import { describe, expect, it } from "vitest";
import { createSeed } from "../data/seed";
import { collapseDirections } from "./directions";
import { parseState } from "./storage";

describe("只保留顶层行动方向", () => {
  it("旧存档中的子类行动归入大类，不丢失任务、时间、货币和兑换", () => {
    const original = createSeed();
    const research = original.skills.find((skill) => skill.id === "research")!;
    original.skills.push(
      { ...research, id: "image", name: "图像分析", parentSkillId: "research" },
      { ...research, id: "image-detail", name: "图像细节", parentSkillId: "image" },
    );
    original.quests[0].skillId = "image-detail";
    original.completions[0].skillId = "image";
    original.chains[0].skillId = "image-detail";
    const next = parseState(JSON.parse(JSON.stringify(original)));
    expect(next.skills).toHaveLength(6);
    expect(next.skills.every((skill) => skill.parentSkillId === null)).toBe(true);
    expect(next.quests[0]).toEqual({ ...original.quests[0], skillId: "research" });
    expect(next.completions[0]).toEqual({ ...original.completions[0], skillId: "research" });
    expect(next.chains[0].skillId).toBe("research");
    expect(next.quests).toHaveLength(original.quests.length);
    for (const key of ["collection", "redemptions", "sessions", "timer"] as const) {
      expect(next[key]).toEqual(original[key]);
    }
    expect(collapseDirections(next)).toBe(next);
    expect(original.skills).toHaveLength(8);
  });

  it("保留自定义的大类，拒绝损坏的父级引用", () => {
    const state = createSeed();
    state.skills.push({ ...state.skills[0], id: "photography", name: "摄影", parentSkillId: null });
    expect(parseState(state).skills.map((skill) => skill.id)).toContain("photography");
    state.skills.push({ ...state.skills[0], id: "broken", parentSkillId: "missing" });
    expect(() => parseState(state)).toThrow("父技能不存在");
  });
});
