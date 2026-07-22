import type { AppSettings, EpisodeDraft, TimeAccuracy, TimePeriod, VisionEpisode } from "../domain/episode";
import { emptyDetails } from "../domain/episode";
import { episodeSchema, settingsSchema } from "../domain/schemas";
import { localDate } from "../domain/time";
import { db, initializeDatabase, type VisionTrackerDB } from "./database";

export class ActiveEpisodeError extends Error { constructor() { super("已有一条正在记录的发作"); } }
export class EpisodeNotFoundError extends Error { constructor() { super("找不到这条记录"); } }

export interface ManualEpisodeInput {
  occurredOn: string;
  timezone: string;
  startAt: string | null;
  endAt: string | null;
  timePeriod: TimePeriod | null;
  accuracy: TimeAccuracy;
  durationMinutes: number | null;
  details?: Partial<EpisodeDraft>;
}

export class EpisodeRepository {
  constructor(private readonly database: VisionTrackerDB = db) {}

  private queue(episodeId: string, operation: "upsert" | "delete", revision?: number, updatedAt?: string): Promise<string> {
    return this.database.syncQueue.put({ id: episodeId, episodeId, operation, createdAt: new Date().toISOString(), revision, updatedAt }).then((id) => {
      if (typeof window !== "undefined") setTimeout(() => window.dispatchEvent(new Event("vision-sync-requested")));
      return id;
    });
  }

  private async changed(): Promise<void> {
    await this.database.metadata.where("id").equals("metadata").modify((metadata) => { metadata.changesSinceBackup += 1; });
  }

  async createLiveEpisode(now = new Date(), timezone = Intl.DateTimeFormat().resolvedOptions().timeZone): Promise<VisionEpisode> {
    await initializeDatabase(this.database);
    return this.database.transaction("rw", this.database.episodes, this.database.metadata, this.database.syncQueue, async () => {
      if (await this.getActiveEpisode()) throw new ActiveEpisodeError();
      const iso = now.toISOString();
      const episode = episodeSchema.parse({ ...emptyDetails, schemaVersion: 1, id: crypto.randomUUID(), revision: 1, status: "ongoing", recordMethod: "live", occurredOn: localDate(now, timezone), timezone, startAt: iso, endAt: null, timePeriod: null, dateAccuracy: "exact", startTimeAccuracy: "exact", endTimeAccuracy: "unknown", duration: { minutes: null, source: "unknown", accuracy: "unknown" }, createdAt: iso, updatedAt: iso, voidedAt: null });
      await this.database.episodes.add(episode);
      await this.queue(episode.id, "upsert");
      await this.changed();
      return episode;
    });
  }

  async endLiveEpisode(id: string, now = new Date(), details: Partial<EpisodeDraft> = {}): Promise<VisionEpisode> {
    return this.mutate(id, (episode) => {
      if (episode.status !== "ongoing" || !episode.startAt) throw new Error("记录不在进行中");
      const minutes = Math.max((now.getTime() - new Date(episode.startAt).getTime()) / 60000, 1 / 60);
      return { ...episode, ...details, status: "completed", endAt: now.toISOString(), endTimeAccuracy: "exact", duration: { minutes, source: "computed", accuracy: "exact" } };
    });
  }

  async createManualEpisode(input: ManualEpisodeInput): Promise<VisionEpisode> {
    await initializeDatabase(this.database);
    const now = new Date().toISOString();
    const computed = input.startAt && input.endAt ? (new Date(input.endAt).getTime() - new Date(input.startAt).getTime()) / 60000 : null;
    const minutes = computed ?? input.durationMinutes;
    const episode = episodeSchema.parse({ ...emptyDetails, ...input.details, schemaVersion: 1, id: crypto.randomUUID(), revision: 1, status: "completed", recordMethod: "manual", occurredOn: input.occurredOn, timezone: input.timezone, startAt: input.startAt, endAt: input.endAt, timePeriod: input.timePeriod, dateAccuracy: input.accuracy === "period_only" || input.accuracy === "date_only" ? input.accuracy : "exact", startTimeAccuracy: input.accuracy, endTimeAccuracy: input.endAt ? input.accuracy : "unknown", duration: { minutes, source: computed !== null ? "computed" : minutes !== null ? "manual" : "unknown", accuracy: minutes !== null ? input.accuracy === "exact" ? "exact" : "approximate" : "unknown" }, createdAt: now, updatedAt: now, voidedAt: null });
    await this.database.transaction("rw", this.database.episodes, this.database.metadata, this.database.syncQueue, async () => { await this.database.episodes.add(episode); await this.queue(episode.id, "upsert"); await this.changed(); });
    return episode;
  }

  async updateEpisode(id: string, patch: Partial<EpisodeDraft>): Promise<VisionEpisode> { return this.mutate(id, (episode) => ({ ...episode, ...patch })); }
  async voidEpisode(id: string): Promise<void> { await this.mutate(id, (episode) => ({ ...episode, status: "voided", voidedAt: new Date().toISOString() })); }
  async restoreEpisode(id: string): Promise<void> { await this.mutate(id, (episode) => ({ ...episode, status: episode.endAt || episode.recordMethod === "manual" ? "completed" : "ongoing", voidedAt: null })); }
  async permanentlyDeleteEpisode(id: string): Promise<void> { await this.database.transaction("rw", this.database.episodes, this.database.metadata, this.database.syncQueue, async () => { const existing = await this.database.episodes.get(id); if (!existing) return; const updatedAt = new Date().toISOString(); await this.database.episodes.delete(id); await this.queue(id, "delete", existing.revision + 1, updatedAt); await this.changed(); }); }
  async getEpisode(id: string): Promise<VisionEpisode | undefined> { return this.database.episodes.get(id); }
  async getActiveEpisode(): Promise<VisionEpisode | undefined> { return this.database.episodes.where("status").equals("ongoing").first(); }
  async listEpisodes(): Promise<VisionEpisode[]> { return this.database.episodes.orderBy("occurredOn").reverse().sortBy("updatedAt").then((items) => items.reverse()); }
  async countEpisodes(): Promise<number> { return this.database.episodes.count(); }

  private async mutate(id: string, transform: (episode: VisionEpisode) => VisionEpisode): Promise<VisionEpisode> {
    return this.database.transaction("rw", this.database.episodes, this.database.metadata, this.database.syncQueue, async () => {
      const existing = await this.database.episodes.get(id);
      if (!existing) throw new EpisodeNotFoundError();
      const next = episodeSchema.parse({ ...transform(existing), revision: existing.revision + 1, updatedAt: new Date().toISOString() });
      await this.database.episodes.put(next);
      await this.queue(next.id, "upsert");
      await this.changed();
      return next;
    });
  }
}

export class SettingsRepository {
  constructor(private readonly database: VisionTrackerDB = db) {}
  async get(): Promise<AppSettings> { await initializeDatabase(this.database); return (await this.database.settings.get("settings"))!; }
  async update(patch: Partial<Omit<AppSettings, "id" | "schemaVersion">>): Promise<AppSettings> { const next = settingsSchema.parse({ ...await this.get(), ...patch }); await this.database.settings.put(next); return next; }
}

export const episodes = new EpisodeRepository();
export const settings = new SettingsRepository();
