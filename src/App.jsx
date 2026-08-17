// ============================================
// IELTS CONTENT VIEW - YANGILANGAN VERSIYA
// ============================================

function IeltsContentView({ content }) {
  if (!content) {
    return (
      <div style={{ textAlign: "center", padding: "40px 20px", color: COLORS.textSoft, fontFamily: "Inter, sans-serif", fontSize: 14 }}>
        Bu mavzu uchun IELTS namunasi tayyorlanmoqda — tez orada qo'shiladi. 🛠️
      </div>
    );
  }

  // Collocationlarni ko'rsatish
  const renderCollocations = () => {
    if (!content.collocations || content.collocations.length === 0) return null;
    return (
      <div style={{ marginBottom: 26 }}>
        <div style={{ 
          fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, fontSize: 15, 
          color: COLORS.text, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 
        }}>
          <span>📚</span> Foydali so'z birikmalari (Collocations)
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {content.collocations.map((c, i) => (
            <div key={i} style={{ 
              background: COLORS.bg, borderRadius: 8, padding: "10px 14px",
              borderLeft: `3px solid ${MODULE_COLORS.vocabulary.accent}`,
              fontFamily: "Inter, sans-serif", fontSize: 13.5, lineHeight: 1.5
            }}>
              <div>
                <span style={{ fontWeight: 700, color: MODULE_COLORS.vocabulary.dark }}>
                  {c.phrase}
                </span>
                <span style={{ color: COLORS.textSoft, marginLeft: 8 }}>
                  ({c.translation})
                </span>
              </div>
              <div style={{ color: COLORS.textSoft, fontSize: 12.5, marginTop: 2 }}>
                {c.def}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // renderBold funksiyasi (agar tashqarida bo'lmasa, shu yerda)
  const renderBold = (text) => {
    if (!text) return null;
    const parts = text.split(/\*\*(.+?)\*\*/g);
    return parts.map((part, i) =>
      i % 2 === 1 ? (
        <b key={i} style={{ color: MODULE_COLORS.vocabulary.dark }}>{part}</b>
      ) : (
        <span key={i}>{part}</span>
      )
    );
  };

  return (
    <div>
      {/* COLLOCATIONS */}
      {renderCollocations()}

      {/* PART 1 */}
      {content.part1 && content.part1.length > 0 && (
        <div style={{ marginBottom: 26 }}>
          <div style={{
            fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, fontSize: 13,
            color: "#fff", background: MODULE_COLORS.vocabulary.dark, display: "inline-block",
            padding: "4px 12px", borderRadius: 999, marginBottom: 12,
          }}>
            IELTS Speaking Part 1
          </div>
          {content.part1.map((qa, i) => (
            <div key={i} style={{ marginBottom: 16 }}>
              <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 13.5, color: COLORS.primary, marginBottom: 6 }}>
                Examiner: {qa.q}
              </div>
              <div style={{ 
                fontFamily: "Inter, sans-serif", fontSize: 14, lineHeight: 1.65, 
                color: COLORS.text, fontStyle: "italic", paddingLeft: 14, 
                borderLeft: `3px solid ${MODULE_COLORS.vocabulary.accent}` 
              }}>
                {renderBold(qa.a)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PART 2 */}
      {content.part2 && (
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
            {content.part2.closing && (
              <div style={{ color: COLORS.textSoft, fontSize: 13 }}>{content.part2.closing}</div>
            )}
          </div>
          <div style={{ 
            fontFamily: "Inter, sans-serif", fontSize: 14, lineHeight: 1.7, 
            color: COLORS.text, fontStyle: "italic", paddingLeft: 14, 
            borderLeft: `3px solid ${MODULE_COLORS.vocabulary.accent}`, 
            whiteSpace: "pre-line" 
          }}>
            {renderBold(content.part2.answer)}
          </div>
        </div>
      )}

      {/* PART 3 */}
      {content.part3 && content.part3.length > 0 && (
        <div>
          <div style={{
            fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, fontSize: 13,
            color: "#fff", background: MODULE_COLORS.vocabulary.dark, display: "inline-block",
            padding: "4px 12px", borderRadius: 999, marginBottom: 12,
          }}>
            IELTS Speaking Part 3
          </div>
          {content.part3.map((qa, i) => (
            <div key={i} style={{ marginBottom: 16 }}>
              <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 13.5, color: COLORS.primary, marginBottom: 6 }}>
                Examiner: {qa.q}
              </div>
              <div style={{ 
                fontFamily: "Inter, sans-serif", fontSize: 14, lineHeight: 1.65, 
                color: COLORS.text, fontStyle: "italic", paddingLeft: 14, 
                borderLeft: `3px solid ${MODULE_COLORS.vocabulary.accent}` 
              }}>
                {renderBold(qa.a)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
