"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

type FormState = Record<string, string | number | boolean | null | undefined>;

const mmrcOptions = [
  "Grad 0: Ingen dyspné unntatt ved svært anstrengende fysisk aktivitet.",
  "Grad 1: Kortpustethet ved rask gange på flat mark eller opp en svak bakke.",
  "Grad 2: Må gå saktere enn jevnaldrende på flat mark eller må stoppe for å puste ved normal gangfart.",
  "Grad 3: Må stoppe for å puste etter ca. 100 meter eller etter noen minutter på flat mark.",
  "Grad 4: For kortpustet til å forlate huset eller blir kortpustet ved påkledning.",
];

function toNbString(v: unknown) {
  if (v === null || v === undefined || v === "") return "";
  return String(v).replace(".", ",");
}

function parseNbNumber(v: unknown) {
  if (v === "" || v === null || v === undefined) return null;
  const s = String(v).trim().replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function formatNbDecimal(v: number | null, digits = 2) {
  if (v == null) return "";
  return v.toFixed(digits).replace(".", ",");
}

export default function EditReviewPage() {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState<FormState>({});
  const [meta, setMeta] = useState<{ patientCode?: string; reviewYear?: number }>({});

  useEffect(() => {
    (async () => {
      const r = await fetch(`/api/reviews/${id}`);
      if (!r.ok) {
        setMsg("Kunne ikke laste skjema");
        setLoading(false);
        return;
      }
      const j = await r.json();
      setMeta({ patientCode: j.patient?.patientCode, reviewYear: j.reviewYear });
      setForm({
        catScore: j.catScore ?? "",
        mmrc: j.mmrc ?? "",
        exacerbationsLast12m: j.exacerbationsLast12m ?? "",
        hospitalizationsLast12m: j.hospitalizationsLast12m ?? "",
        fev1L: toNbString(j.fev1L),
        fev1PercentPred: toNbString(j.fev1PercentPred),
        fvcL: toNbString(j.fvcL),
        fev1Fvc: toNbString(j.fev1Fvc),
        spo2: toNbString(j.spo2),
        eosinophils: toNbString(j.eosinophils),
        smokeStatus: j.smokeStatus ?? "",
        smokingActive: typeof j.smokingActive === "boolean" ? j.smokingActive : "",
        packYears: toNbString(j.packYears),
        heightCm: toNbString(j.heightCm),
        weightKg: toNbString(j.weightKg),
        chestXrayYear: j.chestXrayYear ?? "",
        comorbCvd: !!j.comorbCvd,
        comorbKidneyDisease: !!j.comorbKidneyDisease,
        comorbDiabetesMetSyn: !!j.comorbDiabetesMetSyn,
        comorbOsteoporosis: !!j.comorbOsteoporosis,
        comorbAnxietyDepression: !!j.comorbAnxietyDepression,
        medLaba: !!j.medLaba,
        medLama: !!j.medLama,
        medIcs: !!j.medIcs,
        medSama: !!j.medSama,
        medSaba: !!j.medSaba,
        medPde4: !!j.medPde4,
        influenzaDate: j.influenzaDate ? String(j.influenzaDate).slice(0, 10) : "",
        pneumococcalDate: j.pneumococcalDate ? String(j.pneumococcalDate).slice(0, 10) : "",
        covidDate: j.covidDate ? String(j.covidDate).slice(0, 10) : "",
        rsvDate: j.rsvDate ? String(j.rsvDate).slice(0, 10) : "",
        notes: j.notes ?? "",
      });
      setLoading(false);
    })();
  }, [id]);

  function setValue(name: string, value: string | number | boolean) {
    setForm((f) => ({ ...f, [name]: value }));
  }

  const autoFev1Fvc = useMemo(() => {
    const fev1 = parseNbNumber(form.fev1L);
    const fvc = parseNbNumber(form.fvcL);
    if (fev1 == null || fvc == null || fvc === 0) return null;
    return fev1 / fvc;
  }, [form.fev1L, form.fvcL]);

  const autoBmi = useMemo(() => {
    const heightCm = parseNbNumber(form.heightCm);
    const weightKg = parseNbNumber(form.weightKg);
    if (heightCm == null || weightKg == null || heightCm <= 0) return null;
    const heightM = heightCm / 100;
    return weightKg / (heightM * heightM);
  }, [form.heightCm, form.weightKg]);

  function isValidNbNumberInput(v: unknown) {
    if (v === "" || v === null || v === undefined) return true;
    return /^\d+(,\d+)?$/.test(String(v).trim());
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!isValidNbNumberInput(form.fev1L)) e.fev1L = "Ugyldig tall. Bruk f.eks. 1,5";
    if (!isValidNbNumberInput(form.fvcL)) e.fvcL = "Ugyldig tall. Bruk f.eks. 3,1";
    if (!isValidNbNumberInput(form.fev1PercentPred)) e.fev1PercentPred = "Ugyldig tall. Bruk f.eks. 52,3";
    if (!isValidNbNumberInput(form.spo2)) e.spo2 = "Ugyldig tall. Bruk heltall eller komma";
    if (!isValidNbNumberInput(form.eosinophils)) e.eosinophils = "Ugyldig tall. Bruk heltall eller komma";
    if (!isValidNbNumberInput(form.heightCm)) e.heightCm = "Ugyldig tall. Bruk f.eks. 172";
    if (!isValidNbNumberInput(form.weightKg)) e.weightKg = "Ugyldig tall. Bruk f.eks. 74,5";

    const cat = parseNbNumber(form.catScore);
    if (cat != null && (cat < 0 || cat > 40)) e.catScore = "CAT må være mellom 0 og 40";

    const mmrc = parseNbNumber(form.mmrc);
    if (mmrc != null && (mmrc < 0 || mmrc > 4)) e.mmrc = "mMRC må være mellom 0 og 4";

    const spo2 = parseNbNumber(form.spo2);
    if (spo2 != null && (spo2 < 50 || spo2 > 100)) e.spo2 = "SpO2 må være mellom 50 og 100";

    const fev1fvc = autoFev1Fvc;
    if (fev1fvc != null && (fev1fvc <= 0 || fev1fvc > 2)) e.fev1Fvc = "FEV1/FVC ser ugyldig ut";

    const heightCm = parseNbNumber(form.heightCm);
    if (heightCm != null && (heightCm < 100 || heightCm > 250)) e.heightCm = "Høyde må være mellom 100 og 250 cm";

    const weightKg = parseNbNumber(form.weightKg);
    if (weightKg != null && (weightKg < 20 || weightKg > 400)) e.weightKg = "Vekt må være mellom 20 og 400 kg";

    const chestXrayYear = parseNbNumber(form.chestXrayYear);
    const nowYear = new Date().getFullYear();
    if (chestXrayYear != null && (!Number.isInteger(chestXrayYear) || chestXrayYear < 1950 || chestXrayYear > nowYear)) {
      e.chestXrayYear = `Årstall må være et heltall mellom 1950 og ${nowYear}`;
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function save() {
    setSaving(true);
    setMsg(null);
    if (!validate()) {
      setMsg("Skjema har feil. Se røde felter under.");
      setSaving(false);
      return;
    }

    const payload = {
      ...form,
      catScore: parseNbNumber(form.catScore),
      mmrc: parseNbNumber(form.mmrc),
      exacerbationsLast12m: parseNbNumber(form.exacerbationsLast12m),
      hospitalizationsLast12m: parseNbNumber(form.hospitalizationsLast12m),
      fev1L: parseNbNumber(form.fev1L),
      fev1PercentPred: parseNbNumber(form.fev1PercentPred),
      fvcL: parseNbNumber(form.fvcL),
      fev1Fvc: autoFev1Fvc ?? parseNbNumber(form.fev1Fvc),
      spo2: parseNbNumber(form.spo2),
      eosinophils: parseNbNumber(form.eosinophils),
      packYears: parseNbNumber(form.packYears),
      smokingActive: form.smokingActive === "" ? null : form.smokingActive === true || form.smokingActive === "true",
      heightCm: parseNbNumber(form.heightCm),
      weightKg: parseNbNumber(form.weightKg),
      bmi: autoBmi == null ? null : Number(autoBmi.toFixed(2)),
      chestXrayYear: parseNbNumber(form.chestXrayYear),
    };

    const r = await fetch(`/api/reviews/${id}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) {
      setMsg(j.error || "Lagring feilet");
      setSaving(false);
      return;
    }

    const code = meta.patientCode ? encodeURIComponent(meta.patientCode) : "";
    window.location.href = code ? `/?patientCode=${code}&saved=1` : `/?saved=1`;
  }

  if (loading) return <main className="app-shell">Laster...</main>;

  return (
    <main className="app-shell">
      <div className="topbar">
        <div>
          <h1>KOLS årskontroll – rediger</h1>
          <div className="muted">Pasient-ID: <b>{meta.patientCode}</b> · År: <b>{meta.reviewYear}</b></div>
        </div>
      </div>

      <section className="card">
        <h3>Symptomer og forverring</h3>
        <div className="grid grid-2">
          <label>CAT <input value={String(form.catScore ?? "")} onChange={(e) => setValue("catScore", e.target.value)} />{errors.catScore && <div className="error">{errors.catScore}</div>}</label>
          <label>mMRC
            <select value={String(form.mmrc ?? "")} onChange={(e) => setValue("mmrc", e.target.value)}>
              <option value="">Velg grad</option>
              {mmrcOptions.map((m, i) => <option key={i} value={i}>{m}</option>)}
            </select>
            {errors.mmrc && <div className="error">{errors.mmrc}</div>}
          </label>
          <label>Eksaserbasjoner siste 12 mnd <input value={String(form.exacerbationsLast12m ?? "")} onChange={(e) => setValue("exacerbationsLast12m", e.target.value)} /></label>
          <label>Innleggelser siste 12 mnd <input value={String(form.hospitalizationsLast12m ?? "")} onChange={(e) => setValue("hospitalizationsLast12m", e.target.value)} /></label>
        </div>
      </section>

      <section className="card">
        <h3>Spirometri</h3>
        <p className="muted">Bruk norske desimaler (komma), f.eks. 3,1</p>
        <div className="grid grid-2">
          <label>FEV1 (L/s) <input value={String(form.fev1L ?? "")} onChange={(e) => setValue("fev1L", e.target.value)} />{errors.fev1L && <div className="error">{errors.fev1L}</div>}</label>
          <label>FEV1 % pred <input value={String(form.fev1PercentPred ?? "")} onChange={(e) => setValue("fev1PercentPred", e.target.value)} />{errors.fev1PercentPred && <div className="error">{errors.fev1PercentPred}</div>}</label>
          <label>FVC (L) <input value={String(form.fvcL ?? "")} onChange={(e) => setValue("fvcL", e.target.value)} />{errors.fvcL && <div className="error">{errors.fvcL}</div>}</label>
          <label>FEV1/FVC (auto) <input value={autoFev1Fvc == null ? "" : formatNbDecimal(autoFev1Fvc)} readOnly />{errors.fev1Fvc && <div className="error">{errors.fev1Fvc}</div>}</label>
          <label>SpO2 <input value={String(form.spo2 ?? "")} onChange={(e) => setValue("spo2", e.target.value)} />{errors.spo2 && <div className="error">{errors.spo2}</div>}</label>
          <label>Eosinofile <input value={String(form.eosinophils ?? "")} onChange={(e) => setValue("eosinophils", e.target.value)} />{errors.eosinophils && <div className="error">{errors.eosinophils}</div>}</label>
        </div>
      </section>

      <section className="card">
        <h3>Røyking, antropometri og komorbiditet</h3>
        <div className="grid grid-2">
          <label>Røykestatus (ja/nei)
            <select value={String(form.smokingActive ?? "")} onChange={(e) => setValue("smokingActive", e.target.value)}>
              <option value="">Ikke registrert</option>
              <option value="true">Ja</option>
              <option value="false">Nei</option>
            </select>
          </label>
          <label>Røntgen thorax (siste årstall)
            <input value={String(form.chestXrayYear ?? "")} onChange={(e) => setValue("chestXrayYear", e.target.value)} />
            {errors.chestXrayYear && <div className="error">{errors.chestXrayYear}</div>}
          </label>

          <label>Høyde (cm)
            <input value={String(form.heightCm ?? "")} onChange={(e) => setValue("heightCm", e.target.value)} />
            {errors.heightCm && <div className="error">{errors.heightCm}</div>}
          </label>
          <label>Vekt (kg)
            <input value={String(form.weightKg ?? "")} onChange={(e) => setValue("weightKg", e.target.value)} />
            {errors.weightKg && <div className="error">{errors.weightKg}</div>}
          </label>

          <label>BMI (auto)
            <input value={autoBmi == null ? "" : formatNbDecimal(autoBmi, 2)} readOnly />
          </label>
        </div>

        <div style={{ marginTop: 12 }}>
          <div className="muted" style={{ marginBottom: 6 }}>Komorbiditeter (flere valg mulig)</div>
          <div className="grid grid-2">
            {[
              ["comorbCvd", "Hjerte-karsykdom"],
              ["comorbKidneyDisease", "Nyresykdom"],
              ["comorbDiabetesMetSyn", "Diabetes/metabolsk syndrom"],
              ["comorbOsteoporosis", "Osteoporose"],
              ["comorbAnxietyDepression", "Angst/depresjon"],
            ].map(([k, label]) => (
              <label key={k}><input type="checkbox" checked={Boolean(form[k])} onChange={(e) => setValue(k, e.target.checked)} /> {label}</label>
            ))}
          </div>
        </div>
      </section>

      <section className="card">
        <h3>Medikamentklasser</h3>
        <div className="grid grid-3">
          {[["medLaba", "LABA"], ["medLama", "LAMA"], ["medIcs", "ICS"], ["medSama", "SAMA"], ["medSaba", "SABA"], ["medPde4", "PDE4-hemmer"]].map(([k, label]) => (
            <label key={k}><input type="checkbox" checked={Boolean(form[k])} onChange={(e) => setValue(k, e.target.checked)} /> {label}</label>
          ))}
        </div>
      </section>

      <section className="card">
        <h3>Vaksiner og notat</h3>
        <div className="grid grid-2">
          <label>Influensa dato <input type="date" value={String(form.influenzaDate ?? "")} onChange={(e) => setValue("influenzaDate", e.target.value)} /></label>
          <label>Pneumokokk dato <input type="date" value={String(form.pneumococcalDate ?? "")} onChange={(e) => setValue("pneumococcalDate", e.target.value)} /></label>
          <label>Covid dato <input type="date" value={String(form.covidDate ?? "")} onChange={(e) => setValue("covidDate", e.target.value)} /></label>
          <label>RSV dato <input type="date" value={String(form.rsvDate ?? "")} onChange={(e) => setValue("rsvDate", e.target.value)} /></label>
        </div>
        <label style={{ marginTop: 10 }}>Notat
          <textarea rows={4} style={{ width: "100%" }} value={String(form.notes ?? "")} onChange={(e) => setValue("notes", e.target.value)} />
        </label>
      </section>

      <div className="sticky-actions">
        <div className="actions">
          <button onClick={save} disabled={saving} className="button-primary">{saving ? "Lagrer..." : "Ferdig (lagre skjema)"}</button>
          <a href="/" className="button-ghost" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "10px 12px", borderRadius: 10, border: "1px solid var(--border)" }}>Tilbake til pasientsiden</a>
        </div>
      </div>

      {msg && <div className="message">{msg}</div>}
    </main>
  );
}
