import { useEpisodes, useSettings } from "../app/hooks";
import { labels } from "../app/labels";
import { dataQuality, periodMetrics, timeDistribution } from "../domain/statistics";

export function Trends() {
  const episodes = useEpisodes();
  const settings = useSettings();
  const metrics = periodMetrics(episodes, 30);
  const distribution = timeDistribution(episodes, settings.reportingTimezone);
  const quality = dataQuality(episodes);
  const symptoms = [...episodes.filter((item) => item.status !== "voided").flatMap((item) => item.visualSymptoms).reduce((map, item) => map.set(item, (map.get(item) ?? 0) + 1), new Map<string, number>())].sort((a, b) => b[1] - a[1]);
  return <main className="page"><header><p className="eyebrow">趋势</p><h1>看见变化，不下结论</h1><p>样本量较小时，仅展示分布，不推断高风险时段。</p></header><div className="stat-banner"><div><strong>{metrics.episodeCount}</strong><span>近 30 天次数</span></div><div><strong>{metrics.symptomDays}</strong><span>症状日</span></div><div><strong>{metrics.medianDurationMinutes === null ? "—" : Math.round(metrics.medianDurationMinutes)}</strong><span>中位分钟</span></div></div>
    <section><h2>一天中的分布</h2><div className="bar-list">{distribution.periods.map((item) => <div key={item.period}><span>{labels[item.period]}</span><div><i style={{ width: `${item.percentage}%` }} /></div><strong>{item.count}</strong></div>)}</div><p className="hint">{distribution.excludedFromHourly} 条记录因时间不精确，未纳入小时统计。</p></section>
    <section><h2>视觉表现</h2><div className="tag-counts">{symptoms.map(([name, count]) => <span key={name}>{labels[name]} <strong>{count}</strong></span>)}{!symptoms.length && <p className="hint">记录更多信息后显示。</p>}</div></section>
    <section><h2>数据质量</h2><div className="quality-grid"><span>精确开始时间<strong>{Math.round(quality.exactStartRate * 100)}%</strong></span><span>持续时间完整<strong>{Math.round(quality.durationCoverageRate * 100)}%</strong></span><span>眼别完整<strong>{Math.round(quality.eyeScopeCoverageRate * 100)}%</strong></span><span>视觉表现完整<strong>{Math.round(quality.visualSymptomsCoverageRate * 100)}%</strong></span></div></section>
  </main>;
}
