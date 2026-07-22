import Dexie, { type EntityTable } from "dexie";
import type { AppMetadata, AppSettings, SyncJob, VisionEpisode } from "../domain/episode";

export class VisionTrackerDB extends Dexie {
  episodes!: EntityTable<VisionEpisode, "id">;
  settings!: EntityTable<AppSettings, "id">;
  metadata!: EntityTable<AppMetadata, "id">;
  syncQueue!: EntityTable<SyncJob, "id">;

  constructor(name = "vision-episode-tracker") {
    super(name);
    this.version(1).stores({ episodes: "&id, occurredOn, startAt, status, recordMethod, updatedAt, [status+startAt], [recordMethod+occurredOn]", settings: "&id", metadata: "&id" });
    this.version(2).stores({ syncQueue: "&id, &episodeId, createdAt" });
  }
}

export const db = new VisionTrackerDB();

export function defaultSettings(): AppSettings {
  return { id: "settings", schemaVersion: 1, reportingTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC", backupReminderDays: 14, backupReminderChangeCount: 10, privacyScreenOnBackground: false, weekStartsOn: 1, theme: "system" };
}

export async function initializeDatabase(database = db): Promise<void> {
  const now = new Date().toISOString();
  await database.transaction("rw", database.settings, database.metadata, async () => {
    if (!await database.settings.get("settings")) await database.settings.add(defaultSettings());
    if (!await database.metadata.get("metadata")) await database.metadata.add({ id: "metadata", databaseSchemaVersion: 1, createdAt: now, lastMigrationAt: null, lastBackupAt: null, changesSinceBackup: 0, ownerId: null });
  });
}
