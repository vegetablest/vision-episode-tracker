import { useState } from "react";
import { supabase } from "../cloud/client";

export function AuthPage({ onSkip }: { onSkip?: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (mode: "signIn" | "signUp") => {
    if (!email.trim() || password.length < 8) {
      setMessage("请输入有效邮箱和至少 8 位密码。");
      return;
    }
    setBusy(true); setMessage("");
    const result = mode === "signIn"
      ? await supabase.auth.signInWithPassword({ email: email.trim(), password })
      : await supabase.auth.signUp({ email: email.trim(), password });
    setBusy(false);
    if (result.error) return setMessage(result.error.message);
    if (mode === "signUp" && !result.data.session) setMessage("注册成功，请检查邮箱并完成验证。\n");
  };

  return <main className="auth-page"><form onSubmit={(event) => { event.preventDefault(); const button = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement; void submit(button.value === "signUp" ? "signUp" : "signIn"); }}><p className="eyebrow">可选云同步</p><h1>登录你的记录</h1><p>登录后可跨设备同步；也可以跳过登录，只在当前设备管理数据。</p><label>邮箱<input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label><label>密码<input required minLength={8} type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} /></label>{message && <p className="notice">{message}</p>}<button className="primary" disabled={busy} type="submit" value="signIn">{busy ? "请稍候…" : "登录"}</button><button className="secondary" disabled={busy} type="submit" value="signUp">创建账户并同步本地数据</button>{onSkip && <button className="text-button" type="button" onClick={onSkip}>跳过登录，仅保存在本机</button>}</form></main>;
}
