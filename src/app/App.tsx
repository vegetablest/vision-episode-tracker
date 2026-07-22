import { useEffect, useState } from "react";
import { HashRouter, Navigate, NavLink, Route, Routes, useLocation } from "react-router-dom";
import { initializeDatabase } from "../db/database";
import { useAuth } from "../auth/state";
import { AuthPage } from "../pages/Auth";
import { CalendarPage } from "../pages/Calendar";
import { Dashboard } from "../pages/Dashboard";
import { ManualEntry } from "../pages/ManualEntry";
import { Onboarding } from "../pages/Onboarding";
import { RecordDetail } from "../pages/RecordDetail";
import { Records } from "../pages/Records";
import { Report } from "../pages/Report";
import { Settings } from "../pages/Settings";
import { Trends } from "../pages/Trends";

function AccountPage() {
  const { user } = useAuth();
  return user ? <Navigate replace to="/settings" /> : <AuthPage />;
}

function Shell() {
  const location = useLocation();
  const showNav = !location.pathname.startsWith("/recording/") && !location.pathname.startsWith("/settings") && !location.pathname.startsWith("/account");
  return <div className="app-shell"><Routes><Route path="/" element={<Dashboard />} /><Route path="/recording/current" element={<Dashboard />} /><Route path="/recording/manual" element={<ManualEntry />} /><Route path="/trends" element={<Trends />} /><Route path="/calendar" element={<CalendarPage />} /><Route path="/records" element={<Records />} /><Route path="/records/:id" element={<RecordDetail />} /><Route path="/report" element={<Report />} /><Route path="/settings" element={<Settings />} /><Route path="/account" element={<AccountPage />} /></Routes>{showNav && <nav className="bottom-nav">{[["/", "⌂", "首页"], ["/trends", "⌁", "趋势"], ["/calendar", "▦", "日历"], ["/records", "☷", "记录"], ["/report", "▤", "报告"]].map(([to, icon, name]) => <NavLink end={to === "/"} to={to} key={to}><span>{icon}</span>{name}</NavLink>)}</nav>}</div>;
}

export function App() {
  const auth = useAuth();
  const [ready, setReady] = useState(false);
  const [guestMode, setGuestMode] = useState(() => localStorage.getItem("guest-mode") === "1");
  const [onboarded, setOnboarded] = useState(() => localStorage.getItem("onboarding-complete") === "1");
  useEffect(() => { initializeDatabase().then(() => setReady(true)); }, []);
  useEffect(() => { const enableGuest = () => setGuestMode(true); window.addEventListener("guest-mode-enabled", enableGuest); return () => window.removeEventListener("guest-mode-enabled", enableGuest); }, []);
  if (!auth.ready || !ready) return <div className="splash">正在安全地打开记录…</div>;
  if (!auth.user && !guestMode) return <AuthPage onSkip={() => { localStorage.setItem("guest-mode", "1"); setGuestMode(true); }} />;
  if (!onboarded) return <Onboarding signedIn={Boolean(auth.user)} onDone={() => { localStorage.setItem("onboarding-complete", "1"); setOnboarded(true); }} />;
  return <HashRouter><Shell /></HashRouter>;
}
