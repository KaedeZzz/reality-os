import { z } from "zod";
import type { GameState } from "../types/game";
import { PERSONAL_REWARDS } from "../data/rewards";
const detailsSchema = z.object({ note: z.string().trim().max(300) });
export function redeemReward(
  state: GameState,
  rewardId: string,
  id: string,
  details: { note: string },
  now = new Date(),
): GameState {
  if (state.redemptions.some((r) => r.id === id)) return state;
  const reward = PERSONAL_REWARDS.find((r) => r.id === rewardId);
  if (!reward) throw new Error("奖励不存在");
  const parsed = detailsSchema.parse(details);
  if (state.collection.coins < reward.cost) throw new Error("游戏币不足");
  const at = now.toISOString();
  return {
    ...state,
    redemptions: [
      ...state.redemptions,
      {
        id,
        rewardId,
        title: reward.title,
        description: reward.detail,
        category: reward.category,
        cost: reward.cost,
        budget: reward.budget,
        note: parsed.note,
        redeemedAt: at,
        status: "pending",
      },
    ],
    collection: {
      ...state.collection,
      coins: state.collection.coins - reward.cost,
      transactions: [
        ...state.collection.transactions,
        {
          id: `redeem:${id}`,
          label: `兑换 · ${reward.title}`,
          coins: -reward.cost,
          shards: 0,
          at,
        },
      ],
    },
  };
}
export function finishReward(
  state: GameState,
  id: string,
  action: "enjoyed" | "cancelled",
  now = new Date(),
): GameState {
  const reward = state.redemptions.find((r) => r.id === id);
  if (!reward || reward.status !== "pending") return state;
  const at = now.toISOString();
  return {
    ...state,
    redemptions: state.redemptions.map((r) =>
      r.id === id ? { ...r, status: action, finishedAt: at } : r,
    ),
    collection:
      action === "cancelled"
        ? {
            ...state.collection,
            coins: state.collection.coins + reward.cost,
            transactions: [
              ...state.collection.transactions,
              {
                id: `refund:${id}`,
                label: `撤销兑换 · ${reward.title}`,
                coins: reward.cost,
                shards: 0,
                at,
              },
            ],
          }
        : state.collection,
  };
}
