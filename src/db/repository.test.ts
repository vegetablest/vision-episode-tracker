import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { VisionTrackerDB } from "./database";
import { ActiveEpisodeError, EpisodeRepository } from "./repository";

describe("EpisodeRepository", () => {
  let database: VisionTrackerDB;
  let repository: EpisodeRepository;
  beforeEach(() => { database = new VisionTrackerDB(`test-${crypto.randomUUID()}`); repository = new EpisodeRepository(database); });
  afterEach(async () => database.delete());

  it("persists start immediately and permits only one active episode", async () => { const started = await repository.createLiveEpisode(new Date("2026-07-21T10:00:00.000Z"), "UTC"); expect((await repository.getActiveEpisode())?.id).toBe(started.id); await expect(repository.createLiveEpisode()).rejects.toBeInstanceOf(ActiveEpisodeError); });
  it("ends a live episode using timestamps instead of timer ticks", async () => { const started = await repository.createLiveEpisode(new Date("2026-07-21T10:00:00.000Z"), "UTC"); const ended = await repository.endLiveEpisode(started.id, new Date("2026-07-21T10:12:30.000Z")); expect(ended.duration.minutes).toBe(12.5); expect(ended.status).toBe("completed"); });
  it("preserves period-only accuracy without fabricating a timestamp", async () => { const item = await repository.createManualEpisode({ occurredOn: "2026-07-20", timezone: "UTC", startAt: null, endAt: null, timePeriod: "afternoon", accuracy: "period_only", durationMinutes: 15 }); expect(item.startAt).toBeNull(); expect(item.timePeriod).toBe("afternoon"); expect(item.duration.accuracy).toBe("approximate"); });
  it("voids and restores without deleting the record", async () => { const item = await repository.createManualEpisode({ occurredOn: "2026-07-20", timezone: "UTC", startAt: null, endAt: null, timePeriod: null, accuracy: "date_only", durationMinutes: null }); await repository.voidEpisode(item.id); expect((await repository.getEpisode(item.id))?.status).toBe("voided"); await repository.restoreEpisode(item.id); expect((await repository.getEpisode(item.id))?.status).toBe("completed"); });
  it("edits recorded data and preserves identity", async () => {
    const item = await repository.createManualEpisode({ occurredOn: "2026-07-20", timezone: "UTC", startAt: null, endAt: null, timePeriod: null, accuracy: "date_only", durationMinutes: null });
    const edited = await repository.editEpisode(item.id, { occurredOn: "2026-07-19", startAt: null, endAt: null, timePeriod: "evening", accuracy: "period_only", durationMinutes: 12, details: { severity: 4, note: "已修正" } });
    expect(edited).toMatchObject({ id: item.id, createdAt: item.createdAt, revision: 2, occurredOn: "2026-07-19", timePeriod: "evening", severity: 4, note: "已修正" });
    expect((await database.syncQueue.get(item.id))?.operation).toBe("upsert");
  });
  it("records durable sync intent in the same local database", async () => { const item = await repository.createManualEpisode({ occurredOn: "2026-07-20", timezone: "UTC", startAt: null, endAt: null, timePeriod: null, accuracy: "date_only", durationMinutes: null }); expect((await database.syncQueue.get(item.id))?.operation).toBe("upsert"); await repository.permanentlyDeleteEpisode(item.id); const deletion = await database.syncQueue.get(item.id); expect(deletion?.operation).toBe("delete"); expect(deletion?.revision).toBe(item.revision + 1); });
});
