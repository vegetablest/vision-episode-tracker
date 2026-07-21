import { useMemo, useState } from "react";
import { useEpisodes } from "../app/hooks";
import { EpisodeCard } from "../components/EpisodeDetailsForm";

export function CalendarPage() {
  const episodes = useEpisodes().filter((item) => item.status !== "voided");
  const [cursor, setCursor] = useState(() => new Date());
  const [selected, setSelected] = useState("");
  const year = cursor.getFullYear(), month = cursor.getMonth();
  const cells = useMemo(() => { const first = new Date(year, month, 1); const count = new Date(year, month + 1, 0).getDate(); return [...Array((first.getDay() + 6) % 7).fill(null), ...Array.from({ length: count }, (_, index) => index + 1)]; }, [year, month]);
  const key = (day: number) => `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const selectedItems = episodes.filter((item) => item.occurredOn === selected);
  return <main className="page"><header><p className="eyebrow">日历</p><h1>按日期回看</h1></header><section className="calendar"><div className="calendar-head"><button onClick={() => setCursor(new Date(year, month - 1))}>←</button><h2>{year} 年 {month + 1} 月</h2><button onClick={() => setCursor(new Date(year, month + 1))}>→</button></div><div className="weekdays">{["一", "二", "三", "四", "五", "六", "日"].map((item) => <span key={item}>{item}</span>)}</div><div className="days">{cells.map((day, index) => day ? <button className={selected === key(day) ? "selected" : ""} key={key(day)} onClick={() => setSelected(key(day))}><span>{day}</span>{episodes.filter((item) => item.occurredOn === key(day)).length > 0 && <i>{episodes.filter((item) => item.occurredOn === key(day)).length}</i>}</button> : <span key={`empty-${index}`} />)}</div></section>{selected && <section><h2>{selected} 的记录</h2><div className="episode-list">{selectedItems.map((item) => <EpisodeCard key={item.id} episode={item} />)}{!selectedItems.length && <p className="hint">这一天没有记录。</p>}</div></section>}</main>;
}
