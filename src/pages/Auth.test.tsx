import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthPage } from "./Auth";

const { signUp } = vi.hoisted(() => ({ signUp: vi.fn() }));

vi.mock("../cloud/client", () => ({
  supabase: { auth: { signInWithPassword: vi.fn(), signUp } },
}));

describe("AuthPage", () => {
  beforeEach(() => signUp.mockReset());

  it("does not turn an empty registration into an anonymous signup", () => {
    render(<AuthPage />);
    fireEvent.click(screen.getByRole("button", { name: "创建账户并同步本地数据" }));
    expect(signUp).not.toHaveBeenCalled();
  });

  it("allows local-only use without an account", () => {
    const onSkip = vi.fn();
    render(<AuthPage onSkip={onSkip} />);
    fireEvent.click(screen.getByRole("button", { name: "跳过登录，仅保存在本机" }));
    expect(onSkip).toHaveBeenCalledOnce();
  });
});
