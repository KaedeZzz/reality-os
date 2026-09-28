import type { Metadata } from "next";
import "./globals.css";
import "./growth.css";
export const metadata: Metadata = {
  title: "Reality OS · 让真实生活升级",
  description: "把每一个真实行动，变成可见的成长。你的个人 RPG 生产力系统。",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}

