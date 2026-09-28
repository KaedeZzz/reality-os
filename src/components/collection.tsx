"use client";
import { useState } from "react";
import { Coins, Sparkles, ArrowRight, Heart, Compass, Check, Trophy } from "lucide-react";
import { useGame } from "../hooks/use-game";
import { CARDS, CARD_SETS, RARITIES, PACK_PRICE, findCard } from "../data/cards";
import { buyCard, buyPack, toggleShowcase } from "../lib/collection";
import type { GameState } from "../types/game";
import { CardArt } from "./card-art";
import { Button } from "./ui/button";
import { Modal } from "./ui/modal";
import styles from "./collection.module.css";

type Purchase = { kind: "card"; cardId: string; id: string } | { kind: "pack"; set: string; id: string };
export function CollectionEntry({ onOpen }: { onOpen: () => void }) {
  const { state } = useGame();
  if (!state) return null;
  const c = state.collection, wish = c.wishlist ? findCard(c.wishlist) : null;
  return <button className={styles.entry} onClick={onOpen}><Sparkles size={21} /><span><strong>{wish ? `心愿 · ${wish.name}` : "你的下一件收藏"}</strong><small>{wish ? `已攒 ${c.coins} / ${RARITIES[wish.rarity].price} 游戏币` : `已收藏 ${c.owned.length} / ${CARDS.length} · 选一个值得期待的目标`}</small></span><ArrowRight size={18} /></button>;
}
export function CollectionPage() {
  const { state, update, notify, saving, error } = useGame();
  const [tab, setTab] = useState("discover");
  const [theme, setTheme] = useState("all");
  const [selected, setSelected] = useState<string | null>(null);
  const [purchase, setPurchase] = useState<Purchase | null>(null);
  if (!state) return null;
  const c = state.collection;
  const owns = (id: string) => c.owned.some((o) => o.cardId === id);
  const wish = c.wishlist ? findCard(c.wishlist) : null;
  const detail = selected ? findCard(selected) : null;
  const execute = (fn: (s: GameState) => GameState, message: string) => {
    try { update(fn); notify(message); } catch (e) { notify(e instanceof Error ? e.message : "操作未完成"); }
  };
  const openPurchase = (cardId: string) => { setSelected(null); setPurchase({ kind: "card", cardId, id: crypto.randomUUID() }); };
  const list = CARDS.filter((card) => (theme === "all" || card.set === theme) && (tab !== "owned" || owns(card.id)));
  const canConfirm = purchase && (purchase.kind === "pack" ? c.coins >= PACK_PRICE && !c.pendingPack : !owns(purchase.cardId) && c.coins >= RARITIES[findCard(purchase.cardId)!.rarity].price);
  return <div className={styles.page}>
    <header className={styles.header}><div><span className="eyebrow">THE THINGS YOU LOVE</span><h1>收藏室</h1><p>把今天的投入，换成一点期待。</p></div><div className={styles.wallet}><span><Coins size={18} /><b>{c.coins.toLocaleString()}</b>游戏币</span></div></header>
    <section className={styles.wish}>
      <div><span className={styles.kicker}>{wish ? "正在期待" : "先找到你最想要的那一件"}</span><h2>{wish?.name ?? "为了喜欢，慢慢积累。"}</h2><p>{wish ? wish.subtitle : "完成任务赚游戏币，直接带走心仪收藏；也可以选择一个主题，探索未知。"}</p>{wish && <><div className={styles.progress}><span style={{ width: `${Math.min(100, c.coins / RARITIES[wish.rarity].price * 100)}%` }} /></div><small>{c.coins >= RARITIES[wish.rarity].price ? "已经攒够，可以带它回家了。" : `还差 ${RARITIES[wish.rarity].price - c.coins} 游戏币`}</small></>}</div>
      {wish ? <Button onClick={() => setSelected(wish.id)}>查看心愿<ArrowRight size={16} /></Button> : <div className={styles.emblem}><Heart size={42} /></div>}
    </section>
    <div className="tabs">{[["discover","发现收藏"],["owned",`我的收藏 · ${c.owned.length}`],["showcase","我的展台"]].map(([id,label]) => <button key={id} className={tab === id ? "selected" : ""} onClick={() => setTab(id)}>{label}</button>)}</div>
    {tab === "showcase" ? <section className={styles.showcase}>
      <div className={styles.sectionHeading}><h2>只展示你喜欢的</h2><span>{c.showcase.length} / 3 个展示位</span></div>
      <div className={styles.grid}>{c.showcase.map((id) => <button className={styles.cardButton} key={id} onClick={() => setSelected(id)}><CardArt card={findCard(id)!} /></button>)}{Array.from({length:3-c.showcase.length},(_,i)=><div key={i} className={styles.emptySlot}><Sparkles size={30}/><p>留给下一件喜欢的收藏</p><button className="text-link" onClick={() => setTab("owned")}>从卡册选择</button></div>)}</div>
      {!!c.completedSets.length && <div className={styles.badges}>{c.completedSets.map((set)=><span key={set}><Trophy size={18}/>{set} · 完整收藏</span>)}</div>}
    </section> : <>
      {tab === "discover" && <details className={styles.explore}>
        <summary><Compass size={20} /><span>主题探索<small>150 游戏币 · 3 件随机收藏 · 可选主题</small></span><span>展开</span></summary>
        <p>想要确定的收藏，可以直接购买。想遇到意外的喜欢，就选一个主题探索。</p>
        <div className={styles.expeditions}>{CARD_SETS.map((set)=><section key={set}><h3>{set}</h3><p>{CARDS.filter((card)=>card.set===set && owns(card.id)).length} / 4 已发现</p><Button size="sm" disabled={saving || !!error || c.coins < PACK_PRICE || !!c.pendingPack} onClick={() => setPurchase({kind:"pack",set,id:crypto.randomUUID()})}>探索 · {PACK_PRICE} 币</Button></section>)}</div>
        <p className={styles.rules}>每件基础概率：原初 70% / 珍藏 25% / 典藏 5%。连续 4 次探索未出典藏，第 5 次至少获得一件典藏；不同主题共用进度。距离保底最多 {5-c.packsSinceLegendary} 次。重复收藏自动返还：20 / 50 / 120 游戏币。</p>
      </details>}
      <div className={styles.filters}><label>主题<select value={theme} onChange={(e)=>setTheme(e.target.value)}><option value="all">全部主题</option>{CARD_SETS.map((set)=><option key={set}>{set}</option>)}</select></label><span>{list.length} 件收藏</span></div>
      <div className={styles.setProgress}>{CARD_SETS.filter((set)=>theme === "all" || theme === set).map((set)=><div key={set}><strong>{set}</strong><span>{CARDS.filter((card)=>card.set===set && owns(card.id)).length} / 4</span><small>{c.completedSets.includes(set) ? "已集齐 · 奖励已到账" : "集齐奖励：200 币 + 主题徽章"}</small></div>)}</div>
      {!list.length && <div className="empty">这里还没有收藏。去“发现收藏”选一件你喜欢的吧。</div>}
      <div className={styles.grid}>{list.map((card)=><div key={card.id} className={styles.catalogCard}>
        <button className={styles.cardButton} onClick={()=>setSelected(card.id)} aria-label={`查看${card.name}`}><CardArt card={card}/></button>
        <div className={styles.cardBottom}><span>{owns(card.id) ? <><Check size={14}/>已收藏</> : <><Coins size={14}/>{RARITIES[card.rarity].price}</>}</span><button aria-label={`${c.wishlist === card.id ? "取消" : "设为"}心愿 ${card.name}`} disabled={owns(card.id) || saving} onClick={()=>update((s)=>({...s,collection:{...s.collection,wishlist:s.collection.wishlist === card.id ? null : card.id}}))}><Heart size={17} fill={c.wishlist === card.id ? "currentColor" : "none"}/></button></div>
      </div>)}</div>
    </>}
    <details className={styles.history}><summary>资源记录与获取规则</summary><p>完成任务直接获得游戏币，奖励会显示在任务上。专注计时不直接发币。首次开启收藏系统赠送 300 币；旧演示历史不补发。游戏币不出售，无需付费。</p><p>原初 / 珍藏 / 典藏：直购 100 / 300 / 800 币。集齐奖励每个主题只发放一次。</p>{c.transactions.filter((t) => t.coins !== 0).slice(-12).reverse().map((t)=><div key={t.id}><span>{t.label}<small>{new Date(t.at).toLocaleDateString("zh-CN")}</small></span><b>{t.coins !== 0 ? `${t.coins>0?"+":""}${t.coins} 币` : ""}</b></div>)}</details>
    <Modal open={!!detail} onClose={()=>setSelected(null)} title={detail?.name ?? "收藏详情"} description={detail?.set}>
      {detail && <div className={styles.detail}><CardArt card={detail}/><p>{detail.story}</p><small>{RARITIES[detail.rarity].name} · {owns(detail.id) ? `收藏于 ${new Date(c.owned.find((o)=>o.cardId===detail.id)!.acquiredAt).toLocaleDateString("zh-CN")}` : "尚未收藏"}</small>
        {owns(detail.id) ? <Button disabled={saving || !!error} onClick={()=>execute((s)=>toggleShowcase(s,detail.id),"展示位已更新")}>{c.showcase.includes(detail.id) ? "从展台移下" : "放到我的展台"}</Button> : <><div className="button-row"><Button disabled={saving || !!error || c.coins < RARITIES[detail.rarity].price} onClick={()=>openPurchase(detail.id)}>购买 · {RARITIES[detail.rarity].price} 币</Button></div><Button variant="ghost" disabled={saving} onClick={()=>{ update((s)=>({...s,collection:{...s.collection,wishlist:detail.id}})); setSelected(null); notify("心愿已设置，主页会显示攒币进度。"); }}>设为我的心愿</Button></>}
      </div>}
    </Modal>
    <Modal open={!!purchase} onClose={()=>setPurchase(null)} title={purchase?.kind === "pack" ? "出发探索" : "带它回家"} description="确认后资源和收藏会一起保存。">
      {purchase && <><p>{purchase.kind === "pack" ? `${purchase.set}：消耗 ${PACK_PRICE} 游戏币，获得 3 件该主题的随机收藏。重复收藏返还游戏币。` : `${findCard(purchase.cardId)!.name}：消耗 ${RARITIES[findCard(purchase.cardId)!.rarity].price} 游戏币，获得指定收藏。`}</p><div className="modal-actions"><Button variant="ghost" onClick={()=>setPurchase(null)}>再想想</Button><Button disabled={!canConfirm || saving || !!error} onClick={()=>{
        const intent = purchase;
        execute((s)=>intent.kind === "pack" ? buyPack(s,intent.id,intent.set) : buyCard(s,intent.cardId,intent.id),intent.kind === "pack" ? "探索完成，发现已经保存。" : "新的收藏已入册。");
        setPurchase(null);
      }}>确认{purchase.kind === "pack" ? "探索" : "获取"}</Button></div></>}
    </Modal>
    <Modal open={!!c.pendingPack} onClose={()=>{if (!saving && !error) update((s)=>({...s,collection:{...s.collection,pendingPack:null}}));}} title="这次旅途的发现" description={c.pendingPack?.guaranteed ? "本次触发典藏保底，收藏已保存。" : "新的收藏已入册，重复的相遇也返还了游戏币。"}>
      <div className={styles.reveal}>{c.pendingPack?.cards.map((item,i)=><div key={i}><CardArt card={findCard(item.cardId)!}/><p>{item.duplicate ? `重复收藏 → +${item.refund ?? 0} 游戏币` : "新发现 · 已收藏"}</p></div>)}</div>
      <Button disabled={saving || !!error} onClick={()=>update((s)=>({...s,collection:{...s.collection,pendingPack:null}}))}>收好这次发现</Button>
    </Modal>
  </div>;
}
