"use client";
import { useId } from "react";
import type { CollectibleCard } from "../types/collection";
import { RARITIES } from "../data/cards";
import styles from "./collection.module.css";
export function CardArt({ card, muted = false }: { card: CollectibleCard; muted?: boolean }) {
  const id = useId().replace(/:/g, "");
  const ink = card.accent;
  return <div className={`${styles.art} ${muted ? styles.unowned : ""}`} style={{ "--card-color": card.color, "--card-accent": ink } as React.CSSProperties}>
    <div className={styles.cardTop}><span>{card.set}</span><b>{RARITIES[card.rarity].name}</b></div>
    <svg viewBox="0 0 240 250" role="img" aria-label={`${card.name}插画`}>
      <defs><linearGradient id={`${id}-glow`} x2="0" y2="1"><stop stopColor={ink} /><stop offset="1" stopColor={card.color} /></linearGradient></defs>
      <circle cx="120" cy="111" r="86" fill="none" stroke={ink} opacity=".18" />
      <circle cx="120" cy="111" r="66" fill="none" stroke={ink} opacity=".12" />
      {[ [30,44],[191,32],[214,117],[51,161],[170,175],[71,25] ].map(([x,y],i)=><circle key={i} cx={x} cy={y} r={i % 2 ? 1.5 : 2.3} fill={ink} opacity=".7" />)}
      <g fill={ink} stroke={ink} strokeLinejoin="round">
        {card.motif === "planet" && <><circle cx="120" cy="109" r="47" fill={`url(#${id}-glow)`} strokeWidth="0"/><ellipse cx="120" cy="114" rx="91" ry="20" fill="none" strokeWidth="5" transform="rotate(-25 120 114)"/><circle cx="187" cy="44" r="10"/><path d="M76 182l8 14 16 4-16 4-8 14-4-14-16-4 16-4z" stroke="none"/></>}
        {card.motif === "tower" && <><path d="M91 193l14-111h30l14 111z" fill={`url(#${id}-glow)`}/><path d="M98 76h44l-22-23zM98 91h44"/><rect x="106" y="77" width="28" height="18"/><path d="M112 84L24 47v74zM129 84l86-37v74z" opacity=".2" stroke="none"/><path d="M26 209q40-23 80 0t108 0" fill="none" strokeWidth="3"/></>}
        {card.motif === "ship" && <><circle cx="73" cy="64" r="27" opacity=".2"/><path d="M43 164L186 53l-45 137-30-58z" fill={`url(#${id}-glow)`}/><path d="M43 164l68-32 75-79M111 132l30 58" fill="none" strokeWidth="2"/><path d="M82 159l-31 41m58-37l-28 52" fill="none" strokeWidth="3" opacity=".5"/></>}
        {card.motif === "gate" && <><path d="M66 210V103a54 54 0 01108 0v107" fill="none" strokeWidth="12"/><path d="M85 210V104a35 35 0 0170 0v106" fill={`url(#${id}-glow)`} opacity=".5"/><path d="M38 219h164M55 206h130M76 193h88" fill="none" strokeWidth="3"/><path d="M120 71l9 29 29 9-29 9-9 29-9-29-29-9 29-9z"/></>}
        {card.motif === "city" && <><circle cx="164" cy="81" r="44" opacity=".65"/><path d="M26 199V122h43v-23h38v42h34v-25h42v36h31v47" fill={card.color} strokeWidth="3"/>{[42,80,95,155,170,197].map((x,i)=><path key={x} d={`M${x} ${145+i%2*20}v10m0 10v10`} strokeWidth="4"/>)}<path d="M72 99l9-26 9 26M27 213h185" fill="none" strokeWidth="2"/></>}
        {card.motif === "train" && <><circle cx="177" cy="62" r="24" opacity=".5"/><path d="M57 222l28-31m99 31l-28-31M50 230h140M60 216h123" fill="none" strokeWidth="3"/><rect x="70" y="71" width="100" height="124" rx="28" fill={`url(#${id}-glow)`}/><rect x="82" y="89" width="76" height="54" rx="9" fill={card.color}/><path d="M120 90v52M85 158h70" strokeWidth="3"/><circle cx="91" cy="177" r="6" fill={card.color}/><circle cx="149" cy="177" r="6" fill={card.color}/></>}
        {card.motif === "moon" && <><path d="M60 214V71a60 60 0 01120 0v143z" fill="none" strokeWidth="5"/><path d="M120 12v200M61 124h118M46 215h149" fill="none" strokeWidth="3"/><circle cx="135" cy="76" r="35"/><circle cx="150" cy="65" r="30" fill={card.color} stroke="none"/><path d="M68 211l47-57 39 57" opacity=".35"/></>}
        {card.motif === "sun" && <><circle cx="120" cy="103" r="45" fill={`url(#${id}-glow)`}/>{Array.from({length:12},(_,i)=><path key={i} d="M120 31v-14" transform={`rotate(${i*30} 120 103)`} strokeWidth="3"/>)}<path d="M34 216l46-59h80l46 59M80 157v-16h80v16M46 198h148M66 177h108" fill="none" strokeWidth="3"/></>}
        {card.motif === "mountain" && <><circle cx="169" cy="67" r="28" opacity=".7"/><path d="M20 205L97 62l48 89 27-42 51 96z" fill={`url(#${id}-glow)`}/><path d="M72 110l25-48 25 48-25-12z" fill="#ecf9f3" stroke="none"/><path d="M96 132l-21 68M163 155l-24 45" fill="none" strokeWidth="2" opacity=".5"/></>}
        {card.motif === "tree" && <><circle cx="122" cy="93" r="64" opacity=".14"/><path d="M119 36L67 117h29l-42 54h51v39h29v-39h51l-42-54h29z" fill={`url(#${id}-glow)`}/><path d="M120 80v127m0-60l-20-20m20 34l24-24M46 214h151" fill="none" strokeWidth="3"/></>}
        {card.motif === "whale" && <><path d="M30 114q21-62 97-21 28 18 51 13l22-29v54q-13 29-65 38-71 7-105-55z" fill={`url(#${id}-glow)`}/><path d="M128 157l-14 29-21-30"/><circle cx="56" cy="118" r="3" fill={card.color}/><path d="M48 85q-20-31 3-46m3 44q26-36 9-47M31 200q26-18 53 0t54 0 70 0" fill="none" strokeWidth="3" opacity=".7"/></>}
        {card.motif === "island" && <><circle cx="121" cy="95" r="65" opacity=".17"/><path d="M40 145q78-36 162 0l-79 77z" fill={`url(#${id}-glow)`}/><ellipse cx="120" cy="143" rx="80" ry="16"/><path d="M120 136V62m0 39l-24-24m24 42l31-29" fill="none" strokeWidth="5"/><circle cx="92" cy="64" r="25" fill="#b5e5ba" stroke="none"/><circle cx="133" cy="58" r="32" fill="#cce7ad" stroke="none"/><circle cx="151" cy="86" r="24" fill="#b5e5ba" stroke="none"/><path d="M15 180h36m146 11h30" strokeWidth="3"/></>}
      </g>
    </svg>
    <div className={styles.cardName}><h3>{card.name}</h3><p>{card.subtitle}</p></div>
    <span className={styles.edition}>{card.rarity === "legendary" ? "✦ ARCHIVE EDITION ✦" : "REALITY COLLECTION · 01"}</span>
  </div>;
}
