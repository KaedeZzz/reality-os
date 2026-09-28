import { describe, it, expect } from "vitest";
import { createSeed } from "../data/seed";
import { CARDS } from "../data/cards";
import { buyCard, buyPack, toggleShowcase, migrateCurrency, claimSeasonReward } from "./collection";
import { completeQuest } from "./game";
import { parseState } from "./storage";
const rich = () => { const s = createSeed(); s.collection.coins = 10000; return s; };
describe("收藏经济", () => {
  it("任务按实际 XP 发币，重复完成不发币", () => {
    const s = createSeed();
    const result = completeQuest(s, "q1");
    expect(result.state.collection.coins).toBe(300 + result.coins);
    expect(completeQuest(result.state, "q1").state.collection).toEqual(result.state.collection);
  });
  it("定向购买准确扣款，重放同一操作不重复扣款", () => {
    const s = buyCard(createSeed(), "orbit", "purchase-1");
    expect(s.collection.coins).toBe(200);
    expect(s.collection.owned.map((o) => o.cardId)).toEqual(["orbit"]);
    expect(buyCard(s, "orbit", "purchase-1")).toBe(s);
    expect(() => buyCard(s, "orbit", "purchase-2")).toThrow("已经收藏");
  });
  it("资源不足不修改余额，锁定展示只能使用已拥有的卡", () => {
    const s = createSeed();
    expect(() => buyCard(s, "stargate", "x")).toThrow("不足");
    expect(() => buyCard(s, "island", "x")).toThrow("不足");
    expect(() => toggleShowcase(s, "orbit")).toThrow("先获得");
    expect(s.collection.coins).toBe(300);
  });
  it("同包重复只收藏一次，其余转换为星屑", () => {
    const s = buyPack(createSeed(), "p1", "深空来信", () => 0);
    expect(s.collection.coins).toBe(190);
    expect(s.collection.owned).toHaveLength(1);
    expect(s.collection.shards).toBe(0);
    expect(s.collection.pendingPack?.cards.map((c) => c.duplicate)).toEqual([false, true, true]);
    expect(buyPack(s, "p1", "深空来信")).toBe(s);
    expect(() => buyPack(s, "p2", "深空来信")).toThrow("先查看");
  });
  it("第五次保证典藏，获得典藏后计数归零", () => {
    let s = rich();
    for (let i = 0; i < 5; i++) {
      s = buyPack(s, `p${i}`, "荒野回声", () => 0);
      if (i < 4) {
        expect(s.collection.packsSinceLegendary).toBe(i + 1);
        s.collection.pendingPack = null;
      }
    }
    expect(s.collection.pendingPack?.guaranteed).toBe(true);
    expect(s.collection.pendingPack?.cards[2].cardId).toBe("island");
    expect(s.collection.packsSinceLegendary).toBe(0);
  });
  it("自然抽中典藏也重置保底，只返回所选主题", () => {
    const input = rich(); input.collection.packsSinceLegendary = 3;
    const s = buyPack(input, "p", "浮光之城", () => .99);
    expect(s.collection.packsSinceLegendary).toBe(0);
    expect(s.collection.pendingPack?.guaranteed).toBe(false);
    expect(s.collection.pendingPack?.cards.every((c) => c.cardId === "dawn")).toBe(true);
  });
  it("每套只发一次集齐奖励", () => {
    let s = rich();
    const cards = CARDS.filter((c) => c.set === "深空来信");
    for (const card of cards) s = buyCard(s, card.id, card.id);
    expect(s.collection.coins).toBe(10000 - 100 - 100 - 300 - 800 + 200);
    expect(s.collection.shards).toBe(0);
    expect(s.collection.completedSets).toEqual(["深空来信"]);
    s = buyCard(s, "rooftop", "another");
    expect(s.collection.transactions.filter((t) => t.id.startsWith("set:")).length).toBe(1);
  });
  it("购买指定卡并清除已实现的心愿", () => {
    const input = createSeed(); input.collection.wishlist = "orbit";
    const s = buyCard(input, "orbit", "exchange");
    expect(s.collection.coins).toBe(200);
    expect(s.collection.shards).toBe(0);
    expect(s.collection.wishlist).toBeNull();
  });
  it("展示位最多三个，移除后可以替换", () => {
    let s = rich();
    for (const card of CARDS.slice(0,4)) s = buyCard(s, card.id, card.id);
    expect(() => toggleShowcase(s, "stargate")).toThrow("已满");
    s = toggleShowcase(s, "orbit");
    s = toggleShowcase(s, "stargate");
    expect(s.collection.showcase).toEqual(["signal", "voyager", "stargate"]);
  });
  it("旧存档只领一次启程礼，不按演示历史发币", () => {
    const old: Partial<ReturnType<typeof createSeed>> = createSeed(); delete old.collection;
    const migrated = parseState(old);
    expect(migrated.collection.coins).toBe(300);
    const spent = buyCard(migrated, "orbit", "once");
    expect(parseState(JSON.parse(JSON.stringify(spent))).collection.coins).toBe(200);
  });
  it("未关闭的探索结果和保底进度跨读取保留", () => {
    const s = buyPack(createSeed(), "p", "浮光之城", () => .8);
    expect(parseState(JSON.parse(JSON.stringify(s))).collection).toEqual(s.collection);
  });
  it("拒绝负余额、无效卡牌和无所有权展示", () => {
    const s = createSeed(); s.collection.coins = -1;
    expect(() => parseState(s)).toThrow();
    s.collection.coins = 0; s.collection.showcase = ["orbit"];
    expect(() => parseState(s)).toThrow();
  });
});

describe("单一货币迁移", () => {
  it("只转换剩余星屑一次，保留收藏并不拿旧 XP 重复发币", () => {
    const old = createSeed();
    delete old.collection.currencyVersion;
    old.collection.coins = 42;
    old.collection.shards = 17;
    const migrated = parseState(old);
    expect(migrated.collection.coins).toBe(127);
    expect(migrated.collection.shards).toBe(0);
    expect(parseState(JSON.parse(JSON.stringify(migrated))).collection.coins).toBe(127);
    expect(migrated.profile.totalXp).toBe(old.profile.totalXp);
  });
  it("待展示的旧结果折合金币但不重复入账", () => {
    const c = createSeed().collection;
    delete c.currencyVersion;
    c.shards = 5;
    c.pendingPack = { id: "old", guaranteed: false, cards: [{ cardId: "orbit", duplicate: true, shards: 5 }] };
    const migrated = migrateCurrency(c);
    expect(migrated.coins).toBe(325);
    expect(migrated.pendingPack!.cards[0].refund).toBe(25);
    expect(migrateCurrency(migrated).coins).toBe(325);
  });
  it("赛季奖励使用同一余额，重复兑换不扣款", () => {
    const input = rich();
    const next = claimSeasonReward(input, "r1");
    expect(next.collection.coins).toBe(input.collection.coins - 500);
    expect(next.rewards[0].claimedAt).toBeTruthy();
    expect(claimSeasonReward(next, "r1")).toBe(next);
    expect(() => claimSeasonReward(createSeed(), "r1")).toThrow("不足");
  });
});
