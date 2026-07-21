export const labels: Record<string, string> = {
  left: "左眼", right: "右眼", both: "双眼", unknown: "不确定",
  blurred: "视物模糊", blind_spot: "视野缺失", flashing: "闪光", zigzag: "锯齿", dark_shadow: "黑影", distorted: "视物变形", tunnel_vision: "管状视野", temporary_blindness: "短暂无法看清", other: "其他",
  headache: "头痛", nausea: "恶心", dizziness: "眩晕", numbness: "麻木", weakness: "无力", speech_difficulty: "言语困难", balance_problem: "平衡问题", none: "没有",
  dawn: "凌晨", morning: "上午", afternoon: "下午", evening: "晚上",
  left_field: "左侧视野", right_field: "右侧视野", central: "中央视野", peripheral: "周边视野", full: "全部视野",
  sudden: "突然出现", gradual: "逐渐发展",
  screen: "使用屏幕", reading: "阅读", driving: "驾驶", walking: "步行", exercise: "运动", resting: "休息", just_woke_up: "刚醒来", eating: "进食",
  poor_sleep: "睡眠不足", fasting: "空腹", stress: "压力", long_screen_time: "长时间看屏幕", bright_light: "强光", dehydration: "饮水不足",
};

export function formatDuration(minutes: number | null): string {
  if (minutes === null) return "未记录";
  if (minutes < 1) return "不到 1 分钟";
  if (minutes < 60) return `${Math.round(minutes)} 分钟`;
  return `${Math.floor(minutes / 60)} 小时 ${Math.round(minutes % 60)} 分钟`;
}

export function formatDateTime(iso: string | null): string {
  return iso ? new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso)) : "时间未记录";
}
