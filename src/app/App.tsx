import { useEffect, useState } from "react";
import { HashRouter, NavLink, Route, Routes, useLocation } from "react-router-dom";
import { initializeDatabase } from "../db/database";
import { CalendarPage } from "../pages/Calendar";
import { Dashboard } from "../pages/Dashboard";
import { ManualEntry } from "../pages/ManualEntry";
import { Onboarding } from "../pages/Onboarding";
import { RecordDetail } from "../pages/RecordDetail";
import { Records } from "../pages/Records";
import { Report } from "../pages/Report";
import { Settings } from "../pages/Settings";
import { Trends } from "../pages/Trends";

function Shell() {
  const location = useLocation();
  const showNav = !location.pathname.startsWith("/recording/") && !location.pathname.startsWith("/settings");
  return <div className="app-shell"><Routes><Route path="/" element={<Dashboard />} /><Route path="/recording/current" element={<Dashboard />} /><Route path="/recording/manual" element={<ManualEntry />} /><Route path="/trends" element={<Trends />} /><Route path="/calendar" element={<CalendarPage />} /><Route path="/records" element={<Records />} /><Route path="/records/:id" element={<RecordDetail />} /><Route path="/report" element={<Report />} /><Route path="/settings" element={<Settings />} /></Routes>{showNav && <nav className="bottom-nav">{[["/", "⌂", "首页"], ["/trends", "⌁", "趋势"], ["/calendar", "▦", "日历"], ["/records", "☷", "记录"], ["/report", "▤", "报告"]].map(([to, icon, name]) => <NavLink end={to === "/"} to={to} key={to}><span>{icon}</span>{name}</NavLink>)}</nav>}</div>;
}

export function App() {
  const [ready, setReady] = useState(false);
  const [onboarded, setOnboarded] = useState(() => localStorage.getItem("onboarding-complete") === "1");
  useEffect(() => { initializeDatabase().then(() => setReady(true)); }, []);
  if (!ready) return <div className="splash">正在打开本地记录…</div>;
  if (!onboarded) return <Onboarding onDone={() => { localStorage.setItem("onboarding-complete", "1"); setOnboarded(true); }} />;
  return <HashRouter><Shell /></HashRouter>;
}
