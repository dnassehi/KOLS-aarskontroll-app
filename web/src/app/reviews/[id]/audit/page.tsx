"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

// ─── AUDIT spørsmål og svaralternativer ────────────────────────────────────

const FREQ_OPTIONS = [
  { label: "Aldri", value: 0 },
  { label: "Sjeldnere enn månedlig", value: 1 },
  { label: "Månedlig", value: 2 },
  { label: "Ukentlig", value: 3 },
  { label: "Daglig eller nesten daglig", value: 4 },
];

const AUDIT_QUESTIONS: {
  q: string;
  hint?: string;
  options: { label: string; value: number }[];
}[] = [
  // Q1
  {
    q: "Hvor ofte drikker du alkohol?",
    options: [
      { label: "Aldri", value: 0 },
      { label: "Månedlig eller sjeldnere", value: 1 },
      { label: "2–4 ganger per måned", value: 2 },
      { label: "2–3 ganger per uke", value: 3 },
      { label: "4 ganger per uke eller mer", value: 4 },
    ],
  },
  // Q2
  {
    q: "Hvor mange enheter alkohol drikker du på en typisk dag når du drikker?",
    hint: "1 enhet ≈ 1 glass vin / 1/3 liter øl / 4 cl brennevin",
    options: [
      { label: "1–2", value: 0 },
      { label: "3–4", value: 1 },
      { label: "5–6", value: 2 },
      { label: "7–9", value: 3 },
      { label: "10 eller mer", value: 4 },
    ],
  },
  // Q3
  {
    q: "Hvor ofte drikker du 6 eller mer enheter ved en anledning?",
    options: [
      { label: "Aldri", value: 0 },
      { label: "Sjeldnere enn månedlig", value: 1 },
      { label: "Månedlig", value: 2 },
      { label: "Ukentlig", value: 3 },
      { label: "Daglig eller nesten daglig", value: 4 },
    ],
  },
  // Q4
  {
    q: "Hvor ofte i løpet av siste år klarte du ikke å stoppe drikkingen når du hadde begynt?",
    options: FREQ_OPTIONS,
  },
  // Q5
  {
    q: "Hvor ofte i løpet av siste år klarte du ikke å gjøre det du normalt skulle gjøre fordi du hadde drukket?",
    options: FREQ_OPTIONS,
  },
  // Q6
  {
    q: "Hvor ofte i løpet av siste år trengte du et glass alkohol om morgenen for å komme i gang etter en natt med mye drikking?",
    options: FREQ_OPTIONS,
  },
  // Q7
  {
    q: "Hvor ofte i løpet av siste år har du hatt skyldfølelse eller dårlig samvittighet fordi du drakk?",
    options: FREQ_OPTIONS,
  },
  // Q8
  {
    q: "Hvor ofte i løpet av siste år klarte du ikke å huske hva som skjedde kvelden i forveien fordi du hadde drukket?",
    options: FREQ_OPTIONS,
  },
  // Q9
  {
    q: "Har du, eller har noen andre, blitt skadet som følge av at du drakk?",
    options: [
      { label: "Nei", value: 0 },
      { label: "Ja, men ikke i løpet av siste år", value: 2 },
      { label: "Ja, i løpet av siste år", value: 4 },
    ],
  },
  // Q10
  {
    q: "Har en slektning, venn, lege eller annen helseperson uttrykt bekymring for drikkingen din eller foreslått at du burde redusere?",
    options: [
      { label: "Nei", value: 0 },
      { label: "Ja, men ikke i løpet av siste år", value: 2 },
      { label: "Ja, i løpet av siste år", value: 4 },
    ],
  },
];

// ─── Hjelpefunksjoner ──────────────────────────────────────────────────────

function auditCThreshold(sex: string | null): number {
  return sex === "F" ? 3 : 4; // default til menn (4) ved ukjent
}

function auditCInterpretation(score: number, sex: string | null): string {
  const threshold = auditCThreshold(sex);
  if (score < threshold) return "Under grenseverdi – full AUDIT ikke nødvendig";
  return `Grenseverdi nådd (≥${threshold}) – gå videre med full AUDIT`;
}

function auditInterpretation(score: number): string {
  if (score <= 7) return "Lav risiko";
  if (score <= 15) return "Moderat risiko – kortintervensjon anbefales";
  if (score <= 19) return "Skadelig bruk – behandling bør vurderes";
  return "Trolig avhengighet – grundig utredning og behandling";
}

// ─── Komponent ─────────────────────────────────────────────────────────────

export default function AuditPage() {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [sex, setSex] = useState<string | null>(null);

  // Q1–Q10, null = ikke besvart
  const [vals, setVals] = useState<(number | null)[]>(Array(10).fill(null));

  useEffect(() => {
    (async () => {
      const r = await fetch(`/api/reviews/${id}`);
      if (!r.ok) {
        setMsg("Kunne ikke laste AUDIT-data");
        setLoading(false);
        return;
      }
      const j = await r.json();
      setSex(j.gliSex ?? null);
      setVals([
        j.auditQ1  ?? null,
        j.auditQ2  ?? null,
        j.auditQ3  ?? null,
        j.auditQ4  ?? null,
        j.auditQ5  ?? null,
        j.auditQ6  ?? null,
        j.auditQ7  ?? null,
        j.auditQ8  ?? null,
        j.auditQ9  ?? null,
        j.auditQ10 ?? null,
      ]);
      setLoading(false);
    })();
  }, [id]);

  const auditCScore = useMemo(() => {
    const q1 = vals[0]; const q2 = vals[1]; const q3 = vals[2];
    if (q1 === null || q2 === null || q3 === null) return null;
    return q1 + q2 + q3;
  }, [vals]);

  const threshold = auditCThreshold(sex);
  const showFullAudit = auditCScore !== null && auditCScore >= threshold;

  const auditScore = useMemo(() => {
    if (!showFullAudit) return null;
    if (vals.some((v) => v === null)) return null;
    return (vals as number[]).reduce((a, b) => a + b, 0);
  }, [vals, showFullAudit]);

  function setVal(idx: number, value: number) {
    setVals((prev) => {
      const next = [...prev];
      next[idx] = value;
      return next;
    });
  }

  async function save() {
    setSaving(true);
    setMsg(null);

    const computedAuditC = auditCScore;
    const computedAudit = showFullAudit ? auditScore : null;

    const body: Record<string, number | null> = {
      auditQ1:  vals[0], auditQ2:  vals[1], auditQ3: vals[2],
      auditQ4:  vals[3], auditQ5:  vals[4], auditQ6: vals[5],
      auditQ7:  vals[6], auditQ8:  vals[7], auditQ9: vals[8],
      auditQ10: vals[9],
      auditCScore: computedAuditC,
      auditScore: computedAudit,
    };

    const r = await fetch(`/api/reviews/${id}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!r.ok) {
      const j = await r.json().catch(() => ({}));
      setMsg(j.error || "Lagring feilet");
      setSaving(false);
      return;
    }

    setSaving(false);
    setMsg("AUDIT lagret. Oppdaterer skjema og lukker fanen...");

    try { localStorage.setItem(`auditSaved-${id}`, String(Date.now())); } catch {}
    try {
      if (window.opener && !window.opener.closed) {
        window.opener.postMessage({ type: "audit-saved", reviewId: id }, window.location.origin);
      }
    } catch {}

    setTimeout(() => { window.close(); }, 250);
  }

  if (loading) return <main className="app-shell">Laster AUDIT...</main>;

  return (
    <main className="app-shell">
      <section className="card">
        <h1>AUDIT – Alcohol Use Disorders Identification Test</h1>
        <p className="muted">
          Besvart fra pasienten. AUDIT-C er de tre første spørsmålene.
          Grenseverdi for videre AUDIT: ≥4 (menn) / ≥3 (kvinner).
        </p>

        {/* Sex-override hvis ikke registrert */}
        {!sex && (
          <div style={{ marginBottom: 16, padding: 10, borderRadius: 10, background: "#fffbe6", border: "1px solid #f0c040" }}>
            <b>Kjønn ikke registrert i skjemaet.</b>{" "}
            Grenseverdi er satt til menn (≥4) som standard.{" "}
            <label style={{ marginLeft: 8 }}>
              Overstyr:{" "}
              <select value={sex ?? ""} onChange={(e) => setSex(e.target.value || null)}>
                <option value="">Mann (standard)</option>
                <option value="M">Mann</option>
                <option value="F">Kvinne</option>
              </select>
            </label>
          </div>
        )}

        {/* AUDIT-C — Q1–Q3 */}
        <h3 style={{ marginTop: 16 }}>AUDIT-C (spørsmål 1–3)</h3>
        <div style={{ display: "grid", gap: 14 }}>
          {AUDIT_QUESTIONS.slice(0, 3).map((item, idx) => (
            <div key={idx} style={{ border: "1px solid var(--border)", borderRadius: 10, padding: 12 }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>
                {idx + 1}. {item.q}
              </div>
              {item.hint && <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>{item.hint}</div>}
              <select
                value={vals[idx] ?? ""}
                onChange={(e) => setVal(idx, Number(e.target.value))}
                style={{ width: "100%" }}
              >
                <option value="">– Velg svar –</option>
                {item.options.map((o) => (
                  <option key={o.value} value={o.value}>{o.label} ({o.value} p)</option>
                ))}
              </select>
            </div>
          ))}
        </div>

        {/* AUDIT-C score og vurdering */}
        {auditCScore !== null && (
          <div style={{ marginTop: 14, padding: 12, borderRadius: 10, background: "#f6f8fc" }}>
            <b>AUDIT-C skår: {auditCScore} / 12</b>
            <div
              className="muted"
              style={{ color: showFullAudit ? "#b42318" : "#067647", fontWeight: 600, marginTop: 4 }}
            >
              {auditCInterpretation(auditCScore, sex)}
            </div>
          </div>
        )}

        {/* Full AUDIT — Q4–Q10 */}
        {showFullAudit && (
          <>
            <h3 style={{ marginTop: 24 }}>Full AUDIT (spørsmål 4–10)</h3>
            <div style={{ display: "grid", gap: 14 }}>
              {AUDIT_QUESTIONS.slice(3).map((item, i) => {
                const idx = i + 3;
                return (
                  <div key={idx} style={{ border: "1px solid var(--border)", borderRadius: 10, padding: 12 }}>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>
                      {idx + 1}. {item.q}
                    </div>
                    <select
                      value={vals[idx] ?? ""}
                      onChange={(e) => setVal(idx, Number(e.target.value))}
                      style={{ width: "100%" }}
                    >
                      <option value="">– Velg svar –</option>
                      {item.options.map((o) => (
                        <option key={o.value} value={o.value}>{o.label} ({o.value} p)</option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>

            {auditScore !== null && (
              <div style={{ marginTop: 14, padding: 12, borderRadius: 10, background: "#f6f8fc" }}>
                <b>AUDIT totalskår: {auditScore} / 40</b>
                <div className="muted" style={{ marginTop: 4 }}>{auditInterpretation(auditScore)}</div>
              </div>
            )}
          </>
        )}

        <div className="actions" style={{ marginTop: 16 }}>
          <button className="button-primary" onClick={save} disabled={saving || auditCScore === null}>
            {saving ? "Lagrer..." : "Lagre AUDIT"}
          </button>
        </div>

        {msg && <div className="message" style={{ marginTop: 10 }}>{msg}</div>}

        <p className="muted" style={{ marginTop: 18, fontSize: 12 }}>
          AUDIT er utviklet av Verdens helseorganisasjon (WHO). Babor T et al., AUDIT: The Alcohol Use Disorders Identification Test, WHO 2001.
        </p>
      </section>
    </main>
  );
}
