# Reality OS 桌面版

双击项目根目录的 `Reality OS.lnk`，或打开 `release\Reality OS-win32-x64\Reality OS.exe`。

- 不需要浏览器、Node.js、终端或 localhost 端口，断网可用。
- 请保留整个 `Reality OS-win32-x64` 文件夹，不要单独移动 exe。可以为 exe 创建桌面快捷方式。
- 存档位于 `%APPDATA%\Reality OS`，独立于安装文件夹；关闭应用后保留。
- 迁移旧进度：网页版“系统设置 → 导出备份”，再在桌面版“系统设置 → 导入存档”。两份存档不会自动同步。
- 桌面版固定使用本地存档，不连接 Supabase。

开发者更新界面后运行 `npm run desktop:build` 重新打包；打包前关闭已打开的桌面版。浏览器开发预览仍可使用 `npm run dev`。
