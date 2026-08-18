import { useState, useEffect, useCallback } from "react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { VOCAB_TOPICS, VOCAB_WORDS, IELTS_CONTENT, WRITING_TOPICS, WRITING_CONTENT } from "./vocabData";

const FONTS = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;600&display=swap');
`;

const API_BASE = "https://business-english-surxon.onrender.com/api";

const COLORS = {
  bg: "#F4F6FB",
  surface: "#FFFFFF",
  primary: "#1E2A5E",
  primaryDark: "#141C42",
  amber: "#F5A623",
  amberDark: "#9C6B0A",
  clay: "#8B6F47",
  text: "#12172B",
  textSoft: "#5B6178",
  line: "#E3E7F2",
  red: "#E0483E",
  green: "#0FA36B",
  greenBg: "#E4F7EE",
};

// Har bir modulga o'z rangi — bo'limlarni bir-biridan vizual ravishda ajratib turadi
const MODULE_COLORS = {
  speaking: { accent: "#E0483E", bg: "#FCEAE8", dark: "#A8332B" },
  writing: { accent: "#3B5BDB", bg: "#EAEDFC", dark: "#28409E" },
  reading: { accent: "#0FA36B", bg: "#E4F7EE", dark: "#0B7850" },
  listening: { accent: "#8B5CF6", bg: "#F1EBFE", dark: "#6633C4" },
  business: { accent: "#F5A623", bg: "#FDF2DF", dark: "#9C6B0A" },
  vocabulary: { accent: "#0B8793", bg: "#E1F4F6", dark: "#065E66" },
};

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

const MODULES = [
  { id: "speaking", icon: "🗣", name: "Speaking", desc: "AI ekzaminator bilan Part 1–3 amaliyoti", live: true },
  { id: "writing", icon: "✍", name: "Writing", desc: "Task 1 va Task 2, AI tekshiruvi bilan", live: true },
  { id: "reading", icon: "📖", name: "Reading", desc: "5 xil qism, javob kalitlari bilan", live: false },
  { id: "listening", icon: "🎧", name: "Listening", desc: "6 xil qism, transkript va audio", live: false },
  { id: "business", icon: "💼", name: "Business English", desc: "Ish mavzulari: muzokaralar, taqdimotlar, email", live: true },
  { id: "vocabulary", icon: "🗂", name: "Vocabulary", desc: "20 mavzu, 600 so'z — kartochkalar orqali", live: true },
];

async function api(path, { token, method = "GET", body, timeoutMs = 55000 } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (err) {
    if (err.name === "AbortError") {
      throw new Error("Server javob bermadi (ehtimol uyg'onmoqda). Yana bir bor urinib ko'ring.");
    }
    throw new Error("Tarmoq xatoligi. Internetni tekshirib, qayta urinib ko'ring.");
  } finally {
    clearTimeout(timer);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Server xatoligi.");
  return data;
}

function RiverPath({ current }) {
  const idx = Math.max(0, LEVELS.indexOf(current));
  const pts = [[40, 150], [140, 90], [260, 170], [380, 80], [500, 160], [600, 100]];
  const pathD = `M${pts.map((p) => p.join(",")).join(" L")}`;
  return (
    <svg viewBox="0 0 640 200" style={{ width: "100%", height: "auto", display: "block" }}>
      <path d={pathD} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="4" strokeLinecap="round" />
      <path
        d={pathD}
        fill="none"
        stroke={COLORS.amber}
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray="700"
        strokeDashoffset={700 - (idx / (LEVELS.length - 1)) * 700}
      />
      {pts.map(([x, y], i) => (
        <g key={i}>
          <circle
            cx={x}
            cy={y}
            r={i === idx ? 16 : 12}
            fill={i <= idx ? COLORS.amber : COLORS.primaryDark}
            stroke={i <= idx ? "#FFFFFF" : "rgba(255,255,255,0.3)"}
            strokeWidth="2"
          />
          <text
            x={x}
            y={y + 4}
            textAnchor="middle"
            style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, fill: i <= idx ? COLORS.primaryDark : "rgba(255,255,255,0.55)" }}
          >
            {LEVELS[i]}
          </text>
        </g>
      ))}
    </svg>
  );
}

function Badge({ children, tone = "amber" }) {
  const map = {
    amber: { bg: "#FDF2DF", fg: COLORS.amberDark },
    live: { bg: COLORS.greenBg, fg: "#0B7850" },
    soon: { bg: "#EEF0F6", fg: "#6B7189" },
  };
  const { bg, fg } = map[tone] || map.amber;
  return (
    <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: 0.2, color: fg, background: bg, borderRadius: 999, padding: "4px 10px" }}>
      {children}
    </span>
  );
}

function Field({ label, ...props }) {
  return (
    <label style={{ display: "block", marginBottom: 14 }}>
      <div style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: COLORS.textSoft, marginBottom: 6 }}>{label}</div>
      <input
        {...props}
        style={{
          width: "100%",
          boxSizing: "border-box",
          padding: "10px 12px",
          borderRadius: 8,
          border: `1.5px solid ${COLORS.line}`,
          fontFamily: "Inter, sans-serif",
          fontSize: 14,
        }}
      />
    </label>
  );
}

function AuthScreen({ mode, setMode, onAuth }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const path = mode === "login" ? "/auth/login" : "/auth/register";
      const body = mode === "login" ? { email, password } : { fullName, email, password };
      const data = await api(path, { method: "POST", body });
      onAuth(data.token, data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 380, margin: "60px auto", padding: "0 24px" }}>
      <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 18 }}>
        {["#E0483E", "#3B5BDB", "#0FA36B", "#8B5CF6", "#F5A623"].map((c) => (
          <div key={c} style={{ width: 22, height: 6, borderRadius: 3, background: c }} />
        ))}
      </div>
      <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 26, fontWeight: 700, color: COLORS.text, marginBottom: 4, textAlign: "center" }}>
        BizEnglish Surxon
      </div>
      <div style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: COLORS.textSoft, marginBottom: 24, textAlign: "center" }}>
        {mode === "login" ? "Hisobingizga kiring" : "Yangi hisob yarating"}
      </div>
      <form onSubmit={submit} style={{ background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 16, padding: 22, boxShadow: "0 8px 24px rgba(30,42,94,0.06)" }}>
        {mode === "register" && (
          <Field label="To'liq ism" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        )}
        <Field label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Field label="Parol" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
        {error && (
          <div style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: COLORS.red, marginBottom: 12 }}>{error}</div>
        )}
        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "12px 0",
            background: COLORS.primary,
            color: "#fff",
            border: "none",
            borderRadius: 10,
            fontFamily: "Inter, sans-serif",
            fontSize: 14,
            fontWeight: 700,
            cursor: loading ? "default" : "pointer",
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? "Yuklanmoqda..." : mode === "login" ? "Kirish" : "Ro'yxatdan o'tish"}
        </button>
      </form>
      <div style={{ textAlign: "center", marginTop: 14, fontFamily: "Inter, sans-serif", fontSize: 13, color: COLORS.textSoft }}>
        {mode === "login" ? "Hisobingiz yo'qmi?" : "Hisobingiz bormi?"}{" "}
        <button
          onClick={() => setMode(mode === "login" ? "register" : "login")}
          style={{ background: "none", border: "none", color: COLORS.primary, fontWeight: 700, cursor: "pointer", fontFamily: "Inter, sans-serif", fontSize: 13 }}
        >
          {mode === "login" ? "Ro'yxatdan o'ting" : "Kiring"}
        </button>
      </div>
    </div>
  );
}

function TopBar({ user, xp, streak, onLogout }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 24px", borderBottom: `1px solid ${COLORS.line}`, background: COLORS.surface }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: COLORS.primary, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Space Grotesk, sans-serif", color: COLORS.amber, fontWeight: 700, fontSize: 18 }}>
          B
        </div>
        <div>
          <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 16, fontWeight: 700, color: COLORS.text, lineHeight: 1.1 }}>BizEnglish Surxon</div>
          <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: COLORS.textSoft }}>{user?.full_name || user?.email}</div>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 4, fontFamily: "IBM Plex Mono, monospace", fontSize: 13, fontWeight: 600, color: "#9C6B0A", background: "#FDF2DF", borderRadius: 999, padding: "5px 12px" }}>
          🔥 {streak?.current_streak ?? 0}
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 4, fontFamily: "IBM Plex Mono, monospace", fontSize: 13, fontWeight: 600, color: COLORS.primary, background: "#EAEDFC", borderRadius: 999, padding: "5px 12px" }}>
          ⭐ {xp} XP
        </span>
        <button onClick={onLogout} style={{ background: "none", border: "none", color: COLORS.textSoft, fontFamily: "Inter, sans-serif", fontSize: 12, cursor: "pointer", marginLeft: 4 }}>
          Chiqish
        </button>
      </div>
    </div>
  );
}

function StatTile({ label, value, bg, fg, mono }) {
  return (
    <div style={{ background: bg, borderRadius: 14, padding: "16px 18px", flex: 1, minWidth: 130 }}>
      <div style={{ fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 600, color: fg, opacity: 0.85, marginBottom: 6 }}>{label}</div>
      <div style={{ fontFamily: mono ? "IBM Plex Mono, monospace" : "Space Grotesk, sans-serif", fontSize: 26, fontWeight: 700, color: fg }}>{value}</div>
    </div>
  );
}

function Dashboard({ onOpen, xp, streak, level }) {
  return (
    <div style={{ padding: "24px 24px 40px", maxWidth: 760, margin: "0 auto" }}>
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <StatTile label="DARAJA" value={level || "A1"} bg="#EAEDFC" fg={COLORS.primary} />
        <StatTile label="XP BALL" value={xp} bg="#FDF2DF" fg={COLORS.amberDark} mono />
        <StatTile label="KUNLIK SERIYA" value={`🔥 ${streak?.current_streak ?? 0}`} bg="#FCEAE8" fg="#A8332B" mono />
      </div>

      <div style={{ background: COLORS.primary, borderRadius: 16, padding: "20px 24px", marginBottom: 24 }}>
        <div style={{ fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 600, color: "#AEB8E0", marginBottom: 10, letterSpacing: 0.3 }}>
          CEFR YO'LI
        </div>
        <RiverPath current={level || "A1"} />
      </div>

      <div style={{ fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 700, color: COLORS.textSoft, letterSpacing: 0.5, marginBottom: 10 }}>
        MODULLAR
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 }}>
        {MODULES.map((m) => {
          const c = MODULE_COLORS[m.id];
          return (
            <button
              key={m.id}
              onClick={() => onOpen(m.id)}
              style={{
                textAlign: "left",
                background: COLORS.surface,
                border: `1px solid ${COLORS.line}`,
                borderLeft: `4px solid ${c.accent}`,
                borderRadius: 14,
                padding: "16px 18px",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                gap: 8,
                boxShadow: m.live ? "0 4px 14px rgba(20,25,50,0.05)" : "none",
                opacity: m.live ? 1 : 0.75,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: c.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
                  {m.icon}
                </div>
                <Badge tone={m.live ? "live" : "soon"}>{m.live ? "● Ishlaydi" : "Tez orada"}</Badge>
              </div>
              <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 17, fontWeight: 700, color: COLORS.text }}>{m.name}</div>
              <div style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: COLORS.textSoft, lineHeight: 1.4 }}>{m.desc}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ScoreCard({ feedback }) {
  // AI javobidagi "BALL: ..." yoki "TAXMINIY BALL (Band): ..." qatorini ajratib,
  // katta va yorqin ko'rinishda ko'rsatadi — o'quvchiga motivatsiya beradi.
  const match = feedback.match(/^(BALL[^:]*|TAXMINIY BALL[^:]*):\s*(.+)$/m);
  if (!match) return null;
  const label = match[1].trim();
  const value = match[2].trim();
  return (
    <div style={{ background: COLORS.primary, borderRadius: 14, padding: "18px 20px", marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div>
        <div style={{ fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 600, color: "#AEB8E0", letterSpacing: 0.3 }}>{label}</div>
        <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 30, fontWeight: 700, color: "#FFFFFF" }}>{value}</div>
      </div>
      <div style={{ fontSize: 32 }}>🏆</div>
    </div>
  );
}

function FeedbackView({ feedback }) {
  return (
    <div>
      <ScoreCard feedback={feedback} />
      <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 12, padding: 16, fontFamily: "Inter, sans-serif", fontSize: 14, color: COLORS.text, whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
        {feedback}
      </div>
    </div>
  );
}
function BackButton({ onBack }) {
  return (
    <button onClick={onBack} style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: COLORS.primary, background: "none", border: "none", cursor: "pointer", marginBottom: 16, padding: 0 }}>
      ← Bosh sahifa
    </button>
  );
}

function ModuleHeader({ moduleId, icon, title }) {
  const c = MODULE_COLORS[moduleId];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
      <div style={{ width: 40, height: 40, borderRadius: 10, background: c.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
        {icon}
      </div>
      <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 22, fontWeight: 700, color: c.dark }}>{title}</div>
    </div>
  );
}

function BusinessModule({ token, onBack }) {
  const [modules, setModules] = useState(null);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/content/business-modules", { token })
      .then(setModules)
      .catch((e) => setError(e.message));
  }, [token]);

  return (
    <div style={{ padding: 24, maxWidth: 720, margin: "0 auto" }}>
      <BackButton onBack={selected ? () => setSelected(null) : onBack} />
      <ModuleHeader moduleId="business" icon="💼" title="Business English" />
      {error && <div style={{ color: COLORS.red, fontFamily: "Inter, sans-serif", fontSize: 14 }}>{error}</div>}
      {!modules && !error && (
        <div style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: COLORS.textSoft }}>Yuklanmoqda...</div>
      )}
      {modules && !selected && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10 }}>
          {modules.map((m) => (
            <button
              key={m.id}
              onClick={() => setSelected(m)}
              style={{ textAlign: "left", background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 10, padding: "14px", cursor: "pointer", fontFamily: "Inter, sans-serif", fontSize: 14, color: COLORS.text }}
            >
              {m.title}
            </button>
          ))}
        </div>
      )}
      {selected && (
        <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 14, padding: 20 }}>
          <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 18, fontWeight: 600, marginBottom: 12 }}>{selected.title}</div>
          <div style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: COLORS.textSoft, marginBottom: 6 }}>Lug'at:</div>
          <ul style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: COLORS.text, paddingLeft: 18, marginBottom: 14 }}>
            {selected.vocabulary?.map((v) => (
              <li key={v.term} style={{ marginBottom: 4 }}>
                <b>{v.term}</b> — {v.def}
              </li>
            ))}
          </ul>
          <div style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: COLORS.textSoft, marginBottom: 6 }}>Foydali iboralar:</div>
          <ul style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: COLORS.text, paddingLeft: 18 }}>
            {selected.keyPhrases?.map((p) => (
              <li key={p} style={{ marginBottom: 4 }}>{p}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

const CHART_COLORS = [COLORS.primary, COLORS.amber, COLORS.clay, "#5B8C7E", "#B3261E"];

function ChartVisual({ chart }) {
  const data = chart.categories.map((cat, i) => {
    const row = { name: cat };
    chart.series.forEach((s) => { row[s.name] = s.data[i]; });
    return row;
  });
  return (
    <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 12, padding: 16, marginBottom: 14 }}>
      <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{chart.title}</div>
      <div style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: COLORS.textSoft, marginBottom: 10 }}>{chart.unit}</div>
      <ResponsiveContainer width="100%" height={240}>
        {chart.type === "line" ? (
          <LineChart data={data}>
            <CartesianGrid stroke={COLORS.line} />
            <XAxis dataKey="name" tick={{ fontFamily: "Inter, sans-serif", fontSize: 11 }} />
            <YAxis tick={{ fontFamily: "Inter, sans-serif", fontSize: 11 }} />
            <Tooltip />
            <Legend wrapperStyle={{ fontFamily: "Inter, sans-serif", fontSize: 12 }} />
            {chart.series.map((s, i) => (
              <Line key={s.name} type="monotone" dataKey={s.name} stroke={CHART_COLORS[i % CHART_COLORS.length]} strokeWidth={2} />
            ))}
          </LineChart>
        ) : chart.type === "bar" ? (
          <BarChart data={data}>
            <CartesianGrid stroke={COLORS.line} />
            <XAxis dataKey="name" tick={{ fontFamily: "Inter, sans-serif", fontSize: 11 }} />
            <YAxis tick={{ fontFamily: "Inter, sans-serif", fontSize: 11 }} />
            <Tooltip />
            <Legend wrapperStyle={{ fontFamily: "Inter, sans-serif", fontSize: 12 }} />
            {chart.series.map((s, i) => (
              <Bar key={s.name} dataKey={s.name} fill={CHART_COLORS[i % CHART_COLORS.length]} />
            ))}
          </BarChart>
        ) : (
          <PieChart>
            <Pie data={data} dataKey={chart.series[0].name} nameKey="name" outerRadius={90} label>
              {data.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
            </Pie>
            <Tooltip />
            <Legend wrapperStyle={{ fontFamily: "Inter, sans-serif", fontSize: 12 }} />
          </PieChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

function ProcessVisual({ steps }) {
  return (
    <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 12, padding: 16, marginBottom: 14, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
      {steps.map((s, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ background: COLORS.bg, border: `1px solid ${COLORS.line}`, borderRadius: 8, padding: "8px 12px", fontFamily: "Inter, sans-serif", fontSize: 13, color: COLORS.text }}>
            <b>{i + 1}.</b> {s}
          </div>
          {i < steps.length - 1 && <span style={{ color: COLORS.amberDark }}>→</span>}
        </div>
      ))}
    </div>
  );
}

function WritingModule({ token, onBack, onXpChange }) {
  const [lessons, setLessons] = useState(null);
  const [category, setCategory] = useState(null);
  const [selected, setSelected] = useState(null);
  const [text, setText] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/writing/lessons", { token }).then(setLessons).catch((e) => setError(e.message));
  }, [token]);

  async function pickLesson(l) {
    setError("");
    setFeedback(null);
    setText("");
    setCategory(l);
    try {
      const full = await api(`/writing/lessons/${l.id}`, { token });
      setSelected(full);
    } catch (e) {
      setError(e.message);
    }
  }

  async function getAnotherTask() {
    if (!category) return;
    setError("");
    setFeedback(null);
    setText("");
    try {
      const full = await api(`/writing/lessons/${category.id}`, { token });
      setSelected(full);
    } catch (e) {
      setError(e.message);
    }
  }

  async function submit() {
    setLoading(true);
    setError("");
    try {
      const data = await api("/writing/check", {
        token,
        method: "POST",
        body: { lessonId: selected.id, text, taskPrompt: selected.taskPrompt, chart: selected.chart, steps: selected.steps },
      });
      setFeedback(data.feedback);
      onXpChange();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 24, maxWidth: 720, margin: "0 auto" }}>
      <BackButton onBack={selected ? () => { setSelected(null); setCategory(null); setFeedback(null); setText(""); } : onBack} />
      <ModuleHeader moduleId="writing" icon="✍" title="Writing" />
      {error && <div style={{ color: COLORS.red, fontFamily: "Inter, sans-serif", fontSize: 14, marginBottom: 12 }}>{error}</div>}

      {!selected && lessons && (
        <div style={{ display: "grid", gap: 10 }}>
          {lessons.map((l) => (
            <button
              key={l.id}
              onClick={() => pickLesson(l)}
              style={{ textAlign: "left", background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 10, padding: "14px", cursor: "pointer", fontFamily: "Inter, sans-serif", fontSize: 14, color: COLORS.text }}
            >
              {l.title}
            </button>
          ))}
        </div>
      )}

      {selected && !feedback && (
        <div>
          <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 12, padding: 16, marginBottom: 14, fontFamily: "Inter, sans-serif", fontSize: 13, color: COLORS.textSoft, whiteSpace: "pre-wrap" }}>
            {selected.lesson}
          </div>
          <div style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: COLORS.text, marginBottom: 10, fontWeight: 600 }}>
            {selected.taskPrompt}
          </div>
          {selected.chart && <ChartVisual chart={selected.chart} />}
          {selected.steps && <ProcessVisual steps={selected.steps} />}
          <button
            type="button"
            onClick={getAnotherTask}
            style={{ background: "none", border: "none", color: COLORS.primary, fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 600, cursor: "pointer", marginBottom: 10, padding: 0 }}
          >
            🔀 Boshqa vazifa
          </button>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={8}
            placeholder="Javobingizni shu yerga yozing..."
            style={{ width: "100%", boxSizing: "border-box", padding: 12, borderRadius: 10, border: `1px solid ${COLORS.line}`, fontFamily: "Inter, sans-serif", fontSize: 14, marginBottom: 10 }}
          />
          <div style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: COLORS.textSoft, marginBottom: 14 }}>
            Talab: {selected.wordCountMin}-{selected.wordCountMax} so'z
          </div>
          <button
            onClick={submit}
            disabled={loading || text.trim().length < 15}
            style={{ padding: "10px 20px", background: COLORS.primary, color: "#fff", border: "none", borderRadius: 8, fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: 14, cursor: loading ? "default" : "pointer", opacity: loading || text.trim().length < 15 ? 0.6 : 1 }}
          >
            {loading ? "AI tekshirmoqda..." : "Tekshirish uchun yuborish"}
          </button>
          {loading && (
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: COLORS.textSoft, marginTop: 8 }}>
              Birinchi so'rov 30-50 soniya davom etishi mumkin (server uyg'onmoqda) — sahifani yopmang.
            </div>
          )}
        </div>
      )}

      {feedback && <FeedbackView feedback={feedback} />}
    </div>
  );
}

function useRecorder(token, onTranscribed) {
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [recError, setRecError] = useState("");
  const mediaRef = { current: null };
  const chunksRef = { current: [] };

  async function start() {
    setRecError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/ogg;codecs=opus")
        ? "audio/ogg;codecs=opus"
        : "audio/webm";
      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];
      recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        setBusy(true);
        try {
          const blob = new Blob(chunksRef.current, { type: mimeType });
          const base64 = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result.split(",")[1]);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
          const data = await api("/speaking/transcribe", {
            token,
            method: "POST",
            body: { audioBase64: base64, mimeType },
          });
          onTranscribed(data.transcript, data.pronunciationNote);
        } catch (e) {
          setRecError(e.message);
        } finally {
          setBusy(false);
        }
      };
      recorder.start();
      mediaRef.current = recorder;
      window.__activeRecorder = recorder;
      setRecording(true);
    } catch (e) {
      setRecError("Mikrofonga ruxsat berilmadi yoki topilmadi.");
    }
  }

  function stop() {
    if (window.__activeRecorder) {
      window.__activeRecorder.stop();
      window.__activeRecorder = null;
    }
    setRecording(false);
  }

  return { recording, busy, recError, start, stop };
}

function MicButton({ token, onTranscribed }) {
  const { recording, busy, recError, start, stop } = useRecorder(token, onTranscribed);
  return (
    <div style={{ marginBottom: 12 }}>
      <button
        type="button"
        onClick={recording ? stop : start}
        disabled={busy}
        style={{
          padding: "8px 16px",
          background: recording ? COLORS.red : COLORS.surface,
          color: recording ? "#fff" : COLORS.primary,
          border: `1px solid ${recording ? COLORS.red : COLORS.line}`,
          borderRadius: 8,
          fontFamily: "Inter, sans-serif",
          fontWeight: 600,
          fontSize: 13,
          cursor: busy ? "default" : "pointer",
          opacity: busy ? 0.6 : 1,
        }}
      >
        {busy ? "Tahlil qilinmoqda..." : recording ? "⏹ To'xtatish" : "🎤 Yozib olish"}
      </button>
      {recError && (
        <div style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: COLORS.red, marginTop: 6 }}>{recError}</div>
      )}
    </div>
  );
}

function SpeakingModule({ token, onBack, onXpChange }) {
  const [topics, setTopics] = useState(null);
  const [topic, setTopic] = useState(null);
  const [stage, setStage] = useState("part1"); // part1 | part2 | part3
  const [answers, setAnswers] = useState({ part1: "", part2: "", part3: "" });
  const [pronunciationNotes, setPronunciationNotes] = useState({});
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/speaking/topics", { token }).then(setTopics).catch((e) => setError(e.message));
  }, [token]);

  async function pickTopic(t) {
    setError("");
    try {
      const full = await api(`/speaking/topics/${t.id}`, { token });
      setTopic(full);
      setStage("part1");
      setAnswers({ part1: "", part2: "", part3: "" });
      setPronunciationNotes({});
      setFeedback(null);
    } catch (e) {
      setError(e.message);
    }
  }

  function handleTranscribed(transcript, note) {
    setAnswers((a) => ({ ...a, [stage]: (a[stage] ? a[stage] + " " : "") + transcript }));
    if (note) setPronunciationNotes((n) => ({ ...n, [stage]: note }));
  }

  function next() {
    if (stage === "part1") setStage("part2");
    else if (stage === "part2") setStage("part3");
  }

  async function submit() {
    setLoading(true);
    setError("");
    try {
      const data = await api("/speaking/submit", {
        token,
        method: "POST",
        body: { topicId: topic.id, answers, pronunciationNotes },
      });
      setFeedback(data.feedback);
      onXpChange();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const stageInfo = {
    part1: { label: "Part 1", questions: topic?.part1Questions },
    part2: { label: "Part 2 — Cue Card", cue: topic?.part2 },
    part3: { label: "Part 3", questions: topic?.part3Questions },
  };

  return (
    <div style={{ padding: 24, maxWidth: 720, margin: "0 auto" }}>
      <BackButton onBack={topic ? () => { setTopic(null); setFeedback(null); } : onBack} />
      <ModuleHeader moduleId="speaking" icon="🗣" title="Speaking (Multilevel format)" />
      {error && <div style={{ color: COLORS.red, fontFamily: "Inter, sans-serif", fontSize: 14, marginBottom: 12 }}>{error}</div>}

      {!topic && topics && (
        <div>
          <button
            type="button"
            onClick={async () => {
              setError("");
              try {
                const full = await api("/speaking/topics/random", { token });
                setTopic(full);
                setStage("part1");
                setAnswers({ part1: "", part2: "", part3: "" });
                setPronunciationNotes({});
                setFeedback(null);
              } catch (e) {
                setError(e.message);
              }
            }}
            style={{ width: "100%", textAlign: "center", background: COLORS.primary, color: "#fff", border: "none", borderRadius: 10, padding: "14px", cursor: "pointer", fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: 14, marginBottom: 14 }}
          >
            🔀 Tasodifiy mavzu bilan boshlash
          </button>
          <div style={{ display: "grid", gap: 10 }}>
            {topics.map((t) => (
              <button
                key={t.id}
                onClick={() => pickTopic(t)}
                style={{ textAlign: "left", background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 10, padding: "14px", cursor: "pointer", fontFamily: "Inter, sans-serif", fontSize: 14, color: COLORS.text }}
              >
                {t.theme}
              </button>
            ))}
          </div>
        </div>
      )}

      {topic && !feedback && (
        <div>
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            {["part1", "part2", "part3"].map((s) => (
              <Badge key={s} tone={s === stage ? "live" : "soon"}>{stageInfo[s].label}</Badge>
            ))}
          </div>

          {stage !== "part2" ? (
            <ol style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: COLORS.text, paddingLeft: 20, marginBottom: 14 }}>
              {stageInfo[stage].questions?.map((q) => <li key={q} style={{ marginBottom: 6 }}>{q}</li>)}
            </ol>
          ) : (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
                {topic.part2.cueCardTitle}
              </div>
              <ul style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: COLORS.text, paddingLeft: 20 }}>
                {topic.part2.bulletPoints.map((b) => <li key={b} style={{ marginBottom: 4 }}>{b}</li>)}
              </ul>
            </div>
          )}

          <MicButton token={token} onTranscribed={handleTranscribed} />
          <textarea
            value={answers[stage]}
            onChange={(e) => setAnswers({ ...answers, [stage]: e.target.value })}
            rows={6}
            placeholder="Mikrofonni bosib gapiring, yoki shu yerga to'g'ridan-to'g'ri yozing..."
            style={{ width: "100%", boxSizing: "border-box", padding: 12, borderRadius: 10, border: `1px solid ${COLORS.line}`, fontFamily: "Inter, sans-serif", fontSize: 14, marginBottom: 12 }}
          />

          {stage !== "part3" ? (
            <button
              onClick={next}
              disabled={answers[stage].trim().length < 10}
              style={{ padding: "10px 20px", background: COLORS.primary, color: "#fff", border: "none", borderRadius: 8, fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: 14, cursor: "pointer", opacity: answers[stage].trim().length < 10 ? 0.6 : 1 }}
            >
              Keyingi qism →
            </button>
          ) : (
            <button
              onClick={submit}
              disabled={loading || answers.part3.trim().length < 10}
              style={{ padding: "10px 20px", background: COLORS.primary, color: "#fff", border: "none", borderRadius: 8, fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: 14, cursor: loading ? "default" : "pointer", opacity: loading || answers.part3.trim().length < 10 ? 0.6 : 1 }}
            >
              {loading ? "AI baholamoqda..." : "Yakunlash va baholash"}
            </button>
          )}
          {loading && (
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: COLORS.textSoft, marginTop: 8 }}>
              Birinchi so'rov 30-50 soniya davom etishi mumkin (server uyg'onmoqda) — sahifani yopmang.
            </div>
          )}
        </div>
      )}

      {feedback && <FeedbackView feedback={feedback} />}
    </div>
  );
}

function VocabTopicCard({ topic, known, total, onOpen }) {
  const pct = total ? Math.round((known / total) * 100) : 0;
  return (
    <button
      onClick={onOpen}
      style={{
        textAlign: "left",
        background: COLORS.surface,
        border: `1px solid ${COLORS.line}`,
        borderLeft: `4px solid ${MODULE_COLORS.vocabulary.accent}`,
        borderRadius: 14,
        padding: "14px 16px",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ width: 34, height: 34, borderRadius: 9, background: MODULE_COLORS.vocabulary.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17 }}>
          {topic.icon}
        </div>
        <span style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 11, fontWeight: 600, color: COLORS.textSoft }}>{total} so'z</span>
      </div>
      <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 15, fontWeight: 700, color: COLORS.text }}>{topic.name}</div>
      <div style={{ background: COLORS.bg, borderRadius: 999, height: 6, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: MODULE_COLORS.vocabulary.accent, borderRadius: 999 }} />
      </div>
      <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: COLORS.textSoft }}>{known}/{total} bilaman deb belgilangan</div>
    </button>
  );
}

function loadVocabProgress() {
  try {
    return JSON.parse(localStorage.getItem("vocabProgress") || "{}");
  } catch {
    return {};
  }
}
function saveVocabProgress(progress) {
  try {
    localStorage.setItem("vocabProgress", JSON.stringify(progress));
  } catch {
    // localStorage ishlamasa ham kartochkalar davom etaveradi
  }
}

function VocabFlashcard({ word, flipped, onFlip }) {
  const c = MODULE_COLORS.vocabulary;
  return (
    <div
      onClick={onFlip}
      style={{
        background: flipped ? c.dark : COLORS.surface,
        border: `1.5px solid ${flipped ? c.dark : COLORS.line}`,
        borderRadius: 18,
        padding: "36px 24px",
        minHeight: 200,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        cursor: "pointer",
        userSelect: "none",
        boxShadow: "0 8px 24px rgba(20,25,50,0.06)",
        transition: "background 0.15s ease",
      }}
    >
      {!flipped ? (
        <>
          <Badge tone="soon">{word.level}</Badge>
          <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 30, fontWeight: 700, color: COLORS.text, marginTop: 14 }}>
            {word.term}
          </div>
          <div style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: COLORS.textSoft, marginTop: 10 }}>
            Tarjimasini ko'rish uchun bosing
          </div>
        </>
      ) : (
        <>
          <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 24, fontWeight: 700, color: "#fff" }}>
            {word.translation}
          </div>
          <div style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: "rgba(255,255,255,0.85)", marginTop: 10, lineHeight: 1.5 }}>
            {word.def}
          </div>
          <div style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "rgba(255,255,255,0.65)", marginTop: 12, fontStyle: "italic" }}>
            "{word.example}"
          </div>
        </>
      )}
    </div>
  );
}

function renderBold(text) {
  // "**so'z**" ko'rinishidagi qismlarni qalin qilib render qiladi.
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <b key={i} style={{ color: MODULE_COLORS.vocabulary.dark }}>{part}</b>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

function IeltsPhraseGroup({ group }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, fontSize: 14.5, color: COLORS.text, marginBottom: 10 }}>
        {group.title}
      </div>
      <ol style={{ margin: 0, paddingLeft: 22, display: "flex", flexDirection: "column", gap: 8 }}>
        {group.phrases.map((p, i) => (
          <li key={i} style={{ fontFamily: "Inter, sans-serif", fontSize: 14, lineHeight: 1.55, color: COLORS.text }}>
            <b style={{ color: MODULE_COLORS.vocabulary.dark }}>{p.phrase}</b>
            {" "}<span style={{ color: COLORS.textSoft }}>({p.translation})</span>
            {" — "}<span style={{ fontStyle: "italic", color: COLORS.textSoft }}>{p.def}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function IeltsQA({ q, a }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 13.5, color: COLORS.primary, marginBottom: 6 }}>
        Examiner: {q}
      </div>
      <div style={{ fontFamily: "Inter, sans-serif", fontSize: 14, lineHeight: 1.65, color: COLORS.text, fontStyle: "italic", paddingLeft: 14, borderLeft: `3px solid ${MODULE_COLORS.vocabulary.accent}` }}>
        {renderBold(a)}
      </div>
    </div>
  );
}

function IeltsContentView({ content }) {
  if (!content) {
    return (
      <div style={{ textAlign: "center", padding: "40px 20px", color: COLORS.textSoft, fontFamily: "Inter, sans-serif", fontSize: 14 }}>
        Bu mavzu uchun IELTS namunasi tayyorlanmoqda — tez orada qo'shiladi. 🛠️
      </div>
    );
  }
  return (
    <div>
      <div style={{ marginBottom: 26 }}>
        <div style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, fontSize: 16, color: COLORS.text, marginBottom: 12 }}>
          So'z birikmalari
        </div>
        {content.groups.map((g, i) => <IeltsPhraseGroup key={i} group={g} />)}
      </div>

      <div style={{ marginBottom: 26 }}>
        <div style={{
          fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, fontSize: 13,
          color: "#fff", background: MODULE_COLORS.vocabulary.dark, display: "inline-block",
          padding: "4px 12px", borderRadius: 999, marginBottom: 12,
        }}>
          IELTS Speaking Part 1
        </div>
        {content.part1.map((qa, i) => <IeltsQA key={i} q={qa.q} a={qa.a} />)}
      </div>

      <div style={{ marginBottom: 26 }}>
        <div style={{
          fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, fontSize: 13,
          color: "#fff", background: MODULE_COLORS.vocabulary.dark, display: "inline-block",
          padding: "4px 12px", borderRadius: 999, marginBottom: 12,
        }}>
          IELTS Speaking Part 2
        </div>
        <div style={{
          background: MODULE_COLORS.vocabulary.bg, borderRadius: 12, padding: "14px 16px", marginBottom: 12,
          fontFamily: "Inter, sans-serif", fontSize: 14,
        }}>
          <b style={{ color: MODULE_COLORS.vocabulary.dark }}>{content.part2.cue}</b>
          <div style={{ color: COLORS.textSoft, marginTop: 6, fontSize: 13 }}>You should say:</div>
          <ul style={{ margin: "4px 0 4px 18px", padding: 0, color: COLORS.textSoft, fontSize: 13 }}>
            {content.part2.bullets.map((b, i) => <li key={i}>{b}</li>)}
          </ul>
          <div style={{ color: COLORS.textSoft, fontSize: 13 }}>{content.part2.closing}</div>
        </div>
        <div style={{ fontFamily: "Inter, sans-serif", fontSize: 14, lineHeight: 1.7, color: COLORS.text, fontStyle: "italic", paddingLeft: 14, borderLeft: `3px solid ${MODULE_COLORS.vocabulary.accent}`, whiteSpace: "pre-line" }}>
          {renderBold(content.part2.answer)}
        </div>
      </div>

      <div>
        <div style={{
          fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, fontSize: 13,
          color: "#fff", background: MODULE_COLORS.vocabulary.dark, display: "inline-block",
          padding: "4px 12px", borderRadius: 999, marginBottom: 12,
        }}>
          IELTS Speaking Part 3
        </div>
        {content.part3.map((qa, i) => <IeltsQA key={i} q={qa.q} a={qa.a} />)}
      </div>
    </div>
  );
}

function WritingTopicCard({ topic, onOpen }) {
  return (
    <button
      onClick={onOpen}
      style={{
        textAlign: "left", background: COLORS.surface, border: `1px solid ${COLORS.line}`,
        borderLeft: `4px solid ${MODULE_COLORS.vocabulary.accent}`, borderRadius: 14,
        padding: "14px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 12,
      }}
    >
      <div style={{ width: 34, height: 34, borderRadius: 9, background: MODULE_COLORS.vocabulary.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, flexShrink: 0 }}>
        {topic.icon}
      </div>
      <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 14.5, fontWeight: 700, color: COLORS.text }}>
        {topic.name}
      </div>
    </button>
  );
}

function WritingContentView({ content }) {
  if (!content) {
    return (
      <div style={{ textAlign: "center", padding: "40px 20px", color: COLORS.textSoft, fontFamily: "Inter, sans-serif", fontSize: 14 }}>
        Bu mavzu uchun Writing lug'ati tayyorlanmoqda — tez orada qo'shiladi. 🛠️
      </div>
    );
  }
  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, fontSize: 15, color: COLORS.text, marginBottom: 10 }}>
          Asosiy atamalar
        </div>
        <ol style={{ margin: 0, paddingLeft: 22, display: "flex", flexDirection: "column", gap: 8 }}>
          {content.terms.map((t, i) => (
            <li key={i} style={{ fontFamily: "Inter, sans-serif", fontSize: 14, lineHeight: 1.55, color: COLORS.text }}>
              <b style={{ color: MODULE_COLORS.vocabulary.dark }}>{t.term}</b>
              {" "}<span style={{ color: COLORS.textSoft }}>({t.translation})</span>
              {" — "}<span style={{ fontStyle: "italic", color: COLORS.textSoft }}>{t.def}</span>
            </li>
          ))}
        </ol>
      </div>

      <div style={{ marginBottom: 24 }}>
        <div style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, fontSize: 15, color: COLORS.text, marginBottom: 10 }}>
          Akademik kollokatsiyalar
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {content.collocations.map((c, i) => (
            <div key={i} style={{ background: COLORS.bg, borderRadius: 10, padding: "10px 14px" }}>
              <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 13.5, color: MODULE_COLORS.vocabulary.dark, marginBottom: 3 }}>
                {c.phrase}
              </div>
              <div style={{ fontFamily: "Inter, sans-serif", fontSize: 13.5, color: COLORS.textSoft, lineHeight: 1.5 }}>
                {renderBold(c.example)}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, fontSize: 15, color: COLORS.text, marginBottom: 10 }}>
          Namuna paragraf
        </div>
        <div style={{
          fontFamily: "Inter, sans-serif", fontSize: 14, lineHeight: 1.75, color: COLORS.text,
          paddingLeft: 14, borderLeft: `3px solid ${MODULE_COLORS.vocabulary.accent}`, fontStyle: "italic",
        }}>
          {renderBold(content.sampleParagraph)}
        </div>
      </div>
    </div>
  );
}

function VocabListView({ topicWords, progress, setProgress }) {
  const byLevel = LEVELS.map((lv) => ({ level: lv, words: topicWords.filter((w) => w.level === lv) })).filter((g) => g.words.length);

  function toggleKnown(word) {
    const next = { ...progress, [word.id]: progress[word.id] === "known" ? undefined : "known" };
    setProgress(next);
    saveVocabProgress(next);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
      {byLevel.map((group) => (
        <div key={group.level}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <span style={{
              fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, fontSize: 13,
              color: MODULE_COLORS.vocabulary.dark, background: MODULE_COLORS.vocabulary.bg,
              padding: "3px 10px", borderRadius: 999,
            }}>
              {group.level}
            </span>
            <div style={{ flex: 1, height: 1, background: COLORS.line }} />
          </div>
          <ol style={{ margin: 0, paddingLeft: 22, display: "flex", flexDirection: "column", gap: 14 }}>
            {group.words.map((w) => (
              <li key={w.id} style={{ fontFamily: "Inter, sans-serif", fontSize: 14.5, lineHeight: 1.6, color: COLORS.text }}>
                <span
                  onClick={() => toggleKnown(w)}
                  style={{
                    fontWeight: 700,
                    color: progress[w.id] === "known" ? MODULE_COLORS.vocabulary.dark : COLORS.text,
                    cursor: "pointer",
                    borderBottom: progress[w.id] === "known" ? `2px solid ${MODULE_COLORS.vocabulary.accent}` : "2px solid transparent",
                  }}
                  title="Bilaman deb belgilash uchun bosing"
                >
                  {w.term}
                </span>
                {" "}<span style={{ color: COLORS.textSoft }}>({w.translation})</span>
                {" — "}
                <span style={{ fontStyle: "italic", color: COLORS.textSoft }}>{w.def}</span>
                <div style={{ marginTop: 3, color: MODULE_COLORS.vocabulary.dark, fontSize: 13.5 }}>
                  “{w.example}”
                </div>
              </li>
            ))}
          </ol>
        </div>
      ))}
    </div>
  );
}

function VocabTopicPractice({ topic, progress, setProgress, onBack }) {
  const [level, setLevel] = useState("Barchasi");
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [view, setView] = useState("card"); // "card" | "list"

  const topicWords = VOCAB_WORDS.filter((w) => w.topicId === topic.id);
  const words = level === "Barchasi" ? topicWords : topicWords.filter((w) => w.level === level);
  const word = words[index % words.length];
  const known = topicWords.filter((w) => progress[w.id] === "known").length;

  function mark(status) {
    const next = { ...progress, [word.id]: status };
    setProgress(next);
    saveVocabProgress(next);
    setFlipped(false);
    setIndex((i) => (i + 1) % words.length);
  }

  function skip() {
    setFlipped(false);
    setIndex((i) => (i + 1) % words.length);
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", gap: 4, background: COLORS.bg, borderRadius: 10, padding: 4 }}>
          {[{ id: "card", label: "🗂 Kartochka" }, { id: "list", label: "📖 Ro'yxat" }, { id: "ielts", label: "📝 IELTS namuna" }].map((v) => (
            <button
              key={v.id}
              onClick={() => setView(v.id)}
              style={{
                fontFamily: "Inter, sans-serif", fontSize: 12.5, fontWeight: 700,
                padding: "7px 14px", borderRadius: 8, border: "none", cursor: "pointer",
                background: view === v.id ? COLORS.surface : "transparent",
                color: view === v.id ? MODULE_COLORS.vocabulary.dark : COLORS.textSoft,
                boxShadow: view === v.id ? "0 1px 4px rgba(20,25,50,0.08)" : "none",
              }}
            >
              {v.label}
            </button>
          ))}
        </div>
        <span style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 12, fontWeight: 600, color: COLORS.textSoft }}>
          Bilgan so'zlar: {known}/{topicWords.length}
        </span>
      </div>

      {view === "list" && (
        <VocabListView topicWords={topicWords} progress={progress} setProgress={setProgress} />
      )}

      {view === "ielts" && (
        <IeltsContentView content={IELTS_CONTENT[topic.id]} />
      )}

      {view === "card" && (
        <>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
            {["Barchasi", ...LEVELS].map((lv) => (
              <button
                key={lv}
                onClick={() => { setLevel(lv); setIndex(0); setFlipped(false); }}
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: 12,
                  fontWeight: 700,
                  padding: "6px 12px",
                  borderRadius: 999,
                  border: `1.5px solid ${lv === level ? MODULE_COLORS.vocabulary.dark : COLORS.line}`,
                  background: lv === level ? MODULE_COLORS.vocabulary.bg : "transparent",
                  color: lv === level ? MODULE_COLORS.vocabulary.dark : COLORS.textSoft,
                  cursor: "pointer",
                }}
              >
                {lv}
              </button>
            ))}
          </div>
          <div style={{ textAlign: "right", marginBottom: 8 }}>
            <span style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 12, fontWeight: 600, color: COLORS.textSoft }}>
              {index + 1} / {words.length}
            </span>
          </div>

          <VocabFlashcard word={word} flipped={flipped} onFlip={() => setFlipped((f) => !f)} />

          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <button
              onClick={() => mark("unknown")}
              style={{ flex: 1, padding: "12px 0", background: "#FCEAE8", color: "#A8332B", border: "none", borderRadius: 10, fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 14, cursor: "pointer" }}
            >
              ✕ Bilmadim
            </button>
            <button
              onClick={skip}
              style={{ padding: "12px 18px", background: "none", color: COLORS.textSoft, border: `1.5px solid ${COLORS.line}`, borderRadius: 10, fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: 14, cursor: "pointer" }}
            >
              O'tkazib yuborish
            </button>
            <button
              onClick={() => mark("known")}
              style={{ flex: 1, padding: "12px 0", background: COLORS.greenBg, color: "#0B7850", border: "none", borderRadius: 10, fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 14, cursor: "pointer" }}
            >
              ✓ Bilaman
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function VocabularyModule({ onBack }) {
  const [activeTopic, setActiveTopic] = useState(null);
  const [activeWritingTopic, setActiveWritingTopic] = useState(null);
  const [progress, setProgress] = useState(loadVocabProgress);

  const businessTopics = VOCAB_TOPICS.filter((t) => t.category === "business");
  const speakingTopics = VOCAB_TOPICS.filter((t) => t.category === "speaking");

  const businessWords = VOCAB_WORDS.filter((w) => businessTopics.some((t) => t.id === w.topicId));
  const speakingWords = VOCAB_WORDS.filter((w) => speakingTopics.some((t) => t.id === w.topicId));

  const businessKnown = businessWords.filter((w) => progress[w.id] === "known").length;
  const speakingKnown = speakingWords.filter((w) => progress[w.id] === "known").length;
  const totalKnown = businessKnown + speakingKnown;

  const businessPct = businessWords.length ? Math.round((businessKnown / businessWords.length) * 100) : 0;
  const speakingUnlocked = businessPct >= 80; // Business bosqichining katta qismi o'zlashtirilganda ochiladi

  function renderTopicGrid(topics) {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
        {topics.map((t) => {
          const topicWords = VOCAB_WORDS.filter((w) => w.topicId === t.id);
          const known = topicWords.filter((w) => progress[w.id] === "known").length;
          return (
            <VocabTopicCard
              key={t.id}
              topic={t}
              known={known}
              total={topicWords.length}
              onOpen={() => setActiveTopic(t)}
            />
          );
        })}
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 760, margin: "0 auto" }}>
      <BackButton onBack={activeTopic ? () => setActiveTopic(null) : activeWritingTopic ? () => setActiveWritingTopic(null) : onBack} />
      <ModuleHeader
        moduleId="vocabulary"
        icon="🗂"
        title={activeTopic ? activeTopic.name : activeWritingTopic ? activeWritingTopic.name : "Vocabulary"}
      />

      {!activeTopic && !activeWritingTopic && (
        <>
          <div style={{ background: MODULE_COLORS.vocabulary.bg, borderRadius: 14, padding: "14px 18px", marginBottom: 22, fontFamily: "Inter, sans-serif", fontSize: 13, color: MODULE_COLORS.vocabulary.dark }}>
            38 ta mavzu, jami {VOCAB_WORDS.length} ta so'z (A1–C2). Jami bilgan so'zlaringiz: <b>{totalKnown}</b>
          </div>

          {/* 1-bosqich: Business */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <span style={{
              fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, fontSize: 11,
              color: "#fff", background: MODULE_COLORS.vocabulary.dark,
              padding: "3px 9px", borderRadius: 999,
            }}>
              1-BOSQICH
            </span>
            <span style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, fontSize: 15, color: COLORS.text }}>
              Biznes lug'ati
            </span>
            <span style={{ marginLeft: "auto", fontFamily: "IBM Plex Mono, monospace", fontSize: 12, fontWeight: 600, color: COLORS.textSoft }}>
              {businessPct}%
            </span>
          </div>
          <div style={{ marginBottom: 18 }}>{renderTopicGrid(businessTopics)}</div>

          {/* 2-bosqich: Speaking (umumiy IELTS mavzulari) */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <span style={{
              fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, fontSize: 11,
              color: speakingUnlocked ? "#fff" : COLORS.textSoft,
              background: speakingUnlocked ? MODULE_COLORS.vocabulary.dark : COLORS.line,
              padding: "3px 9px", borderRadius: 999,
            }}>
              2-BOSQICH
            </span>
            <span style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, fontSize: 15, color: speakingUnlocked ? COLORS.text : COLORS.textSoft }}>
              Speaking uchun umumiy mavzular
            </span>
          </div>

          {!speakingUnlocked && (
            <div style={{
              background: COLORS.bg, border: `1.5px dashed ${COLORS.line}`, borderRadius: 14,
              padding: "16px 18px", marginBottom: 12, display: "flex", alignItems: "center", gap: 12,
            }}>
              <span style={{ fontSize: 22 }}>🔒</span>
              <div style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: COLORS.textSoft, lineHeight: 1.5 }}>
                Bu bosqich Biznes lug'atining <b>80%</b>ini o'zlashtirgach ochiladi.
                Hozirgi darajangiz: <b>{businessPct}%</b>. Davom eting — daraja ko'tariladi!
              </div>
            </div>
          )}

          {speakingUnlocked && renderTopicGrid(speakingTopics)}

          {/* 3-bosqich: IELTS Writing lug'ati */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "26px 0 10px" }}>
            <span style={{
              fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, fontSize: 11,
              color: "#fff", background: MODULE_COLORS.vocabulary.dark,
              padding: "3px 9px", borderRadius: 999,
            }}>
              WRITING
            </span>
            <span style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, fontSize: 15, color: COLORS.text }}>
              IELTS Writing lug'ati
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
            {WRITING_TOPICS.map((t) => (
              <WritingTopicCard key={t.id} topic={t} onOpen={() => setActiveWritingTopic(t)} />
            ))}
          </div>
        </>
      )}

      {activeTopic && (
        <VocabTopicPractice topic={activeTopic} progress={progress} setProgress={setProgress} onBack={() => setActiveTopic(null)} />
      )}

      {activeWritingTopic && (
        <WritingContentView content={WRITING_CONTENT[activeWritingTopic.id]} />
      )}
    </div>
  );
}

function ComingSoonModule({ id, onBack }) {
  const m = MODULES.find((x) => x.id === id);
  return (
    <div style={{ padding: 24, maxWidth: 720, margin: "0 auto" }}>
      <BackButton onBack={onBack} />
      <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 24, fontWeight: 600, color: COLORS.text, marginBottom: 6 }}>
        {m.icon} {m.name}
      </div>
      <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 14, padding: "40px 20px", textAlign: "center", fontFamily: "Inter, sans-serif", color: COLORS.textSoft, fontSize: 14 }}>
        Bu bo'lim hali API'ga ulanmagan. Backend'da tayyor bo'lgach, shu yerda ishlaydi.
      </div>
    </div>
  );
}

export default function App() {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState("login");
  const [screen, setScreen] = useState("dashboard");
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(null);
  const [loadError, setLoadError] = useState("");

  const refreshProgress = useCallback(async () => {
    if (!token) return;
    try {
      const data = await api("/progress/me", { token });
      setXp(data.xp);
      setStreak(data.streak);
      setUser((u) => ({ ...u, ...data.user }));
    } catch (e) {
      setLoadError(e.message);
    }
  }, [token]);

  useEffect(() => {
    refreshProgress();
  }, [refreshProgress]);

  function handleAuth(newToken, newUser) {
    setToken(newToken);
    setUser(newUser);
  }

  function handleLogout() {
    setToken(null);
    setUser(null);
    setScreen("dashboard");
  }

  function openModule(id) {
    setScreen(id);
  }

  if (!token) {
    return (
      <div style={{ background: COLORS.bg, minHeight: 500, fontFamily: "Inter, sans-serif" }}>
        <style>{FONTS}</style>
        <AuthScreen mode={authMode} setMode={setAuthMode} onAuth={handleAuth} />
      </div>
    );
  }

  return (
    <div style={{ background: COLORS.bg, minHeight: 500, fontFamily: "Inter, sans-serif" }}>
      <style>{FONTS}</style>
      <TopBar user={user} xp={xp} streak={streak} onLogout={handleLogout} />
      {loadError && (
        <div style={{ padding: "8px 24px", fontFamily: "Inter, sans-serif", fontSize: 12, color: COLORS.red }}>{loadError}</div>
      )}
      {screen === "dashboard" && <Dashboard onOpen={openModule} xp={xp} streak={streak} level={user?.cefr_level} />}
      {screen === "business" && <BusinessModule token={token} onBack={() => setScreen("dashboard")} />}
      {screen === "writing" && <WritingModule token={token} onBack={() => setScreen("dashboard")} onXpChange={refreshProgress} />}
      {screen === "speaking" && <SpeakingModule token={token} onBack={() => setScreen("dashboard")} onXpChange={refreshProgress} />}
      {screen === "vocabulary" && <VocabularyModule onBack={() => setScreen("dashboard")} />}
      {["reading", "listening"].includes(screen) && (
        <ComingSoonModule id={screen} onBack={() => setScreen("dashboard")} />
      )}
    </div>
  );
}
