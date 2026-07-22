import { describe, expect, it } from "vitest";
import type { VisionEpisode } from "../domain/episode";
import { groupEpisodes } from "../domain/timeline";

function episode(id: string, occurredOn: string): VisionEpisode {
  const timestamp = `${occurredOn}T08:00:00.000Z`;
  return { schemaVersion: 1, id, revision: 1, status: "completed", recordMethod: "manual", occurredOn, timezone: "UTC", startAt: timestamp, endAt: null, timePeriod: null, dateAccuracy: "exact", startTimeAccuracy: "exact", endTimeAccuracy: "unknown", duration: { minutes: null, source: "unknown", accuracy: "unknown" }, eyeScope: null, visualFields: [], visualSymptoms: [], severity: null, onsetPattern: null, similarToPrevious: null, recoveredCompletely: null, residualSymptoms: null, associatedSymptoms: [], activity: null, possibleRelatedFactors: [], otherVisualSymptom: null, otherAssociatedSymptom: null, otherRelatedFactor: null, note: null, createdAt: timestamp, updatedAt: timestamp, voidedAt: null };
}

describe("record timeline grouping", () => {
  const episodes = [episode("00000000-0000-4000-8000-000000000001", "2026-07-21"), episode("00000000-0000-4000-8000-000000000002", "2026-07-20"), episode("00000000-0000-4000-8000-000000000003", "2026-06-30")];

  it("groups records by day in reverse chronological order", () => { const groups = groupEpisodes(episodes, "day"); expect(groups.map((group) => group.key)).toEqual(["2026-07-21", "2026-07-20", "2026-06-30"]); });
  it("groups Monday and Tuesday into the same week", () => { const groups = groupEpisodes(episodes, "week"); expect(groups[0]).toMatchObject({ key: "2026-07-20", episodes: [episodes[0], episodes[1]] }); });
  it("aggregates records by calendar month", () => { const groups = groupEpisodes(episodes, "month"); expect(groups.map((group) => [group.key, group.episodes.length])).toEqual([["2026-07", 2], ["2026-06", 1]]); });
});
