import { useState, useEffect, useCallback } from "react";

const FONTS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@500&display=swap');
`;

const API_BASE = "https://business-english-surxon.onrender.com/api";

const COLORS = {
  bg: "#EEF2ED",
  surface: "#FFFFFF",
  primary: "#123832",
  primaryDark: "#0B241F",
  amber: "#D6A24A",
  amberDark: "#8A6522",
  clay: "#8B6F47",
  text: "#1A1A18",
  textSoft: "#5B5D57",
  line: "#DCE1D8",
  red: "#B3261E",
};

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

const MODULES = [
  { id: "speaking", icon: "🗣", name: "Speaking", desc: "AI ekzaminator bilan Part 1–3 amaliyoti", live: true },
  { id: "writing", icon: "✍", name: "Writing", desc: "Task 1 va Task 2, AI tekshiruvi bilan", live: true },
  { id: "reading", icon: "📖", name: "Reading", desc: "5 xil qism, javob kalitlari bilan", live: false },
  { id: "listening", icon: "🎧", name: "Listening", desc: "6 xil qism, transkript va audio", live: false },
  { id: "business", icon: "💼", name: "Business English", desc: "Ish mavzulari: muzokaralar, taqdimotlar, email", live: true },
];

async function api(path, { token, method = "GET", body } = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
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
      <path d={pathD} fill="none" stroke={COLORS.line} strokeWidth="4" strokeLinecap="round" />
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
            fill={i <= idx ? COLORS.amber : COLORS.surface}
            stroke={i <= idx ? COLORS.amberDark : COLORS.line}
            strokeWidth="2"
          />
          <text
            x={x}
            y={y + 4}
            textAnchor="middle"
            style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 600, fill: i <= idx ? COLORS.primaryDark : COLORS.textSoft }}
          >
            {LEVELS[i]}
          </text>
        </g>
      ))}
    </svg>
  );
}

function Badge({ children, tone = "amber" }) {
  const bg = tone === "amber" ? "#F7E9CE" : "#E1F5EE";
  const fg = tone === "amber" ? COLORS.amberDark : COLORS.primary;
  return (
    <span style={{ fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 600, color: fg, background: bg, borderRadius: 999, padding: "3px 10px" }}>
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
          border: `1px solid ${COLORS.line}`,
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
    <div style={{ maxWidth: 360, margin: "60px auto", padding: "0 24px" }}>
      <div style={{ fontFamily: "Fraunces, serif", fontSize: 24, fontWeight: 600, color: COLORS.text, marginBottom: 4, textAlign: "center" }}>
        BizEnglish Surxon
      </div>
      <div style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: COLORS.textSoft, marginBottom: 24, textAlign: "center" }}>
        {mode === "login" ? "Hisobingizga kiring" : "Yangi hisob yarating"}
      </div>
      <form onSubmit={submit} style={{ background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 14, padding: 20 }}>
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
            padding: "11px 0",
            background: COLORS.primary,
            color: "#fff",
            border: "none",
            borderRadius: 8,
            fontFamily: "Inter, sans-serif",
            fontSize: 14,
            fontWeight: 600,
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
          style={{ background: "none", border: "none", color: COLORS.primary, fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif", fontSize: 13 }}
        >
          {mode === "login" ? "Ro'yxatdan o'ting" : "Kiring"}
        </button>
      </div>
    </div>
  );
}

function TopBar({ user, xp, streak, onLogout }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px", borderBottom: `1px solid ${COLORS.line}`, background: COLORS.surface }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 8, background: COLORS.primary, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Fraunces, serif", color: COLORS.amber, fontWeight: 600, fontSize: 18 }}>
          B
        </div>
        <div>
          <div style={{ fontFamily: "Fraunces, serif", fontSize: 16, fontWeight: 600, color: COLORS.text, lineHeight: 1.1 }}>BizEnglish Surxon</div>
          <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: COLORS.textSoft }}>{user?.full_name || user?.email}</div>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <span style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 13, color: COLORS.amberDark }}>🔥 {streak?.current_streak ?? 0}</span>
        <span style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 13, color: COLORS.primaryDark }}>{xp} XP</span>
        <button onClick={onLogout} style={{ background: "none", border: "none", color: COLORS.textSoft, fontFamily: "Inter, sans-serif", fontSize: 12, cursor: "pointer" }}>
          Chiqish
        </button>
      </div>
    </div>
  );
}

function Dashboard({ onOpen, xp, streak, level }) {
  return (
    <div style={{ padding: "28px 24px 40px", maxWidth: 720, margin: "0 auto" }}>
      <div style={{ background: COLORS.primary, borderRadius: 16, padding: "24px 28px", marginBottom: 24 }}>
        <div style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "#BFD6CE", marginBottom: 4 }}>Sizning darajangiz</div>
        <div style={{ fontFamily: "Fraunces, serif", fontSize: 30, fontWeight: 600, color: "#FFFFFF", marginBottom: 12 }}>
          {level || "Hali aniqlanmagan"}
        </div>
        <RiverPath current={level || "A1"} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 }}>
        {MODULES.map((m) => (
          <button
            key={m.id}
            onClick={() => onOpen(m.id)}
            style={{ textAlign: "left", background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 14, padding: "18px 18px", cursor: "pointer", display: "flex", flexDirection: "column", gap: 8 }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 22 }}>{m.icon}</span>
              <Badge tone={m.live ? "teal" : "amber"}>{m.live ? "Ishlaydi" : "Tez orada"}</Badge>
            </div>
            <div style={{ fontFamily: "Fraunces, serif", fontSize: 18, fontWeight: 600, color: COLORS.text }}>{m.name}</div>
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: COLORS.textSoft, lineHeight: 1.4 }}>{m.desc}</div>
          </button>
        ))}
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
      <div style={{ fontFamily: "Fraunces, serif", fontSize: 24, fontWeight: 600, color: COLORS.text, marginBottom: 16 }}>
        💼 Business English
      </div>
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
          <div style={{ fontFamily: "Fraunces, serif", fontSize: 18, fontWeight: 600, marginBottom: 12 }}>{selected.title}</div>
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

function WritingModule({ token, onBack, onXpChange }) {
  const [lessons, setLessons] = useState(null);
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
    try {
      const data = await api("/writing/check", { token, method: "POST", body: { lessonId: selected.id, text } });
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
      <BackButton onBack={selected ? () => { setSelected(null); setFeedback(null); setText(""); } : onBack} />
      <div style={{ fontFamily: "Fraunces, serif", fontSize: 24, fontWeight: 600, color: COLORS.text, marginBottom: 16 }}>✍ Writing</div>
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
        </div>
      )}

      {feedback && (
        <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 12, padding: 16, fontFamily: "Inter, sans-serif", fontSize: 14, color: COLORS.text, whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
          {feedback}
        </div>
      )}
    </div>
  );
}

function SpeakingModule({ token, onBack, onXpChange }) {
  const [topics, setTopics] = useState(null);
  const [topic, setTopic] = useState(null);
  const [stage, setStage] = useState("part1"); // part1 | part2 | part3
  const [answers, setAnswers] = useState({ part1: "", part2: "", part3: "" });
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
      setFeedback(null);
    } catch (e) {
      setError(e.message);
    }
  }

  function next() {
    if (stage === "part1") setStage("part2");
    else if (stage === "part2") setStage("part3");
  }

  async function submit() {
    setLoading(true);
    setError("");
    try {
      const data = await api("/speaking/submit", { token, method: "POST", body: { topicId: topic.id, answers } });
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
      <div style={{ fontFamily: "Fraunces, serif", fontSize: 24, fontWeight: 600, color: COLORS.text, marginBottom: 16 }}>
        🗣 Speaking (Multilevel format)
      </div>
      {error && <div style={{ color: COLORS.red, fontFamily: "Inter, sans-serif", fontSize: 14, marginBottom: 12 }}>{error}</div>}

      {!topic && topics && (
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
      )}

      {topic && !feedback && (
        <div>
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            {["part1", "part2", "part3"].map((s) => (
              <Badge key={s} tone={s === stage ? "teal" : "amber"}>{stageInfo[s].label}</Badge>
            ))}
          </div>

          {stage !== "part2" ? (
            <ol style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: COLORS.text, paddingLeft: 20, marginBottom: 14 }}>
              {stageInfo[stage].questions?.map((q) => <li key={q} style={{ marginBottom: 6 }}>{q}</li>)}
            </ol>
          ) : (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontFamily: "Fraunces, serif", fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
                {topic.part2.cueCardTitle}
              </div>
              <ul style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: COLORS.text, paddingLeft: 20 }}>
                {topic.part2.bulletPoints.map((b) => <li key={b} style={{ marginBottom: 4 }}>{b}</li>)}
              </ul>
            </div>
          )}

          <textarea
            value={answers[stage]}
            onChange={(e) => setAnswers({ ...answers, [stage]: e.target.value })}
            rows={6}
            placeholder="Javobingizni shu yerga yozing (mikrofon yozib olish keyingi bosqichda qo'shiladi)..."
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
        </div>
      )}

      {feedback && (
        <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 12, padding: 16, fontFamily: "Inter, sans-serif", fontSize: 14, color: COLORS.text, whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
          {feedback}
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
      <div style={{ fontFamily: "Fraunces, serif", fontSize: 24, fontWeight: 600, color: COLORS.text, marginBottom: 6 }}>
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
      {["reading", "listening"].includes(screen) && (
        <ComingSoonModule id={screen} onBack={() => setScreen("dashboard")} />
      )}
    </div>
  );
}
