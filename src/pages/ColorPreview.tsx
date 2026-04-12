const options = [
  { label: "A: Warm Gray", bg: "#F5F5F4", desc: "Stone-100 · Notion/Linear vibe" },
  { label: "B: Cool Slate", bg: "#F8FAFC", desc: "Slate-50 · Stripe/Vercel vibe" },
  { label: "C: Neutral", bg: "#FAFAFA", desc: "Neutral-50 · Apple vibe" },
];

const MiniCard = () => (
  <div style={{ background: "#fff", borderRadius: 12, padding: 20, border: "1px solid hsl(220 13% 91%)" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
      <span style={{ fontWeight: 600, fontSize: 15, color: "hsl(220 26% 14%)" }}>Taken Overzicht</span>
      <span style={{ fontSize: 12, color: "hsl(220 9% 46%)", background: "hsl(163 30% 95%)", padding: "2px 8px", borderRadius: 6 }}>5 open</span>
    </div>
    <div style={{ fontSize: 13, color: "hsl(220 9% 46%)", marginBottom: 16 }}>Dagelijkse checklist voor bediening</div>
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {["Tafels dekken", "Glazen poleren", "Menukaarten checken"].map((t) => (
        <div key={t} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "hsl(220 14% 96%)", borderRadius: 8, fontSize: 14, color: "hsl(220 26% 14%)" }}>
          <div style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid hsl(163 65% 26%)" }} />
          {t}
        </div>
      ))}
    </div>
    <button style={{ marginTop: 16, width: "100%", padding: "10px 0", background: "hsl(163 65% 26%)", color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
      Taak toevoegen
    </button>
  </div>
);

const MiniSidebar = () => (
  <div style={{ background: "#fff", borderRadius: 12, padding: 12, border: "1px solid hsl(220 13% 91%)", width: "100%" }}>
    {["Dashboard", "Taken", "Voorraad", "Instellingen"].map((item, i) => (
      <div key={item} style={{
        padding: "8px 12px", borderRadius: 8, fontSize: 13, fontWeight: i === 1 ? 600 : 400,
        background: i === 1 ? "hsl(163 30% 95%)" : "transparent",
        color: i === 1 ? "hsl(163 65% 26%)" : "hsl(220 9% 46%)",
        marginBottom: 4,
      }}>
        {item}
      </div>
    ))}
  </div>
);

const KpiRow = () => (
  <div style={{ display: "flex", gap: 12 }}>
    {[
      { label: "Open", value: "12", color: "hsl(163 65% 26%)" },
      { label: "Gedaan", value: "24", color: "hsl(160 60% 45%)" },
    ].map((k) => (
      <div key={k.label} style={{ flex: 1, background: "#fff", borderRadius: 12, padding: "14px 16px", border: "1px solid hsl(220 13% 91%)" }}>
        <div style={{ fontSize: 12, color: "hsl(220 9% 46%)", marginBottom: 4 }}>{k.label}</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: k.color }}>{k.value}</div>
      </div>
    ))}
  </div>
);

export default function ColorPreview() {
  return (
    <div style={{ minHeight: "100vh", background: "#e5e5e5", padding: 32, fontFamily: "'Inter', sans-serif" }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, color: "#1f2937" }}>Achtergrondkleur vergelijken</h1>
      <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 24 }}>Welke achtergrond is het prettigst? Let op contrast met de witte kaarten en leesbaarheid.</p>
      
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 24 }}>
        {options.map((opt) => (
          <div key={opt.label} style={{ background: opt.bg, borderRadius: 16, padding: 24, border: "2px solid hsl(220 13% 91%)" }}>
            <div style={{ marginBottom: 16, textAlign: "center" }}>
              <div style={{ fontWeight: 700, fontSize: 16, color: "#1f2937" }}>{opt.label}</div>
              <div style={{ fontSize: 12, color: "#6b7280" }}>{opt.desc}</div>
              <code style={{ fontSize: 11, color: "#9ca3af", background: "#fff", padding: "2px 6px", borderRadius: 4 }}>{opt.bg}</code>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <KpiRow />
              <MiniCard />
              <MiniSidebar />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
