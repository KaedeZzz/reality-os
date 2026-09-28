"use client";
import { useState } from "react";
import { Check, LockKeyhole, ArrowRight, Flag, Plus, Award } from "lucide-react";
import { useGame } from "../hooks/use-game";
import { completeQuest, createJourney, isQuestUnlocked } from "../lib/game";
import { Button } from "./ui/button";
import { Modal } from "./ui/modal";
import styles from "./journeys.module.css";

export function JourneyEntry() {
  const { state } = useGame();
  const [open, setOpen] = useState(false);
  if (!state) return null;
  const journeys = state.chains.filter((c) => c.journey);
  const current = journeys.find((c) => !c.card);
  const next = current?.stageIds?.map((id) => state.quests.find((q) => q.id === id)).find((q) => q && q.status !== "completed");
  return <>
    <button className={styles.entry} onClick={() => setOpen(true)}>
      <Flag size={20} />
      <span><strong>{current ? current.title : journeys.length ? "我的旅程与成果卡" : "开启你的第一段主线旅程"}</strong><small>{next ? `下一步 · ${next.title}` : "把一个真实目标，变成值得收藏的成果。"}</small></span>
      <ArrowRight size={18} />
    </button>
    <Modal open={open} onClose={() => setOpen(false)} title="主线旅程"><Journeys /></Modal>
  </>;
}

export function Journeys() {
  const { state, update, notify } = useGame();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [finishing, setFinishing] = useState<string | null>(null);
  if (!state) return null;
  const journeys = state.chains.filter((c) => c.journey);
  const active = journeys.filter((c) => !c.card);
  const cards = journeys.filter((c) => c.card);
  const finalChain = journeys.find((c) => c.stageIds?.includes(finishing ?? ""));
  const finish = (id: string, result?: string) => {
    update((s) => {
      const next = completeQuest(s, id).state;
      if (!result) return next;
      return { ...next, chains: next.chains.map((c) => c.stageIds?.includes(id) && c.card ? { ...c, card: { ...c.card, result } } : c) };
    });
    notify(result ? "旅程完成！你的成果卡已收入收藏。" : "阶段完成，下一步已解锁。");
    setFinishing(null);
  };
  return <div className={styles.content}>
    <div className={styles.toolbar}><p>一个目标，几步行动，一张属于你的成果卡。</p><Button size="sm" variant="secondary" onClick={() => { setCreating(!creating); setError(""); }}><Plus size={15} />{creating ? "收起创建" : "新旅程"}</Button></div>
    {creating && <form className={`form-stack ${styles.form}`} onSubmit={(e) => {
      e.preventDefault();
      const form = new FormData(e.currentTarget);
      try {
        const input = {
          title: String(form.get("title")), description: String(form.get("result")),
          skillId: String(form.get("skill")), minutes: Number(form.get("minutes")),
          stages: String(form.get("stages")).split(/\r?\n/).map((s) => s.trim()).filter(Boolean),
        };
        // Validate before queuing the state update so form errors remain visible.
        const next = createJourney(state, input);
        update((s) => ({ ...s, quests: [...s.quests, ...next.quests.slice(state.quests.length)], chains: [...s.chains, next.chains[next.chains.length - 1]] }));
        setCreating(false); setError(""); notify("旅程已开启，先完成第一步。");
      } catch (error) { setError(error instanceof Error && error.name !== "ZodError" ? error.message : "请填写目标、成果及 2–8 个阶段，每个阶段不超过 120 字。"); }
    }}>
      <label>我想完成什么<input name="title" required maxLength={100} placeholder="例如：做出第一个个人网站" /></label>
      <label>怎样算完成<textarea name="result" required maxLength={500} placeholder="例如：网站正式上线，并展示三个自己的作品。" /></label>
      <label>行动阶段 · 每行一个，按先后顺序<textarea name="stages" required rows={5} placeholder={'确定网站内容\n完成首页\n加入三个作品\n发布并检查网站'} /></label>
      <div className="form-grid"><label>成长方向<select name="skill">{state.skills.filter((s) => s.unlocked).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label><label>每阶段预计分钟<input type="number" name="minutes" min={1} max={480} defaultValue={30} required /></label></div>
      <p className="muted tiny">按顺序解锁，最后一步是终点挑战。预计时间用于计算游戏币奖励；成果卡只记录实际投入。</p>
      {error && <p role="alert">{error}</p>}
      <Button type="submit">开启旅程</Button>
    </form>}
    {!active.length && !creating && <div className={styles.empty}><Flag size={28} /><h3>{cards.length ? "为下一个目标留一点空间" : "第一段旅程，由你定义"}</h3><p>选一个有明确终点的目标，拆成 2–8 个能完成的阶段。</p><Button onClick={() => setCreating(true)}>创建主线旅程</Button></div>}
    {active.map((chain) => {
      const stages = (chain.stageIds ?? []).map((id) => state.quests.find((q) => q.id === id)).filter((q) => !!q);
      const count = stages.filter((q) => q.status === "completed").length;
      return <section className={styles.journey} key={chain.id}>
        <div className={styles.heading}><h3>{chain.title}</h3><span>{count} / {stages.length}</span></div>
        <p className={styles.description}>终点 · {chain.description}</p>
        <div className={styles.track} role="progressbar" aria-label={`${chain.title}进度`} aria-valuemin={0} aria-valuemax={stages.length} aria-valuenow={count}><span style={{ width: `${count / stages.length * 100}%` }} /></div>
        <ol className={styles.steps}>{stages.map((q, index) => {
          const done = q.status === "completed";
          const unlocked = isQuestUnlocked(q, state.quests) && state.skills.some((s) => s.id === q.skillId && s.unlocked);
          return <li key={q.id} className={done ? styles.done : unlocked ? styles.current : styles.locked}>
            <span className={styles.number}>{done ? <Check size={16} /> : unlocked ? index + 1 : <LockKeyhole size={14} />}</span>
            <div><strong>{q.title}</strong><small>{done ? "已完成" : !unlocked ? "完成上一阶段后解锁" : index === stages.length - 1 ? "终点挑战 · 完成后获得成果卡" : `当前阶段 · 预计 ${q.estimatedMinutes} 分钟`}</small></div>
            {!done && unlocked && <Button size="sm" variant="secondary" onClick={() => index === stages.length - 1 ? setFinishing(q.id) : finish(q.id)}>完成{index === stages.length - 1 ? "旅程" : "阶段"}</Button>}
          </li>;
        })}</ol>
      </section>;
    })}
    {!!cards.length && <section><h3 className={styles.collectionTitle}>成果收藏 · {cards.length}</h3><div className={styles.cards}>{cards.map((chain) => {
      const card = chain.card!;
      return <article className={styles.card} key={chain.id}>
        <div className={styles.seal}><Award size={32} /></div><span className={styles.label}>真实行动 · 成果纪念</span>
        <h3>{card.title}</h3><p>{card.result}</p><div className={styles.cardStats}><span><b>{card.stages}</b>完成阶段</span><span><b>{Math.round(card.minutes)}</b>记录分钟</span><span><b>{card.coins ?? 0}</b>获得游戏币</span></div>
        <footer>{card.skillName} · {new Date(card.earnedAt).toLocaleDateString("zh-CN")}</footer>
      </article>;
    })}</div></section>}
    <Modal open={!!finishing} onClose={() => setFinishing(null)} title="给这段旅程留下一个结尾" description="确认最后阶段已经完成，写下你真正做成了什么。">
      <form className="form-stack" onSubmit={(e) => { e.preventDefault(); const result = String(new FormData(e.currentTarget).get("result")).trim(); if (finishing && result) finish(finishing, result); }}>
        <label>我的成果<textarea name="result" required maxLength={500} rows={4} defaultValue={finalChain?.description} /></label>
        <p className="muted tiny">完成日期、阶段数和已记录的投入会保存在成果卡中。领取卡片不会额外重复发放游戏币。</p>
        <Button type="submit">完成旅程，收藏成果卡</Button>
      </form>
    </Modal>
  </div>;
}
