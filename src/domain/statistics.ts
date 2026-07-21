import type { TimePeriod, VisionEpisode } from "./episode";
import { localHour, periodForHour } from "./time";

export interface Comparison { current: number; previous: number; absoluteChange: number; percentageChange: number | null; direction: "up" | "down" | "same"; displayMode: "percentage" | "from_zero" | "none" }
export interface PeriodMetrics { episodeCount: number; symptomDays: number; liveCount: number; manualCount: number; ongoingCount: number; exactDurationCount: number; approximateDurationCount: number; missingDurationCount: number; totalDurationMinutes: number | null; averageDurationMinutes: number | null; medianDurationMinutes: number | null; maxDurationMinutes: number | null; episodeComparison: Comparison; symptomDaysComparison: Comparison }

export function compare(current: number, previous: number): Comparison {
  const absoluteChange = current - previous;
  return { current, previous, absoluteChange, percentageChange: previous ? absoluteChange / previous * 100 : null, direction: absoluteChange === 0 ? "same" : absoluteChange > 0 ? "up" : "down", displayMode: previous ? "percentage" : current ? "from_zero" : "none" };
}

export function median(values: number[]): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function summarize(items: VisionEpisode[]) {
  const valid = items.filter((episode) => episode.status !== "voided");
  const durations = valid.flatMap((episode) => episode.duration.minutes === null ? [] : [episode.duration.minutes]);
  return { episodeCount: valid.length, symptomDays: new Set(valid.map((episode) => episode.occurredOn)).size, liveCount: valid.filter((episode) => episode.recordMethod === "live").length, manualCount: valid.filter((episode) => episode.recordMethod === "manual").length, ongoingCount: valid.filter((episode) => episode.status === "ongoing").length, exactDurationCount: valid.filter((episode) => episode.duration.accuracy === "exact").length, approximateDurationCount: valid.filter((episode) => episode.duration.accuracy === "approximate").length, missingDurationCount: valid.filter((episode) => episode.duration.minutes === null).length, totalDurationMinutes: durations.length ? durations.reduce((sum, value) => sum + value, 0) : null, averageDurationMinutes: durations.length ? durations.reduce((sum, value) => sum + value, 0) / durations.length : null, medianDurationMinutes: median(durations), maxDurationMinutes: durations.length ? Math.max(...durations) : null };
}

export function periodMetrics(episodes: VisionEpisode[], days: number, now = new Date()): PeriodMetrics {
  const end = now.getTime();
  const span = days * 86400000;
  const current = episodes.filter((item) => { const time = new Date(`${item.occurredOn}T12:00:00Z`).getTime(); return time > end - span && time <= end; });
  const previous = episodes.filter((item) => { const time = new Date(`${item.occurredOn}T12:00:00Z`).getTime(); return time > end - span * 2 && time <= end - span; });
  const result = summarize(current);
  const prior = summarize(previous);
  return { ...result, episodeComparison: compare(result.episodeCount, prior.episodeCount), symptomDaysComparison: compare(result.symptomDays, prior.symptomDays) };
}

export function timeDistribution(episodes: VisionEpisode[], timezone: string) {
  const hourly = Array.from({ length: 24 }, (_, hour) => ({ hour, exact: 0, approximate: 0 }));
  const periods = new Map<TimePeriod, number>([["dawn", 0], ["morning", 0], ["afternoon", 0], ["evening", 0]]);
  let excludedFromHourly = 0;
  episodes.filter((item) => item.status !== "voided").forEach((item) => {
    if (item.startAt && ["exact", "approximate"].includes(item.startTimeAccuracy)) {
      const hour = localHour(item.startAt, timezone);
      hourly[hour][item.startTimeAccuracy as "exact" | "approximate"] += 1;
      const period = periodForHour(hour);
      periods.set(period, (periods.get(period) ?? 0) + 1);
    } else {
      excludedFromHourly += 1;
      if (item.timePeriod) periods.set(item.timePeriod, (periods.get(item.timePeriod) ?? 0) + 1);
    }
  });
  const total = [...periods.values()].reduce((sum, value) => sum + value, 0);
  return { hourly, periods: [...periods].map(([period, count]) => ({ period, count, percentage: total ? count / total * 100 : 0 })), excludedFromHourly, totalEligible: total };
}

export function dataQuality(episodes: VisionEpisode[]) {
  const valid = episodes.filter((item) => item.status !== "voided");
  const rate = (predicate: (item: VisionEpisode) => boolean) => valid.length ? valid.filter(predicate).length / valid.length : 0;
  return { total: valid.length, exactStartRate: rate((item) => item.startTimeAccuracy === "exact"), durationCoverageRate: rate((item) => item.duration.minutes !== null), eyeScopeCoverageRate: rate((item) => item.eyeScope !== null), visualSymptomsCoverageRate: rate((item) => item.visualSymptoms.length > 0), recoveryCoverageRate: rate((item) => item.recoveredCompletely !== null), manualRecordRate: rate((item) => item.recordMethod === "manual") };
}
