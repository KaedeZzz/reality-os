"use client";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Swords,
  GitBranch,
  ChartNoAxesCombined,
  Flag,
  Settings2,
  ChevronDown,
  ArrowUpRight,
  Command,
  Menu,
  X,
  CircleHelp,
  Sparkles,
} from "lucide-react";
import { useGame } from "../hooks/use-game";
import { dateKey, levelProgress } from "../lib/game";
import { WORKDAY_RULE } from "../lib/economy";
import { supabase } from "../lib/storage";
import type { Quest } from "../types/game";
import { RewardsPage } from "./rewards";
import { Dashboard } from "./dashboard";
import { Quests, QuestEditor } from "./quests";
import { Skills } from "./skills";
import { Stats } from "./stats";
import { SeasonPage } from "./season";
import { Settings, AuthForm } from "./settings";
import { FocusModal } from "./focus";
import { Modal } from "./ui/modal";
import { Button } from "./ui/button";
import { Progress } from "./shared";

const navigation = [
  {
    id: "dashboard",
    title: "总览",
    english: "Dashboard",
    icon: LayoutDashboard,
  },
  { id: "quests", title: "任务日志", english: "Quests", icon: Swords },
  { id: "rewards", title: "奖励", english: "Rewards", icon: Sparkles },
  { id: "skills", title: "行动方向", english: "Skills", icon: GitBranch },
  {
    id: "stats",
    title: "成长档案",
    english: "Stats",
    icon: ChartNoAxesCombined,
  },
  { id: "season", title: "赛季旅程", english: "Season", icon: Flag },
  { id: "settings", title: "系统设置", english: "Settings", icon: Settings2 },
];
export function RealityApp() {
  const { state, error, saving, update, reload, notify, mode } = useGame(),
    [page, setPage] = useState("dashboard"),
    [selectedSkill, setSelectedSkill] = useState("research"),
    [menu, setMenu] = useState(false),
    [editor, setEditor] = useState(false),
    [editing, setEditing] = useState<Quest | undefined>(),
    [defaults, setDefaults] = useState<Partial<Quest> | undefined>(),
    [focus, setFocus] = useState(false),
    [end, setEnd] = useState(false),
    [log, setLog] = useState(false),
    [help, setHelp] = useState(false);
  const navigate = (id: string, skillId?: string) => {
    if (skillId) setSelectedSkill(skillId);
    setPage(id);
    window.location.hash = id;
    setMenu(false);
    window.scrollTo({ top: 0, behavior: "instant" });
  };
  const create = () => {
    setEditing(undefined);
    setDefaults(undefined);
    setEditor(true);
  };
  useEffect(() => {
    const sync = () => {
      const rawHash = window.location.hash.slice(1);
      const hash = rawHash === "collection" ? "rewards" : rawHash;
      if ([...navigation.map((n) => n.id), "settings"].includes(hash))
        setPage(hash);
    };
    sync();
    window.addEventListener("hashchange", sync);
    const shortcut = (e: KeyboardEvent) => {
      if (
        (e.target as HTMLElement).closest(
          'input,textarea,select,[role="dialog"]',
        ) ||
        e.ctrlKey ||
        e.metaKey ||
        e.altKey
      )
        return;
      if (e.key.toLowerCase() === "n") {
        e.preventDefault();
        setEditing(undefined);
        setDefaults(undefined);
        setEditor(true);
      }
      if (e.key.toLowerCase() === "f") {
        e.preventDefault();
        setFocus(true);
      }
    };
    window.addEventListener("keydown", shortcut);
    return () => {
      window.removeEventListener("hashchange", sync);
      window.removeEventListener("keydown", shortcut);
    };
  }, []);
  if (!state)
    return (
      <main className="loading-screen">
        <div className="brand-mark">
          <Command size={28} />
        </div>
        <h1>
          REALITY <span>OS</span>
        </h1>
        {error ? (
          <section className="panel">
            <p className="error-text" role="alert">
              {error}
            </p>
            {supabase ? (
              <AuthForm />
            ) : (
              <>
                <p className="muted">
                  为保护原有数据，没有覆盖存档。请备份浏览器中的 reality-os-v1
                  数据后再恢复。
                </p>
                <Button onClick={reload}>重新读取</Button>
              </>
            )}
          </section>
        ) : (
          <p className="muted">正在读取你的世界…</p>
        )}
      </main>
    );
  const active = navigation.find((n) => n.id === page),
    today = new Date().toLocaleDateString("zh-CN", {
      month: "long",
      day: "numeric",
      weekday: "long",
    }),
    run = state.runs.find((r) => r.date === dateKey())!;
  return (
    <div className={`app-shell growth-theme page-${page}`}>
      <a href="#main-content" className="skip-link">
        跳转到主内容
      </a>
      {menu && <div className="mobile-scrim" onClick={() => setMenu(false)} />}
      <aside className={`sidebar ${menu ? "open" : ""}`}>
        <a
          className="brand"
          href="#dashboard"
          onClick={() => navigate("dashboard")}
        >
          <span className="brand-mark">
            <Command size={23} strokeWidth={1.5} />
          </span>
          <span>
            REALITY <b>OS</b>
            <small>LIFE IN PROGRESS</small>
          </span>
        </a>
        <div className="workspace-selector">
          <span className="workspace-avatar">K</span>
          <div>
            <strong>个人世界</strong>
            <span>Personal workspace</span>
          </div>
          <ChevronDown size={14} />
        </div>
        <div className="nav-caption">WORKSPACE</div>
        <nav aria-label="主导航">
          {navigation.map((n) => (
            <button
              key={n.id}
              className={page === n.id ? "selected" : ""}
              aria-current={page === n.id ? "page" : undefined}
              onClick={() => navigate(n.id)}
            >
              <n.icon size={18} />
              <span className="nav-label">
                {n.title}
                <small>{n.english}</small>
              </span>
              {n.id === "quests" ? (
                <span className="nav-count">
                  {state.quests.filter((q) => q.status === "active").length ||
                    state.quests.filter((q) => q.status === "available").length}
                </span>
              ) : page === n.id ? (
                <span className="nav-dot" />
              ) : null}
            </button>
          ))}
        </nav>
        <div className="sidebar-season">
          <div className="eyebrow">
            <Flag size={12} /> {state.season.name}
          </div>
          <h3>{state.season.subtitle}</h3>
          
          <button onClick={() => navigate("season")}>
            继续你的旅程
            <ArrowUpRight size={13} />
          </button>
        </div>
        <div className="sidebar-bottom">
          <button
            className={page === "settings" ? "selected" : ""}
            onClick={() => navigate("settings")}
          >
            <Settings2 size={17} />
            系统设置
          </button>
          <button onClick={() => setHelp(true)}>
            <CircleHelp size={17} />
            使用指南
            <ArrowUpRight size={13} />
          </button>
          <div className="sidebar-profile">
            <div className="profile-avatar">
              {state.profile.displayName.slice(0, 1).toUpperCase()}
            </div>
            <div>
              <strong>{state.profile.displayName}</strong>
              <span>个人档案</span>
            </div>
            <span className="online-indicator" />
          </div>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="mobile-menu"
              onClick={() => setMenu(!menu)}
              aria-label="展开导航"
            >
              <Menu size={20} />
            </button>
            <span>我的世界</span>
            <span>/</span>
            <strong>{active?.title ?? "系统设置"}</strong>
          </div>
          <div className="topbar-right">
            <button className="growth-currency" onClick={() => navigate("rewards")} aria-label={`奖励，${state.collection.coins} 游戏币`}>
              <Sparkles size={14} />
              {state.collection.coins.toLocaleString()}
              <small>币</small>
            </button>
            <button
              className="growth-help"
              onClick={() => setHelp(true)}
              aria-label="使用指南"
            >
              <CircleHelp size={17} />
            </button>
            <span className="save-indicator">
              <span className="live-dot" />
              {saving
                ? "保存中…"
                : error
                  ? "保存异常"
                  : mode === "local"
                    ? "本地已保存"
                    : "云端已保存"}
            </span>
            <span className="topbar-date">{today}</span>
            <button
              className="profile-mini"
              onClick={() => navigate("settings")}
              aria-label="个人设置"
            >
              {state.profile.displayName.slice(0, 1).toUpperCase()}
            </button>
          </div>
        </header>
        <main id="main-content" className="main-content">
          {error && (
            <div className="error-banner" role="alert">
              {error}
              <Button
                variant="secondary"
                size="sm"
                onClick={() => update((s) => ({ ...s }))}
              >
                重试保存
              </Button>
            </div>
          )}
          {page === "dashboard" && (
            <Dashboard
              navigate={navigate}
              onCreate={create}
              onFocus={() => setFocus(true)}
              onLog={() => setLog(true)}
              onEnd={() => setEnd(true)}
              onSuggestion={(q) => {
                setEditing(undefined);
                setDefaults(q);
                setEditor(true);
              }}
            />
          )}
          {page === "quests" && (
            <Quests
              onCreate={create}
              onEdit={(q) => {
                setEditing(q);
                setEditor(true);
              }}
            />
          )}
          {page === "rewards" && <RewardsPage />}
          {page === "skills" && <Skills initialSkillId={selectedSkill} />}
          {page === "stats" && <Stats />}
          {page === "season" && <SeasonPage />}
          {page === "settings" && <Settings />}
        </main>
      </div>
      <QuestEditor
        open={editor}
        onClose={() => setEditor(false)}
        quest={editing}
        defaults={defaults}
      />
      <FocusModal open={focus} onClose={() => setFocus(false)} />
      <Modal
        open={end}
        onClose={() => setEnd(false)}
        title="今天，到这里就很好"
        description="复盘不是评分。记录一点收获，然后安心休息。"
      >
        <form
          className="form-stack"
          onSubmit={(e) => {
            e.preventDefault();
            const notes = String(new FormData(e.currentTarget).get("notes"));
            update((s) => ({
              ...s,
              runs: s.runs.map((r) =>
                r.date === dateKey()
                  ? { ...r, notes, endedAt: new Date().toISOString() }
                  : r,
              ),
            }));
            setEnd(false);
            notify("今天的记录已保存。休息也是成长的一部分。");
          }}
        >
          <div className="end-summary">
            <strong>
              {run.completedQuestCount}
              <span>主任务完成</span>
            </strong>
            <strong>
              {state.collection.transactions.filter((t) => t.id.startsWith("quest:") && dateKey(new Date(t.at)) === dateKey()).reduce((sum, t) => sum + t.coins, 0)}
              <span>游戏币获得</span>
            </strong>
            <strong>
              {run.score}%<span>今日进度</span>
            </strong>
          </div>
          <label>
            今天有什么值得记住？
            <textarea
              name="notes"
              defaultValue={run.notes}
              rows={4}
              maxLength={3000}
              placeholder="一点进展、一个发现，或一句给自己的话…"
            />
          </label>
          <Button type="submit">保存今日复盘</Button>
        </form>
      </Modal>
      <Modal
        open={log}
        onClose={() => setLog(false)}
        title="记录一次真实投入"
        description="补记已发生的专注或行动时间，不额外发放游戏币。"
      >
        <form
          className="form-stack"
          onSubmit={(e) => {
            e.preventDefault();
            const data = new FormData(e.currentTarget),
              minutes = Number(data.get("minutes")),
              questId = String(data.get("quest"));
            if (!Number.isFinite(minutes) || minutes < 1 || minutes > 480)
              return;
            update((s) => ({
              ...s,
              sessions: [
                ...s.sessions,
                {
                  id: crypto.randomUUID(),
                  questId,
                  minutes,
                  at: new Date().toISOString(),
                },
              ],
              quests: s.quests.map((q) =>
                q.id === questId
                  ? { ...q, actualMinutes: q.actualMinutes + minutes }
                  : q,
              ),
            }));
            setLog(false);
            notify(`已记录 ${minutes} 分钟行动`);
          }}
        >
          <label>
            关联任务
            <select name="quest">
              {state.quests
                .filter(
                  (q) =>
                    q.status === "active" ||
                    q.status === "available" ||
                    q.status === "completed",
                )
                .map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.title}
                  </option>
                ))}
            </select>
          </label>
          <label>
            实际投入（分钟）
            <input
              type="number"
              name="minutes"
              min={1}
              max={480}
              defaultValue={25}
              required
            />
          </label>
          <Button type="submit">记录行动</Button>
        </form>
      </Modal>
      <Modal
        open={help}
        onClose={() => setHelp(false)}
        title="欢迎来到 Reality OS"
        description="一个帮助你开始行动的个人成长系统。"
      >
        <ol className="guide-list">
          <li>从今日三个主任务中，选一个现在能开始的行动。</li>
          <li>点击播放按钮开始任务，或按 F 进入专注模式。</li>
          <li>完成后点击任务左侧圆圈，直接获得游戏币，可用于兑换给自己的奖励。</li>
          <li>按 N 创建新任务；用任务链把大目标拆成具体步骤。</li>
          <li>{WORKDAY_RULE}；在奖励页兑换自己的具体愿望，在成长档案回顾投入。</li>
        </ol>
        <p className="hint">
          <Sparkles size={16} />
          不需要每天满分。数据自动保存，设置中可以导出备份。
        </p>
      </Modal>
    </div>
  );
}

