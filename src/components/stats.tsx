"use client";
import { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import { Zap, CheckCircle2, Timer, CalendarDays } from "lucide-react";
import { useGame } from "../hooks/use-game";
import { dateKey, difficultyLabels } from "../lib/game";
import { PanelTitle, Progress, SkillIcon } from "./shared";
export function Stats() {
  const { state } = useGame(),
    [range, setRange] = useState(7);
  if (!state) return null;
  const earned = (questId: string) => state.collection.transactions.find((t) => t.id === `quest:${questId}`)?.coins ?? 0;
  const days = Array.from({ length: range }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (range - 1 - i));
    const key = dateKey(d),
      events = state.completions.filter((c) => dateKey(new Date(c.at)) === key);
    return {
      date: key.slice(5),
      key,
      xp: events.reduce((s, c) => s + earned(c.questId), 0),
      actions: events.length,
      focus: state.sessions
        .filter((s) => dateKey(new Date(s.at)) === key)
        .reduce((sum, s) => sum + s.minutes, 0),
    };
  });
  const events = state.completions.filter(
      (c) => dateKey(new Date(c.at)) >= days[0].key,
    ),
    totalXp = events.reduce((s, c) => s + earned(c.questId), 0),
    minutes = days.reduce((s, d) => s + d.focus, 0),
    runs = state.runs.filter((r) => r.date >= days[0].key),
    planned = runs.reduce((s, r) => s + r.dailyQuestIds.length, 0),
    done = runs.reduce((s, r) => s + r.completedQuestCount, 0),
    rate = planned ? Math.round((done / planned) * 100) : 0;
  const bySkill = state.skills
    .map((s) => ({
      ...s,
      growth: events
        .filter((c) => c.skillId === s.id)
        .reduce((n, c) => n + earned(c.questId), 0),
    }))
    .filter((s) => s.growth > 0)
    .sort((a, b) => b.growth - a.growth);
  const distribution = Object.entries(difficultyLabels).map(([key, name]) => ({
    name,
    value: events.filter((c) => c.difficulty === key).length,
  }));
  const weekdays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"]
    .map((name, index) => ({
      name,
      xp: events
        .filter((c) => new Date(c.at).getDay() === index)
        .reduce((s, c) => s + earned(c.questId), 0),
    }))
    .sort((a, b) => b.xp - a.xp);
  const tooltip = {
    contentStyle: {
      background: "#202522",
      border: "1px solid #384039",
      borderRadius: 10,
      color: "#eef1ee",
    },
    labelStyle: { color: "#aaa" },
    itemStyle: { color: "#8fddbd" },
  };
  return (
    <>
      <div className="page-title">
        <div>
          <span className="eyebrow">A RECORD OF SHOWING UP</span>
          <h1>
            成长档案<span className="title-dot">.</span>
          </h1>
          <p className="muted">看见真实投入，而不是追逐完美的连续记录。</p>
        </div>
        <div className="segmented">
          {[7, 30, 90].map((n) => (
            <button
              key={n}
              className={range === n ? "selected" : ""}
              onClick={() => setRange(n)}
            >
              {n} 天
            </button>
          ))}
        </div>
      </div>
      {state.demo && (
        <p className="demo-note">
          包含初始演示历史。可在设置中清空示例进度，开始自己的记录。
        </p>
      )}
      <div className="metric-grid">
        {[
          {
            name: "获得游戏币",
            value: totalXp.toLocaleString(),
            unit: "币",
            icon: Zap,
          },
          { name: "主任务完成率", value: rate, unit: "%", icon: CheckCircle2 },
          {
            name: "专注投入",
            value: Math.round(minutes),
            unit: "分钟",
            icon: Timer,
          },
          {
            name: "有行动的日子",
            value: days.filter((d) => d.actions > 0 || d.focus > 0).length,
            unit: `/ ${range} 天`,
            icon: CalendarDays,
          },
        ].map((m) => (
          <section className="panel metric" key={m.name}>
            <div>
              <span>{m.name}</span>
              <m.icon size={17} />
            </div>
            <strong>
              {m.value}
              <small>{m.unit}</small>
            </strong>
          </section>
        ))}
      </div>
      <div className="stats-grid">
        <section className="panel chart-wide">
          <PanelTitle eyebrow="COINS EARNED" title="任务收入" />
          <div className="chart">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={days}
                margin={{ top: 15, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="xpGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8fddbd" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#8fddbd" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#2b312e" vertical={false} />
                <XAxis
                  dataKey="date"
                  stroke="#8e9993"
                  tickLine={false}
                  axisLine={false}
                  minTickGap={30}
                  fontSize={11}
                />
                <YAxis
                  stroke="#8e9993"
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                />
                <Tooltip {...tooltip} />
                <Area
                  name="获得游戏币"
                  type="monotone"
                  dataKey="xp"
                  stroke="#8fddbd"
                  strokeWidth={2}
                  fill="url(#xpGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>
        <section className="panel">
          <PanelTitle eyebrow="WHERE YOU GROW" title="各方向任务收入" />
          {bySkill.length ? (
            bySkill.slice(0, 6).map((s) => (
              <div className="skill-row" key={s.id}>
                <SkillIcon icon={s.icon} color={s.color} />
                <div>
                  <div className="skill-row-title">
                    <strong>{s.name}</strong>
                    <span>+{s.growth} 币</span>
                  </div>
                  <Progress
                    value={(s.growth / Math.max(1, totalXp)) * 100}
                    color={s.color}
                  />
                </div>
              </div>
            ))
          ) : (
            <p className="muted">
              这段时间还没有记录，完成一个任务就会出现在这里。
            </p>
          )}
        </section>
        <section className="panel">
          <PanelTitle eyebrow="TIME WELL SPENT" title="专注分钟" />
          <div className="chart small">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={days}>
                <XAxis
                  dataKey="date"
                  stroke="#8e9993"
                  fontSize={11}
                  minTickGap={30}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip {...tooltip} />
                <Bar
                  dataKey="focus"
                  name="专注分钟"
                  fill="#afa0e7"
                  radius={[3, 3, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
        <section className="panel">
          <PanelTitle eyebrow="YOUR CHALLENGE MIX" title="任务难度分布" />
          <div className="chart small">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distribution}>
                <XAxis
                  dataKey="name"
                  stroke="#8e9993"
                  fontSize={12}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip {...tooltip} />
                <Bar dataKey="value" name="已完成任务" radius={[4, 4, 0, 0]}>
                  {distribution.map((d, i) => (
                    <Cell
                      key={d.name}
                      fill={
                        ["#72857c", "#89b59e", "#8fddbd", "#b1a0ef", "#deb57a"][
                          i
                        ]
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>
      <section className="insight-panel">
        <CalendarDays size={23} />
        <div>
          <h3>
            {events.length
              ? `${weekdays[0].name}，是你的高能时刻`
              : "你的节奏，即将被看见"}
          </h3>
          <p className="muted">
            {events.length
              ? `所选时间内，你在${weekdays[0].name}累计获得 ${weekdays[0].xp} 币。可以把重要任务留给适合自己的日子。`
              : "当你开始记录行动，我们会帮你发现适合自己的节奏。"}
          </p>
        </div>
      </section>
    </>
  );
}

