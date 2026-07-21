import type { AppMetadata, AppSettings, VisionEpisode } from "./episode";
import { episodeSchema, settingsSchema } from "./schemas";

export interface Backup { backupFormat: "vision-episode-tracker"; backupFormatVersion: 1; exportedAt: string; appVersion: string; databaseSchemaVersion: 1; settings: AppSettings; metadata: { sourceCreatedAt: string; sourceLastBackupAt: string | null }; episodes: VisionEpisode[]; checksum: { algorithm: "SHA-256"; value: string } }

async function digest(value: string): Promise<string> {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(bytes)].map((item) => item.toString(16).padStart(2, "0")).join("");
}

export async function createBackup(items: VisionEpisode[], settings: AppSettings, metadata: AppMetadata): Promise<Backup> {
  const content = { backupFormat: "vision-episode-tracker" as const, backupFormatVersion: 1 as const, exportedAt: new Date().toISOString(), appVersion: "0.1.0", databaseSchemaVersion: 1 as const, settings, metadata: { sourceCreatedAt: metadata.createdAt, sourceLastBackupAt: metadata.lastBackupAt }, episodes: items };
  return { ...content, checksum: { algorithm: "SHA-256", value: await digest(JSON.stringify(content)) } };
}

export async function parseBackup(text: string): Promise<Backup> {
  const value = JSON.parse(text) as Backup;
  if (value.backupFormat !== "vision-episode-tracker" || value.backupFormatVersion !== 1) throw new Error("不支持的备份格式");
  const { checksum, ...content } = value;
  if (await digest(JSON.stringify(content)) !== checksum.value) throw new Error("备份校验失败，文件可能已损坏");
  settingsSchema.parse(value.settings);
  value.episodes.forEach((item) => episodeSchema.parse(item));
  return value;
}

function csvCell(value: unknown): string {
  const raw = Array.isArray(value) ? value.join("|") : value === null ? "" : String(value);
  const safe = /^[=+\-@]/.test(raw) ? `'${raw}` : raw;
  return `"${safe.replaceAll('"', '""')}"`;
}

export function createCsv(items: VisionEpisode[]): string {
  const keys = ["id", "status", "recordMethod", "occurredOn", "startAt", "endAt", "timePeriod", "dateAccuracy", "startTimeAccuracy", "endTimeAccuracy", "duration", "eyeScope", "visualFields", "visualSymptoms", "severity", "associatedSymptoms", "activity", "possibleRelatedFactors", "note", "createdAt", "updatedAt"] as const;
  const rows = items.map((item) => keys.map((key) => csvCell(key === "duration" ? item.duration.minutes : item[key])).join(","));
  return `\ufeff${keys.join(",")}\r\n${rows.join("\r\n")}`;
}
