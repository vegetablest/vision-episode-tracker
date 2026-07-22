import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useSettings } from "../app/hooks";
import { createBackup, parseBackup } from "../domain/export";
import type { AppSettings } from "../domain/episode";
import { db } from "../db/database";
import { settings as settingsRepository } from "../db/repository";
import { useAuth } from "../auth/state";
import { supabase } from "../cloud/client";
import { leaveAccountForGuest, synchronize } from "../cloud/sync";
import { InstallGuide } from "../components/InstallGuide";

function downloadJson(value: unknown, filename: string) { const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type: "application/json" })); const anchor = document.createElement("a"); anchor.href = url; anchor.download = filename; anchor.click(); URL.revokeObjectURL(url); }

export function Settings() {
  const { user, syncError } = useAuth();
  const settings = useSettings();
  const input = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState("");
  const [backupBusy, setBackupBusy] = useState(false);
  const update = (patch: Partial<AppSettings>) => settingsRepository.update(patch);
  const signOut = async () => { await leaveAccountForGuest(); localStorage.setItem("guest-mode", "1"); window.dispatchEvent(new Event("guest-mode-enabled")); await supabase.auth.signOut(); };
  const backup = async () => {
    setBackupBusy(true); setMessage("");
    try {
      if (user) {
        try { await synchronize(user); }
        catch { if (!confirm("云端同步失败。是否仍要导出当前设备上的数据？")) { setMessage("导出已取消，请检查网络后重试。"); return; } }
      }
      const metadata = await db.metadata.get("metadata");
      if (!metadata) return;
      const value = await createBackup(await db.episodes.toArray(), settings, metadata);
      downloadJson(value, `vision-episode-tracker-backup-${new Date().toISOString().slice(0, 10)}.json`);
      await db.metadata.update("metadata", { lastBackupAt: new Date().toISOString(), changesSinceBackup: 0 });
      setMessage(user ? "云端与本机数据已合并，完整备份已导出。" : "本机备份已导出，请把文件保存在安全的位置。");
    } finally { setBackupBusy(false); }
  };
  const restore = async (file?: File) => { if (!file) return; try { const value = await parseBackup(await file.text()); await db.transaction("rw", db.episodes, db.settings, db.metadata, db.syncQueue, async () => { for (const incoming of value.episodes) { const local = await db.episodes.get(incoming.id); if (!local || incoming.revision > local.revision || incoming.revision === local.revision && incoming.updatedAt > local.updatedAt) { await db.episodes.put(incoming); await db.syncQueue.put({ id: incoming.id, episodeId: incoming.id, operation: "upsert", createdAt: new Date().toISOString() }); } } await db.settings.put(value.settings); }); window.dispatchEvent(new Event("vision-sync-requested")); setMessage(`恢复完成，共检查 ${value.episodes.length} 条记录；重复记录不会被新增。`); } catch (cause) { setMessage(cause instanceof Error ? cause.message : "无法恢复备份"); } finally { if (input.current) input.current.value = ""; } };
  return <main className="page narrow"><header><p className="eyebrow">设置</p><h1>数据与偏好</h1></header><section className="settings-group"><h2>账户</h2>{user ? <><p>{user.email}</p><p>{syncError || "记录保存在本机，并在联网时同步到云端。"}</p><button className="secondary" onClick={() => void signOut()}>退出登录</button></> : <><p>当前仅保存在本机。注册或登录后，现有本地记录会自动同步一次。</p><Link className="primary" to="/account">登录或创建账户</Link></>}</section><section className="settings-group"><h2>常规</h2><label>报告时区<input value={settings.reportingTimezone} onChange={(event) => update({ reportingTimezone: event.target.value })} /></label><label>备份提醒<select value={settings.backupReminderDays} onChange={(event) => update({ backupReminderDays: Number(event.target.value) as 0 | 7 | 14 | 30 })}><option value="7">每 7 天</option><option value="14">每 14 天</option><option value="30">每 30 天</option><option value="0">关闭</option></select></label><label>外观<select value={settings.theme} onChange={(event) => update({ theme: event.target.value as AppSettings["theme"] })}><option value="system">跟随系统</option><option value="light">浅色</option><option value="dark">深色</option></select></label></section>
    <section className="settings-group"><h2>备份与恢复</h2><p>{user ? "导出前会先合并云端与本机记录，生成完整 JSON 快照。" : "当前记录只在本机，请定期导出 JSON 备份。"}</p><button className="primary" disabled={backupBusy} onClick={() => void backup()}>{backupBusy ? "正在合并数据…" : "导出完整 JSON 备份"}</button><button className="secondary" disabled={backupBusy} onClick={() => input.current?.click()}>从 JSON 合并恢复</button><input hidden ref={input} type="file" accept="application/json,.json" onChange={(event) => restore(event.target.files?.[0])} />{message && <p className="notice">{message}</p>}</section>
    <section className="settings-group"><h2>隐私与安全</h2><p>{user ? "健康记录会安全同步到你的云端账户，并与其他用户的数据隔离。" : "健康记录当前只保存在此浏览器中。"} 导出的文件当前不加密。</p></section><InstallGuide />
  </main>;
}
