import { Link } from "react-router-dom";
import { formatDateTime, formatDuration, labels } from "../app/labels";
import type { EpisodeDraft, EyeScope, VisualSymptom } from "../domain/episode";
import type { VisionEpisode } from "../domain/episode";
import { eyeScopes, visualSymptoms } from "../domain/episode";

interface Props { value: Partial<EpisodeDraft>; onChange: (value: Partial<EpisodeDraft>) => void }

export function EpisodeDetailsForm({ value, onChange }: Props) {
  const toggle = (item: VisualSymptom) => {
    const values = value.visualSymptoms ?? [];
    onChange({ ...value, visualSymptoms: values.includes(item) ? values.filter((entry) => entry !== item) : [...values, item] });
  };
  return <div className="form-stack">
    <fieldset><legend>哪只眼睛？</legend><div className="chips">{eyeScopes.map((item) => <button className={value.eyeScope === item ? "chip selected" : "chip"} type="button" key={item} onClick={() => onChange({ ...value, eyeScope: item as EyeScope })}>{labels[item]}</button>)}</div></fieldset>
    <fieldset><legend>看到了什么？（可多选）</legend><div className="chips">{visualSymptoms.map((item) => <button className={value.visualSymptoms?.includes(item) ? "chip selected" : "chip"} type="button" key={item} onClick={() => toggle(item)}>{labels[item]}</button>)}</div></fieldset>
    <fieldset><legend>影响程度</legend><div className="severity">{[1, 2, 3, 4, 5].map((item) => <button className={value.severity === item ? "selected" : ""} type="button" key={item} onClick={() => onChange({ ...value, severity: item as 1 | 2 | 3 | 4 | 5 })}>{item}</button>)}</div><small>1 轻微 · 5 严重</small></fieldset>
    <label>备注（可选）<textarea maxLength={500} value={value.note ?? ""} onChange={(event) => onChange({ ...value, note: event.target.value || null })} placeholder="只记录你观察到的事实" /></label>
  </div>;
}

export function EpisodeCard({ episode }: { episode: VisionEpisode }) {
  const symptoms = episode.visualSymptoms.map((item) => labels[item]).join("、");
  const title = episode.status === "ongoing" ? "正在发生" : symptoms || "视觉异常";
  const recordedAt = episode.startAt
    ? formatDateTime(episode.startAt)
    : `${episode.occurredOn} · ${episode.timePeriod ? labels[episode.timePeriod] : "时间未知"}`;

  return <Link className={`episode-card ${episode.status === "voided" ? "voided" : ""}`} to={`/records/${episode.id}`}>
    <div><strong>{title}</strong><span>{recordedAt}</span></div>
    <div className="right">
      <strong>{formatDuration(episode.duration.minutes)}</strong>
      <span>{episode.recordMethod === "live" ? "实时" : "补录"}{episode.status === "voided" ? " · 已作废" : ""}</span>
    </div>
  </Link>;
}
