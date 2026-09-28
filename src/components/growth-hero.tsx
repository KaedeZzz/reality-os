"use client";

import { ArrowUpRight, Play, Shield, Star, Trophy, Zap } from "lucide-react";
import { useGame } from "../hooks/use-game";
import { dateKey, levelProgress } from "../lib/game";
import { Progress, SkillIcon } from "./shared";
import { Button } from "./ui/button";

const abbreviations: Record<string, string> = {
  engineering: "ENG",
  research: "RES",
  chess: "CHS",
  fitness: "FIT",
  social: "SOC",
  admin: "LIF",
};

export function GrowthHero({
  onFocus,
  navigate,
}: {
  onFocus: () => void;
  navigate: (page: string, skillId?: string) => void;
}) {
  const { state } = useGame();
  if (!state) return null;
  const progress = levelProgress(state.profile.totalXp);
  const skills = state.skills.filter((s) => !s.parentSkillId).slice(0, 6);
  const today = state.runs.find((r) => r.date === dateKey());
  return (
    <>
      <section className="growth-hero" aria-label="你的成长档案">
        <div className="ambient-lines" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div className="growth-hero-copy">
          <div className="growth-kicker">
            <span className="live-dot" /> {state.season.name} <span>/</span>{" "}
            GROW AT YOUR OWN PACE
          </div>
          <h2>
            YOUR NEXT
            <br />
            <em>LEVEL.</em>
          </h2>
          <p className="growth-hero-subtitle">把时间，变成你的成长。</p>
          <p className="growth-hero-description">
            从一个具体的小行动开始，
            <br />
            让每一份投入，都看得见。
          </p>
          <div className="button-row">
            <Button onClick={onFocus}>
              <Play size={17} fill="currentColor" />
              {state.timer ? "继续专注" : "开始专注"}
            </Button>
            <button
              className="growth-secondary"
              onClick={() => navigate("skills")}
            >
              探索技能树
              <ArrowUpRight size={17} />
            </button>
          </div>
          <div className="growth-match-info">
            <span>
              <Shield size={14} />
              按自己的节奏成长
            </span>
            <span>
              <Zap size={14} />
              {today?.earnedXp ?? 0} XP 今日获得
            </span>
          </div>
        </div>
        <div className="profile-stage">
          <span className="stage-word" aria-hidden="true">
            EVOLVE
          </span>
          <div
            className="profile-card"
            aria-label={`${state.profile.displayName}，等级 ${progress.level}，六项技能等级`}
          >
            <div className="profile-card-inner">
              <div className="profile-rating">
                <strong>{progress.level}</strong>
                <span>LEVEL</span>
                <Shield size={21} strokeWidth={1.5} />
              </div>
              <div className="profile-rarity">
                PERSONAL
                <br />
                PROGRESS
              </div>
              <div className="profile-crest" aria-hidden="true">
                <span>
                  {state.profile.displayName.slice(0, 1).toUpperCase()}
                  <span>✳</span>
                </span>
                <div className="crest-stars">
                  <Star />
                  <Star />
                  <Star />
                </div>
              </div>
              <h3>{state.profile.displayName}</h3>
              <div className="profile-edition">REALITY OS · PERSONAL GROWTH</div>
              <div className="profile-attributes">
                {skills.map((s) => (
                  <div key={s.id}>
                    <strong>{s.level}</strong>
                    <span>
                      {abbreviations[s.id] ?? s.name.slice(0, 3).toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
              <div className="profile-card-footer">
                <Trophy size={13} />
                <span>每一项属性，来自真实行动</span>
              </div>
            </div>
          </div>
          <div className="profile-caption">
            <span className="live-dot" />
            生涯经验 <strong>{state.profile.totalXp.toLocaleString()}</strong>
            <span>XP</span>
          </div>
        </div>
        <div className="growth-level-track">
          <span>LV. {progress.level}</span>
          <Progress value={progress.percent} />
          <span>
            {progress.current.toLocaleString()} /{" "}
            {progress.required.toLocaleString()} XP
          </span>
          <strong>LV. {progress.level + 1}</strong>
        </div>
      </section>
      <section className="skills-band" aria-label="技能成长概览">
        <div className="skills-band-heading">
          <span className="eyebrow">YOUR GROWTH, IN COLOR</span>
          <h2>我的技能</h2>
          <span>每个方向，都有进步</span>
        </div>
        <div className="skills-band-cards">
          {skills.map((s) => (
            <button
              key={s.id}
              className="skill-tile"
              onClick={() => navigate("skills", s.id)}
              aria-label={`查看${s.name}技能，等级${s.level}`}
            >
              <SkillIcon icon={s.icon} color={s.color} />
              <span>
                <strong>{s.name}</strong>
                <small>{abbreviations[s.id] ?? "SKL"}</small>
              </span>
              <b>{String(s.level).padStart(2, "0")}</b>
            </button>
          ))}
        </div>
      </section>
    </>
  );
}

