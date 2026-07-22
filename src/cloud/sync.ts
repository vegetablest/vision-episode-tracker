import type { User } from "@supabase/supabase-js";
import { db, defaultSettings, initializeDatabase } from "../db/database";
import type { VisionEpisode } from "../domain/episode";
import { episodeSchema } from "../domain/schemas";
import { supabase } from "./client";

interface EpisodeRow {
  payload: unknown;
  revision: number;
  updated_at: string;
}

interface DeletionRow {
  episode_id: string;
  revision: number;
  updated_at: string;
}

function newer(incoming: VisionEpisode, local?: VisionEpisode): boolean {
  return !local || incoming.revision > local.revision || incoming.revision === local.revision && incoming.updatedAt > local.updatedAt;
}

async function prepareLocalData(userId: string): Promise<void> {
  await initializeDatabase();
  const metadata = await db.metadata.get("metadata");
  if (metadata?.ownerId && metadata.ownerId !== userId) {
    await db.transaction("rw", db.episodes, db.settings, db.syncQueue, db.metadata, async () => {
      await Promise.all([db.episodes.clear(), db.settings.clear(), db.syncQueue.clear()]);
      await db.settings.put(defaultSettings());
      await db.metadata.update("metadata", { ownerId: userId });
    });
    return;
  }
  if (metadata?.ownerId === userId) return;
  await db.transaction("rw", db.episodes, db.syncQueue, db.metadata, async () => {
    await db.metadata.update("metadata", { ownerId: userId });
    const queued = new Set((await db.syncQueue.toArray()).map((job) => job.episodeId));
    const local = (await db.episodes.toArray()).filter((episode) => !queued.has(episode.id));
    await db.syncQueue.bulkPut(local.map((episode) => ({ id: episode.id, episodeId: episode.id, operation: "upsert" as const, createdAt: new Date().toISOString() })));
  });
}

async function flushQueue(): Promise<void> {
  for (const job of await db.syncQueue.orderBy("createdAt").toArray()) {
    const episode = await db.episodes.get(job.episodeId);
    const result = job.operation === "delete"
      ? await supabase.rpc("sync_episode_deletion", { target_id: job.episodeId, target_revision: job.revision, target_updated_at: job.updatedAt })
      : await supabase.rpc("sync_episode", { episode_data: episode });
    if (result.error) throw result.error;
    await db.syncQueue.delete(job.id);
  }
}

async function fetchEpisodes(): Promise<EpisodeRow[]> {
  const rows: EpisodeRow[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase.from("episodes").select("payload, revision, updated_at").range(from, from + 999);
    if (error) throw error;
    rows.push(...data as EpisodeRow[]);
    if (data.length < 1000) return rows;
  }
}

async function fetchDeletions(): Promise<DeletionRow[]> {
  const rows: DeletionRow[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase.from("episode_deletions").select("episode_id, revision, updated_at").range(from, from + 999);
    if (error) throw error;
    rows.push(...data as DeletionRow[]);
    if (data.length < 1000) return rows;
  }
}

async function pullRemote(): Promise<void> {
  const [episodeRows, deletions] = await Promise.all([fetchEpisodes(), fetchDeletions()]);
  const remote = episodeRows.map((row) => episodeSchema.parse(row.payload));
  const remoteIds = new Set(remote.map((episode) => episode.id));
  const deletedIds = new Set(deletions.map((deletion) => deletion.episode_id));

  await db.transaction("rw", db.episodes, db.syncQueue, async () => {
    const pending = new Set((await db.syncQueue.toArray()).map((job) => job.episodeId));
    for (const incoming of remote) {
      if (pending.has(incoming.id)) continue;
      const local = await db.episodes.get(incoming.id);
      if (newer(incoming, local)) await db.episodes.put(incoming);
    }
    for (const deletion of deletions) {
      if (pending.has(deletion.episode_id)) continue;
      const local = await db.episodes.get(deletion.episode_id);
      if (local && (deletion.revision > local.revision || deletion.revision === local.revision && deletion.updated_at >= local.updatedAt)) await db.episodes.delete(deletion.episode_id);
    }
    const stale = (await db.episodes.toArray()).filter((episode) => !pending.has(episode.id) && !remoteIds.has(episode.id) && !deletedIds.has(episode.id));
    await db.episodes.bulkDelete(stale.map((episode) => episode.id));
  });
}

let running: Promise<void> | null = null;
let requestedUser: User | null = null;

export function synchronize(user: User): Promise<void> {
  requestedUser = user;
  if (running) return running;
  running = (async () => {
    while (requestedUser) {
      const current = requestedUser;
      requestedUser = null;
      await prepareLocalData(current.id);
      await flushQueue();
      await pullRemote();
    }
  })().finally(() => { running = null; });
  return running;
}

export async function leaveAccountForGuest(): Promise<void> {
  await initializeDatabase();
  await db.transaction("rw", db.episodes, db.settings, db.syncQueue, db.metadata, async () => {
    await Promise.all([db.episodes.clear(), db.settings.clear(), db.syncQueue.clear()]);
    await db.settings.put(defaultSettings());
    await db.metadata.update("metadata", { ownerId: null });
  });
}
