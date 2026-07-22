export type InstallPlatform = "android" | "ios" | "other";

interface NavigatorInfo {
  userAgent: string;
  platform: string;
  maxTouchPoints: number;
  standalone?: boolean;
}

export function installPlatform(navigator: NavigatorInfo): InstallPlatform {
  if (/iPad|iPhone|iPod/.test(navigator.userAgent) || navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1) return "ios";
  return /Android/i.test(navigator.userAgent) ? "android" : "other";
}

export function runsStandalone(navigator: NavigatorInfo, media: MediaQueryList): boolean {
  return media.matches || navigator.standalone === true;
}
