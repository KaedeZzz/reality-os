"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { GameState } from "../types/game";
import { ensureDay } from "../lib/game";
import { repository, supabase } from "../lib/storage";

type Store = {
  state: GameState | null;
  error: string;
  saving: boolean;
  update: (fn: (state: GameState) => GameState) => void;
  reload: () => void;
  notify: (message: string) => void;
  mode: string;
};
const Context = createContext<Store | null>(null);
export function GameProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GameState | null>(null),
    [error, setError] = useState(""),
    [saving, setSaving] = useState(false),
    [toast, setToast] = useState("");
  const current = useRef<GameState | null>(null),
    queue = useRef(Promise.resolve()),
    toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const notify = useCallback((message: string) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 4000);
  }, []);
  const persist = useCallback((next: GameState) => {
    setSaving(true);
    queue.current = queue.current
      .catch(() => {})
      .then(() => repository.save(next))
      .then(() => {
        setError("");
        setSaving(false);
      })
      .catch((e: unknown) => {
        setError(
          `保存失败：${e instanceof Error ? e.message : "请检查存储权限"}。当前进度仍在内存中，请导出备份或重试保存。`,
        );
        setSaving(false);
      });
  }, []);
  const reload = useCallback(() => {
    setError("");
    repository
      .load()
      .then((s) => {
        current.current = s;
        setState(s);
        persist(s);
      })
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : "无法读取存档"),
      );
  }, [persist]);
  useEffect(() => {
    reload();
    const subscription = supabase?.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
        current.current = null;
        setState(null);
        setTimeout(reload, 0);
      }
    });
    return () => {
      subscription?.data.subscription.unsubscribe();
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, [reload]);
  const update = useCallback(
    (fn: (state: GameState) => GameState) => {
      if (!current.current) return;
      const next = fn(ensureDay(current.current));
      current.current = next;
      setState(next);
      persist(next);
    },
    [persist],
  );
  useEffect(() => {
    const id = setInterval(() => {
      if (current.current) {
        const next = ensureDay(current.current);
        if (next !== current.current) update(() => next);
      }
    }, 30000);
    return () => clearInterval(id);
  }, [update]);
  return (
    <Context.Provider
      value={{
        state,
        error,
        saving,
        update,
        reload,
        notify,
        mode: repository.mode,
      }}
    >
      {children}
      <div className={`toast ${toast ? "show" : ""}`} role="status">
        {toast}
      </div>
    </Context.Provider>
  );
}
export function useGame() {
  const value = useContext(Context);
  if (!value) throw new Error("GameProvider missing");
  return value;
}

