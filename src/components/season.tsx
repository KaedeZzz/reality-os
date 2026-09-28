"use client";
import { Trophy, Gift } from "lucide-react";
import { useGame } from "../hooks/use-game";
import { dateKey } from "../lib/game";
import { PanelTitle } from "./shared";
export function SeasonPage() {
  const { state } = useGame();
  if (!state) return null;
  const season = state.season;
  const events = state.completions.filter((c) => { const date = dateKey(new Date(c.at)); return date >= season.startDate && date <= season.endDate; });
  return <>
    <div className="page-title"><div><span className="eyebrow">YOUR SEASON</span><h1>赛季记录</h1><p className="muted">留住行动，也记得享受生活。</p></div></div>
    <section className="season-hero"><div><span className="eyebrow">{season.name}</span><h2>{season.subtitle}</h2><p>{season.startDate} — {season.endDate}</p><p>已完成 {events.length} 个任务</p></div><a href="#rewards" className="btn btn-secondary"><Gift size={18}/>给自己一份奖励</a></section>
    <div className="section-spacer"><PanelTitle title="成就记录"/></div><div className="achievements">{state.achievements.map((a) => <section className={`panel achievement ${a.unlockedAt ? "unlocked" : ""}`} key={a.id}><Trophy size={28}/><div><h3>{a.title}</h3><p className="muted">{a.description}</p><span className="tiny">{a.unlockedAt ? "已达成" : "尚未达成"}</span></div></section>)}</div>
  </>;
}
