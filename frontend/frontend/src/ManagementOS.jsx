import { useState, useEffect } from "react";
import {
  Sun, Moon, LayoutDashboard, CalendarDays, CheckSquare, MessageCircle,
  FileSpreadsheet, Users, ExternalLink, ChevronRight, AlertTriangle,
  TrendingUp, Check, X, Sparkles, Clock, RefreshCw, ArrowRight, Flag
} from "lucide-react";

// ---------- Design tokens ----------
const THEME = {
  light: {
    primary: "#1B4F8C", primaryTint: "#EAF2FF",
    secondary: "#2F8F5B", secondaryTint: "#E7F6EC",
    page: "#FFFFFF", card: "#F7F9FC", border: "#E5E9EF",
    textPrimary: "#10151D", textMuted: "#6B7686",
    red: "#B3261E", redTint: "#FCEBEA", amber: "#8A5A00", amberTint: "#FFF4DE",
  },
  dark: {
    primary: "#4A90D9", primaryTint: "#1A2533",
    secondary: "#52C57F", secondaryTint: "#16271E",
    page: "#0E141C", card: "#141C27", border: "#243042",
    textPrimary: "#F2F5F9", textMuted: "#8B97A8",
    red: "#E27C76", redTint: "#2A1717", amber: "#E3B341", amberTint: "#2A2211",
  },
};

// ---------- Mock data (seeded from the real team roster) ----------
const OWNERS = [
  { name: "Abhishek", dept: "Marketing" },
  { name: "Neeraj", dept: "Sales" },
  { name: "Mihir", dept: "Operations" },
  { name: "Jatin", dept: "Finance" },
];

// status: "done" | "not_done" | "blocked" — matches the Status column in the sheet
const TODAY_TASKS = [
  { owner: "Abhishek", task: "Check Ad Spend report for last working day", platform: "Google Sheet", status: "done", notes: "" },
  { owner: "Abhishek", task: "Post content on social media — SupplyMate", platform: "Automate via AI", status: "done", notes: "" },
  { owner: "Abhishek", task: "Organic outreach via LinkedIn", platform: "Automate via AI", status: "not_done", notes: "" },
  { owner: "Neeraj", task: "Call Meta Ads leads", platform: "Google Sheet", status: "done", notes: "" },
  { owner: "Neeraj", task: "Submit daily summary — evening", platform: "WhatsApp", status: "not_done", notes: "" },
  { owner: "Mihir", task: "Schedule AI outbound calls for today", platform: "Ulai", status: "done", notes: "" },
  { owner: "Mihir", task: "Factory morning and evening update", platform: "WhatsApp", status: "not_done", notes: "" },
  { owner: "Jatin", task: "Check and update stock in-out", platform: "Register", status: "done", notes: "" },
  { owner: "Jatin", task: "Live update production status of every order", platform: "Vastra", status: "blocked", notes: "Vendor delivery delayed — 3rd day this week" },
];

// risk: "Low" | "Medium" | "High" — matches the Risk Level column in the sheet
const APPROVALS = [
  {
    id: 1, title: "Raw material purchase — Cotton stock, Vendor: Shree Textiles",
    requester: "Mihir", department: "Operations", amount: 184000,
    implication: "Approving drops this month's working capital buffer by 6%. 2 payables of ₹95,000 total are already due in the same window.",
    risk: "Medium",
  },
  {
    id: 2, title: "November ad budget increase — Meta campaigns",
    requester: "Abhishek", department: "Marketing", amount: 40000,
    implication: "Projected CAC stays within target range. No conflict with current cash position.",
    risk: "Low",
  },
  {
    id: 3, title: "Sampling approval — 3 new SKUs for Anchor tier",
    requester: "Mihir", department: "Operations", amount: 22500,
    implication: "Aligned with Client Profile's Anchor tier margin assumptions.",
    risk: "Low",
  },
];

const WHATSAPP_DIGEST = {
  date: "Yesterday",
  summary: "22 of 26 tasks confirmed done in-thread. Marketing and Finance on track. 2 blockers flagged in Operations — fabric delivery delay from vendor.",
  flags: [
    { text: "Mihir flagged a fabric delivery delay — 3rd day this week", tone: "warning" },
    { text: "Neeraj reported 4 meetings lined up for tomorrow", tone: "positive" },
  ],
};

const DEPT_LINKS = [
  { name: "Marketing OS", status: "On track" },
  { name: "Sales OS", status: "On track" },
  { name: "Operations OS", status: "Needs attention" },
  { name: "Finance OS", status: "On track" },
];

const MONTHLY_GOAL = {
  goal: "Close 3 Anchor-tier clients and hold Meta CAC under ₹850",
  weekly: [
    { week: "Week 1", focus: "Finalise sample bags for top 3 industries, line up 6 Anchor meetings" },
    { week: "Week 2", focus: "Run negotiation scripts on 3 warm Anchor leads" },
    { week: "Week 3", focus: "Close 2 deals, review Meta CAC trend" },
    { week: "Week 4", focus: "Close remaining deal, prep next month's forecast" },
  ],
};

// ---------- Small building blocks ----------
function IconBadge({ icon: Icon, tone, t }) {
  const bg = tone === "secondary" ? t.secondaryTint : t.primaryTint;
  const fg = tone === "secondary" ? t.secondary : t.primary;
  return (
    <div style={{ width: 32, height: 32, borderRadius: 8, background: bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <Icon size={16} color={fg} />
    </div>
  );
}

function Card({ children, t, style }) {
  return (
    <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 10, padding: 16, ...style }}>
      {children}
    </div>
  );
}

function Button({ children, tone = "primary", t, onClick, style, icon: Icon }) {
  const bg = tone === "primary" ? t.primary : tone === "secondary" ? t.secondary : "transparent";
  const color = tone === "ghost" ? t.textPrimary : "#FFFFFF";
  const border = tone === "ghost" ? `1px solid ${t.border}` : "none";
  return (
    <button
      onClick={onClick}
      style={{
        background: bg, color, border, borderRadius: 6, padding: "8px 14px",
        fontFamily: "Inter, sans-serif", fontWeight: 500, fontSize: 13,
        display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer",
        ...style,
      }}
    >
      {Icon && <Icon size={14} />}
      {children}
    </button>
  );
}

function SectionTitle({ children, t }) {
  return <h2 style={{ fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: 16, color: t.textPrimary, margin: "0 0 12px" }}>{children}</h2>;
}

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "planner", label: "Monthly planner", icon: CalendarDays },
  { id: "approvals", label: "Approvals", icon: CheckSquare },
  { id: "whatsapp", label: "WhatsApp", icon: MessageCircle },
  { id: "sheets", label: "Sheets sync", icon: FileSpreadsheet },
  { id: "team", label: "Team", icon: Users },
];

export default function ManagementOS() {
  const [mode, setMode] = useState("light");
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState("dashboard");
  const [tasks, setTasks] = useState(TODAY_TASKS);
  const [approvals, setApprovals] = useState(APPROVALS);
  const [conflict, setConflict] = useState(true);

  const t = THEME[mode];
  const WORKER_URL = import.meta.env.VITE_WORKER_URL; // set this once the worker is deployed

  // Load persisted theme choice (real localStorage — this is a deployed site, not a Claude artifact preview)
  useEffect(() => {
    try {
      const saved = localStorage.getItem("management-os-theme");
      if (saved) setMode(saved);
    } catch (e) {
      // localStorage unavailable — falls back to default light mode
    } finally {
      setLoaded(true);
    }
  }, []);

  // Pull live data from the Sheets Sync Worker once it's deployed and configured.
  // Until VITE_WORKER_URL is set, the app keeps running on the seeded mock data above.
  useEffect(() => {
    if (!WORKER_URL) return;

    const statusFromSheet = (s) => (s === "Done" ? "done" : s === "Blocked" ? "blocked" : "not_done");

    async function loadTasks() {
      const res = await fetch(`${WORKER_URL}/sheets/${encodeURIComponent("Daily Tasks!A2:H50")}`);
      const data = await res.json();
      const rows = (data.values || []).filter((r) => r[2]); // must have a Task value
      setTasks(rows.map((r) => ({
        owner: r[1] || "", task: r[2] || "", platform: r[3] || "",
        status: statusFromSheet(r[5]), notes: r[7] || "",
      })));
    }

    async function loadApprovals() {
      const res = await fetch(`${WORKER_URL}/sheets/${encodeURIComponent("Approvals Queue!A2:K50")}`);
      const data = await res.json();
      const rows = (data.values || []).filter((r) => r[2] && (r[9] || "Pending") === "Pending");
      setApprovals(rows.map((r) => ({
        id: r[0], title: r[2] || "", requester: r[3] || "", department: r[4] || "",
        amount: Number(r[5]) || 0, implication: r[7] || "", risk: r[8] || "Low",
      })));
    }

    loadTasks().catch((e) => console.error("Task sync failed:", e));
    loadApprovals().catch((e) => console.error("Approval sync failed:", e));
  }, [WORKER_URL]);

  // Writes a task's status back to the sheet. No-ops if the worker isn't configured yet.
  async function writeTaskStatus(task, status) {
    if (!WORKER_URL) return;
    // Assumes the row order in state matches the sheet's row order (rows start at A2).
    const rowIndex = tasks.indexOf(task) + 2;
    try {
      await fetch(`${WORKER_URL}/sheets/${encodeURIComponent(`Daily Tasks!F${rowIndex}`)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ values: [[status]] }),
      });
    } catch (e) {
      console.error("Write-back failed:", e);
    }
  }

  const toggleTheme = () => {
    const next = mode === "light" ? "dark" : "light";
    setMode(next);
    try {
      localStorage.setItem("management-os-theme", next);
    } catch (e) {
      // localStorage unavailable — theme still applies for this session
    }
  };

  const toggleTask = (idx) => {
    setTasks((prev) => prev.map((task, i) => {
      if (i !== idx) return task;
      const nextStatus = task.status === "done" ? "not_done" : "done";
      writeTaskStatus(task, nextStatus === "done" ? "Done" : "Not Done");
      return { ...task, status: nextStatus };
    }));
  };

  const toggleBlocked = (idx) => {
    setTasks((prev) => prev.map((task, i) => {
      if (i !== idx) return task;
      const nextStatus = task.status === "blocked" ? "not_done" : "blocked";
      writeTaskStatus(task, nextStatus === "blocked" ? "Blocked" : "Not Done");
      return { ...task, status: nextStatus, notes: nextStatus === "blocked" ? task.notes : "" };
    }));
  };

  const decideApproval = (id) => {
    setApprovals((prev) => prev.filter((a) => a.id !== id));
  };

  if (!loaded) return null;

  const doneCount = tasks.filter((task) => task.status === "done").length;
  const blockedCount = tasks.filter((task) => task.status === "blocked").length;
  const formatINR = (n) => "₹" + n.toLocaleString("en-IN");
  const riskTone = (risk) => (risk === "High" ? t.red : risk === "Medium" ? t.amber : t.secondary);
  const riskBg = (risk) => (risk === "High" ? t.redTint : risk === "Medium" ? t.amberTint : t.secondaryTint);

  return (
    <div style={{ background: t.page, minHeight: "100vh", fontFamily: "Inter, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');
        .mono { font-family: 'IBM Plex Mono', monospace; }
      `}</style>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px", borderBottom: `1px solid ${t.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <IconBadge icon={LayoutDashboard} tone="primary" t={t} />
          <div>
            <div style={{ fontWeight: 600, fontSize: 15, color: t.textPrimary }}>Management OS</div>
            <div style={{ fontWeight: 400, fontSize: 12, color: t.textMuted }}>Cross-department coordination</div>
          </div>
        </div>
        <button
          onClick={toggleTheme}
          aria-label="Toggle dark mode"
          style={{
            width: 36, height: 36, borderRadius: 8, border: `1px solid ${t.border}`,
            background: t.card, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
          }}
        >
          {mode === "light" ? <Moon size={16} color={t.textPrimary} /> : <Sun size={16} color={t.textPrimary} />}
        </button>
      </div>

      <div style={{ display: "flex" }}>
        {/* Sidebar */}
        <div style={{ width: 220, borderRight: `1px solid ${t.border}`, padding: 16, display: "flex", flexDirection: "column", gap: 4, minHeight: "calc(100vh - 69px)" }}>
          {NAV_ITEMS.map((item) => {
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "9px 10px",
                  borderRadius: 6, border: "none", cursor: "pointer", textAlign: "left",
                  background: active ? t.primaryTint : "transparent",
                  color: active ? t.primary : t.textPrimary,
                  fontFamily: "Inter, sans-serif", fontWeight: 500, fontSize: 13,
                }}
              >
                <item.icon size={16} />
                {item.label}
              </button>
            );
          })}

          <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${t.border}` }}>
            <div style={{ fontSize: 12, fontWeight: 500, color: t.textMuted, marginBottom: 8 }}>Department OS</div>
            {DEPT_LINKS.map((d) => (
              <a key={d.name} href="#" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px", borderRadius: 6, textDecoration: "none", color: t.textPrimary, fontSize: 13 }}>
                <span>{d.name}</span>
                <ExternalLink size={12} color={t.textMuted} />
              </a>
            ))}
          </div>
        </div>

        {/* Main content */}
        <div style={{ flex: 1, padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>

          {tab === "dashboard" && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                <Card t={t}>
                  <div style={{ fontSize: 12, color: t.textMuted, marginBottom: 4 }}>Tasks done today</div>
                  <div className="mono" style={{ fontSize: 24, fontWeight: 500, color: t.textPrimary }}>
                    {doneCount}/{tasks.length}
                    {blockedCount > 0 && (
                      <span style={{ fontSize: 12, fontWeight: 500, color: t.red, marginLeft: 8 }}>· {blockedCount} blocked</span>
                    )}
                  </div>
                </Card>
                <Card t={t}>
                  <div style={{ fontSize: 12, color: t.textMuted, marginBottom: 4 }}>Pending approvals</div>
                  <div className="mono" style={{ fontSize: 24, fontWeight: 500, color: t.textPrimary }}>{approvals.length}</div>
                </Card>
                <Card t={t}>
                  <div style={{ fontSize: 12, color: t.textMuted, marginBottom: 4 }}>Departments on track</div>
                  <div className="mono" style={{ fontSize: 24, fontWeight: 500, color: t.secondary }}>3/4</div>
                </Card>
                <Card t={t}>
                  <div style={{ fontSize: 12, color: t.textMuted, marginBottom: 4 }}>Sheets sync status</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <AlertTriangle size={16} color={t.amber} />
                    <span style={{ fontSize: 13, fontWeight: 500, color: t.amber }}>1 conflict</span>
                  </div>
                </Card>
              </div>

              <Card t={t}>
                <SectionTitle t={t}>Today's tasks by owner</SectionTitle>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {tasks.map((task, i) => {
                    const isDone = task.status === "done";
                    const isBlocked = task.status === "blocked";
                    return (
                      <div key={i} style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px",
                        background: isBlocked ? t.redTint : t.page,
                        border: `1px solid ${isBlocked ? t.red : t.border}`, borderRadius: 8,
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <button
                            onClick={() => toggleTask(i)}
                            disabled={isBlocked}
                            style={{
                              width: 18, height: 18, borderRadius: 4, border: `1px solid ${isDone ? t.secondary : t.border}`,
                              background: isDone ? t.secondary : "transparent", cursor: isBlocked ? "not-allowed" : "pointer",
                              display: "flex", alignItems: "center", justifyContent: "center", opacity: isBlocked ? 0.4 : 1,
                            }}
                          >
                            {isDone && <Check size={12} color="#FFFFFF" />}
                          </button>
                          <div>
                            <div style={{ fontSize: 13, color: isBlocked ? t.red : t.textPrimary, fontWeight: 400 }}>{task.task}</div>
                            <div style={{ fontSize: 12, color: isBlocked ? t.red : t.textMuted }}>
                              {task.owner} · {task.platform}{isBlocked && task.notes ? ` · ${task.notes}` : ""}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => toggleBlocked(i)}
                          aria-label={isBlocked ? "Clear blocked status" : "Flag as blocked"}
                          style={{
                            width: 26, height: 26, borderRadius: 6, border: `1px solid ${isBlocked ? t.red : t.border}`,
                            background: isBlocked ? t.red : "transparent", display: "flex", alignItems: "center", justifyContent: "center",
                            cursor: "pointer", flexShrink: 0,
                          }}
                        >
                          <Flag size={12} color={isBlocked ? "#FFFFFF" : t.textMuted} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </Card>

              <Card t={t}>
                <SectionTitle t={t}>Executive summary — this week</SectionTitle>
                <p style={{ fontSize: 13, color: t.textPrimary, lineHeight: 1.6, margin: 0 }}>
                  3 approvals decided, ₹2,46,500 total. Working capital buffer holds above minimum threshold.
                  Operations flagged a recurring fabric delivery delay — worth a vendor conversation this week.
                  Marketing CAC trending under target.
                </p>
              </Card>
            </>
          )}

          {tab === "planner" && (
            <>
              <Card t={t}>
                <SectionTitle t={t}>Monthly goal (from Google Sheet)</SectionTitle>
                <p style={{ fontSize: 14, color: t.textPrimary, margin: "0 0 16px" }}>{MONTHLY_GOAL.goal}</p>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                  <Button t={t} tone="secondary" icon={Sparkles}>Generate weekly breakdown</Button>
                  <Button t={t} tone="ghost" icon={RefreshCw}>Re-sync from sheet</Button>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {MONTHLY_GOAL.weekly.map((w) => (
                    <div key={w.week} style={{ display: "flex", gap: 12, padding: "10px 12px", background: t.page, border: `1px solid ${t.border}`, borderRadius: 8 }}>
                      <div style={{ fontSize: 12, fontWeight: 500, color: t.primary, minWidth: 60 }}>{w.week}</div>
                      <div style={{ fontSize: 13, color: t.textPrimary, flex: 1 }}>{w.focus}</div>
                      <Button t={t} tone="ghost" style={{ padding: "4px 10px" }} icon={ArrowRight}>Break into daily</Button>
                    </div>
                  ))}
                </div>
              </Card>

              <Card t={t}>
                <SectionTitle t={t}>Assign to</SectionTitle>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {OWNERS.map((o) => (
                    <div key={o.name} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 12px", background: t.primaryTint, borderRadius: 8 }}>
                      <span style={{ fontSize: 13, color: t.primary, fontWeight: 500 }}>{o.name}</span>
                      <span style={{ fontSize: 12, color: t.textMuted }}>{o.dept}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </>
          )}

          {tab === "approvals" && (
            <Card t={t}>
              <SectionTitle t={t}>Approval queue</SectionTitle>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {approvals.length === 0 && <p style={{ fontSize: 13, color: t.textMuted }}>Nothing pending.</p>}
                {approvals.map((a) => (
                  <div key={a.id} style={{ padding: 14, background: t.page, border: `1px solid ${t.border}`, borderRadius: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 8 }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: t.textPrimary }}>{a.title}</div>
                        <div style={{ fontSize: 12, color: t.textMuted }}>{a.requester} · {a.department}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div className="mono" style={{ fontSize: 14, fontWeight: 500, color: t.textPrimary }}>{formatINR(a.amount)}</div>
                        <div style={{ fontSize: 11, fontWeight: 500, color: riskTone(a.risk) }}>{a.risk} risk</div>
                      </div>
                    </div>
                    <div style={{
                      display: "flex", gap: 8, padding: "8px 10px", borderRadius: 6, marginBottom: 10,
                      background: riskBg(a.risk),
                    }}>
                      <Sparkles size={14} color={riskTone(a.risk)} style={{ flexShrink: 0, marginTop: 1 }} />
                      <span style={{ fontSize: 12, color: riskTone(a.risk), lineHeight: 1.5 }}>{a.implication}</span>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <Button t={t} tone="secondary" icon={Check} onClick={() => decideApproval(a.id)}>Approve</Button>
                      <Button t={t} tone="ghost" icon={X} onClick={() => decideApproval(a.id)}>Reject</Button>
                      <Button t={t} tone="ghost" icon={MessageCircle}>Suggest change</Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {tab === "whatsapp" && (
            <>
              <Card t={t}>
                <SectionTitle t={t}>Outbound — today's tasks to company group</SectionTitle>
                <div style={{ padding: 12, background: t.secondaryTint, borderRadius: 8, marginBottom: 10 }}>
                  <p style={{ fontSize: 13, color: t.secondary, margin: 0, lineHeight: 1.6 }}>
                    Good morning team. Today's tasks: Abhishek — 6 items, Neeraj — 5 items, Mihir — 6 items, Jatin — 9 items. Check your dashboard for details.
                  </p>
                </div>
                <Button t={t} tone="primary" icon={MessageCircle}>Post to group now</Button>
              </Card>

              <Card t={t}>
                <SectionTitle t={t}>Evening digest — {WHATSAPP_DIGEST.date}</SectionTitle>
                <p style={{ fontSize: 13, color: t.textPrimary, lineHeight: 1.6, marginBottom: 12 }}>{WHATSAPP_DIGEST.summary}</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {WHATSAPP_DIGEST.flags.map((f, i) => (
                    <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", padding: "8px 10px", borderRadius: 6, background: f.tone === "warning" ? t.amberTint : t.secondaryTint }}>
                      {f.tone === "warning" ? <AlertTriangle size={14} color={t.amber} /> : <TrendingUp size={14} color={t.secondary} />}
                      <span style={{ fontSize: 12, color: f.tone === "warning" ? t.amber : t.secondary }}>{f.text}</span>
                    </div>
                  ))}
                </div>
              </Card>

              <Card t={t} style={{ borderStyle: "dashed" }}>
                <div style={{ display: "flex", gap: 10, alignItems: "start" }}>
                  <IconBadge icon={AlertTriangle} tone="primary" t={t} />
                  <p style={{ fontSize: 12, color: t.textMuted, lineHeight: 1.6, margin: 0 }}>
                    Group-reading requires a WhatsApp Business API connection (Twilio / 360dialog / Gupshup). Until that's set up, individual dashboard updates under Team cover the same data reliably.
                  </p>
                </div>
              </Card>
            </>
          )}

          {tab === "sheets" && (
            <Card t={t}>
              <SectionTitle t={t}>Sync status</SectionTitle>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 12px", background: t.secondaryTint, borderRadius: 8 }}>
                  <span style={{ fontSize: 13, color: t.secondary }}>Daily Tasks for Team</span>
                  <span className="mono" style={{ fontSize: 12, color: t.secondary }}>Synced 4 min ago</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 12px", background: t.secondaryTint, borderRadius: 8 }}>
                  <span style={{ fontSize: 13, color: t.secondary }}>Monthly Sales Targets</span>
                  <span className="mono" style={{ fontSize: 12, color: t.secondary }}>Synced 4 min ago</span>
                </div>
                {conflict && (
                  <div style={{ padding: "10px 12px", background: t.amberTint, borderRadius: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: 13, color: t.amber, fontWeight: 500 }}>The Master Plan — row 12 conflict</span>
                      <span className="mono" style={{ fontSize: 12, color: t.amber }}>Needs review</span>
                    </div>
                    <p style={{ fontSize: 12, color: t.amber, margin: "0 0 8px" }}>Sheet says "not started" — Dashboard says "in progress." Which is correct?</p>
                    <div style={{ display: "flex", gap: 8 }}>
                      <Button t={t} tone="secondary" onClick={() => setConflict(false)}>Use dashboard</Button>
                      <Button t={t} tone="ghost" onClick={() => setConflict(false)}>Use sheet</Button>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}

          {tab === "team" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
              {OWNERS.map((o) => {
                const ownerTasks = tasks.filter((task) => task.owner === o.name);
                return (
                  <Card key={o.name} t={t}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                      <IconBadge icon={Users} tone="secondary" t={t} />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: t.textPrimary }}>{o.name}</div>
                        <div style={{ fontSize: 12, color: t.textMuted }}>{o.dept}</div>
                      </div>
                    </div>
                    {ownerTasks.map((task, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", fontSize: 12, color: task.status === "blocked" ? t.red : t.textPrimary }}>
                        {task.status === "blocked" ? <Flag size={12} color={t.red} /> : <Clock size={12} color={t.textMuted} />}
                        {task.task}
                        {task.status === "done" && <Check size={12} color={t.secondary} style={{ marginLeft: "auto" }} />}
                        {task.status === "blocked" && <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 500 }}>Blocked</span>}
                      </div>
                    ))}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
