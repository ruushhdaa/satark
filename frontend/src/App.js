import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import "./App.css";

const API = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";

// eslint-disable-next-line no-unused-vars
const VIEWS = ["dashboard", "control", "logs", "scanner", "settings", "docs"];
const TITLES = {
  dashboard: ["Dashboard", "SATARK Identity Protocol · Pune, IN"],
  control: ["Control Panel", "Manage card state and access rules"],
  logs: ["Threat Logs", "All honeypot captures"],
  scanner: ["Scan Simulator", "Test QR verification flow"],
  settings: ["Settings", "Configuration and preferences"],
  docs: ["API Docs", "Endpoint reference"],
};

export default function App() {
  const [view, setView] = useState("dashboard");
  const [cardMode, setCardMode] = useState("SAFE");
  const [scanCount, setScanCount] = useState(0);
  const [safeCount, setSafeCount] = useState(0);
  const [trapCount, setTrapCount] = useState(0);
  const [logs, setLogs] = useState([]);
  const [activity, setActivity] = useState([]);
  const [scanResult, setScanResult] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [toast, setToast] = useState("");
  const [toastVisible, setToastVisible] = useState(false);
  const [serverOnline, setServerOnline] = useState(false);

  const showToast = (msg) => {
    setToast(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2500);
  };

  const addActivity = useCallback((type, msg) => {
    const now = new Date();
    const time =
      now.getHours().toString().padStart(2, "0") +
      ":" +
      now.getMinutes().toString().padStart(2, "0");
    setActivity((prev) => [{ type, msg, time }, ...prev].slice(0, 5));
  }, []);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/api/status`);
      setCardMode(res.data.card_status);
      setServerOnline(true);
    } catch {
      setServerOnline(false);
    }
  }, []);

  const fetchLogs = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/admin/logs`);
      setLogs(res.data.logs || []);
    } catch {}
  }, []);

  useEffect(() => {
    fetchStatus();
    fetchLogs();
    const interval = setInterval(() => {
      fetchStatus();
      fetchLogs();
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchStatus, fetchLogs]);

  useEffect(() => {
    setScanCount((s) => s);
    setSafeCount(logs.filter ? logs.length : 0);
  }, [logs]);

  const toggleCard = async () => {
    try {
      await axios.get(`${API}/admin/toggle`);
      const newMode = cardMode === "SAFE" ? "LOST" : "SAFE";
      setCardMode(newMode);
      showToast(
        newMode === "LOST" ? "🚨 Honeypot activated" : "✓ Card marked as safe"
      );
    } catch {
      showToast("Server unreachable — toggling locally");
      setCardMode((m) => (m === "SAFE" ? "LOST" : "SAFE"));
    }
  };

  const doScan = async () => {
    setScanning(true);
    setScanResult(null);
    setScanCount((s) => s + 1);
    try {
      const res = await axios.get(`${API}/scan/card001`);
      const data = res.data;
      setScanResult(data);
      if (data.mode === "TRAP") {
        setTrapCount((t) => t + 1);
        addActivity("trap", "TRAP FIRED · Honeypot triggered · GPS captured");
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(async (pos) => {
            await axios.post(`${API}/api/capture`, {
              location: `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`,
              device: navigator.userAgent.substring(0, 60),
            });
            fetchLogs();
          });
        }
        showToast("🚨 Honeypot triggered — GPS captured");
      } else {
        setSafeCount((s) => s + 1);
        addActivity("safe", "Safe scan · Verification request sent to owner");
        showToast("✓ Safe scan — approval requested");
      }
    } catch {
      setScanResult({ error: true });
      showToast("Backend unreachable");
    }
    setScanning(false);
  };

  const clearLogs = async () => {
    setLogs([]);
    showToast("Logs cleared");
  };

  const isSafe = cardMode === "SAFE";

  return (
    <div className="satark-root">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-mark">S</div>
          <span className="logo-text">SATARK</span>
          <span className="logo-badge">v1.0</span>
        </div>

        <div className="sidebar-section">OVERVIEW</div>
        <NavItem icon="▦" label="Dashboard" active={view === "dashboard"} onClick={() => setView("dashboard")} />
        <NavItem icon="◉" label="Control Panel" active={view === "control"} onClick={() => setView("control")} badge={cardMode} badgeType={isSafe ? "green" : "red"} />

        <div className="sidebar-section">SECURITY</div>
        <NavItem icon="≡" label="Threat Logs" active={view === "logs"} onClick={() => setView("logs")} badge={logs.length > 0 ? logs.length : null} badgeType="red" />
        <NavItem icon="⊡" label="Scan Simulator" active={view === "scanner"} onClick={() => setView("scanner")} />

        <div className="sidebar-section">SYSTEM</div>
        <NavItem icon="⚙" label="Settings" active={view === "settings"} onClick={() => setView("settings")} />
        <NavItem icon="⊞" label="API Docs" active={view === "docs"} onClick={() => setView("docs")} />

        <div className="sidebar-bottom">
          <div className={`server-status ${serverOnline ? "online" : "offline"}`}>
            <div className={`s-dot ${serverOnline ? "s-online" : "s-offline"}`} />
            {serverOnline ? "Backend online" : "Backend offline"}
          </div>
          <div className="user-card">
            <div className="user-avatar">RJ</div>
            <div>
              <div className="user-name">Rushda Jagtap</div>
              <div className="user-role">FY · MITAOE</div>
            </div>
            <div className="user-chevron">⌄</div>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <div className="main">
        <header className="topbar">
          <div>
            <div className="topbar-title">{TITLES[view][0]}</div>
            <div className="topbar-sub">{TITLES[view][1]}</div>
          </div>
          <div className="topbar-spacer" />
          <div className={`status-pill ${isSafe ? "safe" : "lost"}`} onClick={() => setView("control")}>
            <div className={`status-dot ${isSafe ? "safe" : "lost"}`} />
            <span>{isSafe ? "CARD SAFE" : "TRAP ACTIVE"}</span>
          </div>
        </header>

        <div className="content">
          {view === "dashboard" && (
            <Dashboard scanCount={scanCount} safeCount={safeCount} trapCount={trapCount} isSafe={isSafe} activity={activity} />
          )}
          {view === "control" && (
            <ControlPanel isSafe={isSafe} onToggle={toggleCard} onClearLogs={clearLogs} showToast={showToast} />
          )}
          {view === "logs" && <LogsView logs={logs} onClear={clearLogs} />}
          {view === "scanner" && (
            <Scanner onScan={doScan} scanning={scanning} result={scanResult} cardMode={cardMode} />
          )}
          {view === "settings" && <Settings />}
          {view === "docs" && <Docs />}
        </div>
      </div>

      <div className={`toast ${toastVisible ? "show" : ""}`}>{toast}</div>
    </div>
  );
}

function NavItem({ icon, label, active, onClick, badge, badgeType }) {
  return (
    <div className={`nav-item ${active ? "active" : ""}`} onClick={onClick}>
      <span className="nav-icon">{icon}</span>
      {label}
      {badge !== null && badge !== undefined && (
        <span className={`nav-badge ${badgeType === "green" ? "green" : badgeType === "red" ? "" : "green"}`}>
          {badge}
        </span>
      )}
    </div>
  );
}

function Dashboard({ scanCount, safeCount, trapCount, isSafe, activity }) {
  return (
    <>
      <div className="metrics-grid">
        <MetricCard label="TOTAL SCANS" value={scanCount} sub="all time" />
        <MetricCard label="SAFE VERIFS" value={safeCount} sub="approved" color="green" />
        <MetricCard label="TRAPS FIRED" value={trapCount} sub="honeypot hits" color="red" />
        <MetricCard label="CARD STATUS" value={isSafe ? "SECURE" : "TRAP ON"} sub="operational" color={isSafe ? "green" : "red"} small />
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-title">SCAN ACTIVITY (7 DAYS)</div>
          <div className="mini-chart">
            {[20, 45, 30, 70, 50, 80, 100].map((h, i) => (
              <div key={i} className="bar" style={{ height: `${h}%`, background: i === 6 ? "#00d4aa" : "#1a3a2a" }} />
            ))}
          </div>
          <div className="chart-labels">
            {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
              <div key={i} className="chart-label">{d}</div>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="card-title">RECENT ACTIVITY</div>
          {activity.length === 0 ? (
            <div className="empty-inline">No activity yet</div>
          ) : (
            activity.map((a, i) => (
              <div key={i} className="log-item">
                <div className={`log-dot ${a.type === "safe" ? "safe-dot" : "trap-dot"}`} />
                <div className="log-time">{a.time}</div>
                <div className="log-text">{a.msg}</div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-title">CARD IDENTITY</div>
        <div className="card-identity-row">
          <div className="qr-box">
            <svg width="56" height="56" viewBox="0 0 7 7">
              <rect x="0" y="0" width="3" height="3" fill="#0a0a0b" />
              <rect x="1" y="1" width="1" height="1" fill="white" />
              <rect x="4" y="0" width="3" height="3" fill="#0a0a0b" />
              <rect x="5" y="1" width="1" height="1" fill="white" />
              <rect x="0" y="4" width="3" height="3" fill="#0a0a0b" />
              <rect x="1" y="5" width="1" height="1" fill="white" />
              <rect x="3" y="3" width="1" height="1" fill="#0a0a0b" />
              <rect x="4" y="4" width="1" height="1" fill="#0a0a0b" />
              <rect x="5" y="5" width="1" height="1" fill="#0a0a0b" />
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <InfoRow k="CARD ID" v="SATARK-2026-MH-0042" mono />
            <InfoRow k="OWNER" v="Rushda Jagtap" />
            <InfoRow k="INSTITUTION" v="MITAOE, Alandi" />
            <InfoRow k="PROTOCOL" v="HONEYPOT v1.0" mono accent />
          </div>
        </div>
      </div>
    </>
  );
}

function MetricCard({ label, value, sub, color, small }) {
  const colors = { green: "#00d4aa", red: "#e63946", default: "#fff" };
  return (
    <div className="metric-card">
      <div className="metric-label">{label}</div>
      <div className="metric-value" style={{ color: colors[color] || colors.default, fontSize: small ? "16px" : "24px" }}>{value}</div>
      <div className="metric-sub">{sub}</div>
    </div>
  );
}

function InfoRow({ k, v, mono, accent }) {
  return (
    <div className="info-row">
      <span className="info-key">{k}</span>
      <span className="info-val" style={{ fontFamily: mono ? "'DM Mono', monospace" : undefined, fontSize: mono ? "11px" : undefined, color: accent ? "#00d4aa" : undefined }}>{v}</span>
    </div>
  );
}

function ControlPanel({ isSafe, onToggle, onClearLogs, showToast }) {
  return (
    <>
      <div className="control-section">
        <div className="control-label">CARD MODE</div>
        <div className="big-toggle">
          <div>
            <div className="toggle-title">{isSafe ? "Card is Secure" : "Honeypot Active"}</div>
            <div className="toggle-desc">{isSafe ? "Scans will request owner approval" : "All scans will trigger GPS capture"}</div>
          </div>
          <div className="toggle-switch" onClick={onToggle}>
            <div className={`toggle-track ${isSafe ? "safe-track" : "lost-track"}`}>
              <div className={`toggle-thumb ${isSafe ? "safe-thumb" : "lost-thumb"}`} />
            </div>
          </div>
        </div>
        <div className="btn-row">
          <button className="action-btn btn-danger" onClick={onToggle}>
            {isSafe ? "🚨 Report Card Lost" : "✓ Mark as Recovered"}
          </button>
          <button className="action-btn btn-ghost" onClick={onClearLogs}>Clear Logs</button>
        </div>
      </div>

      <div className="control-section">
        <div className="control-label">ACCESS RULES</div>
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          {[
            ["Auto-deny timeout", "Deny if owner doesn't respond", "60s"],
            ["Document expiry", "Auto-delete shared documents", "5 min"],
            ["Honeypot mode", "Activate trap on stolen card scans", "ACTIVE"],
            ["Location capture", "GPS on unauthorized scan", "ON"],
          ].map(([k, d, v]) => (
            <div key={k} className="settings-row">
              <div><div className="settings-key">{k}</div><div className="settings-desc">{d}</div></div>
              <span className="tag tag-teal">{v}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function LogsView({ logs, onClear }) {
  return (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
        <div className="control-label">THREAT CAPTURE LOG</div>
        <button className="action-btn btn-ghost" onClick={onClear} style={{ fontSize: "10px", padding: "6px 12px" }}>Clear All</button>
      </div>
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <table className="log-table">
          <thead>
            <tr><th>TIMESTAMP</th><th>IP ADDRESS</th><th>LOCATION</th><th>THREAT</th><th>STATUS</th></tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr><td colSpan={5} className="empty-state">No threats captured yet.<br /><span style={{ color: "#333" }}>Run a trap scan from the Scan Simulator.</span></td></tr>
            ) : (
              logs.map((l, i) => (
                <tr key={i}>
                  <td>{l.timestamp}</td>
                  <td style={{ color: "#ccc" }}>{l.ip}</td>
                  <td>{l.location}</td>
                  <td><span className="threat-badge threat-high">HIGH</span></td>
                  <td style={{ color: "#00d4aa" }}>CAPTURED</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

function Scanner({ onScan, scanning, result, cardMode }) {
  return (
    <>
      <div className="card" style={{ textAlign: "center", padding: "32px", marginBottom: "16px" }}>
        <div className="scan-icon-ring">⊡</div>
        <div style={{ fontSize: "14px", color: "#ccc", marginBottom: "8px" }}>QR Code Scan Simulator</div>
        <div style={{ fontSize: "11px", color: "#555", fontFamily: "'DM Mono', monospace", marginBottom: "24px" }}>
          Current mode: <span style={{ color: cardMode === "SAFE" ? "#00d4aa" : "#e63946" }}>{cardMode}</span>
        </div>
        {result && (
          <div className={`scan-result ${result.error ? "scan-error" : result.mode === "TRAP" ? "scan-trap" : "scan-safe"}`} style={{ marginBottom: "20px" }}>
            {result.error && <div>Backend unreachable. Check Flask server.</div>}
            {result.mode === "SAFE" && <><div style={{ color: "#00d4aa", marginBottom: "4px" }}>✓ VERIFICATION REQUEST SENT</div><div style={{ fontSize: "11px", color: "#555" }}>Waiting for owner approval · 60s timeout</div></>}
            {result.mode === "TRAP" && <><div style={{ color: "#e63946", marginBottom: "4px" }}>🚨 HONEYPOT TRIGGERED</div><div style={{ fontSize: "11px", color: "#888" }}>Thief sees "Verified ✓" · GPS captured silently</div></>}
          </div>
        )}
        <button className="action-btn btn-primary" onClick={onScan} disabled={scanning} style={{ minWidth: "160px" }}>
          {scanning ? "Scanning..." : "▶ Scan Card Now"}
        </button>
      </div>
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <InfoRow k="SAFE MODE" v="Shows verification request · Owner approves" />
        <InfoRow k="LOST MODE" v="Fake verified page · GPS captured silently" />
        <InfoRow k="RESULT" v="Threat logged to capture log" />
      </div>
    </>
  );
}

function Settings() {
  const rows = [
    ["Card Owner", "Registered identity", "Rushda Jagtap"],
    ["Institution", "Issuing organization", "MITAOE · Pune"],
    ["Backend Endpoint", "Flask API server", "Render (prod)"],
    ["Protocol Version", "SATARK honeypot spec", "v1.0.0"],
  ];
  return (
    <>
      <div className="control-label" style={{ marginBottom: "16px" }}>GENERAL</div>
      <div className="card" style={{ padding: 0, overflow: "hidden", marginBottom: "16px" }}>
        {rows.map(([k, d, v]) => (
          <div key={k} className="settings-row">
            <div><div className="settings-key">{k}</div><div className="settings-desc">{d}</div></div>
            <span className="tag tag-gray">{v}</span>
          </div>
        ))}
      </div>
      <div className="control-label" style={{ marginBottom: "16px" }}>NOTIFICATIONS</div>
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {[["Trap trigger alert", "Notify when honeypot fires", "ENABLED"], ["Safe scan log", "Log approved verifications", "ENABLED"], ["Email alerts", "Send to registered email", "PENDING"]].map(([k, d, v]) => (
          <div key={k} className="settings-row">
            <div><div className="settings-key">{k}</div><div className="settings-desc">{d}</div></div>
            <span className={`tag ${v === "PENDING" ? "tag-gray" : "tag-teal"}`}>{v}</span>
          </div>
        ))}
      </div>
    </>
  );
}

function Docs() {
  const endpoints = [
    ["GET", "#0d1f0d", "#00d4aa", "/scan/:card_id", "Routes scan to safe verification or honeypot based on card state."],
    ["POST", "#1f0d0d", "#e63946", "/api/capture", "Receives GPS + device fingerprint from honeypot page. Logs thief data."],
    ["GET", "#0d1f0d", "#00d4aa", "/admin/toggle", "Switches card between SAFE and LOST mode. Demo control endpoint."],
    ["GET", "#0d1f0d", "#00d4aa", "/admin/logs", "Returns all captured thief entries as JSON with IP, GPS, timestamp."],
  ];
  return (
    <>
      <div className="control-label" style={{ marginBottom: "16px" }}>API REFERENCE</div>
      {endpoints.map(([method, bg, color, path, desc]) => (
        <div key={path} className="card" style={{ marginBottom: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
            <span style={{ background: bg, color, padding: "3px 8px", borderRadius: "4px", fontSize: "10px", fontFamily: "'DM Mono', monospace" }}>{method}</span>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "12px", color: "#ccc" }}>{path}</span>
          </div>
          <div style={{ fontSize: "11px", color: "#555" }}>{desc}</div>
        </div>
      ))}
    </>
  );
}