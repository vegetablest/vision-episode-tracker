import { useState } from "react";
import { useEpisodes } from "../app/hooks";
import { EpisodeCard } from "../components/EpisodeDetailsForm";
import { groupEpisodes, type TimelineGrouping } from "../domain/timeline";

export function Records() {
  const episodes = useEpisodes();
  const [showVoided, setShowVoided] = useState(false);
  const [grouping, setGrouping] = useState<TimelineGrouping>("day");
  const visible = episodes.filter((item) => showVoided || item.status !== "voided");
  const groups = groupEpisodes(visible, grouping);

  return <main className="page">
    <header><p className="eyebrow">记录</p><h1>发作时间线</h1><p>按时间回看每次记录，观察聚集与间隔。</p></header>
    <div className="records-toolbar">
      <div className="segmented" aria-label="时间线聚合方式">{[["day", "日"], ["week", "周"], ["month", "月"]].map(([value, label]) => <button type="button" aria-pressed={grouping === value} className={grouping === value ? "selected" : ""} key={value} onClick={() => setGrouping(value as TimelineGrouping)}>按{label}</button>)}</div>
      <label className="switch"><input type="checkbox" checked={showVoided} onChange={(event) => setShowVoided(event.target.checked)} />显示已作废</label>
    </div>
    <div className="timeline">{groups.map((group) => <section className="timeline-group" key={group.key}>
      <div className="timeline-heading"><i aria-hidden="true" /><div><h2>{group.label}</h2><span>{group.episodes.length} 次记录</span></div></div>
      <div className="timeline-items">{group.episodes.map((episode) => <EpisodeCard episode={episode} key={episode.id} />)}</div>
    </section>)}</div>
    {!groups.length && <div className="empty"><h3>没有符合条件的记录</h3><p>记录完成后会按时间出现在这里。</p></div>}
  </main>;
}
