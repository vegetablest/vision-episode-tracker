import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { InstallGuide } from "./InstallGuide";

beforeEach(() => {
  vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
});

afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe("InstallGuide", () => {
  it("offers the browser prompt only after it becomes available", async () => {
    const prompt = vi.fn().mockResolvedValue(undefined);
    const event = Object.assign(new Event("beforeinstallprompt", { cancelable: true }), { prompt, userChoice: Promise.resolve({ outcome: "dismissed" }) });
    render(<InstallGuide />);
    expect(screen.queryByRole("button", { name: "安装应用" })).not.toBeInTheDocument();
    fireEvent(window, event);
    fireEvent.click(await screen.findByRole("button", { name: "安装应用" }));
    await waitFor(() => expect(prompt).toHaveBeenCalledOnce());
  });

  it("hides settings guidance after installation", () => {
    const { container } = render(<InstallGuide />);
    fireEvent(window, new Event("appinstalled"));
    expect(container).toBeEmptyDOMElement();
  });
});
