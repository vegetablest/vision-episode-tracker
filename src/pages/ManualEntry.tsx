import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSettings } from "../app/hooks";
import { EpisodeDetailsForm } from "../components/EpisodeDetailsForm";
import type { EpisodeDraft, TimeAccuracy, TimePeriod } from "../domain/episode";
import { dateInputToIso } from "../domain/time";
import { episodes } from "../db/repository";

export function ManualEntry() {
  const navigate = useNavigate();
  const settings = useSettings();
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [mode, setMode] = useState<TimeAccuracy>("exact");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [period, setPeriod] = useState<TimePeriod>("afternoon");
  const [duration, setDuration] = useState("");
  const [details, setDetails] = useState<Partial<EpisodeDraft>>({});
  const [error, setError] = useState("");
  const save = async (event: React.FormEvent) => { event.preventDefault(); setError(""); try { const hasTime = mode === "exact" || mode === "approximate"; await episodes.createManualEpisode({ occurredOn: date, timezone: settings.reportingTimezone, startAt: hasTime && start ? dateInputToIso(date, start) : null, endAt: hasTime && end ? dateInputToIso(date, end) : null, timePeriod: mode === "period_only" ? period : null, accuracy: mode, durationMinutes: duration ? Number(duration) : null, details }); navigate("/records"); } catch (cause) { setError(cause instanceof Error ? cause.message : "保存失败"); } };
  return <main className="page narrow"><header><p className="eyebrow">事后补录</p><h1>记得多少，就记录多少</h1><p>不确定的时间不会被转换成虚假的精确时间。</p></header><form className="form-stack" onSubmit={save}>
    <label>发生日期<input required type="date" max={today} value={date} onChange={(event) => setDate(event.target.value)} /></label>
    <fieldset><legend>时间准确程度</legend><div className="mode-grid">{[["exact", "精确时间"], ["approximate", "大约时间"], ["period_only", "仅记得时段"], ["date_only", "只记得日期"]].map(([value, label]) => <button type="button" className={mode === value ? "selected" : ""} key={value} onClick={() => setMode(value as TimeAccuracy)}>{label}</button>)}</div></fieldset>
    {(mode === "exact" || mode === "approximate") && <div className="two-columns"><label>开始时间<input required type="time" value={start} onChange={(event) => setStart(event.target.value)} /></label><label>结束时间（可选）<input type="time" value={end} onChange={(event) => setEnd(event.target.value)} /></label></div>}
    {mode === "period_only" && <label>大致时段<select value={period} onChange={(event) => setPeriod(event.target.value as TimePeriod)}><option value="dawn">凌晨</option><option value="morning">上午</option><option value="afternoon">下午</option><option value="evening">晚上</option></select></label>}
    {!end && <label>持续时间（分钟，可选）<input type="number" min="0.1" step="0.1" value={duration} onChange={(event) => setDuration(event.target.value)} /></label>}
    <EpisodeDetailsForm value={details} onChange={setDetails} />{error && <p className="error">{error}</p>}<button className="primary" type="submit">保存这次记录</button>
  </form></main>;
}
