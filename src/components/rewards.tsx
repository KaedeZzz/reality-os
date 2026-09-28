"use client";
import { useState } from "react";
import {
  Keyboard,
  Monitor,
  Coffee,
  MapPin,
  Coins,
  ArrowRight,
  Gift,
  Check,
  Sun,
  Gamepad2,
  Car,
  Utensils,
} from "lucide-react";
import { PERSONAL_REWARDS } from "../data/rewards";
import { redeemReward, finishReward } from "../lib/rewards";
import { WORKDAY_COINS, WORKDAY_RULE } from "../lib/economy";
import { useGame } from "../hooks/use-game";
import { Button } from "./ui/button";
import { Modal } from "./ui/modal";
import styles from "./rewards.module.css";
const icons = {
  keyboard: Keyboard,
  monitor: Monitor,
  chocolate: Coffee,
  trip: MapPin,
  rest: Sun,
  gaming: Gamepad2,
  kart: Car,
  dining: Utensils,
};
const daysFor = (coins: number) =>
  (Math.ceil((coins / WORKDAY_COINS) * 10) / 10).toLocaleString();
export function RewardsEntry({ onOpen }: { onOpen: () => void }) {
  const { state } = useGame();
  if (!state) return null;
  const pending = state.redemptions.filter((r) => r.status === "pending");
  return (
    <button className={styles.entry} onClick={onOpen}>
      <Gift size={22} />
      <span>
        <strong>
          {pending.length
            ? `${pending.length} 份奖励，等你享受`
            : "离真正想要的东西，再近一点"}
        </strong>
        <small>
          {pending.length
            ? pending[pending.length - 1].title
            : `已攒 ${state.collection.coins} 币 · 心愿装备、美食、特别休息与出行`}
        </small>
      </span>
      <ArrowRight size={18} />
    </button>
  );
}
export function RewardsPage() {
  const { state, update, notify, saving, error } = useGame();
  const [tab, setTab] = useState("browse");
  const [filter, setFilter] = useState("all");
  const [intent, setIntent] = useState<{ rewardId: string; id: string } | null>(
    null,
  );
  const [cancelId, setCancelId] = useState<string | null>(null);
  if (!state) return null;
  const balance = state.collection.coins;
  const selected = PERSONAL_REWARDS.find((r) => r.id === intent?.rewardId);
  const pending = state.redemptions.filter((r) => r.status === "pending");
  const history = state.redemptions.filter((r) => r.status !== "pending");
  const cancelling = state.redemptions.find((r) => r.id === cancelId);
  const finish = (id: string, action: "enjoyed" | "cancelled") => {
    update((s) => finishReward(s, id, action));
    notify(
      action === "enjoyed" ? "已记下这份开心。" : "已撤销，游戏币已退回。",
    );
    setCancelId(null);
  };
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <span className="eyebrow">WORTH WORKING TOWARD</span>
          <h1>真正想要的东西</h1>
          <p>想拥有的好物，想认真享受的时刻。</p>
        </div>
        <div className={styles.balance}>
          <Coins size={23} />
          <div>
            <strong>{balance.toLocaleString()}</strong>
            <span>可用游戏币</span>
          </div>
        </div>
      </header>
      <div className="tabs">
        {[
          ["browse", "挑一份奖励"],
          ["pending", `待享受 · ${pending.length}`],
          ["history", "奖励回忆"],
        ].map(([id, label]) => (
          <button
            key={id}
            className={tab === id ? "selected" : ""}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === "browse" ? (
        <>
          <div className={styles.rate}>
            <strong>{WORKDAY_RULE}</strong>
            <span>消费类按预算定价 · 休闲类单独定价</span>
          </div>
          <div className={styles.filters} aria-label="奖励筛选">
            {[
              ["all", "全部奖励"],
              ["leisure", "无需额外消费"],
              ["spending", "消费目标"],
            ].map(([id, label]) => (
              <button
                key={id}
                aria-pressed={filter === id}
                onClick={() => setFilter(id)}
              >
                {label}
              </button>
            ))}
          </div>
          <div className={styles.grid}>
            {PERSONAL_REWARDS.filter(
              (r) =>
                filter === "all" ||
                (filter === "leisure"
                  ? r.budget === undefined
                  : r.budget !== undefined),
            )
              .sort((a, b) => Number(!!b.image) - Number(!!a.image))
              .map((r) => {
                const Icon = icons[r.icon];
                const remaining = Math.max(0, r.cost - balance);
                return (
                  <article
                    className={styles.reward}
                    key={r.id}
                    data-category={r.category}
                  >
                    <div className={styles.cardTop}>
                      <span className={styles.symbol}>
                        <Icon size={26} />
                      </span>
                      <span>{r.category}</span>
                    </div>
                    {r.image && (
                      <figure className={styles.productImage}>
                        <img
                          src={r.image.src}
                          alt={r.image.alt}
                          loading="lazy"
                          style={{ objectFit: r.image.fit ?? "contain" }}
                        />
                        <figcaption>{r.image.caption}</figcaption>
                      </figure>
                    )}
                    <h2>{r.title}</h2>
                    <p>{r.description}</p>
                    {r.tags && (
                      <div className={styles.tags}>
                        {r.tags.map((tag) => (
                          <span key={tag}>{tag}</span>
                        ))}
                      </div>
                    )}
                    <div className={styles.budget}>
                      {r.budget === undefined
                        ? "无需额外消费"
                        : `预算 ¥${r.budget.toLocaleString()}`}{" "}
                      · 从零攒起约 {daysFor(r.cost)} 个标准劳动日
                    </div>
                    <div
                      className={styles.progress}
                      role="progressbar"
                      aria-label={`${r.title}可兑换进度`}
                      aria-valuemin={0}
                      aria-valuemax={r.cost}
                      aria-valuenow={Math.min(balance, r.cost)}
                    >
                      <span
                        style={{
                          width: `${Math.min(100, (balance / r.cost) * 100)}%`,
                        }}
                      />
                    </div>
                    <div className={styles.remaining}>
                      {remaining
                        ? `还差 ${remaining.toLocaleString()} 币 · 约 ${daysFor(remaining)} 个标准劳动日`
                        : "已经攒够，可以兑现这份期待"}
                    </div>
                    <div className={styles.bottom}>
                      <strong>
                        {r.cost.toLocaleString()}
                        <small> 游戏币</small>
                      </strong>
                      <button
                        onClick={() =>
                          setIntent({ rewardId: r.id, id: crypto.randomUUID() })
                        }
                      >
                        {balance >= r.cost ? "兑换这份期待" : "查看目标"}
                        <ArrowRight size={15} />
                      </button>
                    </div>
                  </article>
                );
              })}
          </div>
          <p className={styles.hint}>
            所有奖励共用同一余额。消费类按 1 币对应 1
            元预算定价；特别休息和游戏夜只扣游戏币。日常休息、周末和普通娱乐始终自由。兑换不会自动下单。
          </p>
        </>
      ) : (
        <div className={styles.records}>
          {!(tab === "pending" ? pending : history).length && (
            <div className={styles.empty}>
              <Gift size={30} />
              <h2>
                {tab === "pending"
                  ? "下一份期待，等你挑选"
                  : "让奖励成为真实的回忆"}
              </h2>
              <p>
                {tab === "pending"
                  ? "兑换后会放在这里，等你真正去享受。"
                  : "使用奖励后标记“已享受”，就会保留在这里。"}
              </p>
              <Button variant="secondary" onClick={() => setTab("browse")}>
                去看看奖励
              </Button>
            </div>
          )}
          {(tab === "pending" ? pending : history)
            .slice()
            .reverse()
            .map((r) => (
              <article className={styles.record} key={r.id}>
                <div className={styles.recordTop}>
                  <span>{r.category}</span>
                  <span>
                    {r.status === "pending"
                      ? "待享受"
                      : r.status === "enjoyed"
                        ? "已享受"
                        : "已撤销 · 已退币"}
                  </span>
                </div>
                <h2>{r.title}</h2>
                <p>{r.description}</p>
                {r.budget !== undefined && (
                  <p className={styles.personalBudget}>
                    给自己的预算：¥{r.budget} 以内
                  </p>
                )}
                {r.note && <blockquote>{r.note}</blockquote>}
                <div className={styles.recordFoot}>
                  <small>
                    {new Date(r.redeemedAt).toLocaleDateString("zh-CN")} 兑换 ·{" "}
                    {r.cost} 游戏币
                  </small>
                  {r.status === "pending" && (
                    <div className="button-row">
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={saving || !!error}
                        onClick={() => setCancelId(r.id)}
                      >
                        暂时不要了
                      </Button>
                      <Button
                        size="sm"
                        disabled={saving || !!error}
                        onClick={() => finish(r.id, "enjoyed")}
                      >
                        <Check size={15} />
                        已享受
                      </Button>
                    </div>
                  )}
                </div>
              </article>
            ))}
        </div>
      )}
      <details className={styles.ledger}>
        <summary>收入规则与游戏币记录</summary>
        <p>
          {WORKDAY_RULE}。新收入比原来提高
          20%。任务完成时按已记录的投入时长结算；未记录时长时，按任务预计时长确认。计时本身不发币，不足
          1 币的部分累计到下次。原有余额保留，旧任务不会重复结算。
        </p>
        <p>
          兑换时扣币，撤销未使用的奖励会全额退回。已享受的奖励不能再次退币。
        </p>
        {state.collection.transactions
          .filter((t) => t.coins !== 0)
          .slice(-15)
          .reverse()
          .map((t) => (
            <div key={t.id}>
              <span>{t.label}</span>
              <strong>
                {t.coins > 0 ? "+" : ""}
                {t.coins} 币
              </strong>
            </div>
          ))}
      </details>
      <Modal
        open={!!selected}
        onClose={() => setIntent(null)}
        title={selected?.title ?? "兑换奖励"}
        description={selected?.detail}
      >
        {selected && (
          <form
            className="form-stack"
            onSubmit={(e) => {
              e.preventDefault();
              if (!intent) return;
              const values = new FormData(e.currentTarget);
              try {
                update((s) =>
                  redeemReward(s, intent.rewardId, intent.id, {
                    note: String(values.get("note") ?? ""),
                  }),
                );
                setIntent(null);
                setTab("pending");
                notify("奖励已放进待享受，找个喜欢的时刻去用吧。");
              } catch (e) {
                notify(e instanceof Error ? e.message : "兑换失败");
              }
            }}
          >
            {selected.image && (
              <figure className={styles.detailImage}>
                <img
                  src={selected.image.src}
                  alt={selected.image.alt}
                  style={{ objectFit: selected.image.fit ?? "contain" }}
                />
                <figcaption>{selected.image.caption}</figcaption>
              </figure>
            )}
            {selected.tags && (
              <div className={styles.tags}>
                {selected.tags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
            )}
            {selected.source && (
              <a
                className={styles.sourceLink}
                href={selected.source.url}
                target="_blank"
                rel="noreferrer"
              >
                {selected.source.label} ↗
              </a>
            )}
            <div className={styles.cost}>
              <span>本次兑换</span>
              <strong>{selected.cost} 游戏币</strong>
            </div>
            <p className="muted">
              {selected.budget === undefined
                ? "这是一份特别休闲安排，无需额外消费，不会生成现金预算。"
                : `为这份期待预留 ¥${selected.budget.toLocaleString()} 消费额度，兑换后由你安排购买或出行。`}
            </p>
            <label>
              给自己的小备注（可不填）
              <textarea
                name="note"
                maxLength={300}
                rows={2}
                placeholder="例如：想要的型号、口味，或者计划出发的日期。"
              />
            </label>
            <p className="muted tiny">
              兑换后仍可撤销并退币。享受过后，再标记“已享受”。
            </p>
            <Button
              type="submit"
              disabled={saving || !!error || balance < selected.cost}
            >
              {balance < selected.cost
                ? `还差 ${selected.cost - balance} 游戏币`
                : `兑换这份奖励 · ${selected.cost} 币`}
            </Button>
          </form>
        )}
      </Modal>
      <Modal
        open={!!cancelling}
        onClose={() => setCancelId(null)}
        title="先把这份奖励放一放？"
        description="仅撤销尚未使用的奖励，游戏币会全额退回。"
      >
        <p>
          {cancelling?.title} · 退回 {cancelling?.cost} 游戏币
        </p>
        <div className="modal-actions">
          <Button variant="secondary" onClick={() => setCancelId(null)}>
            继续保留
          </Button>
          <Button
            disabled={saving || !!error}
            onClick={() => cancelling && finish(cancelling.id, "cancelled")}
          >
            撤销并退币
          </Button>
        </div>
      </Modal>
    </div>
  );
}
