import { useState } from "react";
import { Link } from "react-router-dom";
import { formatDateTime, formatDuration, labels } from "../app/labels";
import type { AssociatedSymptom, EpisodeDraft, EyeScope, PossibleRelatedFactor, VisualField, VisualSymptom } from "../domain/episode";
import type { VisionEpisode } from "../domain/episode";
import { activities, associatedSymptoms, eyeScopes, relatedFactors, visualFields, visualSymptoms } from "../domain/episode";

interface Props { value: Partial<EpisodeDraft>; onChange: (value: Partial<EpisodeDraft>) => void }

export function EpisodeDetailsForm({ value, onChange }: Props) {
  const [expanded, setExpanded] = useState(false);
  const toggleVisual = (item: VisualSymptom) => {
    const values = value.visualSymptoms ?? [];
    onChange({ ...value, visualSymptoms: values.includes(item) ? values.filter((entry) => entry !== item) : [...values, item] });
  };
  const toggleField = (item: VisualField) => {
    const values = value.visualFields ?? [];
    onChange({ ...value, visualFields: values.includes(item) ? values.filter((entry) => entry !== item) : [...values, item] });
  };
  const toggleAssociated = (item: AssociatedSymptom) => {
    const values = value.associatedSymptoms ?? [];
    const next: AssociatedSymptom[] = item === "none" ? ["none"] : values.filter((entry) => entry !== "none");
    onChange({ ...value, associatedSymptoms: next.includes(item) ? next.filter((entry) => entry !== item) : [...next, item] });
  };
  const toggleFactor = (item: PossibleRelatedFactor) => {
    const values = value.possibleRelatedFactors ?? [];
    onChange({ ...value, possibleRelatedFactors: values.includes(item) ? values.filter((entry) => entry !== item) : [...values, item] });
  };
  return <div className="form-stack">
    <fieldset><legend>哪只眼睛？</legend><div className="chips">{eyeScopes.map((item) => <button className={value.eyeScope === item ? "chip selected" : "chip"} type="button" key={item} onClick={() => onChange({ ...value, eyeScope: item as EyeScope })}>{labels[item]}</button>)}</div></fieldset>
    <fieldset><legend>看到了什么？（可多选）</legend><div className="chips">{visualSymptoms.map((item) => <button className={value.visualSymptoms?.includes(item) ? "chip selected" : "chip"} type="button" key={item} onClick={() => toggleVisual(item)}>{labels[item]}</button>)}</div></fieldset>
    <fieldset><legend>影响程度</legend><div className="severity">{[1, 2, 3, 4, 5].map((item) => <button className={value.severity === item ? "selected" : ""} type="button" key={item} onClick={() => onChange({ ...value, severity: item as 1 | 2 | 3 | 4 | 5 })}>{item}</button>)}</div><small>1 轻微 · 5 严重</small></fieldset>
    <button className="more-toggle" type="button" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}><span>{expanded ? "收起详细信息" : "记录更多信息"}</span><span>{expanded ? "−" : "+"}</span></button>
    {expanded && <div className="more-fields">
      <fieldset><legend>影响了哪部分视野？</legend><div className="chips">{visualFields.map((item) => <button className={value.visualFields?.includes(item) ? "chip selected" : "chip"} type="button" key={item} onClick={() => toggleField(item)}>{labels[item]}</button>)}</div></fieldset>
      <fieldset><legend>如何出现？</legend><div className="chips">{["sudden", "gradual", "unknown"].map((item) => <button className={value.onsetPattern === item ? "chip selected" : "chip"} type="button" key={item} onClick={() => onChange({ ...value, onsetPattern: item as EpisodeDraft["onsetPattern"] })}>{labels[item]}</button>)}</div></fieldset>
      <fieldset><legend>伴随表现（可多选）</legend><div className="chips">{associatedSymptoms.map((item) => <button className={value.associatedSymptoms?.includes(item) ? "chip selected" : "chip"} type="button" key={item} onClick={() => toggleAssociated(item)}>{labels[item]}</button>)}</div></fieldset>
      <fieldset><legend>恢复情况</legend><div className="mode-grid"><button className={value.recoveredCompletely === true ? "selected" : ""} type="button" onClick={() => onChange({ ...value, recoveredCompletely: true, residualSymptoms: false })}>完全恢复</button><button className={value.recoveredCompletely === false ? "selected" : ""} type="button" onClick={() => onChange({ ...value, recoveredCompletely: false, residualSymptoms: true })}>仍有异常</button></div></fieldset>
      <label>当时在做什么？<select value={value.activity ?? ""} onChange={(event) => onChange({ ...value, activity: event.target.value ? event.target.value as EpisodeDraft["activity"] : null })}><option value="">未选择</option>{activities.map((item) => <option key={item} value={item}>{labels[item]}</option>)}</select></label>
      <fieldset><legend>你认为可能相关的情况</legend><p className="hint">仅记录你的观察，不代表已经确认是诱因。</p><div className="chips">{relatedFactors.map((item) => <button className={value.possibleRelatedFactors?.includes(item) ? "chip selected" : "chip"} type="button" key={item} onClick={() => toggleFactor(item)}>{labels[item]}</button>)}</div></fieldset>
      <fieldset><legend>和以前是否相似？</legend><div className="mode-grid"><button className={value.similarToPrevious === true ? "selected" : ""} type="button" onClick={() => onChange({ ...value, similarToPrevious: true })}>相似</button><button className={value.similarToPrevious === false ? "selected" : ""} type="button" onClick={() => onChange({ ...value, similarToPrevious: false })}>不相似</button></div></fieldset>
    </div>}
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
