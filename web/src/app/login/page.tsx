"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [registerMode, setRegisterMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const endpoint = registerMode ? "/api/auth/register" : "/api/auth/login";
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error || "Innlogging feilet");
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <main className="app-shell" style={{ maxWidth: 520, paddingTop: 40 }}>
      <section className="card">
        <h1>{registerMode ? "Opprett bruker" : "Logg inn"}</h1>
        <p className="muted">KOLS årskontroll – sikker innlogging per lege.</p>

        <form onSubmit={submit} className="grid" style={{ marginTop: 12 }}>
          <label>
            E-post
            <input placeholder="navn@epost.no" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label>
            Passord
            <input placeholder="••••••••" type="password" autoComplete={registerMode ? "new-password" : "current-password"} value={password} onChange={(e) => setPassword(e.target.value)} required />
          </label>
          <button type="submit" className="button-primary">{registerMode ? "Opprett" : "Logg inn"}</button>
        </form>

        {error && <p className="error">{error}</p>}

        <button onClick={() => setRegisterMode((v) => !v)} className="button-ghost" style={{ marginTop: 8 }}>
          {registerMode ? "Har du bruker? Logg inn" : "Ingen bruker? Opprett"}
        </button>
      </section>
    </main>
  );
}
