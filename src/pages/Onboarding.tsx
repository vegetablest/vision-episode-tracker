import { useState } from "react";

export function Onboarding({ signedIn, onDone }: { signedIn: boolean; onDone: () => void }) {
  const [step, setStep] = useState(0);
  const [accepted, setAccepted] = useState(false);
  const storagePage = signedIn
    ? <><span className="onboarding-icon">☁</span><h1>本地优先，安全同步</h1><p>记录会同步到你的云端账户；离线时仍可正常记录，联网后自动补传。</p><label className="accept"><input type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} />我理解记录会在登录设备间同步</label></>
    : <><span className="onboarding-icon">⌂</span><h1>仅保存在本机</h1><p>无需账号即可使用；注册或登录后，可以把现有记录同步到你的账户。</p><label className="accept"><input type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} />我知道本地模式需要自行备份</label></>;
  const pages = [<><span className="onboarding-icon">◉</span><h1>记录每一次视觉异常</h1><p>实时计时或事后补录，帮助你整理变化与就诊材料。</p></>, storagePage, <><span className="onboarding-icon">＋</span><h1>添加到主屏幕</h1><p>在 Safari 点“分享”，选择“添加到主屏幕”。首次加载后可离线使用。</p></>];
  const next = () => { if (step === pages.length - 1) onDone(); else setStep(step + 1); };
  return <main className="onboarding"><div>{pages[step]}<div className="dots">{pages.map((_, index) => <i className={index === step ? "active" : ""} key={index} />)}</div><button className="primary" disabled={step === 1 && !accepted} onClick={next}>{step === pages.length - 1 ? "开始使用" : "下一步"}</button></div></main>;
}
