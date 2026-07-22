import { Link } from "react-router-dom";
import { formatDateTime, formatDuration, labels } from "../app/labels";
import type { VisionEpisode } from "../domain/episode";

export function EpisodeCard({ episode }: { episode: VisionEpisode }) {
  const symptoms = episode.visualSymptoms.map((item) => labels[item]).join("、");
  const title = episode.status === "ongoing" ? "正在发生" : symptoms || "视觉异常";
  const recordedAt = episode.startAt
    ? formatDateTime(episode.startAt)
    : `${episode.occurredOn} · ${episode.timePeriod ? labels[episode.timePeriod] : "时间未知"}`;

  return (
    <Link
      className={`episode-card ${episode.status === "voided" ? "voided" : ""}`}
      to={`/records/${episode.id}`}
    >
      <div>
        <strong>{title}</strong>
        <span>{recordedAt}</span>
      </div>
      <div className="right">
        <strong>{formatDuration(episode.duration.minutes)}</strong>
        <span>
          {episode.recordMethod === "live" ? "实时" : "补录"}
          {episode.status === "voided" ? " · 已作废" : ""}
        </span>
      </div>
    </Link>
  );
}
