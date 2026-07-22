import { describe, expect, it } from "vitest";
import { installPlatform, runsStandalone } from "./install";

const navigatorInfo = { userAgent: "", platform: "Linux", maxTouchPoints: 0 };

describe("PWA install environment", () => {
  it("recognizes Android and touch-enabled iPadOS", () => {
    expect(installPlatform({ ...navigatorInfo, userAgent: "Mozilla/5.0 (Linux; Android 15)" })).toBe("android");
    expect(installPlatform({ ...navigatorInfo, platform: "MacIntel", maxTouchPoints: 5 })).toBe("ios");
  });

  it("recognizes browser and iOS standalone modes", () => {
    expect(runsStandalone(navigatorInfo, { matches: true } as MediaQueryList)).toBe(true);
    expect(runsStandalone({ ...navigatorInfo, standalone: true }, { matches: false } as MediaQueryList)).toBe(true);
    expect(runsStandalone(navigatorInfo, { matches: false } as MediaQueryList)).toBe(false);
  });
});
