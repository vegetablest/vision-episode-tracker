import type { VisionEpisode } from "./episode";

export type TimelineGrouping = "day" | "week" | "month";

export interface EpisodeGroup {
  key: string;
  label: string;
  episodes: VisionEpisode[];
}

function dateFromKey(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function weekStart(value: string): string {
  const date = dateFromKey(value);
  date.setUTCDate(date.getUTCDate() - (date.getUTCDay() + 6) % 7);
  return isoDate(date);
}

function groupKey(episode: VisionEpisode, grouping: TimelineGrouping): string {
  if (grouping === "day") return episode.occurredOn;
  if (grouping === "month") return episode.occurredOn.slice(0, 7);
  return weekStart(episode.occurredOn);
}

function groupLabel(key: string, grouping: TimelineGrouping): string {
  if (grouping === "month") {
    const [year, month] = key.split("-");
    return `${year} 年 ${Number(month)} 月`;
  }
  if (grouping === "day") return new Intl.DateTimeFormat("zh-CN", { timeZone: "UTC", month: "long", day: "numeric", weekday: "short" }).format(dateFromKey(key));
  const end = dateFromKey(key);
  end.setUTCDate(end.getUTCDate() + 6);
  return `${key.replaceAll("-", ".")} — ${isoDate(end).replaceAll("-", ".")}`;
}

export function groupEpisodes(episodes: VisionEpisode[], grouping: TimelineGrouping): EpisodeGroup[] {
  const groups = new Map<string, VisionEpisode[]>();
  [...episodes].sort((a, b) => (b.startAt ?? b.createdAt).localeCompare(a.startAt ?? a.createdAt)).forEach((episode) => {
    const key = groupKey(episode, grouping);
    groups.set(key, [...(groups.get(key) ?? []), episode]);
  });
  return [...groups.entries()].sort(([left], [right]) => right.localeCompare(left)).map(([key, items]) => ({ key, label: groupLabel(key, grouping), episodes: items }));
}
