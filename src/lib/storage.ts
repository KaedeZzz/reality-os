import { createCollection, migrateCurrency } from "./collection";
import { findCard } from "../data/cards";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { GameState } from "../types/game";
import { createSeed } from "../data/seed";
import {
  calculateLevel,
  ensureDay,
  levelProgress,
  refreshUnlocks,
} from "./game";

const number = z.number().finite().nonnegative().max(100000000);
const questStatus = z.enum([
  "backlog",
  "available",
  "active",
  "completed",
  "failed",
  "skipped",
]);
const difficulty = z.enum(["trivial", "easy", "normal", "hard", "boss"]);
const stateSchema = z.object({
  version: z.literal(1),
  redemptions: z.array(z.object({
    id: z.string(), rewardId: z.string(), title: z.string(), category: z.string(), description: z.string(),
    cost: number.int(), budget: number.optional(), note: z.string().max(300), redeemedAt: z.string(),
    status: z.enum(["pending", "enjoyed", "cancelled"]), finishedAt: z.string().optional(),
  })).default([]),
  collection: z.object({
    currencyVersion: z.literal(2).optional(),
    coins: number.int(), shards: number.int(),
    owned: z.array(z.object({ cardId: z.string(), acquiredAt: z.string() })),
    completedSets: z.array(z.string()).default([]),
    showcase: z.array(z.string()).max(3), wishlist: z.string().nullable(),
    packsSinceLegendary: number.int().max(4),
    transactions: z.array(z.object({ id: z.string(), label: z.string(), coins: z.number().int().min(-100000000).max(100000000), shards: z.number().int().min(-100000000).max(100000000), at: z.string() })),
    pendingPack: z.object({ id: z.string(), guaranteed: z.boolean(), cards: z.array(z.object({ cardId: z.string(), duplicate: z.boolean(), shards: number.int(), refund: number.int().optional() })).length(3) }).nullable(),
  }).default(createCollection),
  demo: z.boolean(),
  profile: z.object({
    id: z.string(),
    displayName: z.string().min(1).max(60),
    totalXp: number,
    level: number,
    createdAt: z.string(),
  }),
  skills: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      description: z.string(),
      icon: z.string(),
      parentSkillId: z.string().nullable(),
      level: number,
      xp: number,
      xpToNextLevel: number,
      category: z.string(),
      unlocked: z.boolean(),
      sortOrder: number,
      prerequisiteLevel: number,
      color: z.string(),
    }),
  ),
  quests: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      description: z.string(),
      type: z.enum(["main", "side", "daily", "weekly", "boss", "habit"]),
      status: questStatus,
      difficulty,
      xpReward: number,
      skillId: z.string(),
      estimatedMinutes: number,
      actualMinutes: number,
      dueDate: z.string().optional(),
      parentQuestId: z.string().optional(),
      questChainId: z.string().optional(),
      createdAt: z.string(),
      completedAt: z.string().optional(),
    }),
  ),
  chains: z.array(
    z.object({
      journey: z.boolean().optional(),
      createdAt: z.string().optional(),
      stageIds: z.array(z.string()).optional(),
      card: z.object({
        coins: number.int().optional(), earnedAt: z.string(), title: z.string(), result: z.string(),
        skillName: z.string(), stages: number, minutes: number, xp: number,
      }).optional(),
      id: z.string(),
      title: z.string(),
      description: z.string(),
      progress: number,
      skillId: z.string(),
    }),
  ),
  runs: z.array(
    z.object({
      date: z.string(),
      energy: number.max(100),
      focus: number.max(100),
      dailyQuestIds: z.array(z.string()),
      completedQuestCount: number,
      earnedXp: number,
      notes: z.string(),
      score: number.max(100),
      endedAt: z.string().optional(),
    }),
  ),
  season: z.object({
    id: z.string(),
    name: z.string(),
    subtitle: z.string(),
    startDate: z.string(),
    endDate: z.string(),
    status: z.enum(["active", "completed"]),
    seasonXp: number,
    level: number,
    objectives: z.array(
      z.object({
        id: z.string(),
        skillId: z.string(),
        targetXp: number.positive(),
        earnedXp: number,
      }),
    ),
  }),
  rewards: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      description: z.string(),
      cost: number,
      type: z.literal("milestone"),
      available: z.boolean(),
      claimedAt: z.string().optional(),
    }),
  ),
  achievements: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      description: z.string(),
      condition: z.string(),
      unlockedAt: z.string().optional(),
      icon: z.string(),
    }),
  ),
  completions: z.array(
    z.object({
      rewardMinutes: number.optional(),
      rewardCoinsPerDay: number.positive().optional(),
      coins: number.int().optional(),
      id: z.string(),
      questId: z.string(),
      title: z.string(),
      skillId: z.string(),
      difficulty,
      estimatedMinutes: number,
      actualMinutes: number,
      xp: number,
      at: z.string(),
    }),
  ),
  sessions: z.array(
    z.object({
      id: z.string(),
      questId: z.string(),
      minutes: number,
      at: z.string(),
    }),
  ),
  timer: z
    .object({
      questId: z.string(),
      durationSeconds: number,
      remainingSeconds: number,
      startedAt: z
        .number()
        .finite()
        .nonnegative()
        .max(8640000000000000)
        .nullable(),
    })
    .nullable(),
  dismissedSuggestions: z.array(z.string()),
});
export function parseState(value: unknown): GameState {
  const parsed = stateSchema.parse(value);
  parsed.collection = migrateCurrency(parsed.collection);
  for (const reward of parsed.rewards.filter((r) => r.claimedAt)) {
    const id = "legacy:" + reward.id;
    if (!parsed.redemptions.some((r) => r.id === id)) parsed.redemptions.push({
      id, rewardId: reward.id, title: reward.title, category: "旧版奖励", description: reward.description,
      cost: Math.max(0, -(parsed.collection.transactions.find((t) => t.id === "reward:" + reward.id)?.coins ?? 0)),
      note: "从旧版已领取奖励保留", redeemedAt: reward.claimedAt!, status: "pending",
    });
  }
  if (new Set(parsed.redemptions.map((r) => r.id)).size !== parsed.redemptions.length) throw new Error("奖励记录 ID 重复");
  const collection = parsed.collection;
  const ownedIds = collection.owned.map((o) => o.cardId);
  if (new Set(ownedIds).size !== ownedIds.length || ownedIds.some((id) => !findCard(id)) ||
      new Set(collection.showcase).size !== collection.showcase.length || collection.showcase.some((id) => !ownedIds.includes(id)) ||
      (collection.wishlist !== null && !findCard(collection.wishlist)) ||
      collection.pendingPack?.cards.some((c) => !ownedIds.includes(c.cardId))) throw new Error("收藏存档中的卡牌信息无效");
  if (
    new Set(parsed.quests.map((q) => q.id)).size !== parsed.quests.length ||
    new Set(parsed.skills.map((s) => s.id)).size !== parsed.skills.length
  )
    throw new Error("存档中有重复 ID");
  for (const q of parsed.quests) {
    if (!parsed.skills.some((s) => s.id === q.skillId))
      throw new Error("存档中的任务技能不存在");
    const visited = new Set([q.id]);
    let p = q.parentQuestId;
    while (p) {
      if (visited.has(p)) throw new Error("任务依赖存在循环");
      visited.add(p);
      const parent = parsed.quests.find((a) => a.id === p);
      if (!parent) throw new Error("任务依赖不存在");
      p = parent.parentQuestId;
    }
  }
  for (const s of parsed.skills) {
    const visited = new Set([s.id]);
    let p = s.parentSkillId;
    while (p) {
      if (visited.has(p)) throw new Error("技能树存在循环");
      visited.add(p);
      const parent = parsed.skills.find((a) => a.id === p);
      if (!parent) throw new Error("父技能不存在");
      p = parent.parentSkillId;
    }
  }
  parsed.profile.level = calculateLevel(parsed.profile.totalXp);
  parsed.season.level = calculateLevel(parsed.season.seasonXp);
  parsed.skills = parsed.skills.map((s) => {
    const p = levelProgress(s.xp);
    return { ...s, level: p.level, xpToNextLevel: p.required - p.current };
  });
  return ensureDay(refreshUnlocks(parsed));
}
export interface GameRepository {
  load(): Promise<GameState>;
  save(state: GameState): Promise<void>;
  mode: "local" | "supabase";
}
export const STORAGE_KEY = "reality-os-v1";
export class LocalRepository implements GameRepository {
  mode = "local" as const;
  async load() {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? parseState(JSON.parse(raw)) : createSeed();
  }
  async save(state: GameState) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }
}
const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
  key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
export const supabase = process.env.NEXT_PUBLIC_DESKTOP !== "1" && url && key ? createClient(url, key) : null;
export class SupabaseRepository implements GameRepository {
  mode = "supabase" as const;
  async userId() {
    const { data, error } = await supabase!.auth.getUser();
    if (error || !data.user) throw new Error("请先登录 Supabase 账号");
    return data.user.id;
  }
  async load() {
    const userId = await this.userId();
    const { data, error } = await supabase!
      .from("player_saves")
      .select("state")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw error;
    const state = data ? parseState(data.state) : createSeed();
    return { ...state, profile: { ...state.profile, id: userId } };
  }
  async save(state: GameState) {
    const userId = await this.userId();
    if (state.profile.id !== userId)
      throw new Error("账号已变更，请重新读取当前账号存档");
    const { error } = await supabase!
      .from("player_saves")
      .upsert({ user_id: userId, state, updated_at: new Date().toISOString() });
    if (error) throw error;
  }
}
export const repository: GameRepository = supabase
  ? new SupabaseRepository()
  : new LocalRepository();

