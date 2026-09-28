"use client";
import { useState } from "react";
import { useGame } from "../hooks/use-game";
import { SkillIcon } from "./shared";
export function Skills({ initialSkillId = "research" }: { initialSkillId?: string }) {
  const { state } = useGame();
  const [selected, setSelected] = useState(initialSkillId);
  if (!state) return null;
  const skill = state.skills.find((s) => s.id === selected) ?? state.skills[0];
  const events = state.completions.filter((c) => c.skillId === skill?.id);
  const minutes = state.sessions.filter((session) => state.quests.find((q) => q.id === session.questId)?.skillId === skill?.id).reduce((sum,s) => sum+s.minutes,0);
  return <>
    <div className="page-title"><div><span className="eyebrow">YOUR DIRECTIONS</span><h1>行动方向</h1><p className="muted">记录你把时间花在哪里。所有方向都可以直接开始。</p></div></div>
    <div className="skill-page-grid"><section className="panel tree-canvas"><div className="tree-roots">
      {state.skills.map((s) => <button key={s.id} className={`skill-node ${selected === s.id ? "selected" : ""}`} onClick={() => setSelected(s.id)}><SkillIcon icon={s.icon} color={s.color}/><div><strong>{s.name}</strong><p className="tiny muted">{state.completions.filter((c) => c.skillId === s.id).length} 个已完成任务</p></div></button>)}
    </div></section>{skill && <aside className="panel skill-detail"><SkillIcon icon={skill.icon} color={skill.color} size={30}/><h2>{skill.name}</h2><p className="muted">{skill.description}</p><div className="detail-stat"><span>完成任务</span><strong>{events.length}</strong></div><div className="detail-stat"><span>记录投入</span><strong>{Math.round(minutes)} 分钟</strong></div><h3>最近的行动</h3>{events.slice(-5).reverse().map((c)=><div className="growth-row" key={c.id}><span>{c.title}</span><small>已完成</small></div>)}{!events.length && <p className="muted tiny">完成关联任务后，行动记录会出现在这里。</p>}</aside>}</div>
  </>;
}
