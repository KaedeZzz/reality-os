import type { GameState } from "../types/game";

// Called after save validation. Preserve actions when removing legacy subcategories.
export function collapseDirections(state: GameState): GameState {
  if (state.skills.every((skill) => !skill.parentSkillId)) return state;
  const byId = new Map(state.skills.map((skill) => [skill.id, skill]));
  const roots = new Map(state.skills.map((skill) => {
    let root = skill;
    const visited = new Set([root.id]);
    while (root.parentSkillId) {
      const parent = byId.get(root.parentSkillId);
      if (!parent || visited.has(parent.id)) throw new Error("行动方向的父级无效");
      visited.add(parent.id);
      root = parent;
    }
    return [skill.id, root.id];
  }));
  const directionId = (id: string) => roots.get(id) ?? id;
  return {
    ...state,
    skills: state.skills.filter((skill) => !skill.parentSkillId),
    quests: state.quests.map((quest) => ({ ...quest, skillId: directionId(quest.skillId) })),
    chains: state.chains.map((chain) => ({ ...chain, skillId: directionId(chain.skillId) })),
    completions: state.completions.map((completion) => ({ ...completion, skillId: directionId(completion.skillId) })),
  };
}
