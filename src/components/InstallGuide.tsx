import { useInstallPrompt } from "../app/useInstallPrompt";

interface GuideContentProps {
  platform: "android" | "ios" | "other";
  canInstall: boolean;
  install(): Promise<void>;
}

function GuideContent({ platform, canInstall, install }: GuideContentProps) {
  if (canInstall) return <><p>安装后可以从桌面直接打开，并继续使用离线记录。</p><button className="primary" onClick={() => void install()}>安装应用</button></>;
  if (platform === "ios") return <><p>使用 Safari 打开本应用，然后：</p><ol><li>点击分享按钮。</li><li>选择“添加到主屏幕”。</li></ol></>;
  if (platform === "android") return <p>如果没有出现安装按钮，请打开浏览器菜单，选择“安装应用”或“添加到主屏幕”。</p>;
  return <p>支持安装的浏览器可通过地址栏或浏览器菜单中的“安装应用”添加到桌面。</p>;
}

export function InstallGuide({ onboarding = false }: { onboarding?: boolean }) {
  const state = useInstallPrompt();
  if (state.installed) return onboarding ? <><span className="onboarding-icon">✓</span><h1>已经安装</h1><p>可以从桌面直接打开应用。</p></> : null;
  const content = <><span className={onboarding ? "onboarding-icon" : "install-icon"}>＋</span><h1 className={onboarding ? undefined : "install-title"}>安装到设备</h1><GuideContent platform={state.platform} canInstall={state.canInstall} install={state.install} /></>;
  return onboarding ? content : <section className="settings-group install-guide">{content}</section>;
}
