import { useRef, useState } from "react";
import { useSettings } from "../app/hooks";
import { createBackup, parseBackup } from "../domain/export";
import type { AppSettings } from "../domain/episode";
import { db } from "../db/database";
import { settings as settingsRepository } from "../db/repository";

function downloadJson(value: unknown, filename: string) { const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type: "application/json" })); const anchor = document.createElement("a"); anchor.href = url; anchor.download = filename; anchor.click(); URL.revokeObjectURL(url); }

export function Settings() {
  const settings = useSettings();
  const input = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState("");
  const update = (patch: Partial<AppSettings>) => settingsRepository.update(patch);
  const backup = async () => { const metadata = await db.metadata.get("metadata"); if (!metadata) return; const value = await createBackup(await db.episodes.toArray(), settings, metadata); downloadJson(value, `vision-episode-tracker-backup-${new Date().toISOString().slice(0, 10)}.json`); await db.metadata.update("metadata", { lastBackupAt: new Date().toISOString(), changesSinceBackup: 0 }); setMessage("备份已导出，请把文件保存在安全的位置。"); };
  const restore = async (file?: File) => { if (!file) return; try { const value = await parseBackup(await file.text()); await db.transaction("rw", db.episodes, db.settings, db.metadata, async () => { for (const incoming of value.episodes) { const local = await db.episodes.get(incoming.id); if (!local || incoming.revision > local.revision || incoming.revision === local.revision && incoming.updatedAt > local.updatedAt) await db.episodes.put(incoming); } await db.settings.put(value.settings); }); setMessage(`恢复完成，共检查 ${value.episodes.length} 条记录；重复记录不会被新增。`); } catch (cause) { setMessage(cause instanceof Error ? cause.message : "无法恢复备份"); } finally { if (input.current) input.current.value = ""; } };
  return <main className="page narrow"><header><p className="eyebrow">设置</p><h1>数据与偏好</h1></header><section className="settings-group"><h2>常规</h2><label>报告时区<input value={settings.reportingTimezone} onChange={(event) => update({ reportingTimezone: event.target.value })} /></label><label>备份提醒<select value={settings.backupReminderDays} onChange={(event) => update({ backupReminderDays: Number(event.target.value) as 0 | 7 | 14 | 30 })}><option value="7">每 7 天</option><option value="14">每 14 天</option><option value="30">每 30 天</option><option value="0">关闭</option></select></label><label>外观<select value={settings.theme} onChange={(event) => update({ theme: event.target.value as AppSettings["theme"] })}><option value="system">跟随系统</option><option value="light">浅色</option><option value="dark">深色</option></select></label></section>
    <section className="settings-group"><h2>备份与恢复</h2><p>数据只保存在当前浏览器中。删除应用、清除 Safari 数据或更换网址都可能导致数据丢失。</p><button className="primary" onClick={backup}>导出完整 JSON 备份</button><button className="secondary" onClick={() => input.current?.click()}>从 JSON 合并恢复</button><input hidden ref={input} type="file" accept="application/json,.json" onChange={(event) => restore(event.target.files?.[0])} />{message && <p className="notice">{message}</p>}</section>
    <section className="settings-group"><h2>隐私与安全</h2><p>应用没有账号、服务器或分析埋点。健康记录不会上传到 GitHub。导出的文件由你自行保管，当前版本不加密。</p></section><section className="settings-group"><h2>安装到 iPhone</h2><ol><li>使用 Safari 打开本应用。</li><li>点击分享按钮。</li><li>选择“添加到主屏幕”。</li></ol></section>
  </main>;
}
