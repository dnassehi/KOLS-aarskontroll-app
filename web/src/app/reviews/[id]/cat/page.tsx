"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

const CAT_ITEMS = [
  ["Jeg hoster aldri", "Jeg hoster hele tiden"],
  ["Jeg har ikke slim i brystet i det hele tatt", "Jeg har brystet fullt av slim"],
  ["Brystet føles ikke tett i det hele tatt", "Brystet føles svært tett"],
  ["Jeg er ikke andpusten når jeg går opp en bakke eller en trapp mellom to etasjer", "Jeg er svært andpusten når jeg går opp en bakke eller en trapp mellom to etasjer"],
  ["Jeg blir ikke begrenset ved noen aktiviteter som jeg gjør hjemme", "Jeg blir svært begrenset når jeg utfører aktiviteter hjemme"],
  ["Jeg føler meg trygg når jeg går ut, til tross for lungesykdommen", "Jeg føler meg overhode ikke trygg når jeg går ut, pga. lungesykdommen"],
  ["Jeg sover godt", "Jeg sover ikke godt på grunn av min lungesykdom"],
  ["Jeg har mye energi", "Jeg har ingen energi i det hele tatt"],
] as const;

export default function CatPage() {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [vals, setVals] = useState<number[]>([0, 0, 0, 0, 0, 0, 0, 0]);

  useEffect(() => {
    (async () => {
      const r = await fetch(`/api/reviews/${id}`);
      if (!r.ok) {
        setMsg("Kunne ikke laste CAT-data");
        setLoading(false);
        return;
      }
      const j = await r.json();
      setVals([
        Number(j.catQ1 ?? 0),
        Number(j.catQ2 ?? 0),
        Number(j.catQ3 ?? 0),
        Number(j.catQ4 ?? 0),
        Number(j.catQ5 ?? 0),
        Number(j.catQ6 ?? 0),
        Number(j.catQ7 ?? 0),
        Number(j.catQ8 ?? 0),
      ]);
      setLoading(false);
    })();
  }, [id]);

  const total = useMemo(() => vals.reduce((a, b) => a + b, 0), [vals]);

  const burden = useMemo(() => {
    if (total <= 9) return "Lav påvirkning";
    if (total <= 20) return "Moderat påvirkning";
    if (total <= 30) return "Høy påvirkning";
    return "Svært høy påvirkning";
  }, [total]);

  async function save() {
    setSaving(true);
    setMsg(null);
    const body = {
      catQ1: vals[0], catQ2: vals[1], catQ3: vals[2], catQ4: vals[3],
      catQ5: vals[4], catQ6: vals[5], catQ7: vals[6], catQ8: vals[7],
      catScore: total,
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
    setMsg("CAT lagret. Oppdaterer skjema og lukker fanen...");

    try {
      localStorage.setItem(`catSaved-${id}`, String(Date.now()));
    } catch {}

    try {
      if (window.opener && !window.opener.closed) {
        window.opener.postMessage({ type: "cat-saved", reviewId: id }, window.location.origin);
      }
    } catch {
      // ignore cross-window errors
    }

    setTimeout(() => {
      window.close();
    }, 250);
  }

  if (loading) return <main className="app-shell">Laster CAT...</main>;

  return (
    <main className="app-shell">
      <section className="card">
        <h1>CAT – COPD Assessment Test</h1>
        <p className="muted">Skår hvert spørsmål fra 0 til 5 med slider.</p>

        <div style={{ display: "grid", gap: 18 }}>
          {CAT_ITEMS.map(([left, right], idx) => (
            <div key={idx} style={{ border: "1px solid var(--border)", borderRadius: 10, padding: 12 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 10, alignItems: "center" }}>
                <div>{left}</div>
                <div style={{ fontWeight: 700, minWidth: 20, textAlign: "center" }}>{vals[idx]}</div>
                <div style={{ textAlign: "right" }}>{right}</div>
              </div>
              <input
                type="range"
                min={0}
                max={5}
                step={1}
                value={vals[idx]}
                onChange={(e) => {
                  const nv = [...vals];
                  nv[idx] = Number(e.target.value);
                  setVals(nv);
                }}
                style={{ width: "100%", marginTop: 8 }}
              />
            </div>
          ))}
        </div>

        <div style={{ marginTop: 16, padding: 12, borderRadius: 10, background: "#f6f8fc" }}>
          <b>CAT totalskår: {total} / 40</b>
          <div className="muted">Vurdering: {burden}</div>
        </div>

        <div className="actions" style={{ marginTop: 12 }}>
          <button className="button-primary" onClick={save} disabled={saving}>{saving ? "Lagrer..." : "Lagre CAT"}</button>
        </div>

        {msg && <div className="message" style={{ marginTop: 10 }}>{msg}</div>}

        <p className="muted" style={{ marginTop: 18, fontSize: 12 }}>
          CAT (COPD Assessment Test) er et varemerke for GlaxoSmithKline-gruppen. ©2009 GlaxoSmithKline-gruppen. Med enerett.
        </p>
      </section>
    </main>
  );
}
