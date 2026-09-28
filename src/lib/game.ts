import { creditTask } from "./collection";
import { taskCoins, rewardMinutes, WORKDAY_COINS } from "./economy";
import { z } from "zod";
import type { Difficulty, GameState, Quest, Skill } from "../types/game";

export const difficultyLabels = {
  trivial: "轻量",
  easy: "简单",
  normal: "普通",
  hard: "困难",
  boss: "首领",
};
export const typeLabels = {
  main: "主线",
  side: "支线",
  daily: "每日",
  weekly: "每周",
  boss: "首领",
  habit: "习惯",
};
export const statusLabels = {
  backlog: "待解锁",
  available: "可开始",
  active: "进行中",
  completed: "已完成",
  failed: "未完成",
  skipped: "已跳过",
};
export const dateKey = (date = new Date()) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
export const xpRequiredForLevel = (level: number) =>
  Math.round(100 * Math.max(1, level) ** 1.5);
export function levelProgress(totalXp: number) {
  let level = 1,
    remaining = Math.max(0, totalXp),
    base = 0;
  while (remaining >= xpRequiredForLevel(level)) {
    const needed = xpRequiredForLevel(level);
    remaining -= needed;
    base += needed;
    level++;
  }
  const required = xpRequiredForLevel(level);
  return {
    level,
    current: remaining,
    required,
    base,
    percent: (remaining / required) * 100,
  };
}
export const calculateLevel = (xp: number) => levelProgress(xp).level;
export const suggestXp = (difficulty: Difficulty, minutes: number) =>
  Math.round(
    { trivial: 15, easy: 40, normal: 100, hard: 220, boss: 500 }[difficulty] *
      Math.min(1.5, Math.max(0.5, minutes / 45)),
  );
export const trivialMultiplier = (priorCount: number) =>
  priorCount < 5 ? 1 : priorCount < 10 ? 0.5 : 0.2;
export const dailyScore = (completed: number, planned: number) =>
  planned > 0 ? Math.round(Math.min(1, completed / planned) * 100) : 0;
export const rewardCap = (minutes: number) => Math.max(5, minutes * 8);
export const questReward = (
  quest: Pick<Quest, "difficulty" | "xpReward" | "estimatedMinutes">,
  priorCount: number,
) =>
  Math.round(
    Math.min(quest.xpReward, rewardCap(quest.estimatedMinutes)) *
      (quest.difficulty === "trivial" || quest.estimatedMinutes <= 5
        ? trivialMultiplier(priorCount)
        : 1),
  );
export function addSkillXp(skill: Skill, amount: number): Skill {
  const xp = skill.xp + amount,
    progress = levelProgress(xp);
  return {
    ...skill,
    xp,
    level: progress.level,
    xpToNextLevel: progress.required - progress.current,
  };
}
export const isQuestUnlocked = (quest: Quest, quests: Quest[]) =>
  !quest.parentQuestId ||
  quests.some((q) => q.id === quest.parentQuestId && q.status === "completed");
export function refreshUnlocks(state: GameState): GameState {
  return {
    ...state,
    quests: state.quests.map((q) =>
      q.status === "backlog" &&
      q.parentQuestId &&
      isQuestUnlocked(q, state.quests)
        ? { ...q, status: "available" }
        : q,
    ),
    skills: state.skills.map((s) => ({
      ...s,
      unlocked: true,
    })),
    chains: state.chains.map((c) => {
      const quests = state.quests.filter((q) => q.questChainId === c.id);
      return {
        ...c,
        progress: dailyScore(
          quests.filter((q) => q.status === "completed").length,
          quests.length,
        ),
      };
    }),
  };
}
export function ensureDay(state: GameState, now = new Date()): GameState {
  const today = dateKey(now);
  if (state.runs.some((r) => r.date === today)) return state;
  // Recurrence creates a new occurrence; old completions remain immutable history.
  const recurring = state.quests.filter(
    (q) =>
      ["daily", "habit", "weekly"].includes(q.type) &&
      ["completed", "skipped", "failed"].includes(q.status) &&
      !state.quests.some(
        (other) =>
          other.id !== q.id &&
          other.title === q.title &&
          other.skillId === q.skillId &&
          ["available", "active"].includes(other.status),
      ),
  );
  const added: Quest[] = [];
  for (const q of recurring) {
    if (added.some((a) => a.title === q.title && a.skillId === q.skillId))
      continue;
    const last = state.quests
      .filter((a) => a.title === q.title && a.skillId === q.skillId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
    const elapsed =
      (now.getTime() - new Date(last.completedAt ?? last.createdAt).getTime()) /
      86400000;
    if (
      dateKey(new Date(last.completedAt ?? last.createdAt)) === today ||
      (q.type === "weekly" && elapsed < 7)
    )
      continue;
    added.push({
      ...q,
      id: crypto.randomUUID(),
      status: "available",
      createdAt: now.toISOString(),
      completedAt: undefined,
      actualMinutes: 0,
      parentQuestId: undefined,
    });
  }
  const quests = [...state.quests, ...added];
  const candidates = quests
    .filter(
      (q) =>
        ["available", "active"].includes(q.status) &&
        isQuestUnlocked(q, quests) &&
        state.skills.find((s) => s.id === q.skillId)?.unlocked,
    )
    .sort((a, b) => Number(b.type === "daily") - Number(a.type === "daily"));
  return {
    ...state,
    quests,
    runs: [
      ...state.runs,
      {
        date: today,
        energy: 78,
        focus: 65,
        dailyQuestIds: candidates.slice(0, 3).map((q) => q.id),
        completedQuestCount: 0,
        earnedXp: 0,
        notes: "",
        score: 0,
      },
    ],
  };
}
export function completeQuest(
  input: GameState,
  questId: string,
  now = new Date(),
): { state: GameState; xp: number; coins: number } {
  const state = ensureDay(input, now),
    quest = state.quests.find((q) => q.id === questId);
  if (
    !quest ||
    !["available", "active"].includes(quest.status) ||
    !isQuestUnlocked(quest, state.quests) ||
    !state.skills.find((s) => s.id === quest.skillId)?.unlocked ||
    state.completions.some((c) => c.questId === questId)
  )
    return { state, xp: 0, coins: 0 };
  const today = dateKey(now);
  const coins = taskCoins(state, quest);
  const quests = state.quests.map((q) =>
    q.id === questId
      ? { ...q, status: "completed" as const, completedAt: now.toISOString() }
      : q,
  );
  const next: GameState = {
    ...state,
    profile: state.profile,
    quests,
    skills: state.skills,
    completions: [
      ...state.completions,
      {
        id: crypto.randomUUID(),
        questId,
        title: quest.title,
        skillId: quest.skillId,
        difficulty: quest.difficulty,
        estimatedMinutes: quest.estimatedMinutes,
        actualMinutes: quest.actualMinutes,
        xp: 0,
        coins,
        rewardMinutes: rewardMinutes(quest),
        rewardCoinsPerDay: WORKDAY_COINS,
        at: now.toISOString(),
      },
    ],
    runs: state.runs.map((r) => {
      if (r.date !== today) return r;
      const completed = r.dailyQuestIds.filter(
        (id) => quests.find((q) => q.id === id)?.status === "completed",
      ).length;
      return {
        ...r,
        earnedXp: r.earnedXp,
        completedQuestCount: completed,
        score: dailyScore(completed, r.dailyQuestIds.length),
      };
    }),
    season: state.season,
    achievements: state.achievements.map((a) =>
      !a.unlockedAt &&
      (a.condition === "first" ||
        (a.condition === "ten" && state.completions.length + 1 >= 10) ||
        (a.condition === "boss" && quest.type === "boss"))
        ? { ...a, unlockedAt: now.toISOString() }
        : a,
    ),
  };
  return { state: awardJourneyCards(creditTask(refreshUnlocks(next), questId, quest.title, coins, now), now), xp: 0, coins };
}
export function difficultySuggestion(state: GameState) {
  for (const skill of state.skills) {
    const recent = state.quests
      .filter(
        (q) =>
          q.skillId === skill.id &&
          ["completed", "skipped", "failed"].includes(q.status),
      )
      .sort((a, b) =>
        (b.completedAt ?? b.createdAt).localeCompare(
          a.completedAt ?? a.createdAt,
        ),
      )
      .slice(0, 10);
    const completed = recent.filter((q) => q.status === "completed");
    if (recent.length >= 5 && completed.length / recent.length >= 0.8) {
      const average = Math.round(
        completed.reduce(
          (sum, q) => sum + Math.max(q.estimatedMinutes, q.actualMinutes),
          0,
        ) / completed.length,
      );
      const key = `${skill.id}-${recent.map((q) => q.id).join(",")}`;
      if (!state.dismissedSuggestions.includes(key))
        return {
          key,
          skill,
          total: recent.length,
          completed: completed.length,
          minutes: Math.min(90, average + 10),
        };
    }
  }
  return null;
}
export const questSchema = z.object({
  title: z.string().trim().min(1, "请输入任务名称").max(120),
  description: z.string().max(2000),
  type: z.enum(["main", "side", "daily", "weekly", "boss", "habit"]),
  difficulty: z.enum(["trivial", "easy", "normal", "hard", "boss"]),
  skillId: z.string().min(1),
  estimatedMinutes: z.coerce.number().int().min(1).max(480),
  xpReward: z.coerce.number().int().min(1).max(5000),
  dueDate: z.string().optional(),
  parentQuestId: z.string().optional(),
  questChainId: z.string().optional(),
});

export const journeySchema = z.object({
  title: z.string().trim().min(1, "请填写目标").max(100),
  description: z.string().trim().min(1, "请描述完成时的成果").max(500),
  skillId: z.string().min(1),
  stages: z.array(z.string().trim().min(1).max(120)).min(2, "至少需要两个阶段").max(8, "最多八个阶段"),
  minutes: z.number().int().min(1).max(480),
});
export function createJourney(state: GameState, input: z.input<typeof journeySchema>, now = new Date()): GameState {
  const data = journeySchema.parse(input);
  if (!state.skills.some((s) => s.id === data.skillId && s.unlocked)) throw new Error("请选择已解锁的技能");
  const id = crypto.randomUUID();
  const stageIds = data.stages.map(() => crypto.randomUUID());
  const quests: Quest[] = data.stages.map((title, index) => ({
    id: stageIds[index], title, description: data.description,
    skillId: data.skillId, questChainId: id,
    parentQuestId: index ? stageIds[index - 1] : undefined,
    type: index === data.stages.length - 1 ? "boss" : "main",
    difficulty: index === data.stages.length - 1 ? "hard" : "normal",
    xpReward: suggestXp(index === data.stages.length - 1 ? "hard" : "normal", data.minutes),
    estimatedMinutes: data.minutes, actualMinutes: 0,
    status: index ? "backlog" : "available", createdAt: now.toISOString(),
  }));
  return { ...state, quests: [...state.quests, ...quests], chains: [...state.chains, {
    id, title: data.title, description: data.description, skillId: data.skillId,
    progress: 0, journey: true, createdAt: now.toISOString(), stageIds,
  }] };
}
export function awardJourneyCards(state: GameState, now = new Date()): GameState {
  return { ...state, chains: state.chains.map((chain) => {
    if (!chain.journey || chain.card || !chain.stageIds?.length) return chain;
    const stages = chain.stageIds.map((id) => state.quests.find((q) => q.id === id));
    if (!stages.every((q) => q?.status === "completed")) return chain;
    return { ...chain, card: {
      title: chain.title, result: chain.description, earnedAt: now.toISOString(),
      skillName: state.skills.find((s) => s.id === chain.skillId)?.name ?? "个人成长",
      stages: stages.length,
      minutes: stages.reduce((sum, q) => sum + (q?.actualMinutes ?? 0), 0),
      coins: state.completions.filter((c) => chain.stageIds!.includes(c.questId)).reduce((sum, c) => sum + (c.coins ?? 0), 0),
      xp: state.completions.filter((c) => chain.stageIds!.includes(c.questId)).reduce((sum, c) => sum + c.xp, 0),
    } };
  }) };
}
