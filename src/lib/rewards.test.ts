import { describe, it, expect } from "vitest";
import { createSeed } from "../data/seed";
import { redeemReward, finishReward } from "./rewards";
import { parseState } from "./storage";
const details = { note: "淘宝收藏夹里的那一份" };
describe("具体愿望奖励", () => {
  it("休闲奖励只消耗游戏币，不产生现金预算，重载后可正常退币", () => {
    const s = redeemReward(createSeed(), "gaming-evening", "game-night", {
      note: "周五晚上",
    });
    expect(s.collection.coins).toBe(180);
    expect(s.redemptions[0].budget).toBeUndefined();
    const loaded = parseState(JSON.parse(JSON.stringify(s)));
    expect(
      finishReward(loaded, "game-night", "cancelled").collection.coins,
    ).toBe(300);
  });
  it("卡丁车与大餐保留各自的现金预算", () => {
    const s = createSeed();
    s.collection.coins = 1000;
    const kart = redeemReward(s, "karting-session", "kart", { note: "" });
    const dinner = redeemReward(kart, "special-dinner", "dinner", { note: "" });
    expect(dinner.collection.coins).toBe(100);
    expect(dinner.redemptions.map((r) => r.budget)).toEqual([400, 500]);
  });
  it("扣币后进入待享受，重复提交不重复扣款", () => {
    const s = redeemReward(createSeed(), "wishlist-chocolate", "one", details);
    expect(s.collection.coins).toBe(100);
    expect(s.redemptions[0]).toMatchObject({
      status: "pending",
      cost: 200,
      budget: 200,
      note: details.note,
    });
    expect(redeemReward(s, "wishlist-chocolate", "one", details)).toBe(s);
  });
  it("购买多个奖励共用同一钱包，不能重复使用额度", () => {
    const initial = createSeed();
    initial.collection.coins = 3000;
    const s = redeemReward(initial, "wishlist-keyboard", "one", details);
    expect(s.collection.coins).toBe(1000);
    expect(() => redeemReward(s, "wishlist-monitor", "two", details)).toThrow(
      "不足",
    );
    expect(
      redeemReward(s, "wishlist-chocolate", "three", details).collection.coins,
    ).toBe(800);
  });
  it("北京行程按确认的总预算一次预留 4000 币", () => {
    const s = createSeed();
    s.collection.coins = 4500;
    const next = redeemReward(s, "beijing-november", "trip", {
      note: "门票、交通和住宿",
    });
    expect(next.collection.coins).toBe(500);
    expect(next.redemptions[0]).toMatchObject({ budget: 4000, cost: 4000 });
  });
  it("余额不足不会产生记录或扣款，已撤下的日常奖励不能再兑换", () => {
    const s = createSeed();
    expect(() => redeemReward(s, "wishlist-monitor", "no", details)).toThrow(
      "不足",
    );
    expect(() => redeemReward(s, "gaming-hour", "old", details)).toThrow(
      "不存在",
    );
    expect(s.redemptions).toHaveLength(0);
    expect(s.collection.coins).toBe(300);
  });
  it("取消未使用奖励恰好退回一次", () => {
    const redeemed = redeemReward(
      createSeed(),
      "wishlist-chocolate",
      "one",
      details,
    );
    const cancelled = finishReward(redeemed, "one", "cancelled");
    expect(cancelled.collection.coins).toBe(300);
    expect(cancelled.redemptions[0].status).toBe("cancelled");
    expect(finishReward(cancelled, "one", "cancelled")).toBe(cancelled);
    expect(finishReward(cancelled, "one", "enjoyed")).toBe(cancelled);
  });
  it("已享受后不能退币，也不再次扣款", () => {
    const redeemed = redeemReward(
      createSeed(),
      "wishlist-chocolate",
      "one",
      details,
    );
    const enjoyed = finishReward(redeemed, "one", "enjoyed");
    expect(enjoyed.collection.coins).toBe(100);
    expect(enjoyed.redemptions[0].finishedAt).toBeTruthy();
    expect(finishReward(enjoyed, "one", "cancelled")).toBe(enjoyed);
  });
  it("新记录跨存档保留，旧版缺失字段自动补齐", () => {
    const old: Partial<ReturnType<typeof createSeed>> = createSeed();
    delete old.redemptions;
    expect(parseState(old).redemptions).toEqual([]);
    const s = redeemReward(createSeed(), "wishlist-chocolate", "one", details);
    expect(parseState(JSON.parse(JSON.stringify(s))).redemptions).toEqual(
      s.redemptions,
    );
  });
  it("旧版已兑换奖励保留；免费旧奖励不凭空退币", () => {
    const old = createSeed();
    old.rewards[0].claimedAt = new Date().toISOString();
    const migrated = parseState(old);
    expect(migrated.redemptions[0].cost).toBe(0);
    expect(migrated.redemptions[0].status).toBe("pending");
    const cancelled = finishReward(migrated, "legacy:r1", "cancelled");
    expect(cancelled.collection.coins).toBe(300);
    expect(parseState(cancelled).redemptions).toHaveLength(1);
  });
  it("已下架奖励的旧记录仍可按原价退回", () => {
    const old = createSeed();
    old.redemptions = [
      {
        id: "old",
        rewardId: "gaming-hour",
        title: "旧奖励",
        category: "放松时间",
        description: "",
        note: "",
        cost: 120,
        redeemedAt: new Date().toISOString(),
        status: "pending",
      },
    ];
    const next = finishReward(parseState(old), "old", "cancelled");
    expect(next.collection.coins).toBe(420);
    expect(
      finishReward(parseState(next), "old", "cancelled").collection.coins,
    ).toBe(420);
  });
});
