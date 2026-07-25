import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Link, useNavigate, useParams } from "react-router-dom";
import { EpisodeDetailsForm } from "../components/EpisodeDetailsForm";
import { episodeDetails, type EpisodeDraft, type TimeAccuracy, type TimePeriod, type VisionEpisode } from "../domain/episode";
import { dateInputToIso } from "../domain/time";
import { db } from "../db/database";
import { episodes } from "../db/repository";

function localTime(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function EditForm({ episode }: { episode: VisionEpisode }) {
  const navigate = useNavigate();
  const mode = episode.startTimeAccuracy === "unknown" ? "date_only" : episode.startTimeAccuracy;
  const [date, setDate] = useState(episode.occurredOn);
  const [accuracy, setAccuracy] = useState<TimeAccuracy>(mode);
  const [start, setStart] = useState(localTime(episode.startAt));
  const [end, setEnd] = useState(localTime(episode.endAt));
  const [period, setPeriod] = useState<TimePeriod>(episode.timePeriod ?? "afternoon");
  const [duration, setDuration] = useState(episode.duration.minutes?.toString() ?? "");
  const [details, setDetails] = useState<Partial<EpisodeDraft>>(() => episodeDetails(episode));
  const [error, setError] = useState("");
  const today = new Date().toISOString().slice(0, 10);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    try {
      const hasTime = accuracy === "exact" || accuracy === "approximate";
      await episodes.editEpisode(episode.id, {
        occurredOn: date,
        startAt: hasTime && start ? dateInputToIso(date, start) : null,
        endAt: hasTime && end ? dateInputToIso(date, end) : null,
        timePeriod: accuracy === "period_only" ? period : null,
        accuracy,
        durationMinutes: duration ? Number(duration) : null,
        details,
      });
      navigate(`/records/${episode.id}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "保存失败");
    }
  };

  return <main className="page narrow">
    <header><p className="eyebrow">编辑记录</p><h1>修改已记录的数据</h1></header>
    <form className="form-stack" onSubmit={save}>
      <label>发生日期<input required type="date" max={today} value={date} onChange={(event) => setDate(event.target.value)} /></label>
      <fieldset><legend>时间准确程度</legend><div className="mode-grid">{[["exact", "精确时间"], ["approximate", "大约时间"], ["period_only", "仅记得时段"], ["date_only", "只记得日期"]].map(([value, label]) => <button type="button" className={accuracy === value ? "selected" : ""} key={value} onClick={() => setAccuracy(value as TimeAccuracy)}>{label}</button>)}</div></fieldset>
      {(accuracy === "exact" || accuracy === "approximate") && <div className="two-columns"><label>开始时间<input required type="time" value={start} onChange={(event) => setStart(event.target.value)} /></label><label>结束时间（可选）<input type="time" value={end} onChange={(event) => setEnd(event.target.value)} /></label></div>}
      {accuracy === "period_only" && <label>大致时段<select value={period} onChange={(event) => setPeriod(event.target.value as TimePeriod)}><option value="dawn">凌晨</option><option value="morning">上午</option><option value="afternoon">下午</option><option value="evening">晚上</option></select></label>}
      {!end && <label>持续时间（分钟，可选）<input type="number" min="0.1" step="0.1" value={duration} onChange={(event) => setDuration(event.target.value)} /></label>}
      <EpisodeDetailsForm initiallyExpanded value={details} onChange={setDetails} />
      {error && <p className="error">{error}</p>}
      <div className="button-row"><button className="primary" type="submit">保存修改</button><Link className="secondary" to={`/records/${episode.id}`}>取消</Link></div>
    </form>
  </main>;
}

export function RecordEdit() {
  const { id = "" } = useParams();
  const episode = useLiveQuery(() => db.episodes.get(id), [id]);
  if (!episode) return <main className="page"><div className="empty"><h1>找不到记录</h1><Link to="/records">返回记录</Link></div></main>;
  if (episode.status === "ongoing") return <main className="page"><div className="empty"><h1>记录仍在进行</h1><p>请先结束记录，再修改数据。</p><Link to="/">返回首页</Link></div></main>;
  return <EditForm episode={episode} />;
}
