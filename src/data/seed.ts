import { createCollection } from "../lib/collection";
import type { GameState, Quest, Skill } from "../types/game";
import {
  addSkillXp,
  calculateLevel,
  dateKey,
  refreshUnlocks,
} from "../lib/game";

export function createSeed(): GameState {
  const now = new Date(),
    today = dateKey(now),
    at = now.toISOString();
  const definitions = [
    ["engineering", "工程开发", "code", null, 3800, "#8da7fa", 1],
    ["research", "学术研究", "flask", null, 7200, "#b1a0ef", 1],
    ["chess", "国际象棋", "chess", null, 2200, "#e9b976", 1],
    ["fitness", "体能健康", "heart", null, 2800, "#88cfa4", 1],
    ["social", "社交连接", "users", null, 1400, "#ed9bac", 1],
    ["admin", "生活管理", "coffee", null, 1020, "#85cbd6", 1],
  ] as const;
  const skills: Skill[] = definitions.map(
    ([id, name, icon, parentSkillId, xp, color, prerequisiteLevel], i) =>
      addSkillXp(
        {
          id,
          name,
          icon,
          parentSkillId,
          xp: 0,
          level: 1,
          xpToNextLevel: 100,
          category: parentSkillId ?? id,
          unlocked: true,
          sortOrder: i,
          prerequisiteLevel,
          color,
          description: `通过真实行动持续积累${name}能力。每一步都算数。`,
        },
        xp,
      ),
  );
  const quest = (
    id: string,
    title: string,
    skillId: string,
    difficulty: Quest["difficulty"],
    estimatedMinutes: number,
    xpReward: number,
    type: Quest["type"] = "side",
  ): Quest => ({
    id,
    title,
    skillId,
    difficulty,
    estimatedMinutes,
    xpReward,
    type,
    status: "available",
    description: "把注意力放在可控制的行动上。完成一个清晰、具体的步骤就好。",
    actualMinutes: 0,
    createdAt: at,
  });
  const quests: Quest[] = [
    quest("q1", "分析纸张帘纹频率", "research", "hard", 45, 220, "daily"),
    quest("q2", "认真下 3 局快棋", "chess", "normal", 60, 120, "daily"),
    quest("q3", "运动，让身体重新充电", "fitness", "normal", 45, 100, "daily"),
    quest("q4", "撰写 Spectral TV 章节", "research", "normal", 45, 150, "main"),
    quest("q5", "复盘今天的棋局", "chess", "easy", 30, 70),
    quest("q6", "处理重要的生活事务", "admin", "easy", 25, 60, "weekly"),
  ];
  [
    "整理实验结果",
    "选择三张最有说服力的图表",
    "撰写 Methods 章节",
    "撰写 Results 章节",
    "撰写 Discussion 章节",
    "完成论文完整初稿",
  ].forEach((title, i) =>
    quests.push({
      ...quest(
        `chain-${i}`,
        title,
        "research",
        i === 5 ? "boss" : "normal",
        i === 5 ? 90 : 45,
        i === 5 ? 500 : 150,
        i === 5 ? "boss" : "main",
      ),
      questChainId: "thesis",
      parentQuestId: i ? `chain-${i - 1}` : undefined,
      status: i < 2 ? "completed" : i === 2 ? "available" : "backlog",
      completedAt: i < 2 ? at : undefined,
    }),
  );
  const completions: GameState["completions"] = [],
    sessions: GameState["sessions"] = [],
    runs: GameState["runs"] = [];
  for (let i = 28; i >= 1; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    d.setHours(17, 0, 0, 0);
    const count = i % 6 === 0 ? 0 : i % 4 === 0 ? 1 : i % 3 === 0 ? 2 : 3;
    const ids: string[] = [];
    for (let j = 0; j < count; j++) {
      const id = `history-${i}-${j}`,
        skillId = ["research", "chess", "fitness"][j];
      ids.push(id);
      const q = {
        ...quest(
          id,
          ["阅读并整理研究笔记", "练习棋局战术", "完成一次运动"][j],
          skillId,
          "normal",
          25,
          80,
          "side",
        ),
        status: "completed" as const,
        createdAt: d.toISOString(),
        completedAt: d.toISOString(),
        actualMinutes: 25,
      };
      quests.push(q);
      completions.push({
        id,
        questId: id,
        title: q.title,
        skillId,
        difficulty: q.difficulty,
        estimatedMinutes: 25,
        actualMinutes: 25,
        xp: 80,
        at: d.toISOString(),
      });
    }
    runs.push({
      date: dateKey(d),
      energy: 70,
      focus: 65,
      dailyQuestIds: [
        ...ids,
        ...Array.from({ length: 3 - count }, (_, j) => `miss-${i}-${j}`),
      ],
      completedQuestCount: count,
      earnedXp: count * 80,
      notes: "演示历史",
      score: Math.round((count / 3) * 100),
    });
    if (count)
      sessions.push({
        id: `focus-${i}`,
        questId: ids[0],
        minutes: count * 25,
        at: d.toISOString(),
      });
  }
  runs.push({
    date: today,
    energy: 78,
    focus: 65,
    dailyQuestIds: ["q1", "q2", "q3"],
    completedQuestCount: 0,
    earnedXp: 0,
    notes: "",
    score: 0,
  });
  const start = new Date(now);
  start.setDate(start.getDate() - 20);
  const end = new Date(now);
  end.setDate(end.getDate() + 64);
  return refreshUnlocks({
    version: 1,
    redemptions: [],
    collection: createCollection(),
    profile: {
      id: "local-player",
      displayName: "KaedeZ",
      totalXp: 18420,
      level: calculateLevel(18420),
      createdAt: at,
    },
    skills,
    quests,
    chains: [
      {
        id: "thesis",
        title: "毕业论文 · 最后的远征",
        description: "将零散的研究，写成完整的故事。",
        progress: 33,
        skillId: "research",
      },
    ],
    runs,
    season: {
      id: "season-1",
      name: "SEASON 01",
      subtitle: "剑桥 · 最后一个学期",
      startDate: dateKey(start),
      endDate: dateKey(end),
      status: "active",
      seasonXp: 4200,
      level: calculateLevel(4200),
      objectives: [
        { id: "o1", skillId: "research", targetXp: 5000, earnedXp: 2400 },
        { id: "o2", skillId: "chess", targetXp: 2500, earnedXp: 1020 },
        { id: "o3", skillId: "fitness", targetXp: 3000, earnedXp: 1600 },
        { id: "o4", skillId: "admin", targetXp: 1500, earnedXp: 800 },
      ],
    },
    rewards: [
      {
        id: "r1",
        title: "吃一顿喜欢的晚餐",
        description: "认真享受，给自己一点奖励。",
        cost: 5,
        type: "milestone",
        available: true,
      },
      {
        id: "r2",
        title: "买一款心愿单游戏",
        description: "探索另一个世界。",
        cost: 10,
        type: "milestone",
        available: false,
      },
      {
        id: "r3",
        title: "给自己一天短途旅行",
        description: "换一个视角看生活。",
        cost: 15,
        type: "milestone",
        available: false,
      },
      {
        id: "r4",
        title: "一份值得期待的大礼",
        description: "由你定义的赛季纪念。",
        cost: 20,
        type: "milestone",
        available: false,
      },
    ],
    achievements: [
      {
        id: "a1",
        title: "第一步",
        description: "完成你的第一个任务",
        condition: "first",
        icon: "footprints",
      },
      {
        id: "a2",
        title: "行动的力量",
        description: "累计完成 10 个任务",
        condition: "ten",
        icon: "zap",
      },
      {
        id: "a3",
        title: "直面挑战",
        description: "完成一个首领任务",
        condition: "boss",
        icon: "trophy",
      },
    ],
    completions,
    sessions,
    timer: null,
    dismissedSuggestions: [],
    demo: true,
  });
}
