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
import { VOCAB_WORDS, IELTS_TOPICS, IELTS_CONTENT } from "./vocabData";

// Corrected Business Vocabulary topic icons.
// Kept in App.jsx so broken/mis-encoded icons in vocabData.js
// cannot appear in the Vocabulary & IELTS topic cards.
const VOCAB_TOPICS = [
  { id: "job_interviews", icon: "💼", name: "Ish suhbati" },
  { id: "meetings", icon: "📅", name: "Yig‘ilishlar" },
  { id: "negotiations", icon: "🤝", name: "Muzokaralar" },
  { id: "presentations", icon: "📊", name: "Taqdimotlar" },
  { id: "emails", icon: "📧", name: "Elektron yozishmalar" },
  { id: "marketing", icon: "📣", name: "Marketing" },
  { id: "sales", icon: "💰", name: "Sotuv" },
  { id: "finance", icon: "💳", name: "Moliya" },
  { id: "hr", icon: "👥", name: "Kadrlar boshqaruvi" },
  { id: "management", icon: "🎯", name: "Boshqaruv va liderlik" },
  { id: "customer_service", icon: "🤝", name: "Mijozlarga xizmat" },
  { id: "business_travel", icon: "✈️", name: "Ish safarlari" },
  { id: "networking", icon: "🌐", name: "Aloqalar o‘rnatish" },
  { id: "startups", icon: "🚀", name: "Startaplar" },
  { id: "logistics", icon: "📦", name: "Ta’minot va logistika" },
  { id: "technology", icon: "💻", name: "Texnologiya va IT" },
  { id: "project_management", icon: "📋", name: "Loyiha boshqaruvi" },
  { id: "legal", icon: "⚖️", name: "Huquq va shartnomalar" },
  { id: "strategy", icon: "♟️", name: "Strategiya" },
  { id: "workplace_culture", icon: "🏢", name: "Ofis madaniyati" },
];

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
      {["reading", "listening"].includes(screen) && (
        <ComingSoonModule id={screen} onBack={() => setScreen("dashboard")} />
      )}
    </div>
  );
}
