"use client";
import { taskCoins, rewardMinutes, WORKDAY_RULE } from "../lib/economy";
import { Journeys } from "./journeys";
import { useEffect, useState } from "react";
import {
  Check,
  Circle,
  Clock3,
  Play,
  Pencil,
  Trash2,
  LockKeyhole,
  Plus,
  Search,
  Sparkles,
  ChevronRight,
  SkipForward,
} from "lucide-react";
import type { Quest } from "../types/game";
import { useGame } from "../hooks/use-game";
import {
  completeQuest,
  dailyScore,
  dateKey,
  difficultyLabels,
  isQuestUnlocked,
  questSchema,
  refreshUnlocks,
  statusLabels,
  suggestXp,
  typeLabels,
} from "../lib/game";
import { Button } from "./ui/button";
import { Modal } from "./ui/modal";
import { Empty, PanelTitle, Progress, SkillIcon } from "./shared";

export function QuestCard({
  quest,
  compact = false,
  onEdit,
}: {
  quest: Quest;
  compact?: boolean;
  onEdit?: (q: Quest) => void;
}) {
  const { state, update, notify } = useGame();
  if (!state) return null;
  const skill = state.skills.find((s) => s.id === quest.skillId)!,
    done = quest.status === "completed",
    locked = !isQuestUnlocked(quest, state.quests) || !skill.unlocked;
  const coinPreview = done
    ? (state.completions.find((c) => c.questId === quest.id)?.coins ?? 0)
    : taskCoins(state, quest);
  const finish = () => {
    let coins = 0;
    update((s) => {
      const result = completeQuest(s, quest.id);
      coins = result.coins;
      return result.state;
    });
    notify(
      coins
        ? `任务完成 · +${coins} 游戏币`
        : "任务完成 · 不足 1 币的投入已累计",
    );
  };
  return (
    <article
      className={`quest-card ${compact ? "compact" : ""} ${done ? "done" : ""} ${quest.status === "active" ? "active" : ""}`}
    >
      <button
        className="quest-check"
        disabled={
          done || locked || ["skipped", "failed"].includes(quest.status)
        }
        onClick={finish}
        aria-label={`完成 ${quest.title}`}
      >
        {done ? (
          <Check size={17} />
        ) : locked ? (
          <LockKeyhole size={15} />
        ) : (
          <Circle size={20} />
        )}
      </button>
      <div className="quest-body">
        <div className="quest-category">
          <span style={{ color: skill.color }}>{skill.name}</span>
          <span className={`tag difficulty-${quest.difficulty}`}>
            {difficultyLabels[quest.difficulty]}
          </span>
          {quest.status === "active" && (
            <span className="active-label">● 进行中</span>
          )}
        </div>
        <h3>{quest.title}</h3>
        <div className="quest-meta">
          <Clock3 size={12} />
          {quest.estimatedMinutes} 分钟<span>·</span>
          {typeLabels[quest.type]}
          {quest.dueDate && (
            <span
              className={
                quest.dueDate < new Date().toLocaleDateString("sv-SE") && !done
                  ? "overdue"
                  : ""
              }
            >
              · {quest.dueDate}
            </span>
          )}
        </div>
        {!compact && quest.description && (
          <details className="tiny muted" style={{ marginTop: 10 }}>
            <summary style={{ cursor: "pointer" }}>任务说明与完成标准</summary>
            <p style={{ whiteSpace: "pre-line", lineHeight: 1.7, marginTop: 8 }}>
              {quest.description}
            </p>
          </details>
        )}
        {!compact && quest.actualMinutes > 0 && (
          <p className="tiny muted">
            已投入 {quest.actualMinutes.toFixed(1)} 分钟
          </p>
        )}
      </div>
      <div className="quest-right">
        <strong className="xp-reward">
          +
          {done
            ? (state.completions.find((c) => c.questId === quest.id)?.coins ??
              state.collection.transactions.find(
                (t) => t.id === `quest:${quest.id}`,
              )?.coins ??
              0)
            : coinPreview}
          <small> 游戏币</small>
        </strong>
        <div className="quest-tools">
          {!done &&
            !locked &&
            quest.status !== "active" &&
            quest.status !== "skipped" && (
              <button
                title="开始任务"
                aria-label={`开始 ${quest.title}`}
                onClick={() => {
                  update((s) => ({
                    ...s,
                    quests: s.quests.map((q) =>
                      q.id === quest.id ? { ...q, status: "active" } : q,
                    ),
                  }));
                  notify("任务已开始，一次专注于一个行动。");
                }}
              >
                <Play size={15} />
              </button>
            )}
          {onEdit && !done && (
            <button
              title="编辑任务"
              aria-label={`编辑 ${quest.title}`}
              onClick={() => onEdit(quest)}
            >
              <Pencil size={14} />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
export function QuestEditor({
  open,
  onClose,
  quest,
  defaults,
}: {
  open: boolean;
  onClose: () => void;
  quest?: Quest;
  defaults?: Partial<Quest>;
}) {
  const { state, update, notify } = useGame();
  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "side",
    skillId: "research",
    difficulty: "normal",
    estimatedMinutes: 25,
    xpReward: 56,
    dueDate: "",
    parentQuestId: "",
    questChainId: "",
  });
  const [error, setError] = useState(""),
    [manual, setManual] = useState(false);
  useEffect(() => {
    if (open) {
      setForm({
        title: quest?.title ?? defaults?.title ?? "",
        description: quest?.description ?? "",
        type: quest?.type ?? "side",
        skillId: quest?.skillId ?? defaults?.skillId ?? "research",
        difficulty: quest?.difficulty ?? "normal",
        estimatedMinutes:
          quest?.estimatedMinutes ?? defaults?.estimatedMinutes ?? 25,
        xpReward:
          quest?.xpReward ??
          suggestXp("normal", defaults?.estimatedMinutes ?? 25),
        dueDate: quest?.dueDate ?? "",
        parentQuestId: quest?.parentQuestId ?? "",
        questChainId: quest?.questChainId ?? "",
      });
      setManual(!!quest);
      setError("");
    }
  }, [open, quest, defaults]);
  if (!state) return null;
  const set = (key: string, value: string | number) =>
    setForm((f) => {
      const next = { ...f, [key]: value };
      if (!manual && (key === "difficulty" || key === "estimatedMinutes"))
        next.xpReward = suggestXp(
          next.difficulty as Quest["difficulty"],
          Number(next.estimatedMinutes),
        );
      return next;
    });
  const descendants = new Set<string>();
  if (quest) {
    let changed = true;
    while (changed) {
      changed = false;
      state.quests.forEach((q) => {
        if (
          q.parentQuestId &&
          (q.parentQuestId === quest.id || descendants.has(q.parentQuestId)) &&
          !descendants.has(q.id)
        ) {
          descendants.add(q.id);
          changed = true;
        }
      });
    }
  }
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={quest ? "编辑任务" : "创建新的任务"}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const result = questSchema.safeParse(form);
          if (!result.success) {
            setError(result.error.issues[0].message);
            return;
          }
          if (
            result.data.parentQuestId &&
            (descendants.has(result.data.parentQuestId) ||
              result.data.parentQuestId === quest?.id)
          ) {
            setError("任务不能循环依赖");
            return;
          }
          const data = {
            ...result.data,
            parentQuestId: form.parentQuestId || undefined,
            questChainId: form.questChainId || undefined,
            dueDate: form.dueDate || undefined,
          };
          update((s) => {
            const q: Quest = {
              ...data,
              id: quest?.id ?? crypto.randomUUID(),
              status:
                data.parentQuestId &&
                s.quests.find((p) => p.id === data.parentQuestId)?.status !==
                  "completed"
                  ? "backlog"
                  : quest?.status === "active"
                    ? "active"
                    : "available",
              createdAt: quest?.createdAt ?? new Date().toISOString(),
              actualMinutes: quest?.actualMinutes ?? 0,
            };
            return refreshUnlocks({
              ...s,
              quests: quest
                ? s.quests.map((a) => (a.id === q.id ? q : a))
                : [q, ...s.quests],
            });
          });
          notify(quest ? "任务已更新" : "新任务已加入任务日志");
          onClose();
        }}
        className="form-stack"
      >
        <label>
          任务名称
          <input
            autoFocus
            required
            maxLength={120}
            placeholder="例如：用 25 分钟整理实验结果"
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
          />
        </label>
        <label>
          具体行动
          <textarea
            rows={2}
            placeholder="明确做到什么，就算完成？"
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
          />
        </label>
        <div className="form-grid">
          <label>
            任务类型
            <select
              value={form.type}
              onChange={(e) => set("type", e.target.value)}
            >
              {Object.entries(typeLabels).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </label>
          <label>
            成长技能
            <select
              value={form.skillId}
              onChange={(e) => set("skillId", e.target.value)}
            >
              {state.skills
                .filter((s) => s.unlocked)
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
            </select>
          </label>
          <label>
            难度
            <select
              value={form.difficulty}
              onChange={(e) => set("difficulty", e.target.value)}
            >
              {Object.entries(difficultyLabels).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </label>
          <label>
            预计时间（分钟）
            <input
              type="number"
              min="1"
              max="480"
              required
              value={form.estimatedMinutes}
              onChange={(e) => set("estimatedMinutes", Number(e.target.value))}
            />
          </label>
          <label>
            预计游戏币（按劳动时长折算）
            <input
              type="number"
              readOnly
              value={taskCoins(state, {
                estimatedMinutes: form.estimatedMinutes,
                actualMinutes: quest?.actualMinutes ?? 0,
              })}
            />
          </label>
          <label>
            截止日期
            <input
              type="date"
              value={form.dueDate}
              onChange={(e) => set("dueDate", e.target.value)}
            />
          </label>
          <label>
            所属任务链
            <select
              value={form.questChainId}
              onChange={(e) => set("questChainId", e.target.value)}
            >
              <option value="">独立任务</option>
              {state.chains.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </label>
          <label>
            前置任务
            <select
              value={form.parentQuestId}
              onChange={(e) => set("parentQuestId", e.target.value)}
            >
              <option value="">无依赖</option>
              {state.quests
                .filter((q) => q.id !== quest?.id && !descendants.has(q.id))
                .map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.title}
                  </option>
                ))}
            </select>
          </label>
        </div>
        <p className="hint">
          {WORKDAY_RULE}
          。完成时优先按已记录时长结算，未计时则按预计时长确认。零头会累计。
        </p>
        <p className="hint">
          建议记录「练习 30 分钟」这样的可控行动，让成长不依赖输赢。
        </p>
        {error && (
          <p role="alert" className="error-text">
            {error}
          </p>
        )}
        <div className="modal-actions">
          <Button variant="secondary" type="button" onClick={onClose}>
            取消
          </Button>
          <Button type="submit">
            {quest ? "保存修改" : "创建任务"}
            <ChevronRight size={16} />
          </Button>
        </div>
      </form>
    </Modal>
  );
}
export function ChainView() {
  const { state } = useGame();
  if (!state) return null;
  return (
    <div className="chain-grid">
      {state.chains
        .filter((c) => !c.journey)
        .map((chain) => (
          <section className="panel" key={chain.id}>
            <PanelTitle eyebrow="QUEST CHAIN" title={chain.title} />
            <p className="muted">{chain.description}</p>
            <Progress value={chain.progress} />
            <div className="chain-steps">
              {state.quests
                .filter((q) => q.questChainId === chain.id)
                .map((q, i) => (
                  <div
                    className={`chain-step ${q.status === "completed" ? "complete" : ""}`}
                    key={q.id}
                  >
                    <span className="chain-dot">
                      {q.status === "completed" ? (
                        <Check size={15} />
                      ) : isQuestUnlocked(q, state.quests) ? (
                        i + 1
                      ) : (
                        <LockKeyhole size={13} />
                      )}
                    </span>
                    <div>
                      <strong>{q.title}</strong>
                      <p className="tiny muted">
                        {statusLabels[q.status]} · {taskCoins(state, q)} 游戏币
                        {q.type === "boss" ? " · BOSS" : ""}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </section>
        ))}
    </div>
  );
}
export function Quests({
  onCreate,
  onEdit,
}: {
  onCreate: () => void;
  onEdit: (q: Quest) => void;
}) {
  const { state, update, notify } = useGame(),
    [tab, setTab] = useState("all"),
    [type, setType] = useState("all"),
    [skill, setSkill] = useState("all"),
    [status, setStatus] = useState("all"),
    [sort, setSort] = useState("created"),
    [search, setSearch] = useState(""),
    [deleting, setDeleting] = useState<Quest | null>(null),
    [ai, setAi] = useState(false),
    [goal, setGoal] = useState("");
  if (!state) return null;
  const quests = state.quests
    .filter(
      (q) =>
        (tab === "history"
          ? ["completed", "skipped", "failed"].includes(q.status)
          : !["completed", "skipped", "failed"].includes(q.status)) &&
        (type === "all" || q.type === type) &&
        (skill === "all" || q.skillId === skill) &&
        (status === "all" || q.status === status) &&
        q.title.toLowerCase().includes(search.toLowerCase()),
    )
    .sort((a, b) =>
      sort === "xp"
        ? rewardMinutes(b) - rewardMinutes(a)
        : sort === "due"
          ? (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999")
          : sort === "difficulty"
            ? Object.keys(difficultyLabels).indexOf(b.difficulty) -
              Object.keys(difficultyLabels).indexOf(a.difficulty)
            : b.createdAt.localeCompare(a.createdAt),
    );
  return (
    <>
      <div className="page-title">
        <div>
          <span className="eyebrow">YOUR NEXT CHAPTER</span>
          <h1>
            任务日志<span className="title-dot">.</span>
          </h1>
          <p className="muted">把遥远的目标，拆成现在能做的一小步。</p>
        </div>
        <div className="button-row">
          <Button variant="secondary" onClick={() => setAi(true)}>
            <Sparkles size={16} />
            拆解目标
          </Button>
          <Button onClick={onCreate}>
            <Plus size={16} />
            创建任务
          </Button>
        </div>
      </div>
      <div className="tabs">
        {[
          ["all", "待办任务"],
          ["chains", "主线旅程"],
          ["history", "行动历史"],
        ].map(([k, v]) => (
          <button
            key={k}
            className={tab === k ? "selected" : ""}
            onClick={() => setTab(k)}
          >
            {v}
          </button>
        ))}
      </div>
      {tab === "chains" ? (
        <>
          <Journeys />
          <details style={{ marginTop: 28 }}>
            <summary>其他任务链</summary>
            <ChainView />
          </details>
        </>
      ) : (
        <>
          <div className="filters">
            <label className="search">
              <Search size={16} />
              <input
                aria-label="搜索任务"
                placeholder="搜索你的任务…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
            <select
              aria-label="任务类型筛选"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="all">所有类型</option>
              {Object.entries(typeLabels).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
            <select
              aria-label="技能筛选"
              value={skill}
              onChange={(e) => setSkill(e.target.value)}
            >
              <option value="all">所有技能</option>
              {state.skills.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <select
              aria-label="状态筛选"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="all">所有状态</option>
              {Object.entries(statusLabels).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
            <select
              aria-label="排序"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="created">最新创建</option>
              <option value="xp">游戏币奖励</option>
              <option value="due">截止日期</option>
              <option value="difficulty">任务难度</option>
            </select>
          </div>
          <div className="quest-list">
            {quests.length ? (
              quests.map((q) => (
                <div className="quest-list-row" key={q.id}>
                  <QuestCard
                    quest={q}
                    onEdit={
                      state.chains.some(
                        (c) => c.journey && c.id === q.questChainId,
                      )
                        ? undefined
                        : onEdit
                    }
                  />
                  {!state.chains.some(
                    (c) => c.journey && c.id === q.questChainId,
                  ) &&
                    !["completed", "skipped", "failed"].includes(q.status) && (
                      <div className="row-actions">
                        <button
                          aria-label={`跳过 ${q.title}`}
                          title="跳过，无惩罚"
                          onClick={() => {
                            update((s) => ({
                              ...s,
                              quests: s.quests.map((a) =>
                                a.id === q.id ? { ...a, status: "skipped" } : a,
                              ),
                            }));
                            notify("已跳过。不扣游戏币，按自己的节奏来。");
                          }}
                        >
                          <SkipForward size={15} />
                        </button>
                        <button
                          aria-label={`删除 ${q.title}`}
                          onClick={() => setDeleting(q)}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    )}
                </div>
              ))
            ) : (
              <Empty>
                这里暂时没有任务。试着创建一个小行动，或调整筛选条件。
              </Empty>
            )}
          </div>
        </>
      )}
      <Modal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="删除这个任务？"
        description="删除不可撤销，不影响已经获得的游戏币。"
      >
        <p>{deleting?.title}</p>
        <div className="modal-actions">
          <Button variant="secondary" onClick={() => setDeleting(null)}>
            保留
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              if (state.quests.some((q) => q.parentQuestId === deleting?.id)) {
                notify("该任务有后续依赖，请先修改后续任务的前置条件。");
                setDeleting(null);
                return;
              }
              if (state.timer?.questId === deleting?.id) {
                notify("请先结束关联的专注计时。");
                setDeleting(null);
                return;
              }
              update((s) =>
                refreshUnlocks({
                  ...s,
                  quests: s.quests.filter((q) => q.id !== deleting?.id),
                  runs: s.runs.map((r) => {
                    if (r.date !== dateKey()) return r;
                    const ids = r.dailyQuestIds.filter(
                      (id) => id !== deleting?.id,
                    );
                    return {
                      ...r,
                      dailyQuestIds: ids,
                      score: dailyScore(r.completedQuestCount, ids.length),
                    };
                  }),
                }),
              );
              setDeleting(null);
              notify("任务已删除");
            }}
          >
            确认删除
          </Button>
        </div>
      </Modal>
      <Modal
        open={ai}
        onClose={() => setAi(false)}
        title="把目标拆成可执行的行动"
        description="本地模板建议 · 未连接 AI 服务。你可以在创建后编辑每一步。"
      >
        <form
          className="form-stack"
          onSubmit={(e) => {
            e.preventDefault();
            const id = crypto.randomUUID(),
              at = new Date().toISOString();
            let parent: string | undefined;
            const steps = [
              "界定完成标准与范围",
              "收集资料，列出待办",
              "完成第一个可交付版本",
              "检查、修改并交付",
            ].map((step, i) => {
              const q: Quest = {
                id: crypto.randomUUID(),
                title: `${goal.trim()}：${step}`,
                description: "本地确定性模板生成，请按实际情况调整。",
                type: i === 3 ? "boss" : "main",
                status: i === 0 ? "available" : "backlog",
                difficulty: i === 3 ? "hard" : "normal",
                skillId: "research",
                estimatedMinutes: 25,
                xpReward: suggestXp(i === 3 ? "hard" : "normal", 25),
                actualMinutes: 0,
                createdAt: at,
                questChainId: id,
                parentQuestId: parent,
              };
              parent = q.id;
              return q;
            });
            update((s) => ({
              ...s,
              chains: [
                ...s.chains,
                {
                  id,
                  title: goal.trim(),
                  description: "每次推进一个具体行动。",
                  progress: 0,
                  skillId: "research",
                },
              ],
              quests: [...steps, ...s.quests],
            }));
            setAi(false);
            setGoal("");
            setTab("chains");
            notify("已生成 4 步任务链，可在任务日志中编辑。");
          }}
        >
          <label>
            你想完成什么？
            <input
              required
              maxLength={60}
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="例如：完成我的毕业论文"
            />
          </label>
          <div className="template-preview">
            明确目标 <ChevronRight size={14} /> 收集资料{" "}
            <ChevronRight size={14} /> 初稿 <ChevronRight size={14} /> 交付
          </div>
          <Button type="submit" disabled={!goal.trim()}>
            <Sparkles size={16} />
            生成任务链
          </Button>
        </form>
      </Modal>
    </>
  );
}
