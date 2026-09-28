"use client";
import { useEffect, useState } from "react";
import { Pause, Play, Check, Headphones } from "lucide-react";
import { useGame } from "../hooks/use-game";
import { isQuestUnlocked } from "../lib/game";
import { Modal } from "./ui/modal";
import { Button } from "./ui/button";
export function FocusModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { state, update, notify } = useGame(),
    [questId, setQuestId] = useState(""),
    [duration, setDuration] = useState(25),
    [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!open) return;
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, [open]);
  if (!state) return null;
  const timer = state.timer,
    eligible = state.quests.filter(
      (q) =>
        ["active", "available"].includes(q.status) &&
        isQuestUnlocked(q, state.quests) &&
        state.skills.find((s) => s.id === q.skillId)?.unlocked,
    ),
    chosen = questId || eligible[0]?.id;
  const remaining = timer
    ? Math.max(
        0,
        timer.remainingSeconds -
          (timer.startedAt ? (now - timer.startedAt) / 1000 : 0),
      )
    : duration * 60;
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="专注于此刻"
      description="一个任务，一段时间。不必一次完成所有事情。"
    >
      <div className="focus-content">
        <div className="focus-symbol">
          <Headphones size={26} />
        </div>
        {timer ? (
          <>
            <span className="eyebrow">ACTIVE QUEST</span>
            <h3>
              {state.quests.find((q) => q.id === timer.questId)?.title ??
                "自由专注"}
            </h3>
            <div className="timer">
              {String(Math.floor(remaining / 60)).padStart(2, "0")}
              <span>:</span>
              {String(Math.floor(remaining % 60)).padStart(2, "0")}
            </div>
            <p className="muted">
              {remaining <= 0
                ? "这段专注已完成，记得休息一下。"
                : timer.startedAt
                  ? "保持节奏，你正在前进。"
                  : "已暂停，准备好了再继续。"}
            </p>
            <div className="button-row">
              <Button
                variant="secondary"
                disabled={remaining <= 0}
                onClick={() => {
                  setNow(Date.now());
                  update((s) => {
                    if (!s.timer) return s;
                    const t = s.timer;
                    return {
                      ...s,
                      timer: t.startedAt
                        ? {
                            ...t,
                            remainingSeconds: Math.max(
                              0,
                              t.remainingSeconds -
                                (Date.now() - t.startedAt) / 1000,
                            ),
                            startedAt: null,
                          }
                        : { ...t, startedAt: Date.now() },
                    };
                  });
                }}
              >
                {timer.startedAt ? <Pause size={16} /> : <Play size={16} />}{" "}
                {timer.startedAt ? "暂停" : "继续"}
              </Button>
              <Button
                onClick={() => {
                  let minutes = 0;
                  update((s) => {
                    if (!s.timer) return s;
                    const t = s.timer,
                      left = Math.max(
                        0,
                        t.remainingSeconds -
                          (t.startedAt ? (Date.now() - t.startedAt) / 1000 : 0),
                      );
                    minutes = Math.floor((t.durationSeconds - left) / 6) / 10;
                    return {
                      ...s,
                      timer: null,
                      sessions:
                        minutes > 0
                          ? [
                              ...s.sessions,
                              {
                                id: crypto.randomUUID(),
                                questId: t.questId,
                                minutes,
                                at: new Date().toISOString(),
                              },
                            ]
                          : s.sessions,
                      quests: s.quests.map((q) =>
                        q.id === t.questId
                          ? { ...q, actualMinutes: q.actualMinutes + minutes }
                          : q,
                      ),
                    };
                  });
                  notify(
                    minutes > 0
                      ? `已记录 ${minutes} 分钟真实专注，辛苦了。`
                      : "专注已结束，不足 6 秒不计入统计。",
                  );
                  onClose();
                }}
              >
                <Check size={16} />
                结束并记录
              </Button>
            </div>
            <p className="tiny muted">
              只记录实际专注时间，不自动完成任务或发放游戏币。
            </p>
          </>
        ) : (
          <>
            <label className="focus-select">
              选择一个任务
              <select
                value={chosen ?? ""}
                onChange={(e) => setQuestId(e.target.value)}
              >
                {eligible.length ? (
                  eligible.map((q) => (
                    <option key={q.id} value={q.id}>
                      {q.title}
                    </option>
                  ))
                ) : (
                  <option value="">请先创建一个可开始的任务</option>
                )}
              </select>
            </label>
            <div className="duration-presets">
              {[25, 45, 60].map((m) => (
                <button
                  key={m}
                  className={duration === m ? "selected" : ""}
                  onClick={() => setDuration(m)}
                >
                  {m}
                  <small>分钟</small>
                </button>
              ))}
            </div>
            <label className="custom-duration">
              自定义时长
              <input
                type="number"
                min={1}
                max={180}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
              />
              分钟
            </label>
            <Button
              disabled={
                !chosen ||
                duration < 1 ||
                duration > 180 ||
                !Number.isInteger(duration)
              }
              onClick={() => {
                const startedAt = Date.now();
                setNow(startedAt);
                update((s) => ({
                  ...s,
                  timer: {
                    questId: chosen,
                    durationSeconds: duration * 60,
                    remainingSeconds: duration * 60,
                    startedAt,
                  },
                  quests: s.quests.map((q) =>
                    q.id === chosen ? { ...q, status: "active" } : q,
                  ),
                }));
              }}
            >
              <Play size={17} />
              开始专注
            </Button>
            <p className="tiny muted">
              计时器可在关闭窗口、刷新后继续。休息同样重要。
            </p>
          </>
        )}
      </div>
    </Modal>
  );
}

