import { useState } from "react";
import { useEpisodes } from "../app/hooks";
import { EpisodeCard } from "../components/EpisodeDetailsForm";

export function Records() {
  const episodes = useEpisodes();
  const [showVoided, setShowVoided] = useState(false);
  const visible = episodes.filter((item) => showVoided || item.status !== "voided");
  return <main className="page"><header><p className="eyebrow">记录</p><h1>每一次都可核对</h1></header><label className="switch"><input type="checkbox" checked={showVoided} onChange={(event) => setShowVoided(event.target.checked)} />显示已作废记录</label><div className="episode-list">{visible.map((item) => <EpisodeCard episode={item} key={item.id} />)}{!visible.length && <div className="empty"><h3>没有符合条件的记录</h3></div>}</div></main>;
}
