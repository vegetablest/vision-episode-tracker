import { useLiveQuery } from "dexie-react-hooks";
import { db, defaultSettings } from "../db/database";

export function useEpisodes() { return useLiveQuery(() => db.episodes.orderBy("updatedAt").reverse().toArray(), [], []); }
export function useActiveEpisode() { return useLiveQuery(() => db.episodes.where("status").equals("ongoing").first()); }
export function useSettings() { return useLiveQuery(() => db.settings.get("settings"), [], defaultSettings()) ?? defaultSettings(); }
