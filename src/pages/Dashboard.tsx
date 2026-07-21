import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useActiveEpisode, useEpisodes, useSettings } from "../app/hooks";
import { formatDateTime, formatDuration } from "../app/labels";
import { EpisodeCard, EpisodeDetailsForm } from "../components/EpisodeDetailsForm";
import type { EpisodeDraft } from "../domain/episode";
import { periodMetrics } from "../domain/statistics";
import { episodes } from "../db/repository";

export function Dashboard() {
  const all = useEpisodes();
  const active = useActiveEpisode();
  const settings = useSettings();
  const navigate = useNavigate();
  const [details, setDetails] = useState<Partial<EpisodeDraft>>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const start = async () => { setBusy(true); setError(""); try { const item = await episodes.createLiveEpisode(new Date(), settings.reportingTimezone); navigate(`/recording/current?id=${item.id}`); } catch (cause) { setError(cause instanceof Error ? cause.message : "无法开始记录"); } finally { setBusy(false); } };
  const end = async () => { if (!active) return; setBusy(true); try { await episodes.endLiveEpisode(active.id, new Date(), details); setDetails({}); } finally { setBusy(false); } };
  const metrics = [7, 30, 365].map((days) => ({ days, value: periodMetrics(all, days, new Date(), settings.reportingTimezone) }));
  return <main className="page">
    <header className="hero"><div><p className="eyebrow">VISION EPISODE TRACKER</p><h1>今天感觉怎么样？</h1><p>记录事实，留意变化，不做诊断。</p></div><Link className="icon-button" to="/settings" aria-label="设置">⚙</Link></header>
    {active ? <section className="active-panel"><span className="pulse">正在记录</span><h2>{formatDateTime(active.startAt)}</h2><p>即使退出页面，开始时间也已经安全保存在本机。</p><EpisodeDetailsForm value={details} onChange={setDetails} /><button className="primary danger" disabled={busy} onClick={end}>症状已恢复，结束记录</button></section> : <section className="actions"><button className="primary record-button" disabled={busy} onClick={start}><span className="stopwatch" aria-hidden="true">◷</span> 开始记录发作<small>立即保存当前时间</small></button><Link className="secondary record-button" to="/recording/manual">补录一次发作<small>记录已经结束的情况</small></Link>{error && <p className="error">{error}</p>}</section>}
    <section><div className="section-heading"><h2>近期概览</h2><Link to="/trends">查看趋势</Link></div><div className="metrics">{metrics.map(({ days, value }) => <article key={days}><span>最近 {days} 天</span><strong>{value.episodeCount}<small> 次</small></strong><p>{value.symptomDays} 个症状日 · {value.episodeComparison.displayMode === "percentage" ? `${value.episodeComparison.absoluteChange >= 0 ? "+" : ""}${value.episodeComparison.absoluteChange} 较上期` : value.episodeComparison.displayMode === "from_zero" ? "上期为 0" : "与上期相同"}</p></article>)}</div></section>
    <section><div className="section-heading"><h2>最近记录</h2><Link to="/records">全部记录</Link></div><div className="episode-list">{all.slice(0, 4).map((item) => <EpisodeCard key={item.id} episode={item} />)}{!all.length && <div className="empty"><span>◌</span><h3>还没有记录</h3><p>需要时，只点一次“开始记录发作”。</p></div>}</div></section>
    {active && <p className="duration-note">当前持续时间按开始时间实时计算：{formatDuration((Date.now() - new Date(active.startAt!).getTime()) / 60000)}</p>}
  </main>;
}
