import type { Session } from "@supabase/supabase-js";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../cloud/client";
import { synchronize } from "../cloud/sync";
import { AuthContext } from "./state";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [syncError, setSyncError] = useState("");

  useEffect(() => {
    const apply = (next: Session | null) => {
      setSession(next);
      setReady(true);
      if (next?.user) void synchronize(next.user).catch(() => setSyncError("云端同步暂时失败，本地记录不受影响。"));
    };
    void supabase.auth.getSession().then(({ data }) => apply(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, next) => apply(next));
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session?.user) return;
    const sync = () => { void synchronize(session.user).then(() => setSyncError("")).catch(() => setSyncError("云端同步暂时失败，本地记录不受影响。")); };
    const timer = window.setInterval(sync, 15_000);
    const channel = supabase.channel(`episodes:${session.user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "episodes", filter: `user_id=eq.${session.user.id}` }, sync)
      .on("postgres_changes", { event: "*", schema: "public", table: "episode_deletions", filter: `user_id=eq.${session.user.id}` }, sync)
      .subscribe();
    window.addEventListener("online", sync);
    window.addEventListener("visibilitychange", sync);
    window.addEventListener("vision-sync-requested", sync);
    return () => { void supabase.removeChannel(channel); window.clearInterval(timer); window.removeEventListener("online", sync); window.removeEventListener("visibilitychange", sync); window.removeEventListener("vision-sync-requested", sync); };
  }, [session?.user]);

  const value = useMemo(() => ({ user: session?.user ?? null, ready, syncError }), [session, ready, syncError]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
