"use client";
import { ArrowUpRight, Plus, Play, Moon, Activity } from "lucide-react";
import { useGame } from "../hooks/use-game";
import { dateKey } from "../lib/game";
import { Button } from "./ui/button";
import { RewardsEntry } from "./rewards";
import { QuestCard } from "./quests";
import type { Quest } from "../types/game";
import styles from "./dashboard.module.css";

export function Dashboard({ navigate, onCreate, onFocus, onLog, onEnd }: {
  navigate: (page: string, skillId?: string) => void;
  onCreate: () => void;
  onFocus: () => void;
  onLog: () => void;
  onEnd: () => void;
  onSuggestion: (q: Partial<Quest>) => void;
}) {
  const { state, update } = useGame();
  if (!state) return null;
  const today = dateKey();
  const run = state.runs.find((r) => r.date === today)!;
  const daily = run.dailyQuestIds
    .map((id) => state.quests.find((q) => q.id === id))
    .filter((q): q is Quest => !!q);
  const completed = daily.filter((q) => q.status === "completed").length;
  const focusToday = Math.round(state.sessions
    .filter((s) => dateKey(new Date(s.at)) === today)
    .reduce((sum, s) => sum + s.minutes, 0));
  return (
    <div className={styles.home}>
      <header className={styles.heading}>
        <div>
          <h1>今天</h1>
          <p>{state.profile.displayName}，一次做好一件事。</p>
        </div>
        <Button variant="secondary" onClick={onCreate}><Plus size={17} />创建任务</Button>
      </header>

      <section className={styles.focus} aria-label="专注入口">
        <div>
          <h2>{state.timer ? "回到你的专注时间" : "给重要的事，留一点时间。"}</h2>
          <p>今天已专注 {focusToday} 分钟</p>
        </div>
        <Button onClick={onFocus}><Play size={17} fill="currentColor" />{state.timer ? "继续专注" : "开始专注"}</Button>
      </section>

      <section className={styles.tasks} aria-labelledby="today-tasks">
        <div className={styles.sectionHeading}>
          <h2 id="today-tasks">今日任务 <span>{completed} / {daily.length}</span></h2>
          <button onClick={() => navigate("quests")}>全部任务<ArrowUpRight size={16} /></button>
        </div>
        <div className={`daily-cards ${styles.cards}`}>
          {daily.map((q) => <QuestCard key={q.id} quest={q} />)}
          {!daily.length && <div className="empty">今天还没有任务。<button className="text-link" onClick={onCreate}>添加一个小行动</button></div>}
        </div>
      </section>

      <RewardsEntry onOpen={() => navigate("rewards")} />
      <div className={styles.bottom}>
        <details className={styles.checkin}>
          <summary>调整今日状态</summary>
          <div className={styles.sliders}>
            {([['energy', '能量'], ['focus', '专注']] as const).map(([key, label]) => (
              <label key={key}>
                <span>{label}<b>{run[key]}%</b></span>
                <input aria-label={label} type="range" min={0} max={100} value={run[key]}
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    update((s) => ({ ...s, runs: s.runs.map((r) => r.date === today ? { ...r, [key]: value } : r) }));
                  }} />
              </label>
            ))}
          </div>
        </details>
        <div className={styles.actions}>
          <button onClick={onLog}><Activity size={16} />记录行动</button>
          <button onClick={onEnd}><Moon size={16} />{run.endedAt ? "查看今日复盘" : "结束今天"}</button>
        </div>
      </div>
    </div>
  );
}
