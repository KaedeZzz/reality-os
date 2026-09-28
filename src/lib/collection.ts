import type { CollectionState, CardRarity } from "../types/collection";
import type { GameState } from "../types/game";
import { CARDS, RARITIES, PACK_PRICE, CARD_SETS, findCard } from "../data/cards";
export const createCollection = (): CollectionState => ({
  currencyVersion: 2, coins: 300, shards: 0, owned: [], showcase: [], wishlist: null, completedSets: [],
  packsSinceLegendary: 0, pendingPack: null,
  transactions: [{ id: "welcome", label: "收藏启程礼", coins: 300, shards: 0, at: new Date().toISOString() }],
});
export const coinsForXp = (xp: number) => Math.max(0, Math.floor(xp / 2));
export function creditTask(state: GameState, questId: string, title: string, coins: number, now: Date): GameState {
  const c = state.collection;
  if (!coins || c.transactions.some((t) => t.id === `quest:${questId}`)) return state;
  return { ...state, collection: { ...c, coins: c.coins + coins,
    transactions: [...c.transactions, { id: `quest:${questId}`, label: `任务 · ${title}`, coins, shards: 0, at: now.toISOString() }],
  } };
}
const random = () => crypto.getRandomValues(new Uint32Array(1))[0] / 4294967296;
export function buyCard(state: GameState, cardId: string, transactionId: string): GameState {
  const c = state.collection;
  if (c.transactions.some((t) => t.id === transactionId)) return state;
  const card = findCard(cardId);
  if (!card) throw new Error("卡牌不存在");
  if (c.owned.some((o) => o.cardId === cardId)) throw new Error("已经收藏这张卡");
  const price = RARITIES[card.rarity].price;
  if (c.coins < price) throw new Error("游戏币不足，完成任务后再来");
  const at = new Date().toISOString();
  return awardSets({ ...state, collection: { ...c, coins: c.coins - price,
    owned: [...c.owned, { cardId, acquiredAt: at }],
    showcase: c.showcase.length < 3 ? [...c.showcase, cardId] : c.showcase,
    wishlist: c.wishlist === cardId ? null : c.wishlist,
    transactions: [...c.transactions, { id: transactionId, label: `购入 · ${card.name}`, coins: -price, shards: 0, at }],
  } });
}
export function buyPack(state: GameState, transactionId: string, set: string, rng: () => number = random): GameState {
  const c = state.collection;
  if (c.transactions.some((t) => t.id === transactionId)) return state;
  if (!CARD_SETS.includes(set)) throw new Error("请选择一个探索主题");
  if (c.pendingPack) throw new Error("请先查看上一次开包结果");
  if (c.coins < PACK_PRICE) throw new Error("游戏币不足，完成任务后再来");
  const owned = [...c.owned];
  const showcase = [...c.showcase];
  let refund = 0, legendary = false, guaranteed = false;
  const at = new Date().toISOString();
  const cards = Array.from({ length: 3 }, (_, index) => {
    const roll = rng();
    let rarity: CardRarity = roll < .7 ? "common" : roll < .95 ? "rare" : "legendary";
    if (index === 2 && c.packsSinceLegendary >= 4 && !legendary) { rarity = "legendary"; guaranteed = true; }
    if (rarity === "legendary") legendary = true;
    const pool = CARDS.filter((card) => card.rarity === rarity && card.set === set);
    const card = pool[Math.min(pool.length - 1, Math.floor(rng() * pool.length))];
    const duplicate = owned.some((o) => o.cardId === card.id);
    const earned = duplicate ? RARITIES[rarity].duplicate : 0;
    refund += earned;
    if (!duplicate) { owned.push({ cardId: card.id, acquiredAt: at }); if (showcase.length < 3) showcase.push(card.id); }
    return { cardId: card.id, duplicate, shards: 0, refund: earned };
  });
  return awardSets({ ...state, collection: { ...c, coins: c.coins - PACK_PRICE + refund, shards: 0,
    owned, showcase, wishlist: owned.some((o) => o.cardId === c.wishlist) ? null : c.wishlist,
    packsSinceLegendary: legendary ? 0 : c.packsSinceLegendary + 1,
    pendingPack: { id: transactionId, cards, guaranteed },
    transactions: [...c.transactions, { id: transactionId, label: `${set} · 主题探索`, coins: -PACK_PRICE + refund, shards: 0, at }],
  } });
}
export function toggleShowcase(state: GameState, cardId: string): GameState {
  const c = state.collection;
  if (!c.owned.some((o) => o.cardId === cardId)) throw new Error("请先获得这张卡");
  const selected = c.showcase.includes(cardId);
  if (!selected && c.showcase.length >= 3) throw new Error("展示位已满，请先移下一张卡");
  return { ...state, collection: { ...c, showcase: selected ? c.showcase.filter((id) => id !== cardId) : [...c.showcase, cardId] } };
}
function awardSets(state: GameState): GameState {
  let c = state.collection;
  for (const set of CARD_SETS) {
    if (c.completedSets.includes(set) || !CARDS.filter((card) => card.set === set).every((card) => c.owned.some((o) => o.cardId === card.id))) continue;
    c = { ...c, coins: c.coins + 200, shards: 0, completedSets: [...c.completedSets, set],
      transactions: [...c.transactions, { id: `set:${set}`, label: `集齐主题 · ${set}`, coins: 200, shards: 0, at: new Date().toISOString() }],
    };
  }
  return { ...state, collection: c };
}

// Legacy XP remains archived in v1 saves, but no longer accrues or gates gameplay.
// Only unspent shards convert; XP and old task history must not grant coins twice.
export function migrateCurrency(c: CollectionState): CollectionState {
  if (c.currencyVersion === 2) return c;
  const amount = c.shards * 5;
  return { ...c, currencyVersion: 2, coins: c.coins + amount, shards: 0,
    pendingPack: c.pendingPack ? { ...c.pendingPack, cards: c.pendingPack.cards.map((item) => ({ ...item, refund: item.shards * 5, shards: 0 })) } : null,
    transactions: amount ? [...c.transactions, { id: "single-currency-v2", label: "旧星屑余额折合游戏币", coins: amount, shards: 0, at: new Date().toISOString() }] : c.transactions,
  };
}

export function claimSeasonReward(state: GameState, rewardId: string): GameState {
  const reward = state.rewards.find((r) => r.id === rewardId);
  if (!reward) throw new Error("奖励不存在");
  if (reward.claimedAt) return state;
  const price = reward.cost * 100;
  if (state.collection.coins < price) throw new Error("游戏币不足");
  const at = new Date().toISOString();
  return { ...state, rewards: state.rewards.map((r) => r.id === rewardId ? { ...r, available: true, claimedAt: at } : r),
    collection: { ...state.collection, coins: state.collection.coins - price,
      transactions: [...state.collection.transactions, { id: `reward:${rewardId}`, label: `兑换奖励 · ${reward.title}`, coins: -price, shards: 0, at }],
    },
  };
}
