import { useCallback, useEffect, useState } from "react";
import { installPlatform, runsStandalone } from "./install";

interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function useInstallPrompt() {
  const [media] = useState(() => window.matchMedia("(display-mode: standalone)"));
  const [prompt, setPrompt] = useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(() => runsStandalone(navigator, media));

  useEffect(() => {
    const available = (event: Event) => { event.preventDefault(); setPrompt(event as InstallPromptEvent); };
    const complete = () => { setInstalled(true); setPrompt(null); };
    const displayChanged = () => setInstalled(runsStandalone(navigator, media));
    window.addEventListener("beforeinstallprompt", available);
    window.addEventListener("appinstalled", complete);
    media.addEventListener("change", displayChanged);
    return () => { window.removeEventListener("beforeinstallprompt", available); window.removeEventListener("appinstalled", complete); media.removeEventListener("change", displayChanged); };
  }, [media]);

  const install = useCallback(async () => {
    if (!prompt) return;
    await prompt.prompt();
    const choice = await prompt.userChoice;
    setPrompt(null);
    if (choice.outcome === "accepted") setInstalled(true);
  }, [prompt]);

  return { platform: installPlatform(navigator), canInstall: Boolean(prompt), installed, install };
}
