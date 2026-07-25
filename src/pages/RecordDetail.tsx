import { useLiveQuery } from "dexie-react-hooks";
import { Link, useNavigate, useParams } from "react-router-dom";
import { formatDateTime, formatDuration, labels } from "../app/labels";
import { db } from "../db/database";
import { episodes } from "../db/repository";

export function RecordDetail() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const episode = useLiveQuery(() => db.episodes.get(id), [id]);
  if (!episode) return <main className="page"><div className="empty"><h1>找不到记录</h1><Link to="/records">返回记录</Link></div></main>;
  const toggleVoid = async () => { if (episode.status === "voided") await episodes.restoreEpisode(id); else if (confirm("作废后记录会保留，但不参与默认统计。继续吗？")) await episodes.voidEpisode(id); };
  const remove = async () => { if (confirm("永久删除无法恢复。仅应删除测试数据。确定继续吗？")) { await episodes.permanentlyDeleteEpisode(id); navigate("/records"); } };
  const rows = [["发生日期", episode.occurredOn], ["开始", formatDateTime(episode.startAt)], ["结束", formatDateTime(episode.endAt)], ["持续", formatDuration(episode.duration.minutes)], ["记录方式", episode.recordMethod === "live" ? "实时记录" : "事后补录"], ["眼别", episode.eyeScope ? labels[episode.eyeScope] : "未记录"], ["视觉表现", episode.visualSymptoms.map((item) => labels[item]).join("、") || "未记录"], ["严重程度", episode.severity ?? "未记录"], ["备注", episode.note || "未记录"]];
  return <main className="page narrow"><header><p className="eyebrow">记录详情</p><h1>{episode.status === "voided" ? "已作废的记录" : episode.status === "ongoing" ? "正在发生" : "视觉异常记录"}</h1></header><section className="detail-card">{rows.map(([key, value]) => <div key={key}><span>{key}</span><strong>{value}</strong></div>)}</section><div className="button-row">{episode.status !== "ongoing" && <Link className="primary" to={`/records/${id}/edit`}>编辑记录</Link>}<button className="secondary" onClick={toggleVoid}>{episode.status === "voided" ? "恢复记录" : "作废记录"}</button><button className="text-danger" onClick={remove}>永久删除测试数据</button></div><p className="medical-note">本应用只整理你记录的事实，不提供诊断或治疗建议。</p></main>;
}
