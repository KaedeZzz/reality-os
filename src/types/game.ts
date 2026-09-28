import type { RewardRedemption } from "./rewards";
import type { CollectionState } from "./collection";
export type QuestType = "main" | "side" | "daily" | "weekly" | "boss" | "habit";
export type QuestStatus =
  "backlog" | "available" | "active" | "completed" | "failed" | "skipped";
export type Difficulty = "trivial" | "easy" | "normal" | "hard" | "boss";
export interface UserProfile {
  id: string;
  displayName: string;
  level: number;
  totalXp: number;
  createdAt: string;
}
export interface Skill {
  id: string;
  name: string;
  description: string;
  icon: string;
  parentSkillId: string | null;
  level: number;
  xp: number;
  xpToNextLevel: number;
  category: string;
  unlocked: boolean;
  sortOrder: number;
  prerequisiteLevel: number;
  color: string;
}
export interface Quest {
  id: string;
  title: string;
  description: string;
  type: QuestType;
  status: QuestStatus;
  difficulty: Difficulty;
  xpReward: number;
  skillId: string;
  estimatedMinutes: number;
  actualMinutes: number;
  dueDate?: string;
  parentQuestId?: string;
  questChainId?: string;
  createdAt: string;
  completedAt?: string;
}
export interface JourneyCard {
  coins?: number;
  earnedAt: string;
  title: string;
  result: string;
  skillName: string;
  stages: number;
  minutes: number;
  xp: number;
}
export interface QuestChain {
  journey?: boolean;
  createdAt?: string;
  stageIds?: string[];
  card?: JourneyCard;
  id: string;
  title: string;
  description: string;
  progress: number;
  skillId: string;
}
export interface DailyRun {
  date: string;
  energy: number;
  focus: number;
  dailyQuestIds: string[];
  completedQuestCount: number;
  earnedXp: number;
  notes: string;
  score: number;
  endedAt?: string;
}
export interface Reward {
  id: string;
  title: string;
  description: string;
  cost: number;
  type: "milestone";
  available: boolean;
  claimedAt?: string;
}
export interface Season {
  id: string;
  name: string;
  subtitle: string;
  startDate: string;
  endDate: string;
  status: "active" | "completed";
  seasonXp: number;
  level: number;
  objectives: {
    id: string;
    skillId: string;
    targetXp: number;
    earnedXp: number;
  }[];
}
export interface Achievement {
  id: string;
  title: string;
  description: string;
  condition: string;
  unlockedAt?: string;
  icon: string;
}
export interface Completion {
  rewardMinutes?: number;
  rewardCoinsPerDay?: number;
  coins?: number;
  id: string;
  questId: string;
  title: string;
  skillId: string;
  difficulty: Difficulty;
  estimatedMinutes: number;
  actualMinutes: number;
  xp: number;
  at: string;
}
export interface FocusSession {
  id: string;
  questId: string;
  minutes: number;
  at: string;
}
export interface FocusTimer {
  questId: string;
  durationSeconds: number;
  remainingSeconds: number;
  startedAt: number | null;
}
export interface GameState {
  redemptions: RewardRedemption[];
  collection: CollectionState;
  version: 1;
  profile: UserProfile;
  skills: Skill[];
  quests: Quest[];
  chains: QuestChain[];
  runs: DailyRun[];
  season: Season;
  rewards: Reward[];
  achievements: Achievement[];
  completions: Completion[];
  sessions: FocusSession[];
  timer: FocusTimer | null;
  dismissedSuggestions: string[];
  demo: boolean;
}
