import {
  Brain,
  Code2,
  FlaskConical,
  ScanLine,
  HeartPulse,
  Users,
  Coffee,
  Crosshair,
  Crown,
  ArrowUpRight,
  type LucideIcon,
} from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import { levelProgress } from "../lib/game";
const icons: Record<string, LucideIcon> = {
  brain: Brain,
  code: Code2,
  flask: FlaskConical,
  scan: ScanLine,
  heart: HeartPulse,
  users: Users,
  coffee: Coffee,
  target: Crosshair,
  chess: Crown,
};
export function SkillIcon({
  icon,
  color,
  size = 20,
}: {
  icon: string;
  color?: string;
  size?: number;
}) {
  const Icon = icons[icon] ?? Code2;
  return (
    <span
      className="skill-icon"
      style={{ "--accent": color ?? "#8fddbd" } as CSSProperties}
    >
      <Icon size={size} />
    </span>
  );
}
export function Progress({ value, color }: { value: number; color?: string }) {
  return (
    <div
      className="progress"
      role="progressbar"
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="成长进度"
    >
      <span
        style={{
          width: `${Math.min(100, Math.max(0, value))}%`,
          background: color,
        }}
      />
    </div>
  );
}
export function PanelTitle({
  eyebrow,
  title,
  action,
  onAction,
}: {
  eyebrow?: string;
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="panel-heading">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h2>{title}</h2>
      </div>
      {action && (
        <button className="text-link" onClick={onAction}>
          {action}
          <ArrowUpRight size={14} />
        </button>
      )}
    </div>
  );
}
export function Empty({ children }: { children: ReactNode }) {
  return (
    <div className="empty">
      <Crosshair size={30} />
      <p>{children}</p>
    </div>
  );
}
export function XpBar({ xp, color }: { xp: number; color?: string }) {
  const p = levelProgress(xp);
  return (
    <>
      <div className="xp-label">
        <span>LV. {p.level}</span>
        <span>
          {p.current.toLocaleString()} / {p.required.toLocaleString()} XP
        </span>
      </div>
      <Progress value={p.percent} color={color} />
    </>
  );
}

