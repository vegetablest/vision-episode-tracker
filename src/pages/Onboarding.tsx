import { useState } from "react";

export function Onboarding({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const [accepted, setAccepted] = useState(false);
  const pages = [<><span className="onboarding-icon">◉</span><h1>记录每一次视觉异常</h1><p>实时计时或事后补录，帮助你整理变化与就诊材料。</p></>, <><span className="onboarding-icon">⌂</span><h1>数据留在这台设备</h1><p>我们没有账号或服务器。删除应用、清除 Safari 网站数据或更换网址可能导致数据丢失。</p><label className="accept"><input type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} />我知道需要定期导出备份</label></>, <><span className="onboarding-icon">＋</span><h1>添加到主屏幕</h1><p>在 Safari 点“分享”，选择“添加到主屏幕”。首次加载后可离线使用。</p></>];
  const next = () => { if (step === pages.length - 1) onDone(); else setStep(step + 1); };
  return <main className="onboarding"><div>{pages[step]}<div className="dots">{pages.map((_, index) => <i className={index === step ? "active" : ""} key={index} />)}</div><button className="primary" disabled={step === 1 && !accepted} onClick={next}>{step === pages.length - 1 ? "开始使用" : "下一步"}</button></div></main>;
}
