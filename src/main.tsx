import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import { App } from "./app/App";
import { AuthProvider } from "./auth/AuthContext";
import "./styles.css";

const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm("应用已有新版本。现在更新吗？本地记录不会被删除。")) {
      void updateSW(true);
    }
  },
});
createRoot(document.getElementById("root")!).render(<StrictMode><AuthProvider><App /></AuthProvider></StrictMode>);
