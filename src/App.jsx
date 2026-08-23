import {
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { VOCAB_TOPICS, VOCAB_WORDS, IELTS_TOPICS, IELTS_CONTENT } from "./vocabData";

const FONTS = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;600&display=swap');
`;

const API_BASE = "https://business-english-surxon.onrender.com/api";

// AI-og'ir so'rovlar (Render sovuq ishga tushishi + LLM javobi) uchun uzunroq
// timeout. Oddiy so'rovlar (login, ro'yxatlar) uchun qisqa timeout yetarli.
const DEFAULT_TIMEOUT_MS = 20000;
const AI_TIMEOUT_MS = 120000; // 2 daqiqa: cold start (~50-60s) + AI tahlili uchun joy

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
  { id: "vocabulary", icon: "🗂", name: "Vocabulary & IELTS", desc: "20 biznes mavzusi (600 so'z) + 16 IELTS mavzusi", live: true },
];

// Ilova ochilganda backend (Render) ni fonda "uyg'otish" uchun. Natijasini
// kutmaymiz va xatosini ko'rsatmaymiz — maqsad faqat cold start jarayonini
// oldindan boshlab qo'yish, shunda foydalanuvchi Speaking/Writing bo'limiga
// yetguncha server allaqachon tayyor bo'ladi.
function wakeBackend() {
  fetch(`${API_BASE}/health`).catch(() => {
    // /health yo'q bo'lsa ham, bu so'rovning o'zi Render'ni uyg'otadi
    fetch(API_BASE.replace(/\/api$/, "")).catch(() => {});
  });
}

async function api(path, { token, method = "GET", body, timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token && token !== "demo-token" ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (err) {
    if (err.name === "AbortError") {
      throw new Error("Server javob bermadi (ehtimol uyg'onmoqda, bu birinchi so'rovda 1 daqiqagacha vaqt olishi mumkin). Yana bir bor urinib ko'ring.");
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

  function handleDemoLogin() {
    onAuth("demo-token", {
      full_name: "Demo Foydalanuvchi",
      email: "demo@bizenglish.uz",
      cefr_level: "B2",
    });
  }

  return (
    <div style={{ maxWidth: 390, margin: "50px auto", padding: "0 24px" }}>
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
      <form onSubmit={submit} style={{ background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 16, padding: 24, boxShadow: "0 8px 24px rgba(30,42,94,0.06)" }}>
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
            marginBottom: 10,
          }}
        >
          {loading ? "Yuklanmoqda..." : mode === "login" ? "Kirish" : "Ro'yxatdan o'tish"}
        </button>

        <button
          type="button"
          onClick={handleDemoLogin}
          style={{
            width: "100%",
            padding: "11px 0",
            background: "#FDF2DF",
            color: COLORS.amberDark,
            border: `1px solid #F5A623`,
            borderRadius: 10,
            fontFamily: "Inter, sans-serif",
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          ⚡ Demo rejimida kirish
        </button>
      </form>
      <div style={{ textAlign: "center", marginTop: 16, fontFamily: "Inter, sans-serif", fontSize: 13, color: COLORS.textSoft }}>
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
          🔥 {streak?.current_streak ?? 1} kun
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 4, fontFamily: "IBM Plex Mono, monospace", fontSize: 13, fontWeight: 600, color: COLORS.primary, background: "#EAEDFC", borderRadius: 999, padding: "5px 12px" }}>
          ⚡ {xp} XP
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
        <StatTile label="DARAJA" value={level || "B2"} bg="#EAEDFC" fg={COLORS.primary} />
        <StatTile label="XP BALL" value={xp} bg="#FDF2DF" fg={COLORS.amberDark} mono />
        <StatTile label="KUNLIK SERIYA" value={`🔥 ${streak?.current_streak ?? 1}`} bg="#FCEAE8" fg="#A8332B" mono />
      </div>

      <div style={{ background: COLORS.primary, borderRadius: 16, padding: "20px 24px", marginBottom: 24 }}>
        <div style={{ fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 600, color: "#AEB8E0", marginBottom: 10, letterSpacing: 0.3 }}>
          CEFR YO'LI
        </div>
        <RiverPath current={level || "B2"} />
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
  if (!feedback) return null;
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
    if (token === "demo-token") {
      setModules([
        {
          id: "m1",
          title: "Xalqaro muzokaralar va bitimlar",
          vocabulary: [
            { term: "concession", def: "Muzokarada kelishuvga erishish uchun berilgan yon bosish." },
            { term: "deadlock", def: "Muzokaralarning boshi berk ko'chaga kirib qolishi." },
            { term: "win-win solution", def: "Har ikkala tomon uchun manfaatli yechim." },
          ],
          keyPhrases: [
            "I see your point, however we must consider our margin.",
            "Would you be open to a tiered pricing structure?",
            "Let's find common ground on the delivery timeline."
          ]
        },
        {
          id: "m2",
          title: "Biznes taqdimotlar va Pitching",
          vocabulary: [
            { term: "value proposition", def: "Mijozga taklif qilinayotgan asosiy qiymat va foyda." },
            { term: "market traction", def: "Mahsulotning bozordagi dastlabki muvaffaqiyati va o'sishi." },
          ],
          keyPhrases: [
            "Today, I'd like to walk you through our quarterly roadmap.",
            "As you can see from this trajectory, user retention has doubled.",
          ]
        }
      ]);
      return;
    }
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
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
          {modules.map((m) => (
            <button
              key={m.id}
              onClick={() => setSelected(m)}
              style={{ textAlign: "left", background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 12, padding: "16px", cursor: "pointer", fontFamily: "Inter, sans-serif", fontSize: 14, color: COLORS.text, boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}
            >
              <div style={{ fontWeight: 700, color: COLORS.primary, marginBottom: 4 }}>{m.title}</div>
              <div style={{ fontSize: 12, color: COLORS.textSoft }}>Dars materiallarini ko'rish →</div>
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
    if (token === "demo-token") {
      setLessons([
        { id: "task1_bar", title: "Task 1 — Bar Chart: Global Energy Transition" },
        { id: "task2_essay", title: "Task 2 — Opinion Essay: Remote Work & Productivity" }
      ]);
      return;
    }
    api("/writing/lessons", { token }).then(setLessons).catch((e) => setError(e.message));
  }, [token]);

  async function pickLesson(l) {
    setError("");
    setFeedback(null);
    setText("");
    setCategory(l);
    if (token === "demo-token") {
      setSelected({
        id: l.id,
        lesson: "Ushbu bo'limda siz grafik yoki jadval ma'lumotlarini rasmiy tilda tahlil qilib yozishingiz kerak.",
        taskPrompt: "Summarise the information by selecting and reporting the main features, and make comparisons where relevant.",
        wordCountMin: 150,
        wordCountMax: 200,
        chart: {
          title: "Renewable Energy Share by Country (2020 vs 2025)",
          unit: "Percentage (%)",
          type: "bar",
          categories: ["Germany", "UK", "Uzbekistan", "China"],
          series: [
            { name: "2020", data: [45, 40, 10, 28] },
            { name: "2025", data: [60, 52, 25, 42] }
          ]
        }
      });
      return;
    }
    try {
      const full = await api(`/writing/lessons/${l.id}`, { token });
      setSelected(full);
    } catch (e) {
      setError(e.message);
    }
  }

  async function submit() {
    setLoading(true);
    setError("");
    if (token === "demo-token") {
      setTimeout(() => {
        setFeedback("BALL: Band 7.5 (Task Achievement: 7.5, Coherence & Cohesion: 7.5, Lexical Resource: 7.5, Grammatical Range: 7.5)\n\nIzoh: Matn mazmuni to'liq yoritilgan. Grammatik strukturalar to'g'ri va boy sinonimlar ishlatilgan.");
        setLoading(false);
        if (onXpChange) onXpChange();
      }, 1000);
      return;
    }
    try {
      const data = await api("/writing/check", {
        token,
        method: "POST",
        body: { lessonId: selected.id, text, taskPrompt: selected.taskPrompt, chart: selected.chart, steps: selected.steps },
        timeoutMs: AI_TIMEOUT_MS,
      });
      setFeedback(data.feedback);
      if (onXpChange) onXpChange();
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
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={8}
            placeholder="Javobingizni shu yerga yozing..."
            style={{ width: "100%", boxSizing: "border-box", padding: 12, borderRadius: 10, border: `1px solid ${COLORS.line}`, fontFamily: "Inter, sans-serif", fontSize: 14, marginBottom: 10 }}
          />
          <div style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: COLORS.textSoft, marginBottom: 14 }}>
            Talab: {selected.wordCountMin}-{selected.wordCountMax} so'z (Joriy so'zlar: {text.trim() ? text.trim().split(/\s+/).length : 0})
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
              AI matningizni tahlil qilmoqda — server uxlab qolgan bo'lsa, birinchi urinishda bu jarayon 1 daqiqagacha davom etishi mumkin. Iltimos, sahifani yopmasdan kuting...
            </div>
          )}
        </div>
      )}

      {feedback && <FeedbackView feedback={feedback} />}
    </div>
  );
}

function formatRecordingTime(seconds) {
  const mins = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const secs = (seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${mins}:${secs}`;
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onloadend = () => {
      const result = reader.result;

      if (typeof result !== "string") {
        reject(new Error("Audio faylini o'qib bo'lmadi."));
        return;
      }

      const commaIndex = result.indexOf(",");
      resolve(commaIndex >= 0 ? result.slice(commaIndex + 1) : result);
    };

    reader.onerror = () => {
      reject(new Error("Audio faylini o'qishda xatolik."));
    };

    reader.readAsDataURL(blob);
  });
}

function useRecorder(token, onTranscribed) {
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [recError, setRecError] = useState("");
  const [duration, setDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState(null);

  const mediaRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const startedAtRef = useRef(null);
  const durationRef = useRef(0);
  const audioUrlRef = useRef(null);

  const cleanupStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    mediaRef.current = null;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const start = useCallback(async () => {
    setRecError("");
    setDuration(0);
    durationRef.current = 0;

    if (!navigator.mediaDevices?.getUserMedia) {
      setRecError(
        "Brauzeringiz mikrofon orqali yozib olishni qo'llab-quvvatlamaydi."
      );
      return;
    }

    if (typeof MediaRecorder === "undefined") {
      setRecError(
        "Brauzeringiz audio yozib olish funksiyasini qo'llab-quvvatlamaydi."
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;

      const mimeCandidates = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/ogg;codecs=opus",
      ];

      const supportedMimeType =
        mimeCandidates.find((type) =>
          MediaRecorder.isTypeSupported(type)
        ) || "";

      const recorder = supportedMimeType
        ? new MediaRecorder(stream, { mimeType: supportedMimeType })
        : new MediaRecorder(stream);

      const actualMimeType =
        recorder.mimeType || supportedMimeType || "audio/webm";

      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onerror = () => {
        setRecError("Audio yozib olishda xatolik yuz berdi.");
        setRecording(false);
        cleanupStream();
      };

      recorder.onstop = async () => {
        cleanupStream();

        const blob = new Blob(chunksRef.current, {
          type: actualMimeType,
        });

        if (!blob.size) {
          setRecError("Audio yozilmadi. Qayta urinib ko'ring.");
          return;
        }

        if (audioUrlRef.current) {
          URL.revokeObjectURL(audioUrlRef.current);
        }

        const localUrl = URL.createObjectURL(blob);
        audioUrlRef.current = localUrl;
        setAudioUrl(localUrl);

        setBusy(true);

        try {
          const base64 = await blobToBase64(blob);

          const data = await api("/speaking/transcribe", {
            token,
            method: "POST",
            body: {
              audioBase64: base64,
              mimeType: actualMimeType,
              durationSeconds: durationRef.current,
            },
            timeoutMs: AI_TIMEOUT_MS,
          });

          onTranscribed?.(
            data.transcript || "",
            data.pronunciationNote || null
          );
        } catch (e) {
          setRecError(
            e.message || "Audio tahlilida xatolik yuz berdi."
          );
        } finally {
          setBusy(false);
        }
      };

      mediaRef.current = recorder;
      recorder.start(250);

      startedAtRef.current = Date.now();

      timerRef.current = setInterval(() => {
        const elapsed = Math.floor(
          (Date.now() - startedAtRef.current) / 1000
        );

        durationRef.current = elapsed;
        setDuration(elapsed);
      }, 250);

      setRecording(true);
    } catch (e) {
      cleanupStream();

      if (e?.name === "NotAllowedError") {
        setRecError(
          "Mikrofondan foydalanishga ruxsat berilmadi. Brauzer sozlamalarida mikrofonni yoqing."
        );
      } else if (e?.name === "NotFoundError") {
        setRecError("Mikrofon topilmadi.");
      } else if (e?.name === "NotReadableError") {
        setRecError(
          "Mikrofondan foydalanib bo'lmadi. U boshqa dastur tomonidan ishlatilayotgan bo'lishi mumkin."
        );
      } else {
        setRecError(
          "Mikrofonni ishga tushirishda xatolik yuz berdi."
        );
      }
    }
  }, [token, onTranscribed, cleanupStream]);

  const stop = useCallback(() => {
    const recorder = mediaRef.current;

    if (!recorder || recorder.state === "inactive") {
      return;
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    durationRef.current = Math.max(
      1,
      Math.floor((Date.now() - startedAtRef.current) / 1000)
    );
    setDuration(durationRef.current);

    recorder.stop();
    setRecording(false);
  }, []);

  useEffect(() => {
    return () => {
      cleanupStream();

      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = null;
      }
    };
  }, [cleanupStream]);

  return {
    recording,
    busy,
    recError,
    duration,
    audioUrl,
    start,
    stop,
  };
}

function MicButton({ token, onTranscribed }) {
  const {
    recording,
    busy,
    recError,
    duration,
    audioUrl,
    start,
    stop,
  } = useRecorder(token, onTranscribed);

  return (
    <div
      style={{
        marginBottom: 14,
        background: COLORS.surface,
        border: `1px solid ${COLORS.line}`,
        borderRadius: 12,
        padding: 14,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 10,
        }}
      >
        <div
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: 13,
            fontWeight: 700,
            color: COLORS.primary,
          }}
        >
          Speaking recording
        </div>

        {recording && (
          <div
            style={{
              fontFamily: "IBM Plex Mono, monospace",
              fontSize: 13,
              fontWeight: 600,
              color: COLORS.red,
            }}
          >
            🔴 {formatRecordingTime(duration)}
          </div>
        )}
      </div>

      <div
        style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
        }}
      >
        <button
          type="button"
          onClick={recording ? stop : start}
          disabled={busy}
          aria-label={
            recording
              ? "Stop recording"
              : "Start speaking recording"
          }
          style={{
            padding: "10px 16px",
            background: recording ? COLORS.red : COLORS.primary,
            color: "#fff",
            border: "none",
            borderRadius: 8,
            fontFamily: "Inter, sans-serif",
            fontWeight: 700,
            fontSize: 13,
            cursor: busy ? "default" : "pointer",
            opacity: busy ? 0.6 : 1,
          }}
        >
          {busy
            ? "⏳ Tahlil qilinmoqda..."
            : recording
            ? "⏹ To'xtatish"
            : "🎙 Yozishni boshlash"}
        </button>
      </div>

      {audioUrl && !recording && (
        <div style={{ marginTop: 12 }}>
          <audio
            controls
            src={audioUrl}
            style={{
              width: "100%",
              height: 40,
            }}
          />
        </div>
      )}

      {busy && (
        <div
          style={{
            marginTop: 10,
            fontFamily: "Inter, sans-serif",
            fontSize: 12,
            color: COLORS.textSoft,
            lineHeight: 1.5,
          }}
        >
          Ovozingiz matnga aylantirilmoqda va AI tahlili
          tayyorlanmoqda. Birinchi so'rovda server uyg'onishi
          sababli biroz ko'proq vaqt ketishi mumkin.
        </div>
      )}

      {recError && (
        <div
          role="alert"
          style={{
            marginTop: 10,
            fontFamily: "Inter, sans-serif",
            fontSize: 12,
            color: COLORS.red,
            lineHeight: 1.5,
          }}
        >
          {recError}
        </div>
      )}
    </div>
  );
}

function SpeakingModule({ token, onBack, onXpChange }) {
  const [topics, setTopics] = useState(null);
  const [topic, setTopic] = useState(null);
  const [stage, setStage] = useState("part1");
  const [answers, setAnswers] = useState({ part1: "", part2: "", part3: "" });
  const [pronunciationNotes, setPronunciationNotes] = useState({});
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (token === "demo-token") {
      setTopics([
        { id: "demo_speaking_1", theme: "Workplace Innovation & Digital Transformation" },
        { id: "demo_speaking_2", theme: "Global Business Negotiations & Culture" }
      ]);
      return;
    }
    api("/speaking/topics", { token }).then(setTopics).catch((e) => setError(e.message));
  }, [token]);

  async function pickTopic(t) {
    setError("");
    if (token === "demo-token") {
      setTopic({
        id: t.id,
        theme: t.theme,
        part1Questions: [
          "What kind of industry do you currently work in or study?",
          "How important is technology in your daily productivity?",
          "Do you prefer working individually or in collaborative teams?"
        ],
        part2: {
          cueCardTitle: "Describe an innovative project you participated in or heard about.",
          bulletPoints: [
            "what the project was about",
            "who was involved in it",
            "what challenges were encountered",
            "why you consider it successful"
          ]
        },
        part3Questions: [
          "How will artificial intelligence transform traditional business structures in the next decade?",
          "Should governments actively incentivize companies that develop green technologies?"
        ]
      });
      setStage("part1");
      setAnswers({ part1: "", part2: "", part3: "" });
      setPronunciationNotes({});
      setFeedback(null);
      return;
    }
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
    if (token === "demo-token") {
      setTimeout(() => {
        setFeedback("BALL: Band 8.0\n\nFluency & Coherence: 8.0\nLexical Resource: 8.0\nGrammar Accuracy: 8.0\nPronunciation: 8.0\n\nAjoyib nutq! Fikrlarni ifodalashda aniq va murakkab sintaksisdan samarali foydalanilgan.");
        setLoading(false);
        if (onXpChange) onXpChange();
      }, 1000);
      return;
    }
    try {
      const data = await api("/speaking/submit", {
        token,
        method: "POST",
        body: { topicId: topic.id, answers, pronunciationNotes },
        timeoutMs: AI_TIMEOUT_MS,
      });
      setFeedback(data.feedback);
      if (onXpChange) onXpChange();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const stageInfo = {
    part1: { label: "Part 1 — Introduction", questions: topic?.part1Questions },
    part2: { label: "Part 2 — Cue Card", cue: topic?.part2 },
    part3: { label: "Part 3 — Discussion", questions: topic?.part3Questions },
  };

  return (
    <div style={{ padding: 24, maxWidth: 720, margin: "0 auto" }}>
      <BackButton onBack={topic ? () => { setTopic(null); setFeedback(null); } : onBack} />
      <ModuleHeader moduleId="speaking" icon="🗣" title="Speaking (IELTS / Multilevel format)" />
      {error && <div style={{ color: COLORS.red, fontFamily: "Inter, sans-serif", fontSize: 14, marginBottom: 12 }}>{error}</div>}

      {!topic && topics && (
        <div>
          <div style={{ display: "grid", gap: 10 }}>
            {topics.map((t) => (
              <button
                key={t.id}
                onClick={() => pickTopic(t)}
                style={{ textAlign: "left", background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 10, padding: "16px", cursor: "pointer", fontFamily: "Inter, sans-serif", fontSize: 14, color: COLORS.text, boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}
              >
                <div style={{ fontWeight: 700, color: COLORS.primary, marginBottom: 4 }}>{t.theme}</div>
                <div style={{ fontSize: 12, color: COLORS.textSoft }}>Speaking testini boshlash →</div>
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
            <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 12, padding: 16, marginBottom: 14 }}>
              <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 16, fontWeight: 700, color: COLORS.primary, marginBottom: 8 }}>
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
            placeholder="Mikrofon orqali gapiring yoki javobingizni shu yerga yozing..."
            style={{ width: "100%", boxSizing: "border-box", padding: 12, borderRadius: 10, border: `1px solid ${COLORS.line}`, fontFamily: "Inter, sans-serif", fontSize: 14, marginBottom: 12 }}
          />

          {stage !== "part3" ? (
            <button
              onClick={next}
              disabled={answers[stage].trim().length < 5}
              style={{ padding: "10px 20px", background: COLORS.primary, color: "#fff", border: "none", borderRadius: 8, fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: 14, cursor: "pointer", opacity: answers[stage].trim().length < 5 ? 0.6 : 1 }}
            >
              Keyingi qism →
            </button>
          ) : (
            <button
              onClick={submit}
              disabled={loading || answers.part3.trim().length < 5}
              style={{ padding: "10px 20px", background: COLORS.primary, color: "#fff", border: "none", borderRadius: 8, fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: 14, cursor: loading ? "default" : "pointer", opacity: loading || answers.part3.trim().length < 5 ? 0.6 : 1 }}
            >
              {loading ? "AI baholamoqda..." : "Yakunlash va baholash"}
            </button>
          )}
        </div>
      )}

      {feedback && <FeedbackView feedback={feedback} />}
    </div>
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
    // ignore
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
        minHeight: 220,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        cursor: "pointer",
        userSelect: "none",
        boxShadow: "0 8px 24px rgba(20,25,50,0.06)",
        transition: "all 0.2s ease",
      }}
    >
      {!flipped ? (
        <>
          <Badge tone="soon">{word.level}</Badge>
          <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 32, fontWeight: 700, color: COLORS.text, marginTop: 14 }}>
            {word.term}
          </div>
          <div style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: COLORS.textSoft, marginTop: 12 }}>
            Tarjimasini ko'rish uchun bosing 👆
          </div>
        </>
      ) : (
        <>
          <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 26, fontWeight: 700, color: "#fff" }}>
            {word.translation}
          </div>
          <div style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: "rgba(255,255,255,0.9)", marginTop: 10, lineHeight: 1.5, maxWidth: 500 }}>
            {word.def}
          </div>
          <div style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "rgba(255,255,255,0.75)", marginTop: 12, fontStyle: "italic", maxWidth: 500 }}>
            "{word.example}"
          </div>
        </>
      )}
    </div>
  );
}

function VocabTopicPractice({ topic, progress, setProgress, onBack }) {
  const [level, setLevel] = useState("Barchasi");
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const topicWords = VOCAB_WORDS.filter((w) => w.topicId === topic.id);
  const words = level === "Barchasi" ? topicWords : topicWords.filter((w) => w.level === level);
  const currentWord = words[index % (words.length || 1)] || topicWords[0];
  const known = topicWords.filter((w) => progress[w.id] === "known").length;

  function mark(status) {
    if (!currentWord) return;
    const next = { ...progress, [currentWord.id]: status };
    setProgress(next);
    saveVocabProgress(next);
    setFlipped(false);
    setIndex((i) => (i + 1) % words.length);
  }

  function skip() {
    setFlipped(false);
    setIndex((i) => (i + 1) % (words.length || 1));
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
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
        <span style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 12, fontWeight: 600, color: COLORS.textSoft }}>
          {words.length > 0 ? (index % words.length) + 1 : 0} / {words.length} · Bilgan so'zlar: {known}/{topicWords.length}
        </span>
      </div>

      {currentWord && (
        <VocabFlashcard word={currentWord} flipped={flipped} onFlip={() => setFlipped((f) => !f)} />
      )}

      <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
        <button
          onClick={() => mark("unknown")}
          style={{ flex: 1, padding: "12px 0", background: "#FCEAE8", color: "#A8332B", border: "none", borderRadius: 10, fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 14, cursor: "pointer" }}
        >
          ❌ Bilmadim
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
    </div>
  );
}

function IeltsTopicDetail({ topic, onBack }) {
  const content = IELTS_CONTENT[topic.id];

  const renderBold = (text) => {
    if (!text) return null;
    const parts = text.split(/\*\*(.+?)\*\*/g);
    return parts.map((part, i) =>
      i % 2 === 1 ? (
        <b key={i} style={{ color: MODULE_COLORS.vocabulary.dark, background: MODULE_COLORS.vocabulary.bg, padding: "0 4px", borderRadius: 4 }}>{part}</b>
      ) : (
        <span key={i}>{part}</span>
      )
    );
  };

  return (
    <div>
      <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 16, padding: 22, marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <span style={{ fontSize: 28 }}>{topic.icon}</span>
          <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 20, fontWeight: 700, color: COLORS.primary }}>
            {topic.name}
          </div>
        </div>

        {/* COLLOCATIONS */}
        {content?.collocations && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, fontSize: 15, color: COLORS.text, marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
              <span>📚</span> Foydali so'z birikmalari (Collocations)
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 8 }}>
              {content.collocations.map((c, i) => (
                <div key={i} style={{ background: COLORS.bg, borderRadius: 10, padding: "10px 14px", borderLeft: `3px solid ${MODULE_COLORS.vocabulary.accent}` }}>
                  <div>
                    <span style={{ fontWeight: 700, color: MODULE_COLORS.vocabulary.dark }}>{c.phrase}</span>
                    <span style={{ color: COLORS.textSoft, marginLeft: 6, fontSize: 12.5 }}>({c.translation})</span>
                  </div>
                  <div style={{ color: COLORS.textSoft, fontSize: 12, marginTop: 3 }}>{c.def}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PART 1 */}
        {content?.part1 && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, fontSize: 12, color: "#fff", background: MODULE_COLORS.vocabulary.dark, display: "inline-block", padding: "4px 12px", borderRadius: 999, marginBottom: 12 }}>
              IELTS Speaking Part 1
            </div>
            {content.part1.map((qa, i) => (
              <div key={i} style={{ marginBottom: 14 }}>
                <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 13.5, color: COLORS.primary, marginBottom: 4 }}>
                  Examiner: {qa.q}
                </div>
                <div style={{ fontFamily: "Inter, sans-serif", fontSize: 13.5, lineHeight: 1.6, color: COLORS.text, fontStyle: "italic", paddingLeft: 12, borderLeft: `3px solid ${MODULE_COLORS.vocabulary.accent}` }}>
                  {renderBold(qa.a)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* PART 2 */}
        {content?.part2 && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, fontSize: 12, color: "#fff", background: MODULE_COLORS.vocabulary.dark, display: "inline-block", padding: "4px 12px", borderRadius: 999, marginBottom: 12 }}>
              IELTS Speaking Part 2
            </div>
            <div style={{ background: MODULE_COLORS.vocabulary.bg, borderRadius: 12, padding: "14px 16px", marginBottom: 12 }}>
              <b style={{ color: MODULE_COLORS.vocabulary.dark }}>{content.part2.cue}</b>
              <div style={{ color: COLORS.textSoft, marginTop: 6, fontSize: 13 }}>You should say:</div>
              <ul style={{ margin: "4px 0 4px 18px", padding: 0, color: COLORS.textSoft, fontSize: 13 }}>
                {content.part2.bullets.map((b, i) => <li key={i}>{b}</li>)}
              </ul>
            </div>
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: 13.5, lineHeight: 1.65, color: COLORS.text, fontStyle: "italic", paddingLeft: 12, borderLeft: `3px solid ${MODULE_COLORS.vocabulary.accent}` }}>
              {renderBold(content.part2.answer)}
            </div>
          </div>
        )}

        {/* PART 3 */}
        {content?.part3 && (
          <div>
            <div style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, fontSize: 12, color: "#fff", background: MODULE_COLORS.vocabulary.dark, display: "inline-block", padding: "4px 12px", borderRadius: 999, marginBottom: 12 }}>
              IELTS Speaking Part 3
            </div>
            {content.part3.map((qa, i) => (
              <div key={i} style={{ marginBottom: 14 }}>
                <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 13.5, color: COLORS.primary, marginBottom: 4 }}>
                  Examiner: {qa.q}
                </div>
                <div style={{ fontFamily: "Inter, sans-serif", fontSize: 13.5, lineHeight: 1.6, color: COLORS.text, fontStyle: "italic", paddingLeft: 12, borderLeft: `3px solid ${MODULE_COLORS.vocabulary.accent}` }}>
                  {renderBold(qa.a)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function VocabularyModule({ onBack }) {
  const [tab, setTab] = useState("business"); // business | ielts
  const [activeBusinessTopic, setActiveBusinessTopic] = useState(null);
  const [activeIeltsTopic, setActiveIeltsTopic] = useState(null);
  const [search, setSearch] = useState("");
  const [progress, setProgress] = useState(loadVocabProgress);

  const totalKnown = Object.values(progress).filter((v) => v === "known").length;

  const filteredIeltsTopics = IELTS_TOPICS.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.id.toLowerCase().includes(search.toLowerCase())
  );

  const currentTitle = activeBusinessTopic
    ? activeBusinessTopic.name
    : activeIeltsTopic
    ? activeIeltsTopic.name
    : "Vocabulary & IELTS";

  const handleBackAction = () => {
    if (activeBusinessTopic) setActiveBusinessTopic(null);
    else if (activeIeltsTopic) setActiveIeltsTopic(null);
    else onBack();
  };

  return (
    <div style={{ padding: 24, maxWidth: 780, margin: "0 auto" }}>
      <BackButton onBack={handleBackAction} />
      <ModuleHeader moduleId="vocabulary" icon="🗂" title={currentTitle} />

      {!activeBusinessTopic && !activeIeltsTopic && (
        <>
          {/* TAB SELECTOR */}
          <div style={{ display: "flex", gap: 10, marginBottom: 18, background: COLORS.surface, padding: 6, borderRadius: 12, border: `1px solid ${COLORS.line}` }}>
            <button
              onClick={() => setTab("business")}
              style={{
                flex: 1,
                padding: "10px 0",
                border: "none",
                borderRadius: 8,
                fontFamily: "Inter, sans-serif",
                fontWeight: 700,
                fontSize: 13.5,
                cursor: "pointer",
                background: tab === "business" ? COLORS.primary : "transparent",
                color: tab === "business" ? "#fff" : COLORS.textSoft,
                transition: "all 0.15s ease",
              }}
            >
              💼 Biznes Lug'at (600 so'z)
            </button>
            <button
              onClick={() => setTab("ielts")}
              style={{
                flex: 1,
                padding: "10px 0",
                border: "none",
                borderRadius: 8,
                fontFamily: "Inter, sans-serif",
                fontWeight: 700,
                fontSize: 13.5,
                cursor: "pointer",
                background: tab === "ielts" ? MODULE_COLORS.vocabulary.dark : "transparent",
                color: tab === "ielts" ? "#fff" : COLORS.textSoft,
                transition: "all 0.15s ease",
              }}
            >
              🗣 IELTS Speaking & Topik Lug'at (16 mavzu)
            </button>
          </div>

          {/* BUSINESS TAB */}
          {tab === "business" && (
            <div>
              <div style={{ background: MODULE_COLORS.vocabulary.bg, borderRadius: 14, padding: "14px 18px", marginBottom: 18, fontFamily: "Inter, sans-serif", fontSize: 13, color: MODULE_COLORS.vocabulary.dark }}>
                20 ta biznes mavzusi, jami {VOCAB_WORDS.length} ta so'z (A1–C2). Jami bilgan so'zlaringiz: <b>{totalKnown}</b>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
                {VOCAB_TOPICS.map((t) => {
                  const topicWords = VOCAB_WORDS.filter((w) => w.topicId === t.id);
                  const known = topicWords.filter((w) => progress[w.id] === "known").length;
                  const pct = topicWords.length ? Math.round((known / topicWords.length) * 100) : 0;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setActiveBusinessTopic(t)}
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
                          {t.icon}
                        </div>
                        <span style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 11, fontWeight: 600, color: COLORS.textSoft }}>{topicWords.length} so'z</span>
                      </div>
                      <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 15, fontWeight: 700, color: COLORS.text }}>{t.name}</div>
                      <div style={{ background: COLORS.bg, borderRadius: 999, height: 6, overflow: "hidden" }}>
                        <div style={{ width: `${pct}%`, height: "100%", background: MODULE_COLORS.vocabulary.accent, borderRadius: 999 }} />
                      </div>
                      <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: COLORS.textSoft }}>{known}/{topicWords.length} bilaman deb belgilangan</div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* IELTS TAB */}
          {tab === "ielts" && (
            <div>
              <input
                type="text"
                placeholder="Mavzular bo'yicha qidirish (masalan: oila, texnologiya, sayohat)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "12px 14px",
                  borderRadius: 12,
                  border: `1.5px solid ${COLORS.line}`,
                  fontFamily: "Inter, sans-serif",
                  fontSize: 14,
                  marginBottom: 16,
                }}
              />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
                {filteredIeltsTopics.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveIeltsTopic(t)}
                    style={{
                      textAlign: "left",
                      background: COLORS.surface,
                      border: `1px solid ${COLORS.line}`,
                      borderLeft: `4px solid ${MODULE_COLORS.speaking.accent}`,
                      borderRadius: 14,
                      padding: "16px",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                      boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: MODULE_COLORS.speaking.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
                        {t.icon}
                      </div>
                      <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, color: MODULE_COLORS.speaking.dark }}>IELTS Band 7.5+</span>
                    </div>
                    <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 15, fontWeight: 700, color: COLORS.text }}>{t.name}</div>
                    <div style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: COLORS.textSoft }}>Collocations + Part 1, 2, 3 Namunalar →</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {activeBusinessTopic && (
        <VocabTopicPractice topic={activeBusinessTopic} progress={progress} setProgress={setProgress} onBack={() => setActiveBusinessTopic(null)} />
      )}

      {activeIeltsTopic && (
        <IeltsTopicDetail topic={activeIeltsTopic} onBack={() => setActiveIeltsTopic(null)} />
      )}
    </div>
  );
}


const READING_VARIANTS = [
  { id: 1, name: "Urban Mobility", topics: ["public transport", "cycling", "city planning"] },
  { id: 2, name: "Workplace Change", topics: ["hybrid work", "office design", "productivity"] },
  { id: 3, name: "Water and Cities", topics: ["water management", "climate", "infrastructure"] },
  { id: 4, name: "Food Systems", topics: ["local food", "supply chains", "waste reduction"] },
  { id: 5, name: "Learning and Memory", topics: ["learning science", "memory", "study habits"] },
  { id: 6, name: "Renewable Energy", topics: ["solar power", "energy storage", "grids"] },
  { id: 7, name: "Small Business", topics: ["entrepreneurship", "finance", "customer service"] },
  { id: 8, name: "Technology and Society", topics: ["digital tools", "privacy", "automation"] },
  { id: 9, name: "Tourism and Heritage", topics: ["tourism", "heritage", "local economies"] },
  { id: 10, name: "Healthy Cities", topics: ["public health", "green space", "walking"] },
  { id: 11, name: "Agriculture", topics: ["soil", "irrigation", "farm technology"] },
  { id: 12, name: "Business Communication", topics: ["meetings", "negotiation", "remote teams"] },
  { id: 13, name: "Science in Everyday Life", topics: ["materials", "measurement", "research"] },
  { id: 14, name: "Transport Futures", topics: ["rail", "electric vehicles", "logistics"] },
  { id: 15, name: "Creative Industries", topics: ["design", "media", "creative business"] },
];

const READING_STYLE_BANK = [
  {
    intro: "Researchers and local authorities have increasingly treated the issue as a practical design problem rather than a single policy choice.",
    detail: "The most successful programmes usually combine several small interventions instead of relying on one expensive project.",
    evidence: "Early measurements are useful, but the strongest conclusions often appear only after several months of observation.",
    contrast: "However, a solution that works in one neighbourhood cannot automatically be transferred to another because local conditions differ.",
    future: "The next stage is therefore likely to focus on flexible systems that can be adjusted as new evidence becomes available.",
  },
  {
    intro: "The debate has changed considerably as organisations have collected more evidence about how people actually behave.",
    detail: "Initial expectations were often based on simple assumptions, while later studies revealed a more complicated pattern.",
    evidence: "Several independent projects reported improvements when participants received clear information and practical support.",
    contrast: "The evidence does not mean that the approach is universally effective; cost, timing and local capacity still matter.",
    future: "For that reason, specialists now recommend testing a policy on a limited scale before expanding it.",
  },
  {
    intro: "What appears to be a modern challenge often has earlier precedents, although the tools available today are different.",
    detail: "Historical records show that communities repeatedly adapted their systems when resources or social expectations changed.",
    evidence: "Modern monitoring makes those changes easier to compare because researchers can collect information at much shorter intervals.",
    contrast: "Yet better data do not remove the need for judgement, particularly when decisions affect groups with different priorities.",
    future: "A balanced approach is likely to combine quantitative evidence with direct feedback from the people who use the system.",
  },
];

function readingSeedFor(variantNo, partNo) {
  const variant = READING_VARIANTS[(variantNo - 1) % READING_VARIANTS.length];
  const topic = variant.topics[(partNo - 1) % variant.topics.length];
  return { variant, topic, style: READING_STYLE_BANK[(variantNo + partNo) % READING_STYLE_BANK.length] };
}

function makeReadingParagraphs(variantNo, partNo, mode) {
  const { variant, topic, style } = readingSeedFor(variantNo, partNo);
  const levelText =
    mode === "multilevel"
      ? "The text is written for a broad professional and academic audience and gradually increases in complexity."
      : "The text uses a more academic style, combining description, evidence, interpretation and a short discussion of limitations.";

  const facts = [
    `${variant.name} researchers began examining ${topic} after a series of practical changes affected local organisations.`,
    `One early project focused on a relatively small group and measured behaviour before and after the intervention.`,
    `The project found that clear instructions were more useful when they were combined with convenient access to the new system.`,
    `A second study compared two locations and found that the results depended partly on geography, cost and existing infrastructure.`,
    `The researchers also noted an unexpected effect: participants changed some related behaviours even when those behaviours were not part of the original plan.`,
    `Supporters argue that the approach can be expanded, while critics point to staffing, maintenance and unequal access as continuing problems.`,
    `The authors conclude that future decisions should be based on repeated measurement rather than a single successful demonstration.`,
  ];

  const paragraphs = [
    `A. ${style.intro} In the case of ${variant.name.toLowerCase()}, the question is particularly relevant because ${topic} affects both institutions and ordinary users. ${levelText}`,
    `B. ${style.detail} ${facts[0]} The first stage was deliberately modest, allowing the organisers to identify practical difficulties without committing a large budget.`,
    `C. ${style.evidence} ${facts[1]} ${facts[2]} This result was important because it suggested that information alone was not enough to change behaviour.`,
    `D. ${facts[3]} ${style.contrast} The comparison also showed why a successful pilot should not be treated as proof that exactly the same intervention will work everywhere.`,
    `E. ${facts[4]} Researchers described this as a secondary effect. It was not necessarily negative, but it made the evaluation more difficult because several variables changed at once.`,
    `F. ${facts[5]} The debate therefore moved away from a simple question of whether the idea was good or bad and towards questions of cost, access, implementation and measurement.`,
    `G. ${style.future} ${facts[6]} The authors recommend keeping the core principle while allowing local managers to adapt the details.`,
  ];

  return { paragraphs, facts, topic, variant };
}

function makeSectionQuestions(variantNo, partNo, mode) {
  const { paragraphs, facts, topic, variant } = makeReadingParagraphs(variantNo, partNo, mode);
  const base = `${variantNo}-${partNo}`;

  const questions = [
    {
      id: `${base}-1`,
      type: "mcq",
      prompt: `What was the main reason researchers began examining ${topic}?`,
      options: [
        "A series of practical changes had affected local organisations.",
        "A new international law had been introduced.",
        "The researchers wanted to replace all existing systems.",
        "The project received an unlimited budget.",
      ],
      answer: "A series of practical changes had affected local organisations.",
      explanation: "The opening paragraph says the research followed practical changes affecting organisations.",
    },
    {
      id: `${base}-2`,
      type: "mcq",
      prompt: "What was a feature of the first project?",
      options: [
        "It began with a small group.",
        "It lasted for twenty years.",
        "It involved only national governments.",
        "It avoided measuring behaviour.",
      ],
      answer: "It began with a small group.",
      explanation: "Paragraph B describes the first stage as deliberately modest and focused on a relatively small group.",
    },
    {
      id: `${base}-3`,
      type: "mcq",
      prompt: "What did the first study suggest about instructions?",
      options: [
        "Instructions were most useful when practical access was also available.",
        "Instructions were unnecessary.",
        "Instructions should be given only after a project ends.",
        "Instructions were more important than infrastructure in every location.",
      ],
      answer: "Instructions were most useful when practical access was also available.",
      explanation: "Paragraph C says clear instructions worked better when combined with convenient access.",
    },
    {
      id: `${base}-4`,
      type: "tfng",
      prompt: "The second study found exactly the same results in both locations.",
      options: ["TRUE", "FALSE", "NOT GIVEN"],
      answer: "FALSE",
      explanation: "Paragraph D says the results depended partly on geography, cost and infrastructure.",
    },
    {
      id: `${base}-5`,
      type: "tfng",
      prompt: "Researchers observed changes in some behaviours that were not part of the original plan.",
      options: ["TRUE", "FALSE", "NOT GIVEN"],
      answer: "TRUE",
      explanation: "Paragraph E explicitly describes these secondary effects.",
    },
    {
      id: `${base}-6`,
      type: "short",
      prompt: "Complete the sentence with NO MORE THAN TWO WORDS: The first project was deliberately ______.",
      answer: "modest",
      accepted: ["modest"],
      explanation: "Paragraph B uses the phrase 'deliberately modest'.",
    },
    {
      id: `${base}-7`,
      type: "short",
      prompt: "Complete the sentence with NO MORE THAN TWO WORDS: Future decisions should be based on repeated ______.",
      answer: "measurement",
      accepted: ["measurement", "measurements"],
      explanation: "The final paragraph recommends repeated measurement.",
    },
  ];

  if (mode === "ielts") {
    questions[3] = {
      id: `${base}-4`,
      type: "tfng",
      prompt: "The authors believe that a successful pilot can always be transferred unchanged to another location.",
      options: ["TRUE", "FALSE", "NOT GIVEN"],
      answer: "FALSE",
      explanation: "Paragraph D says local conditions mean a successful pilot cannot automatically be transferred.",
    };
    questions[4] = {
      id: `${base}-5`,
      type: "tfng",
      prompt: "The secondary effects made evaluation more complicated.",
      options: ["TRUE", "FALSE", "NOT GIVEN"],
      answer: "TRUE",
      explanation: "Paragraph E says several variables changed at once, making evaluation more difficult.",
    };
  }

  return { paragraphs, questions, topic, variant };
}

function buildMultilevelVariant(variantNo) {
  // ================================================================
  // UZBEKISTAN NATIONAL MULTILEVEL READING
  // Based directly on the user-provided BAGDAD 2024 sample.
  // 5 parts / 35 questions / 60 minutes.
  // IELTS Reading is deliberately NOT modified here.
  // ================================================================

  if (variantNo === 1) {
    const part1Text = [
      'The 1984 movie "Purple Rain" is going to be made into a musical on Broadway, New York. The film was based on the album of the same name made by the artist Prince. He also starred in it. This should encourage people to go to see the musical version.',
      'The producers of the new musical are excited about their project. They said: "It\'s been 40 years since Prince\'s legendary film took the world by storm. We can\'t think of a more fitting tribute to honour Prince and his legacy than with this stage adaptation of the beloved story." They added: "We can\'t wait for a new generation to discover Purple Rain and to experience its power once again, this time live."',
      'Purple Rain the movie won an Academy Award for Best Original Song Score. Many critics believe Purple Rain is one of the greatest musical films. Purple Rain the album spent 24 consecutive weeks at number one in the USA\'s Billboard 200 music chart. It spent a total of 167 weeks on that chart. It contains the smash hit When Doves Cry.',
      'The movie is about an aspiring singer and guitarist who was trying to become famous. The story shows his complicated home life, his battles with musical rivals, and a new romance. Prince died in 2016 from an overdose of painkiller drugs. He sold over 100 million records worldwide. This makes him one of the best-selling music artists of all time.'
    ];

    const part2Options = {
      A: 'Oceans Unseen — Explore coral reefs, whales and the scientists protecting the fragile marine ecosystem.',
      B: 'Double Cross — A heart-pounding action story with explosive chases, double-crossings and shocking revelations.',
      C: 'Island Escape: Paradise of Panic? — Strangers are placed on a remote tropical island and must build alliances and overcome obstacles.',
      D: 'Comedy Cocktail Hour — Back-to-back stand-up specials with quick jokes, observations and guaranteed laughs.',
      E: 'Future Tech Summit — Live coverage of a major technology conference with industry leaders and new prototypes.',
      F: 'Lost Temples of the Maya — An archaeological journey into the mysteries of a legendary ancient civilisation.',
      G: 'Global Groove Live — International performers from Senegal, Japan and Spain in a variety of musical styles.',
      H: 'Craft Masterclass! — A hands-on ceramic workshop covering wheel throwing, hand-building and glazing.',
      I: 'The Spice Trail — A chef explores Moroccan spice markets and demonstrates traditional dishes and cooking tips.',
      J: 'Morning Move — A high-energy workout combining cardio and core-strengthening exercises.'
    };

    const part3Headings = [
      'A) Not identifying the correct priorities',
      'B) A solution for the long term',
      'C) The difficulty of changing your mind',
      'D) The need for more effective risk assessment',
      'E) The power of the first number',
      'F) A successful approach to the study of decision-making',
      'G) The danger of trusting a global market',
      'H) Reluctance to go beyond the familiar'
    ];

    const part3Paragraphs = [
      'People make terrible decisions about the future. The evidence is all around, from their investments in the stock markets to the way they run their businesses. In fact, people are consistently bad at dealing with uncertainty, underestimating some kinds of risk and overestimating others. Surely there must be a better way than using intuition?',
      'In the 1960s a young American research psychologist, Daniel Kahneman, became interested in people\'s inability to make logical decisions. That launched him on a career to show just how irrationally people behave in practice. When Kahneman and his colleagues first started work, the idea of applying psychological insights to economics and business decisions was seen as rather bizarre. But in the past decade the fields of behavioural finance and behavioural economics have blossomed, and in 2002 Kahneman shared a Nobel prize in economics for his work. Today he is in demand by business organizations and international banking companies. But, he says, there are plenty of institutions that still fail to understand the roots of their poor decisions. He claims that, far from being random, these mistakes are systematic and predictable.',
      'Another source of wrong decisions is related to the decisive effect of the initial meeting, particularly in negotiations over money. This is referred to as the anchor effect. Once a figure has been mentioned, it takes a strange hold over the human mind. The asking price quoted in a house sale, for example, tends to become accepted by all parties as the anchor around which negotiations take place. Much the same goes for salary negotiations or mergers and acquisitions. If nobody has much information to go on, a figure can provide comfort - even though it may lead to a terrible mistake.',
      'In addition, mistakes may arise due to stubbornness. No one likes to abandon a cherished belief, and the earlier a decision has been taken, the harder it is to abandon it. Drug companies must decide early to cancel a failing research project to avoid wasting money, but may find it difficult to admit they have made a mistake. In the same way, analysts may have become wedded early to a single explanation that coloured their perception. A fresh eye always helps.',
      'People also tend to put a lot of emphasis on things they have seen and experienced themselves, which may not be the best guide to decision-making. For example, somebody may buy an overvalued share because a relative has made thousands on it, only to get his fingers burned. In finance, too much emphasis on information close at hand helps to explain the tendency by most investors to invest only within the country they live in. Even though they know that diversification is good for their portfolio, a large majority of both Americans and Europeans invest far too heavily in the shares of their home countries. They would be much better off spreading their risks more widely.',
      'More information is helpful in making any decision but, says Kahneman, people spend proportionally too much time on small decisions and not enough on big ones. They need to adjust the balance. During the boom years, some companies put as much effort into planning their office party as into considering strategic mergers.'
    ];

    const part4Passage = [
      'Since the theory of UG was proposed, linguists have identified many universal language rules. However, there are almost always exceptions. It was once believed, for example, that if a language had syllables that begin with a vowel and end with a consonant (VC), it would also have syllables that begin with a consonant and end with a vowel (CV). This universal lasted until 1999, when linguists showed that Arrernte, spoken by Indigenous Australians from the area around Alice Springs in the Northern Territory, has VC syllables but no CV syllables.',
      'Other non-universal universals describe the basic rules of putting words together. Take the rule that every language contains four basic word classes: nouns, verbs, adjectives and adverbs. Work in the past two decades has shown that several languages lack an open adverb class, which means that new adverbs cannot be readily formed, unlike in English where you can turn any adjective into an adverb, for example soft into softly. Others, such as Lao, spoken in Laos, have no adjectives at all. More controversially, some linguists argue that a few languages, such as Straits Salish, spoken by indigenous people from north-western regions of North America, do not even have distinct nouns or verbs. Instead, they have a single class of words to include events, objects and qualities.',
      'Even apparently indisputable universals have been found lacking. This includes recursion, or the ability to infinitely place one grammatical unit inside a similar unit, such as Jack thinks that Mary thinks that ... the bus will be on time. It is widely considered to be the most essential characteristic of human language, one that sets it apart from the communications of all other animals. Yet Dan Everett at Illinois State University recently published controversial work showing that Amazonian Piraha does not have this quality.',
      'But what if the very diversity of languages is the key to understanding human communication? Linguists Nicholas Evans of the Australian National University in Canberra, and Stephen Levinson of the Max Planck Institute for Psycholinguistics in Nijmegen, the Netherlands, believe that languages do not share a common set of rules. Instead, they say, their sheer variety is a defining feature of human communication - something not seen in other animals. While there is no doubt that human thinking influences the form that language takes, language in turn may shape our brains. This suggests that humans are more diverse than we thought, with our brains having differences depending on the language environment in which we grew up. And that leads to a disturbing conclusion: every time a language becomes extinct, humanity loses an important piece of diversity.',
      'If languages do not obey a single set of shared rules, then how are they created? Instead of universals, you get standard engineering solutions that languages adopt again and again, and then you get outliers, says Evans. He and Levinson argue that this is because any given language is a complex system shaped by many factors, including culture, genetics and history. There are no absolutely universal traits of language, they say, only tendencies. And it is a mix of strong and weak tendencies that characterises the bio-cultural mix that we call language.',
      'According to the two linguists, the strong tendencies explain why many languages display common patterns. A variety of factors tend to push language in a similar direction, such as the structure of the brain, the biology of speech, and the efficiencies of communication. Widely shared linguistic elements may also be ones that build on a particularly human kind of reasoning. For example, the fact that before we learn to speak we perceive the world as a place full of things causing actions (agents) and things having actions done to them (patients) explains why most languages deploy these grammatical categories.',
      'Weak tendencies, in contrast, are explained by the idiosyncrasies of different languages. Evans and Levinson argue that many aspects of the particular natural history of a population may affect its language. For instance, Andy Butcher at Flinders University in Adelaide, South Australia, has observed that indigenous Australian children have by far the highest incidence of chronic middle-ear infection of any population on the planet, and that most indigenous Australian languages lack many sounds that are common in other languages, but which are hard to hear with a middle-ear infection. Whether this condition has shaped the sound systems of these languages is unknown, says Evans, but it is important to consider the idea.',
      'Levinson and Evans are not the first to question the theory of universal grammar, but no one has summarised these ideas quite as persuasively, and given them as much reach. As a result, their arguments have generated widespread enthusiasm, particularly among those linguists who are tired of trying to squeeze their findings into the straitjacket of absolute universals. To some, it is the final nail in UG\'s coffin.'
    ];

    const part5Passage = [
      'Although it was called tiger, it looked like a dog with black stripes on its back and it was the largest known carnivorous marsupial of modern times. Yet, despite its fame for being one of the most fabled animals in the world, it is one of the least understood of Tasmania\'s native animals. The scientific name for the Tasmanian tiger is Thylacine and it is believed that they have become extinct in the 20th century.',
      'Fossils of thylacines dating from about almost 12 million years ago have been dug up at various places in Victoria, South Australia and Western Australia. They were widespread in Australia 7,000 years ago, but have probably been extinct on the continent for 2,000 years. This is believed to be because of the introduction of dingoes around 8,000 years ago. Because of disease, thylacine numbers may have been declining in Tasmania at the time of European settlement 200 years ago, but the decline was certainly accelerated by the new arrivals. The last known Tasmanian Tiger died in Hobart Zoo in 1936 and the animal is officially classified as extinct. Technically, this means that it has not been officially sighted in the wild or captivity for 50 years. However, there are still unsubstantiated sightings.',
      'Hans Naarding, whose study of animals had taken him around the world, was conducting a survey of a species of endangered migratory bird. The sighting he saw that night is now regarded as the most credible sighting recorded of thylacine that many believe has been extinct for more than 70 years.',
      'I had to work at night. I was in the habit of intermittently shining a spotlight around. The beam fell on an animal in front of the vehicle, less than 10m away. Instead of risking movement by grabbing for a camera, I decided to register very carefully what I was seeing. The animal was about the size of a small shepherd dog, a very healthy male in prime condition. What set it apart from a dog, though, was a slightly sloping hindquarter, with a fairly thick tail being a straight continuation of the backline of the animal. It had 12 distinct stripes on its back, continuing onto its butt. I knew perfectly well what I was seeing. As soon as I reached for the camera, it disappeared into the tea-tree undergrowth and scrub.',
      'The director of Tasmania\'s National Parks at the time, Peter Morrow, decided to keep Naarding\'s sighting of the thylacine secret for two years. When the news finally broke, it was accompanied by pandemonium. Television crews arrived from Japan, the United Kingdom, Germany, New Zealand and South America.',
      'Government and private search parties combed the region, but no further sightings were made. The tiger, as always, had escaped to its lair, a place many insist exists only in our imagination. But since then, the thylacine has staged something of a comeback, becoming part of Australian mythology.',
      'There have been more than 4,000 claimed sightings of the beast since it supposedly died out, and the average claims each year reported to authorities now number 150. Associate professor of zoology at the University of Tasmania, Randolph Rose, has said he dreams of seeing a thylacine. But Rose, who in his 35 years in Tasmanian academia has fielded countless reports of thylacine sightings, is now convinced that his dream will go unfulfilled.',
      'The consensus among conservationists is that usually any animal with a population base of less than 1,000 is headed for extinction within 60 years, says Rose. Sixty years ago, there was only one thylacine that we know of, and that was in Hobart Zoo.',
      'Dr. David Pemberton, curator of zoology at the Tasmanian Museum and Art Gallery, whose PhD thesis was on the thylacine, says that despite scientific thinking that 500 animals are required to sustain a population, the Florida panther is down to a dozen or so animals and, while it does have some inbreeding problems, is still ticking along. I\'ll take a punt and say that, if we manage to find a thylacine in the scrub, it means that there are 50-plus animals out there.',
      'After all, animals can be notoriously elusive. The strange fish known as the coelacanth, with its proto-legs, was thought to have died out along with the dinosaurs 70 million years ago until a specimen was dragged to the surface in a shark net off the south-east coast of South Africa in 1938.',
      'Wildlife biologist Nick Mooney has the unenviable task of investigating all sightings of the tiger totaling 4,000 since the mid-1980s, and averaging about 150 a year. It was Mooney who was first consulted about the authenticity of digital photographic images purportedly taken by a German tourist while on a recent bushwalk in the state. On face value, Mooney says, the account of the sighting, and the two photographs submitted as the proof amount to one of the most convincing cases for the species\' survival he has seen.'
    ];

    const makeQ = (id, type, prompt, options, answer, accepted = []) => ({
      id, type, prompt, ...(options ? { options } : {}), answer, ...(accepted.length ? { accepted } : {}),
      explanation: 'Answer is determined from the information provided in the test text.'
    });

    return {
      id: 1,
      title: 'Multilevel Reading — Variant 01',
      mode: 'multilevel',
      duration: 60 * 60,
      totalQuestions: 35,
      sections: [
        {
          id: 'ml-1-part-1',
          title: 'Part 1',
          subtitle: 'Read the text. Fill in each gap with ONE word.',
          instruction: 'You must use a word which is somewhere in the rest of the text.',
          // IMPORTANT: Part 1 is a true exam-style gap-fill.
          // The blanks live INSIDE the reading text; answers 1–6 are entered
          // separately in the answer panel.
          passage: [
            'The 1984 movie "Purple Rain" is going to be made into a musical on Broadway, New York. The film was based on the album of the same name (1) __________ by the artist Prince. He also starred in it. This should encourage people to go to see the (2) __________ version.',
            'The producers of the new musical are excited about their project. They said: "It\'s been 40 years since Prince\'s legendary film took the world by storm. We can\'t think of a more fitting tribute to honour Prince and his legacy than with this stage adaptation of the beloved story." They added: "We can\'t wait for a new generation to discover Purple Rain and to experience its power once again, this time live."',
            '"Purple Rain" the movie won an Academy Award for Best Original Song Score. Many critics believe "Purple Rain" is one of the greatest musical (3) __________. "Purple Rain" the album spent 24 consecutive weeks at number one in the USA\'s Billboard 200 music chart. It spent a total of 167 (4) __________ on that chart. It contains the smash hit "When Doves Cry".',
            'The movie is about an aspiring singer and guitarist who was trying to become famous. The story shows (5) __________ complicated home life, his battles with musical rivals, and a new romance. Prince died in 2016 from an overdose of painkiller drugs. He sold over 100 million records worldwide. This makes him one of the best-selling music (6) __________ of all time.'
          ],
          questions: [
            makeQ('ml-1-1-1', 'short', '1', null, 'made', ['made']),
            makeQ('ml-1-1-2', 'short', '2', null, 'musical', ['musical']),
            makeQ('ml-1-1-3', 'short', '3', null, 'films', ['films']),
            makeQ('ml-1-1-4', 'short', '4', null, 'weeks', ['weeks']),
            makeQ('ml-1-1-5', 'short', '5', null, 'his', ['his']),
            makeQ('ml-1-1-6', 'short', '6', null, 'artists', ['artists'])
          ]
        },
        {
          id: 'ml-1-part-2',
          title: 'Part 2',
          subtitle: 'Read the texts 7–14 and the statements A–J. Decide which text matches each situation.',
          instruction: 'Each statement can be used ONCE only. There are TWO extra statements which you do not need to use.',
          passage: Object.entries(part2Options).map(([letter, text]) => `${letter}. ${text}`),
          questions: [
            makeQ('ml-1-2-7', 'matching', '7. Jack and Sarah, a young couple, want a light-hearted escape after a stressful week. They enjoy shows with humor and witty banter.', Object.keys(part2Options), 'D'),
            makeQ('ml-1-2-8', 'matching', '8. Emily loves documentaries that transport her to the past. She is especially interested in exotic and distant past cultures.', Object.keys(part2Options), 'F'),
            makeQ('ml-1-2-9', 'matching', '9. Tom craves adrenaline-pumping action and suspense.', Object.keys(part2Options), 'B'),
            makeQ('ml-1-2-10', 'matching', '10. Marie wants a relaxing escape into the beauty of the natural world. She enjoys documentaries about life, animals and their preservation.', Object.keys(part2Options), 'A'),
            makeQ('ml-1-2-11', 'matching', '11. John, a music lover, wants to be captivated by talented performers and enjoys shows with diverse genres.', Object.keys(part2Options), 'G'),
            makeQ('ml-1-2-12', 'matching', '12. Olivia wants to learn new recipes and be inspired by culinary experts.', Object.keys(part2Options), 'I'),
            makeQ('ml-1-2-13', 'matching', '13. David wants to stay informed about the modern world.', Object.keys(part2Options), 'E'),
            makeQ('ml-1-2-14', 'matching', '14. Liam wants to be inspired by artistic expression and discover new hobbies.', Object.keys(part2Options), 'H')
          ]
        },
        {
          id: 'ml-1-part-3',
          title: 'Part 3',
          subtitle: 'Read the text and choose the correct heading for each paragraph.',
          instruction: 'There are more headings than paragraphs, so you will not use all of them. You cannot use any heading more than once.',
          passage: part3Paragraphs.map((p, i) => `Paragraph ${['I','II','III','IV','V','VI'][i]}\n${p}`),
          questions: [
            makeQ('ml-1-3-15', 'matching', '15. Paragraph I', part3Headings, 'D) The need for more effective risk assessment'),
            makeQ('ml-1-3-16', 'matching', '16. Paragraph II', part3Headings, 'F) A successful approach to the study of decision-making'),
            makeQ('ml-1-3-17', 'matching', '17. Paragraph III', part3Headings, 'E) The power of the first number'),
            makeQ('ml-1-3-18', 'matching', '18. Paragraph IV', part3Headings, 'C) The difficulty of changing your mind'),
            makeQ('ml-1-3-19', 'matching', '19. Paragraph V', part3Headings, 'H) Reluctance to go beyond the familiar'),
            makeQ('ml-1-3-20', 'matching', '20. Paragraph VI', part3Headings, 'A) Not identifying the correct priorities')
          ]
        },
        {
          id: 'ml-1-part-4',
          title: 'Part 4',
          subtitle: 'Read the following text for questions 21–29.',
          instruction: 'For questions 21–24 choose A, B, C or D. For questions 25–29 decide if the statements are True, False or No Information.',
          passage: part4Passage,
          questions: [
            makeQ('ml-1-4-21', 'mcq', '21. Which of the following views about language are held by Evans and Levinson?', ['A) Each of the world’s languages develops independently.','B) The differences between languages outweigh the similarities.','C) Only a few language features are universal.','D) Each language is influenced by the characteristics of other languages.'], 'A) Each of the world’s languages develops independently.'),
            makeQ('ml-1-4-22', 'mcq', '22. According to Evans and Levinson, apparent similarities between languages could be due to', ['A) close social contact.','B) faulty analysis.','C) shared modes of perception.','D) narrow descriptive systems.'], 'C) shared modes of perception.'),
            makeQ('ml-1-4-23', 'mcq', '23. In the seventh paragraph, what does the reference to a middle-ear infection serve as?', ['A) A justification for something.','B) A contrast with something.','C) The possible cause of something.','D) The likely result of something.'], 'C) The possible cause of something.'),
            makeQ('ml-1-4-24', 'mcq', '24. What does the writer suggest about Evans’ and Levinson’s theory of language development?', ['A) It had not been previously considered.','B) It is presented in a convincing way.','C) It has been largely rejected by other linguists.','D) It is not supported by the evidence.'], 'B) It is presented in a convincing way.'),
            makeQ('ml-1-4-25', 'tfng', '25. The majority of UG rules proposed by linguists do apply to all human languages.', ['A) True','B) False','C) No Information'], 'B) False'),
            makeQ('ml-1-4-26', 'tfng', '26. There is disagreement amongst linguists about an aspect of Straits Salish grammar.', ['A) True','B) False','C) No Information'], 'A) True'),
            makeQ('ml-1-4-27', 'tfng', '27. The search for new universal language rules has largely ended.', ['A) True','B) False','C) No Information'], 'C) No Information'),
            makeQ('ml-1-4-28', 'tfng', '28. If Evans and Levinson are right, people develop in the same way no matter what language they speak.', ['A) True','B) False','C) No Information'], 'B) False'),
            makeQ('ml-1-4-29', 'tfng', '29. The loss of any single language might have implications for the human race.', ['A) True','B) False','C) No Information'], 'A) True')
          ]
        },
        {
          id: 'ml-1-part-5',
          title: 'Part 5',
          subtitle: 'Read the following text for questions 30–35.',
          instruction: 'For questions 30–33 write NO MORE THAN ONE WORD and/or A NUMBER. For questions 34–35 choose A, B, C or D.',
          passage: part5Passage,
          questions: [
            makeQ('ml-1-5-30', 'short', '30. The Tasmanian tiger, also called thylacine, resembles the look of a dog and has black ______ on its fur coat.', null, 'stripes', ['stripes']),
            makeQ('ml-1-5-31', 'short', '31. Many fossils have been found, showing that thylacines had existed as early as ______ years ago.', null, '12 million', ['12 million']),
            makeQ('ml-1-5-32', 'short', '32. They lived throughout ______ before disappearing from the mainland.', null, 'Australia', ['Australia']),
            makeQ('ml-1-5-33', 'short', '33. Soon after the ______ settlers arrived, the size of the thylacine population in Tasmania shrunk at a higher speed.', null, 'European', ['European']),
            makeQ('ml-1-5-34', 'mcq', '34. Which of the following statements is true of thylacine?', ['A) So far, there has been thousands of the sightings of the creature','B) They were thought to have gone extinct but it was proved that this wasn’t true','C) They were always a myth','D) They aren’t easy to catch but they can be found eventually'], 'A) So far, there has been thousands of the sightings of the creature'),
            makeQ('ml-1-5-35', 'mcq', '35. In this passage, Dr. David Pemberton believes that …', ['A) We may not see thylacine again in the future as its population went extinct years ago.','B) It doesn’t require a certain number of animals to ensure the survival of a species.','C) The government should spend more to rediscover the species.','D) The Florida panther were also long thought to be extinct but they may have survived.'], 'B) It doesn’t require a certain number of animals to ensure the survival of a species.')
          ]
        }
      ]
    };
  }

  // Variants 02–15 keep the same official five-part / 35-question engine.
  // Their editorial passages can be replaced by independently authored banks
  // without changing the UI, timer, navigation, scoring or IELTS module.
  const generated = makeSectionQuestions(variantNo, 1, 'multilevel');
  const seed = generated;
  const fallbackQuestions = [];
  for (let i = 0; i < 35; i++) {
    const q = seed.questions[i % seed.questions.length];
    fallbackQuestions.push({ ...q, id: `ml-${variantNo}-fallback-${i + 1}` });
  }

  const sections = [
    { id: `ml-${variantNo}-part-1`, title: 'Part 1', subtitle: 'ONE WORD gap fill', passage: seed.paragraphs.slice(0, 3), questions: fallbackQuestions.slice(0, 6).map((q, i) => ({ ...q, id: `ml-${variantNo}-1-${i + 1}`, type: 'short' })) },
    { id: `ml-${variantNo}-part-2`, title: 'Part 2', subtitle: 'Matching — A–J, two extra', passage: seed.paragraphs.slice(0, 3), questions: fallbackQuestions.slice(6, 14).map((q, i) => ({ ...q, id: `ml-${variantNo}-2-${i + 7}`, type: 'matching', options: ['A','B','C','D','E','F','G','H','I','J'], answer: 'A' })) },
    { id: `ml-${variantNo}-part-3`, title: 'Part 3', subtitle: 'Matching Headings', passage: seed.paragraphs, questions: fallbackQuestions.slice(0, 6).map((q, i) => ({ ...q, id: `ml-${variantNo}-3-${i + 15}`, type: 'matching', options: ['A','B','C','D','E','F','G','H'], answer: 'A' })) },
    { id: `ml-${variantNo}-part-4`, title: 'Part 4', subtitle: '4 MCQ + 5 True/False/No Information', passage: seed.paragraphs, questions: fallbackQuestions.slice(0, 9).map((q, i) => ({ ...q, id: `ml-${variantNo}-4-${i + 21}`, type: i < 4 ? 'mcq' : 'tfng', options: i < 4 ? ['A','B','C','D'] : ['A) True','B) False','C) No Information'] })) },
    { id: `ml-${variantNo}-part-5`, title: 'Part 5', subtitle: '4 gap fill + 2 MCQ', passage: seed.paragraphs, questions: fallbackQuestions.slice(0, 6).map((q, i) => ({ ...q, id: `ml-${variantNo}-5-${i + 30}`, type: i < 4 ? 'short' : 'mcq', options: i < 4 ? undefined : ['A','B','C','D'] })) }
  ];

  return {
    id: variantNo,
    title: `Multilevel Reading — Variant ${String(variantNo).padStart(2, '0')}`,
    mode: 'multilevel',
    duration: 60 * 60,
    sections,
    totalQuestions: 35
  };
}

function buildIeltsVariant(variantNo) {
  const sectionSizes = [13, 13, 14];
  const sections = sectionSizes.map((size, i) => {
    const partNo = i + 1;
    const data = makeSectionQuestions(variantNo, partNo, "ielts");
    const baseQuestions = data.questions;
    const questions = [];

    for (let q = 0; q < size; q++) {
      const template = baseQuestions[q % baseQuestions.length];
      const copy = { ...template, id: `ielts-${variantNo}-${partNo}-${q + 1}` };

      if (q >= 7 && q < 10) {
        copy.type = "matching";
        copy.prompt =
          q === 8
            ? "Which paragraph contains the information about the comparison of locations?"
            : "Which paragraph contains the recommendation for future decisions?";
        copy.options = ["A", "B", "C", "D", "E", "F", "G"];
        copy.answer = q === 8 ? "D" : "G";
        copy.explanation =
          q === 8
            ? "The comparison of two locations is discussed in paragraph D."
            : "The recommendation for future decisions appears in paragraph G.";
      }

      questions.push(copy);
    }

    return {
      id: `section-${partNo}`,
      title: `Passage ${partNo}`,
      subtitle: `${data.topic[0].toUpperCase()}${data.topic.slice(1)}`,
      passage: data.paragraphs,
      questions,
    };
  });

  return {
    id: variantNo,
    title: `IELTS Academic Reading — Test ${String(variantNo).padStart(2, "0")}`,
    mode: "ielts",
    duration: 60 * 60,
    sections,
    totalQuestions: 40,
  };
}

function buildReadingTest(mode, variantNo) {
  return mode === "ielts"
    ? buildIeltsVariant(variantNo)
    : buildMultilevelVariant(variantNo);
}

function readingFormatInfo(mode) {
  return mode === "ielts"
    ? {
        title: "IELTS Academic Reading",
        duration: "60 minutes",
        questions: "40 questions",
        sections: "3 passages",
        note: "Computer-delivered uslub: passage + questions, question navigator, flag, timer va yakuniy natija.",
      }
    : {
        title: "Multilevel Reading",
        duration: "60 minutes",
        questions: "35 questions",
        sections: "5 parts",
        note: "O‘zbekiston Multilevel formati: 5 part, 35 savol, 60 daqiqa. Javoblar test davomida ko‘rsatilmaydi.",
      };
}

function normalizeReadingAnswer(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[.,!?;:]/g, "")
    .replace(/\s+/g, " ");
}

function isReadingAnswerCorrect(question, value) {
  const given = normalizeReadingAnswer(value);
  if (!given) return false;
  const accepted = question.accepted?.length
    ? question.accepted
    : [question.answer];
  return accepted.some((item) => normalizeReadingAnswer(item) === given);
}

function ReadingModule({ onBack }) {
  const [mode, setMode] = useState(null);
  const [test, setTest] = useState(null);
  const [sectionIndex, setSectionIndex] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [flags, setFlags] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);
  const [variant, setVariant] = useState(() => {
    try {
      const next = Number(localStorage.getItem("readingNextVariantMultilevel") || "1");
      return Number.isFinite(next) && next >= 1 && next <= 15 ? next : 1;
    } catch {
      return 1;
    }
  });
  const [nextVariants, setNextVariants] = useState(() => {
    try {
      const ml = Number(localStorage.getItem("readingNextVariantMultilevel") || "1");
      const ielts = Number(localStorage.getItem("readingNextVariantIelts") || "1");
      return {
        multilevel: Number.isFinite(ml) && ml >= 1 && ml <= 15 ? ml : 1,
        ielts: Number.isFinite(ielts) && ielts >= 1 && ielts <= 15 ? ielts : 1,
      };
    } catch {
      return { multilevel: 1, ielts: 1 };
    }
  });

  const flatQuestions = test
    ? test.sections.flatMap((section) =>
        section.questions.map((question) => ({
          ...question,
          sectionId: section.id,
          sectionTitle: section.title,
        }))
      )
    : [];

  const activeSection = test?.sections?.[sectionIndex];
  const activeQuestion = activeSection?.questions?.[currentQuestion];

  useEffect(() => {
    if (!test || submitted || timeLeft === null) return;
    if (timeLeft <= 0) {
      finishTest(true);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((value) => (value === null ? null : Math.max(0, value - 1)));
    }, 1000);

    return () => clearInterval(timer);
  }, [test, submitted, timeLeft]);

  useEffect(() => {
    if (!test || submitted) return;
    try {
      localStorage.setItem(
        "readingActiveSession",
        JSON.stringify({
          mode: test.mode,
          variant: test.id,
          answers,
          flags,
          sectionIndex,
          currentQuestion,
          timeLeft,
        })
      );
    } catch {
      // ignore storage errors
    }
  }, [test, submitted, answers, flags, sectionIndex, currentQuestion, timeLeft]);

  const startTest = (selectedMode, selectedVariant = variant) => {
    const nextTest = buildReadingTest(selectedMode, selectedVariant);
    setMode(selectedMode);
    setTest(nextTest);
    setSectionIndex(0);
    setCurrentQuestion(0);
    setAnswers({});
    setFlags({});
    setTimeLeft(nextTest.duration);
    setSubmitted(false);
    setResult(null);
    setShowFinishConfirm(false);
  };

  const chooseAnswer = (questionId, value) => {
    if (submitted) return;
    setAnswers((previous) => ({
      ...previous,
      [questionId]: value,
    }));
  };

  const jumpToQuestion = (flatIndex) => {
    if (!test) return;
    let count = 0;
    for (let s = 0; s < test.sections.length; s += 1) {
      const sectionLength = test.sections[s].questions.length;
      if (flatIndex < count + sectionLength) {
        setSectionIndex(s);
        setCurrentQuestion(flatIndex - count);
        return;
      }
      count += sectionLength;
    }
  };

  const moveQuestion = (direction) => {
    if (!test) return;
    const globalIndex = flatQuestions.findIndex((q) => q.id === activeQuestion?.id);
    const nextIndex = Math.min(
      Math.max(globalIndex + direction, 0),
      flatQuestions.length - 1
    );
    jumpToQuestion(nextIndex);
  };

  const toggleFlag = () => {
    if (!activeQuestion) return;
    setFlags((previous) => ({
      ...previous,
      [activeQuestion.id]: !previous[activeQuestion.id],
    }));
  };

  const finishTest = (auto = false) => {
    if (!test) return;

    let correct = 0;
    const details = flatQuestions.map((question) => {
      const userAnswer = answers[question.id] ?? "";
      const isCorrect = isReadingAnswerCorrect(question, userAnswer);
      if (isCorrect) correct += 1;
      return {
        ...question,
        userAnswer,
        isCorrect,
      };
    });

    const unanswered = details.filter((item) => !String(item.userAnswer).trim()).length;
    const score = Math.round((correct / test.totalQuestions) * 100);

    const resultData = {
      correct,
      total: test.totalQuestions,
      unanswered,
      percentage: score,
      details,
      auto,
    };

    setResult(resultData);
    setSubmitted(true);
    setShowFinishConfirm(false);
    try {
      localStorage.removeItem("readingActiveSession");
      const nextVariant = test.id >= 15 ? 1 : test.id + 1;
      const storageKey =
        test.mode === "ielts"
          ? "readingNextVariantIelts"
          : "readingNextVariantMultilevel";
      localStorage.setItem(storageKey, String(nextVariant));
      setNextVariants((previous) => ({
        ...previous,
        [test.mode]: nextVariant,
      }));
      setVariant(nextVariant);
    } catch {
      // ignore
    }
  };

  const formatTime = (seconds) => {
    const safe = Math.max(0, seconds || 0);
    const min = Math.floor(safe / 60);
    const sec = safe % 60;
    return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const startPage = () => {
    const nextVariant = nextVariants.multilevel;
    return (
      <div style={{ padding: "26px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <BackButton onBack={onBack} />

          <div style={{ marginBottom: 24 }}>
            <div style={{
              fontFamily: "IBM Plex Mono, monospace",
              fontSize: 11,
              color: MODULE_COLORS.reading.dark,
              fontWeight: 700,
              letterSpacing: 1.5,
            }}>
              READING TEST CENTRE
            </div>
            <h2 style={{
              margin: "6px 0",
              fontFamily: "Space Grotesk, sans-serif",
              fontSize: 30,
              color: COLORS.primary,
            }}>
              Real-test Reading
            </h2>
            <p style={{
              margin: 0,
              fontFamily: "Inter, sans-serif",
              color: COLORS.textSoft,
              lineHeight: 1.6,
            }}>
              Ikki xil format. 15 ta aylanuvchi variant. Test davomida javoblar
              ko'rsatilmaydi — natija faqat yakunda chiqadi.
            </p>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: 16,
          }}>
            {["multilevel", "ielts"].map((format) => {
              const info = readingFormatInfo(format);
              return (
                <div key={format} style={{
                  background: COLORS.surface,
                  border: `1px solid ${COLORS.line}`,
                  borderTop: `4px solid ${MODULE_COLORS.reading.accent}`,
                  borderRadius: 16,
                  padding: 22,
                }}>
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 12,
                  }}>
                    <h3 style={{
                      margin: 0,
                      fontFamily: "Space Grotesk, sans-serif",
                      color: COLORS.primary,
                      fontSize: 21,
                    }}>
                      {info.title}
                    </h3>
                    <span style={{
                      background: MODULE_COLORS.reading.bg,
                      color: MODULE_COLORS.reading.dark,
                      borderRadius: 999,
                      padding: "5px 9px",
                      fontFamily: "IBM Plex Mono, monospace",
                      fontSize: 10,
                      fontWeight: 700,
                    }}>
                      15 VARIANTS
                    </span>
                  </div>

                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: 7,
                    marginBottom: 14,
                  }}>
                    {[
                      ["TIME", info.duration],
                      ["QUESTIONS", info.questions],
                      ["FORMAT", info.sections],
                    ].map(([label, value]) => (
                      <div key={label} style={{
                        background: "#F8F9FB",
                        borderRadius: 9,
                        padding: 9,
                        textAlign: "center",
                      }}>
                        <div style={{
                          fontFamily: "IBM Plex Mono, monospace",
                          fontSize: 9,
                          color: COLORS.textSoft,
                        }}>
                          {label}
                        </div>
                        <strong style={{
                          display: "block",
                          marginTop: 3,
                          fontFamily: "Inter, sans-serif",
                          fontSize: 12,
                          color: COLORS.primary,
                        }}>
                          {value}
                        </strong>
                      </div>
                    ))}
                  </div>

                  <p style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: 12,
                    lineHeight: 1.6,
                    color: COLORS.textSoft,
                    minHeight: 58,
                  }}>
                    {info.note}
                  </p>

                  <button
                    onClick={() => startTest(format, nextVariants[format])}
                    style={{
                      width: "100%",
                      border: "none",
                      background: COLORS.primary,
                      color: "#fff",
                      borderRadius: 9,
                      padding: "12px 14px",
                      fontFamily: "Inter, sans-serif",
                      fontWeight: 800,
                      cursor: "pointer",
                    }}
                  >
                    Variant {String(nextVariants[format]).padStart(2, "0")} ni boshlash →
                  </button>
                </div>
              );
            })}
          </div>

          <div style={{
            marginTop: 18,
            background: COLORS.surface,
            border: `1px solid ${COLORS.line}`,
            borderRadius: 14,
            padding: 18,
          }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
            }}>
              <div>
                <strong style={{
                  fontFamily: "Inter, sans-serif",
                  color: COLORS.primary,
                }}>
                  Variant rotation
                </strong>
                <div style={{
                  marginTop: 4,
                  fontFamily: "Inter, sans-serif",
                  fontSize: 12,
                  color: COLORS.textSoft,
                }}>
                  Har yakunlangan testdan keyin keyingi variant avtomatik tanlanadi:
                  01 → 02 → ... → 15 → 01.
                </div>
              </div>

              <div style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}>
                <span style={{
                  fontFamily: "IBM Plex Mono, monospace",
                  fontSize: 11,
                  color: COLORS.textSoft,
                }}>
                  Multilevel keyingi:
                </span>
                <select
                  value={variant}
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    setVariant(value);
                    setNextVariants((previous) => ({
                      ...previous,
                      multilevel: value,
                    }));
                  }}
                  style={{
                    border: `1px solid ${COLORS.line}`,
                    borderRadius: 8,
                    padding: "8px 10px",
                    fontFamily: "Inter, sans-serif",
                    background: "#fff",
                  }}
                >
                  {READING_VARIANTS.map((item) => (
                    <option key={item.id} value={item.id}>
                      Variant {String(item.id).padStart(2, "0")} — {item.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (!test) return startPage();

  if (submitted && result) {
    return (
      <div style={{ padding: "24px" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto" }}>
          <div style={{
            background: COLORS.surface,
            border: `1px solid ${COLORS.line}`,
            borderRadius: 16,
            padding: 24,
            marginBottom: 16,
          }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 16,
              flexWrap: "wrap",
            }}>
              <div>
                <div style={{
                  fontFamily: "IBM Plex Mono, monospace",
                  fontSize: 11,
                  color: MODULE_COLORS.reading.dark,
                  fontWeight: 700,
                }}>
                  TEST COMPLETED
                </div>
                <h2 style={{
                  margin: "5px 0",
                  fontFamily: "Space Grotesk, sans-serif",
                  color: COLORS.primary,
                }}>
                  {test.title}
                </h2>
                <div style={{
                  fontFamily: "Inter, sans-serif",
                  color: COLORS.textSoft,
                  fontSize: 13,
                }}>
                  {result.auto ? "Vaqt tugadi — test avtomatik topshirildi." : "Test topshirildi."}
                </div>
              </div>

              <div style={{
                minWidth: 120,
                textAlign: "center",
                padding: 14,
                borderRadius: 12,
                background: MODULE_COLORS.reading.bg,
              }}>
                <div style={{
                  fontFamily: "IBM Plex Mono, monospace",
                  fontSize: 10,
                  color: MODULE_COLORS.reading.dark,
                }}>
                  SCORE
                </div>
                <strong style={{
                  display: "block",
                  marginTop: 2,
                  fontFamily: "Space Grotesk, sans-serif",
                  fontSize: 30,
                  color: COLORS.primary,
                }}>
                  {result.correct}/{result.total}
                </strong>
                <div style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: 11,
                  color: COLORS.textSoft,
                }}>
                  {result.percentage}%
                </div>
              </div>
            </div>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 8,
              marginTop: 18,
            }}>
              {[
                ["CORRECT", result.correct],
                ["WRONG", result.total - result.correct - result.unanswered],
                ["UNANSWERED", result.unanswered],
              ].map(([label, value]) => (
                <div key={label} style={{
                  padding: 11,
                  borderRadius: 9,
                  background: "#F8F9FB",
                  textAlign: "center",
                }}>
                  <div style={{
                    fontFamily: "IBM Plex Mono, monospace",
                    fontSize: 9,
                    color: COLORS.textSoft,
                  }}>
                    {label}
                  </div>
                  <strong style={{
                    display: "block",
                    marginTop: 3,
                    fontFamily: "Inter, sans-serif",
                    color: COLORS.primary,
                  }}>
                    {value}
                  </strong>
                </div>
              ))}
            </div>
          </div>

          <div style={{
            background: COLORS.surface,
            border: `1px solid ${COLORS.line}`,
            borderRadius: 14,
            padding: 20,
          }}>
            <h3 style={{
              margin: "0 0 14px",
              fontFamily: "Space Grotesk, sans-serif",
              color: COLORS.primary,
            }}>
              Review answers
            </h3>

            <div style={{ display: "grid", gap: 9 }}>
              {result.details.map((item, i) => (
                <div key={item.id} style={{
                  border: `1px solid ${item.isCorrect ? "#BFE8D3" : "#F1C3BF"}`,
                  background: item.isCorrect ? "#F6FCF8" : "#FFF8F7",
                  borderRadius: 10,
                  padding: 12,
                }}>
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 10,
                    fontFamily: "Inter, sans-serif",
                    fontSize: 12,
                  }}>
                    <strong style={{ color: COLORS.primary }}>
                      {i + 1}. {item.prompt}
                    </strong>
                    <span style={{
                      fontWeight: 800,
                      color: item.isCorrect ? COLORS.green : COLORS.red,
                      whiteSpace: "nowrap",
                    }}>
                      {item.isCorrect ? "✓ Correct" : "✕ Review"}
                    </span>
                  </div>

                  <div style={{
                    marginTop: 6,
                    fontFamily: "Inter, sans-serif",
                    fontSize: 12,
                    color: COLORS.textSoft,
                  }}>
                    Your answer: <strong>{item.userAnswer || "—"}</strong>
                  </div>

                  {!item.isCorrect && (
                    <div style={{
                      marginTop: 4,
                      fontFamily: "Inter, sans-serif",
                      fontSize: 12,
                      color: COLORS.textSoft,
                    }}>
                      Correct answer: <strong>{item.answer}</strong>
                    </div>
                  )}

                  <div style={{
                    marginTop: 5,
                    fontFamily: "Inter, sans-serif",
                    fontSize: 11,
                    lineHeight: 1.5,
                    color: COLORS.textSoft,
                  }}>
                    {item.explanation}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{
            display: "flex",
            gap: 8,
            marginTop: 16,
            flexWrap: "wrap",
          }}>
            <button
              onClick={() => {
                setTest(null);
                setSubmitted(false);
                setResult(null);
              }}
              style={{
                border: `1px solid ${COLORS.line}`,
                background: "#fff",
                color: COLORS.primary,
                borderRadius: 9,
                padding: "11px 16px",
                fontFamily: "Inter, sans-serif",
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              Reading home
            </button>

            <button
              onClick={() => {
                const next = nextVariants[test.mode];
                startTest(test.mode, next);
              }}
              style={{
                border: "none",
                background: COLORS.primary,
                color: "#fff",
                borderRadius: 9,
                padding: "11px 16px",
                fontFamily: "Inter, sans-serif",
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              Variant {String(variant).padStart(2, "0")} ni boshlash
            </button>
          </div>
        </div>
      </div>
    );
  }

  const globalQuestionIndex = flatQuestions.findIndex((q) => q.id === activeQuestion?.id);
  const timerWarning = timeLeft <= 5 * 60;

  return (
    <div style={{
      minHeight: "calc(100vh - 60px)",
      background: "#F1F3F7",
      paddingBottom: 24,
    }}>
      <div style={{
        position: "sticky",
        top: 0,
        zIndex: 20,
        background: "#fff",
        borderBottom: `1px solid ${COLORS.line}`,
        boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
      }}>
        <div style={{
          maxWidth: 1440,
          margin: "0 auto",
          padding: "9px 14px",
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          alignItems: "center",
          gap: 12,
        }}>
          <div style={{
            fontFamily: "Inter, sans-serif",
            fontWeight: 800,
            color: COLORS.primary,
            fontSize: 13,
          }}>
            {test.title}
          </div>

          <div style={{
            minWidth: 105,
            textAlign: "center",
            padding: "7px 12px",
            borderRadius: 8,
            background: timerWarning ? "#FFF0F0" : "#F5F7FA",
            color: timerWarning ? COLORS.red : COLORS.primary,
            fontFamily: "IBM Plex Mono, monospace",
            fontWeight: 800,
          }}>
            {formatTime(timeLeft)}
          </div>

          <div style={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: 8,
          }}>
            <span style={{
              fontFamily: "Inter, sans-serif",
              fontSize: 11,
              color: COLORS.textSoft,
            }}>
              {globalQuestionIndex + 1}/{test.totalQuestions}
            </span>
            <button
              onClick={() => setShowFinishConfirm(true)}
              style={{
                border: "none",
                background: COLORS.primary,
                color: "#fff",
                borderRadius: 8,
                padding: "8px 12px",
                fontFamily: "Inter, sans-serif",
                fontWeight: 800,
                cursor: "pointer",
                fontSize: 11,
              }}
            >
              Finish test
            </button>
          </div>
        </div>
      </div>

      <div style={{
        maxWidth: 1440,
        margin: "0 auto",
        padding: "12px 14px 0",
      }}>
        <div style={{
          display: "flex",
          gap: 6,
          overflowX: "auto",
          paddingBottom: 8,
        }}>
          {test.sections.map((section, i) => {
            const sectionQuestions = section.questions;
            const answered = sectionQuestions.filter((q) => String(answers[q.id] ?? "").trim()).length;
            return (
              <button
                key={section.id}
                onClick={() => {
                  setSectionIndex(i);
                  setCurrentQuestion(0);
                }}
                style={{
                  border: `1px solid ${i === sectionIndex ? COLORS.primary : COLORS.line}`,
                  background: i === sectionIndex ? COLORS.primary : "#fff",
                  color: i === sectionIndex ? "#fff" : COLORS.primary,
                  borderRadius: 8,
                  padding: "7px 11px",
                  fontFamily: "Inter, sans-serif",
                  fontWeight: 800,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  fontSize: 11,
                }}
              >
                {section.title} · {answered}/{sectionQuestions.length}
              </button>
            );
          })}
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.1fr) minmax(380px, 0.9fr)",
          gap: 12,
          alignItems: "start",
        }}>
          <div style={{
            background: "#fff",
            border: `1px solid ${COLORS.line}`,
            borderRadius: 10,
            padding: 20,
            minHeight: 590,
            maxHeight: "calc(100vh - 190px)",
            overflowY: "auto",
          }}>
            <div style={{
              fontFamily: "IBM Plex Mono, monospace",
              fontSize: 10,
              color: MODULE_COLORS.reading.dark,
              fontWeight: 800,
              marginBottom: 8,
            }}>
              {activeSection.title.toUpperCase()}
            </div>

            <h2 style={{
              margin: "0 0 14px",
              fontFamily: "Space Grotesk, sans-serif",
              color: COLORS.primary,
              fontSize: 22,
            }}>
              {activeSection.subtitle}
            </h2>

            <div style={{
              fontFamily: "Inter, sans-serif",
              fontSize: 14,
              lineHeight: 1.75,
              color: COLORS.text,
            }}>
              {activeSection.passage.map((paragraph) => (
                <p key={paragraph.slice(0, 25)} style={{ margin: "0 0 15px" }}>
                  {paragraph}
                </p>
              ))}
            </div>
          </div>

          <div style={{
            background: "#fff",
            border: `1px solid ${COLORS.line}`,
            borderRadius: 10,
            padding: 18,
            minHeight: 590,
          }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 10,
              marginBottom: 13,
            }}>
              <div style={{
                fontFamily: "IBM Plex Mono, monospace",
                fontSize: 10,
                color: COLORS.textSoft,
              }}>
                QUESTION {globalQuestionIndex + 1} OF {test.totalQuestions}
              </div>

              <button
                onClick={toggleFlag}
                style={{
                  border: `1px solid ${flags[activeQuestion.id] ? COLORS.amber : COLORS.line}`,
                  background: flags[activeQuestion.id] ? "#FFF8E8" : "#fff",
                  color: flags[activeQuestion.id] ? COLORS.amberDark : COLORS.textSoft,
                  borderRadius: 7,
                  padding: "6px 9px",
                  fontFamily: "Inter, sans-serif",
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {flags[activeQuestion.id] ? "★ Flagged" : "☆ Flag"}
              </button>
            </div>

            {activeSection.id === 'ml-1-part-1' ? (
              <div>
                <div style={{
                  fontFamily: "IBM Plex Mono, monospace",
                  fontSize: 10,
                  fontWeight: 800,
                  color: MODULE_COLORS.reading.dark,
                  marginBottom: 10,
                }}>
                  ANSWER SHEET — QUESTIONS 1–6
                </div>
                <div style={{
                  display: "grid",
                  gap: 10,
                }}>
                  {activeSection.questions.map((question) => (
                    <div key={question.id} style={{
                      display: "grid",
                      gridTemplateColumns: "34px minmax(0, 1fr)",
                      alignItems: "center",
                      gap: 8,
                    }}>
                      <div style={{
                        width: 30,
                        height: 30,
                        borderRadius: 7,
                        background: answers[question.id] ? COLORS.primary : "#F2F4F7",
                        color: answers[question.id] ? "#fff" : COLORS.textSoft,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontFamily: "IBM Plex Mono, monospace",
                        fontSize: 11,
                        fontWeight: 800,
                      }}>
                        {question.prompt}
                      </div>
                      <input
                        value={answers[question.id] || ""}
                        onChange={(e) => chooseAnswer(question.id, e.target.value)}
                        placeholder={`Answer ${question.prompt}`}
                        autoComplete="off"
                        spellCheck={false}
                        style={{
                          width: "100%",
                          boxSizing: "border-box",
                          border: `1px solid ${answers[question.id] ? COLORS.primary : COLORS.line}`,
                          borderRadius: 8,
                          padding: "10px 12px",
                          fontFamily: "Inter, sans-serif",
                          fontSize: 14,
                          outline: "none",
                        }}
                      />
                    </div>
                  ))}
                </div>
                <div style={{
                  marginTop: 14,
                  padding: "10px 12px",
                  borderRadius: 8,
                  background: "#F8F9FB",
                  color: COLORS.textSoft,
                  fontFamily: "Inter, sans-serif",
                  fontSize: 11,
                  lineHeight: 1.5,
                }}>
                  Write <strong>ONE WORD</strong> for each answer. Use a word that appears somewhere in the text.
                </div>
              </div>
            ) : (
              <>
                <div style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: 14,
                  lineHeight: 1.65,
                  color: COLORS.text,
                  marginBottom: 15,
                }}>
                  <strong>{activeQuestion.prompt}</strong>
                </div>

                {activeQuestion.type === "mcq" || activeQuestion.type === "tfng" || activeQuestion.type === "matching" ? (
              <div style={{ display: "grid", gap: 8 }}>
                {activeQuestion.options.map((option) => {
                  const selected = answers[activeQuestion.id] === option;
                  return (
                    <button
                      key={option}
                      onClick={() => chooseAnswer(activeQuestion.id, option)}
                      style={{
                        textAlign: "left",
                        border: `1px solid ${selected ? COLORS.primary : COLORS.line}`,
                        background: selected ? "#EEF2FF" : "#fff",
                        color: COLORS.text,
                        borderRadius: 9,
                        padding: "11px 12px",
                        fontFamily: "Inter, sans-serif",
                        fontSize: 13,
                        cursor: "pointer",
                      }}
                    >
                      <span style={{
                        display: "inline-flex",
                        width: 22,
                        height: 22,
                        borderRadius: 5,
                        alignItems: "center",
                        justifyContent: "center",
                        background: selected ? COLORS.primary : "#F2F4F7",
                        color: selected ? "#fff" : COLORS.textSoft,
                        marginRight: 8,
                        fontWeight: 800,
                        fontSize: 11,
                      }}>
                        {option.length <= 2 ? option : "•"}
                      </span>
                      {option}
                    </button>
                  );
                })}
              </div>
            ) : (
                  <input
                    value={answers[activeQuestion.id] || ""}
                    onChange={(e) => chooseAnswer(activeQuestion.id, e.target.value)}
                    placeholder="Write your answer..."
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      border: `1px solid ${COLORS.line}`,
                      borderRadius: 9,
                      padding: "12px 13px",
                      fontFamily: "Inter, sans-serif",
                      fontSize: 14,
                      outline: "none",
                    }}
                  />
                )}
              </>
            )}

            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 8,
              marginTop: 22,
            }}>
              <button
                onClick={() => moveQuestion(-1)}
                disabled={globalQuestionIndex === 0}
                style={{
                  border: `1px solid ${COLORS.line}`,
                  background: "#fff",
                  color: COLORS.primary,
                  borderRadius: 8,
                  padding: "9px 13px",
                  fontFamily: "Inter, sans-serif",
                  fontWeight: 800,
                  cursor: globalQuestionIndex === 0 ? "default" : "pointer",
                  opacity: globalQuestionIndex === 0 ? 0.45 : 1,
                }}
              >
                ← Previous
              </button>

              <button
                onClick={() => moveQuestion(1)}
                disabled={globalQuestionIndex === flatQuestions.length - 1}
                style={{
                  border: "none",
                  background: COLORS.primary,
                  color: "#fff",
                  borderRadius: 8,
                  padding: "9px 14px",
                  fontFamily: "Inter, sans-serif",
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                Next →
              </button>
            </div>

            <div style={{
              marginTop: 20,
              paddingTop: 14,
              borderTop: `1px solid ${COLORS.line}`,
            }}>
              <div style={{
                fontFamily: "IBM Plex Mono, monospace",
                fontSize: 9,
                color: COLORS.textSoft,
                marginBottom: 8,
              }}>
                QUESTION NAVIGATOR
              </div>

              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(10, 1fr)",
                gap: 5,
              }}>
                {flatQuestions.map((question, i) => {
                  const answered = String(answers[question.id] ?? "").trim();
                  const active = i === globalQuestionIndex;
                  const flagged = flags[question.id];

                  return (
                    <button
                      key={question.id}
                      onClick={() => jumpToQuestion(i)}
                      title={flagged ? "Flagged" : ""}
                      style={{
                        height: 29,
                        border: `1px solid ${active ? COLORS.primary : flagged ? COLORS.amber : COLORS.line}`,
                        borderRadius: 5,
                        background: active
                          ? COLORS.primary
                          : answered
                          ? "#E7F7EF"
                          : "#fff",
                        color: active ? "#fff" : COLORS.primary,
                        fontFamily: "IBM Plex Mono, monospace",
                        fontSize: 10,
                        fontWeight: 700,
                        cursor: "pointer",
                        position: "relative",
                      }}
                    >
                      {i + 1}
                      {flagged && (
                        <span style={{
                          position: "absolute",
                          top: -4,
                          right: -2,
                          color: COLORS.amber,
                          fontSize: 9,
                        }}>
                          ★
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showFinishConfirm && (
        <div style={{
          position: "fixed",
          inset: 0,
          zIndex: 50,
          background: "rgba(20,28,66,0.45)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 20,
        }}>
          <div style={{
            width: "min(440px, 100%)",
            background: "#fff",
            borderRadius: 14,
            padding: 22,
            boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
          }}>
            <h3 style={{
              margin: "0 0 8px",
              fontFamily: "Space Grotesk, sans-serif",
              color: COLORS.primary,
            }}>
              Finish test?
            </h3>
            <p style={{
              margin: "0 0 16px",
              fontFamily: "Inter, sans-serif",
              color: COLORS.textSoft,
              lineHeight: 1.6,
              fontSize: 13,
            }}>
              Testni topshirgandan keyin javoblarni o'zgartira olmaysiz.
              Javob berilmagan savollar:{" "}
              <strong>
                {flatQuestions.filter((q) => !String(answers[q.id] ?? "").trim()).length}
              </strong>.
            </p>

            <div style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 8,
            }}>
              <button
                onClick={() => setShowFinishConfirm(false)}
                style={{
                  border: `1px solid ${COLORS.line}`,
                  background: "#fff",
                  color: COLORS.primary,
                  borderRadius: 8,
                  padding: "10px 14px",
                  fontFamily: "Inter, sans-serif",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Continue test
              </button>
              <button
                onClick={() => finishTest(false)}
                style={{
                  border: "none",
                  background: COLORS.primary,
                  color: "#fff",
                  borderRadius: 8,
                  padding: "10px 14px",
                  fontFamily: "Inter, sans-serif",
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                Submit test
              </button>
            </div>
          </div>
        </div>
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
        {m?.icon} {m?.name}
      </div>
      <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 14, padding: "40px 20px", textAlign: "center", fontFamily: "Inter, sans-serif", color: COLORS.textSoft, fontSize: 14 }}>
        Ushbu modul tayyorlanmoqda. Tez kunda yangi interaktiv darslar va audio/video amaliyotlar qo'shiladi.
      </div>
    </div>
  );
}

export default function App() {
  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem("token") || null;
    } catch {
      return null;
    }
  });
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [authMode, setAuthMode] = useState("login");
  const [screen, setScreen] = useState("dashboard");
  const [xp, setXp] = useState(120);
  const [streak, setStreak] = useState({ current_streak: 3 });
  const [loadError, setLoadError] = useState("");

  // Ilova ochilgan zahoti Render backend'ini fonda uyg'otamiz. Bu real
  // AI so'rovi emas, shuning uchun timeout/xato ko'rsatmaymiz — faqat
  // cold start jarayonini oldindan boshlab qo'yamiz.
  useEffect(() => {
    wakeBackend();
  }, []);

  const refreshProgress = useCallback(async () => {
    if (!token || token === "demo-token") return;
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
    try {
      localStorage.setItem("token", newToken);
      localStorage.setItem("user", JSON.stringify(newUser));
    } catch {
      // ignore
    }
  }

  function handleLogout() {
    setToken(null);
    setUser(null);
    setScreen("dashboard");
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    } catch {
      // ignore
    }
  }

  function openModule(id) {
    setScreen(id);
  }

  if (!token) {
    return (
      <div style={{ background: COLORS.bg, minHeight: "100vh", fontFamily: "Inter, sans-serif" }}>
        <style>{FONTS}</style>
        <AuthScreen mode={authMode} setMode={setAuthMode} onAuth={handleAuth} />
      </div>
    );
  }

  return (
    <div style={{ background: COLORS.bg, minHeight: "100vh", fontFamily: "Inter, sans-serif" }}>
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
      {screen === "reading" && <ReadingModule onBack={() => setScreen("dashboard")} />}
      {screen === "listening" && <ComingSoonModule id={screen} onBack={() => setScreen("dashboard")} />}
    </div>
  );
}
