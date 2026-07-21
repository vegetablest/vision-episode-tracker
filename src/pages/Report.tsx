import { useEpisodes } from "../app/hooks";
import { createCsv } from "../domain/export";
import { periodMetrics } from "../domain/statistics";

function download(content: string, type: string, filename: string) { const url = URL.createObjectURL(new Blob([content], { type })); const anchor = document.createElement("a"); anchor.href = url; anchor.download = filename; anchor.click(); URL.revokeObjectURL(url); }

export function Report() {
  const episodes = useEpisodes().filter((item) => item.status !== "voided");
  const metrics = periodMetrics(episodes, 30);
  const summary = `最近 30 天共记录 ${metrics.episodeCount} 次视觉异常，涉及 ${metrics.symptomDays} 个症状日。${metrics.medianDurationMinutes === null ? "可用记录不足，无法计算持续时间中位数。" : `有持续时间的记录中，中位数约为 ${Math.round(metrics.medianDurationMinutes)} 分钟。`}其中实时记录 ${metrics.liveCount} 次，事后补录 ${metrics.manualCount} 次。本摘要仅整理本人记录，不代表医学诊断。`;
  const copy = async () => navigator.clipboard.writeText(summary);
  const exportCsv = () => download(createCsv(episodes), "text/csv;charset=utf-8", `vision-episode-tracker-${new Date().toISOString().slice(0, 10)}.csv`);
  return <main className="page narrow"><header><p className="eyebrow">就诊报告</p><h1>最近 30 天摘要</h1></header><section className="report-paper"><p>{summary}</p><dl><div><dt>发作次数</dt><dd>{metrics.episodeCount}</dd></div><div><dt>症状日</dt><dd>{metrics.symptomDays}</dd></div><div><dt>平均持续</dt><dd>{metrics.averageDurationMinutes === null ? "—" : `${Math.round(metrics.averageDurationMinutes)} 分钟`}</dd></div><div><dt>最长持续</dt><dd>{metrics.maxDurationMinutes === null ? "—" : `${Math.round(metrics.maxDurationMinutes)} 分钟`}</dd></div></dl><small>生成于 {new Date().toLocaleString("zh-CN")} · 数据来自本机记录</small></section><div className="button-row"><button className="primary" onClick={copy}>复制摘要</button><button className="secondary" onClick={() => window.print()}>打印 / 保存 PDF</button><button className="secondary" onClick={exportCsv}>导出 CSV</button></div><p className="medical-note">若出现突发严重症状，请直接寻求专业医疗帮助，不要依赖本应用判断。</p></main>;
}
