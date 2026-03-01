"use client";

import { useEffect, useState } from "react";

type Patient = {
  id: string;
  patientCode: string;
  name?: string | null;
  reviews: Array<{ id: string; reviewYear: number }>;
};

export default function Dashboard({ email }: { email: string }) {
  const [patientCode, setPatientCode] = useState("");
  const [name, setName] = useState("");
  const [patient, setPatient] = useState<Patient | null>(null);
  const [year, setYear] = useState(new Date().getFullYear());
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    const qp = new URLSearchParams(window.location.search);
    const patientCodeFromUrl = qp.get("patientCode");
    const saved = qp.get("saved");
    if (patientCodeFromUrl) {
      setPatientCode(patientCodeFromUrl);
      void lookup(patientCodeFromUrl);
    }
    if (saved === "1") {
      setMsg("Skjema lagret");
    }
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  async function lookup(codeArg?: string) {
    setMsg(null);
    const code = codeArg ?? patientCode;
    const r = await fetch(`/api/patients?patientCode=${encodeURIComponent(code)}`);
    if (!r.ok) {
      setPatient(null);
      setMsg("Pasient ikke funnet");
      return;
    }
    setPatient(await r.json());
  }

  async function createPatient() {
    setMsg(null);
    const r = await fetch("/api/patients", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ patientCode, name }),
    });
    const j = await r.json();
    if (!r.ok) return setMsg(j.error || "Kunne ikke opprette pasient");
    setPatient({ ...j, reviews: [] });
    setMsg("Pasient opprettet");
  }

  async function createReview() {
    if (!patient) return;
    const r = await fetch("/api/reviews", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ patientId: patient.id, reviewYear: year }),
    });
    const j = await r.json();
    if (!r.ok) return setMsg(j.error || "Kunne ikke opprette årskontroll");
    window.location.href = `/reviews/${j.id}/edit`;
  }

  async function cloneFromPrevious() {
    if (!patient) return;
    const fromYear = year - 1;
    const r = await fetch("/api/reviews/clone", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ patientId: patient.id, fromYear, toYear: year }),
    });
    const j = await r.json();
    if (!r.ok) return setMsg(j.error || "Clone feilet");
    window.location.href = `/reviews/${j.id}/edit`;
  }

  return (
    <main className="app-shell">
      <div className="topbar">
        <div>
          <h1>KOLS årskontroll</h1>
          <div className="muted">Samme stil som Sokrates, mobilvennlig og rask journalføring.</div>
        </div>
        <div className="row">
          <small className="muted">Innlogget: {email}</small>
          <button onClick={logout} className="button-ghost button-inline">Logg ut</button>
        </div>
      </div>

      <section className="card">
        <h3>1) Finn eller opprett pasient</h3>
        <div className="grid grid-4">
          <label>
            Pasient-ID
            <input placeholder="f.eks. 12345" value={patientCode} onChange={(e) => setPatientCode(e.target.value)} />
          </label>
          <label>
            Navn (valgfritt)
            <input placeholder="Kun internt" value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <button onClick={() => lookup()} className="button-ghost">Søk</button>
          <button onClick={createPatient} className="button-primary">Opprett</button>
        </div>
      </section>

      {patient && (
        <section className="card">
          <h3>2) Årskontroll for {patient.patientCode}</h3>
          <div className="grid grid-3">
            <label>
              År
              <input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} />
            </label>
            <button onClick={createReview} className="button-primary">Ny tom årskontroll</button>
            <button onClick={cloneFromPrevious} className="button-ghost">Nytt skjema fra forrige år</button>
          </div>

          <p className="muted">Eksisterende år: {patient.reviews.map((r) => r.reviewYear).join(", ") || "ingen"}</p>
          <ul className="list">
            {patient.reviews.map((r) => (
              <li key={r.id}>
                {r.reviewYear} – <a href={`/reviews/${r.id}/edit`}>Rediger</a> | <a href={`/api/reviews/${r.id}/export/text`}>Tekst</a> |{" "}
                <a href={`/api/reviews/${r.id}/export/pdf`} target="_blank">PDF</a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {msg && <div className="message">{msg}</div>}
    </main>
  );
}
