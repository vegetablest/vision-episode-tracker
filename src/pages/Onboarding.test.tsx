import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Onboarding } from "./Onboarding";

afterEach(cleanup);

function openStoragePage(signedIn: boolean) {
  render(<Onboarding signedIn={signedIn} onDone={vi.fn()} />);
  fireEvent.click(screen.getByRole("button", { name: "下一步" }));
}

describe("Onboarding", () => {
  it("describes cloud sync to signed-in users", () => {
    openStoragePage(true);
    expect(screen.getByText("我理解记录会在登录设备间同步")).toBeInTheDocument();
    expect(screen.queryByText("我知道本地模式需要自行备份")).not.toBeInTheDocument();
  });

  it("shows the local backup warning only to guests", () => {
    openStoragePage(false);
    expect(screen.getByText("我知道本地模式需要自行备份")).toBeInTheDocument();
  });
});
