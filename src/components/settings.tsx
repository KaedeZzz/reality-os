"use client";
import { useRef, useState } from "react";
import {
  Download,
  Upload,
  ShieldCheck,
  HardDrive,
  Cloud,
  RefreshCcw,
} from "lucide-react";
import { useGame } from "../hooks/use-game";
import { createSeed } from "../data/seed";
import { ensureDay, refreshUnlocks } from "../lib/game";
import { parseState, supabase } from "../lib/storage";
import { Button } from "./ui/button";
import { Modal } from "./ui/modal";
import { PanelTitle } from "./shared";
import { VERSION_LABEL } from "../lib/version";
export function AuthForm() {
  const [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <form
      className="form-stack"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!supabase) return;
        setBusy(true);
        const data = new FormData(e.currentTarget),
          email = String(data.get("email")),
          password = String(data.get("password"));
        try {
          const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          setMessage(error?.message ?? "登录成功");
        } catch {
          setMessage("网络连接失败，请重试");
        } finally {
          setBusy(false);
        }
      }}
    >
      <label>
        邮箱
        <input type="email" name="email" required autoComplete="email" />
      </label>
      <label>
        密码
        <input
          type="password"
          name="password"
          minLength={6}
          required
          autoComplete="current-password"
        />
      </label>
      <Button disabled={busy} type="submit">
        {busy ? "正在登录…" : "登录 Supabase 账号"}
      </Button>
      <p className="hint">
        请先在 Supabase Authentication 中创建用户，并执行项目中的 schema.sql。
      </p>
      {message && <p role="status">{message}</p>}
    </form>
  );
}
export function Settings() {
  const { state, update, notify, mode, saving } = useGame(),
    [reset, setReset] = useState(false),
    [imported, setImported] = useState<ReturnType<typeof parseState> | null>(
      null,
    ),
    file = useRef<HTMLInputElement>(null);
  if (!state) return null;
  return (
    <>
      <div className="page-title">
        <div>
          <span className="eyebrow">MAKE IT YOURS</span>
          <h1>
            系统设置<span className="title-dot">.</span>
          </h1>
          <p className="muted">这是你的世界。节奏、方向和数据，都由你掌握。</p>
          <p className="muted tiny">{VERSION_LABEL}</p>
        </div>
      </div>
      <div className="settings-grid">
        <section className="panel">
          <PanelTitle eyebrow="IDENTITY" title="角色档案" />
          <form
            className="form-stack"
            onSubmit={(e) => {
              e.preventDefault();
              const name = String(
                new FormData(e.currentTarget).get("name"),
              ).trim();
              if (!name) return;
              update((s) => ({
                ...s,
                profile: { ...s.profile, displayName: name },
              }));
              notify("角色名称已更新");
            }}
          >
            <label>
              显示名称
              <input
                name="name"
                defaultValue={state.profile.displayName}
                required
                maxLength={60}
              />
            </label>
            <Button type="submit">保存档案</Button>
          </form>
        </section>
        <section className="panel">
          <PanelTitle eyebrow="YOUR DATA, YOUR CONTROL" title="数据与存档" />
          <div className="storage-status">
            {mode === "local" ? <HardDrive size={22} /> : <Cloud size={22} />}
            <div>
              <strong>
                {mode === "local" ? "本地存档模式" : "Supabase 云端存档"}
              </strong>
              <p className="muted tiny">
                {saving ? "正在保存…" : "进度已自动保存"} ·{" "}
                {state.demo ? "包含演示历史" : "个人进度"}
              </p>
            </div>
            <ShieldCheck size={20} />
          </div>
          <p className="muted">
            {mode === "local"
              ? (process.env.NEXT_PUBLIC_DESKTOP === "1" ? "数据保存在这台电脑的 Reality OS 应用目录中，关闭应用后仍会保留。建议定期导出备份。" : "数据保存在当前浏览器。清除浏览器数据会删除存档，建议定期导出。")
              : "数据通过账号隔离保存。当前采用单账号、单客户端写入模式。"}
          </p>
          <div className="button-row">
            <Button
              variant="secondary"
              onClick={() => {
                const url = URL.createObjectURL(
                  new Blob([JSON.stringify(state, null, 2)], {
                    type: "application/json",
                  }),
                );
                const a = document.createElement("a");
                a.href = url;
                a.download = `reality-os-${new Date().toISOString().slice(0, 10)}.json`;
                a.click();
                setTimeout(() => URL.revokeObjectURL(url), 1000);
                notify("存档已导出");
              }}
            >
              <Download size={15} />
              导出备份
            </Button>
            <Button variant="secondary" onClick={() => file.current?.click()}>
              <Upload size={15} />
              导入存档
            </Button>
          </div>
          <input
            hidden
            ref={file}
            type="file"
            accept="application/json,.json"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              try {
                if (f.size > 10 * 1024 * 1024)
                  throw new Error("存档超过 10 MB");
                setImported(parseState(JSON.parse(await f.text())));
              } catch (error) {
                notify(
                  `导入失败：${error instanceof Error ? error.message : "存档格式无效"}`,
                );
              }
              e.target.value = "";
            }}
          />
        </section>
        <section className="panel philosophy">
          <PanelTitle eyebrow="DESIGNED FOR REAL LIFE" title="温和，但持续" />
          <ul>
            <li>未完成的日子，不会抹去过去的努力。</li>
            <li>休息是节奏的一部分，不是失败。</li>
            <li>轻量任务奖励递减，鼓励有意义的行动。</li>
            <li>专注计时不提供挂机收益。</li>
            <li>所有难度建议，都由你决定是否接受。</li>
          </ul>
        </section>
        <section className="panel">
          <PanelTitle eyebrow="A FRESH START" title="开始自己的旅程" />
          <p className="muted">
            清空演示和个人进度，将游戏币、奖励记录和行动历史归零，保留示例任务与技能结构。此操作会覆盖当前存档，请先导出备份。
          </p>
          <Button variant="secondary" onClick={() => setReset(true)}>
            <RefreshCcw size={15} />
            清空进度，重新开始
          </Button>
          {supabase && (
            <Button
              variant="ghost"
              onClick={async () => {
                await supabase?.auth.signOut();
              }}
            >
              退出登录
            </Button>
          )}
        </section>
      </div>
      <Modal
        open={reset}
        onClose={() => setReset(false)}
        title="确认重新开始？"
        description="当前进度将被覆盖。建议先取消并导出备份。"
      >
        <div className="modal-actions">
          <Button variant="secondary" onClick={() => setReset(false)}>
            取消
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              const fresh = createSeed();
              fresh.profile = {
                ...fresh.profile,
                displayName: state.profile.displayName,
                id: state.profile.id,
                totalXp: 0,
                level: 1,
              };
              fresh.skills = fresh.skills.map((s) => ({
                ...s,
                xp: 0,
                level: 1,
                xpToNextLevel: 100,
              }));
              fresh.quests = fresh.quests
                .filter((q) => !q.id.startsWith("history-"))
                .map((q) => ({
                  ...q,
                  status: q.parentQuestId ? "backlog" : "available",
                  completedAt: undefined,
                  actualMinutes: 0,
                }));
              fresh.runs = [];
              fresh.completions = [];
              fresh.sessions = [];
              fresh.season = {
                ...fresh.season,
                seasonXp: 0,
                level: 1,
                objectives: fresh.season.objectives.map((o) => ({
                  ...o,
                  earnedXp: 0,
                })),
              };
              fresh.rewards = fresh.rewards.map((r) => ({
                ...r,
                available: false,
                claimedAt: undefined,
              }));
              fresh.demo = false;
              update(() => ensureDay(refreshUnlocks(fresh)));
              setReset(false);
              notify("新的旅程已开始。每一步，都算数。");
            }}
          >
            确认清空进度
          </Button>
        </div>
      </Modal>
      <Modal
        open={!!imported}
        onClose={() => setImported(null)}
        title="用导入存档替换当前进度？"
        description="存档已通过结构与依赖校验。替换后可通过先前导出的备份恢复。"
      >
        <p>
          {imported?.profile.displayName} ·{" "}
          {imported?.collection.coins.toLocaleString()} 游戏币 ·{" "}
          {imported?.quests.length} 个任务
        </p>
        <div className="modal-actions">
          <Button variant="secondary" onClick={() => setImported(null)}>
            取消
          </Button>
          <Button
            onClick={() => {
              if (imported)
                update((s) => ({
                  ...imported,
                  profile: { ...imported.profile, id: s.profile.id },
                }));
              setImported(null);
              notify("存档已恢复");
            }}
          >
            确认导入
          </Button>
        </div>
      </Modal>
    </>
  );
}


