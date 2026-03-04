"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { calculateGli } from "@/lib/gli";

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

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
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
        responseTestSaba: !!j.responseTestSaba,
        responseTestSama: !!j.responseTestSama,
        postFev1L: toNbString(j.postFev1L),
        postFev1PercentPred: toNbString(j.postFev1PercentPred),
        postFvcL: toNbString(j.postFvcL),
        postFev1Fvc: toNbString(j.postFev1Fvc),
        gliAge: toNbString(j.gliAge),
        gliSex: j.gliSex ?? "",
        gliEthnicity: j.gliEthnicity ?? "1",
        spo2: toNbString(j.spo2),
        eosinophils: toNbString(j.eosinophils),
        smokeStatus: j.smokeStatus ?? "",
        smokingActive: typeof j.smokingActive === "boolean" ? j.smokingActive : "",
        packYears: toNbString(j.packYears),
        heightCm: toNbString(j.heightCm),
        weightKg: toNbString(j.weightKg),
        chestXrayYear: j.chestXrayYear ?? "",
        chestXrayMonth: j.chestXrayMonth ?? "",
        spirometryDate: j.spirometryDate ? String(j.spirometryDate).slice(0, 10) : todayIsoDate(),
        reviewDate: j.reviewDate ? String(j.reviewDate).slice(0, 10) : todayIsoDate(),
        comorbCvd: !!j.comorbCvd,
        comorbKidneyDisease: !!j.comorbKidneyDisease,
        comorbDiabetesMetSyn: !!j.comorbDiabetesMetSyn,
        comorbOsteoporosis: !!j.comorbOsteoporosis,
        comorbAnxietyDepression: !!j.comorbAnxietyDepression,
        receivesPhysiotherapy: !!j.receivesPhysiotherapy,
        lastRehabYear: j.lastRehabYear ?? "",
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
        treatmentStepSuggestion: j.treatmentStepSuggestion ?? "",
        planOrTiltak: j.planOrTiltak ?? "",
      });
      setLoading(false);
    })();
  }, [id]);

  useEffect(() => {
    const key = `catSaved-${id}`;

    const maybeRefresh = () => {
      try {
        const v = localStorage.getItem(key);
        if (v) {
          localStorage.removeItem(key);
          window.location.reload();
        }
      } catch {}
    };

    const onMessage = (ev: MessageEvent) => {
      if (ev.origin !== window.location.origin) return;
      if (ev.data?.type === "cat-saved" && ev.data?.reviewId === id) {
        window.location.reload();
      }
    };

    window.addEventListener("focus", maybeRefresh);
    document.addEventListener("visibilitychange", maybeRefresh);
    window.addEventListener("message", onMessage);

    return () => {
      window.removeEventListener("focus", maybeRefresh);
      document.removeEventListener("visibilitychange", maybeRefresh);
      window.removeEventListener("message", onMessage);
    };
  }, [id]);

  function setValue(name: string, value: string | number | boolean) {
    setForm((f) => ({ ...f, [name]: value }));
  }

  const autoFev1Fvc = useMemo(() => {
    const fev1 = parseNbNumber(form.fev1L);
    const fvc = parseNbNumber(form.fvcL);
    if (fev1 == null || fvc == null || fvc === 0) return null;
    return (fev1 / fvc) * 100;
  }, [form.fev1L, form.fvcL]);

  const autoPostFev1Fvc = useMemo(() => {
    const fev1 = parseNbNumber(form.postFev1L);
    const fvc = parseNbNumber(form.postFvcL);
    if (fev1 == null || fvc == null || fvc === 0) return null;
    return (fev1 / fvc) * 100;
  }, [form.postFev1L, form.postFvcL]);

  const reversibility = useMemo(() => {
    const pre = parseNbNumber(form.fev1L);
    const post = parseNbNumber(form.postFev1L);
    if (pre == null || post == null || pre <= 0) return { ml: null as number | null, pct: null as number | null };
    const deltaL = post - pre;
    return {
      ml: deltaL * 1000,
      pct: (deltaL / pre) * 100,
    };
  }, [form.fev1L, form.postFev1L]);

  const gliPre = useMemo(() => {
    return calculateGli(
      parseNbNumber(form.gliAge),
      parseNbNumber(form.heightCm),
      (form.gliSex as string) || null,
      parseNbNumber(form.gliEthnicity),
      parseNbNumber(form.fev1L),
      parseNbNumber(form.fvcL),
    );
  }, [form.gliAge, form.heightCm, form.gliSex, form.gliEthnicity, form.fev1L, form.fvcL]);

  const gliPost = useMemo(() => {
    return calculateGli(
      parseNbNumber(form.gliAge),
      parseNbNumber(form.heightCm),
      (form.gliSex as string) || null,
      parseNbNumber(form.gliEthnicity),
      parseNbNumber(form.postFev1L),
      parseNbNumber(form.postFvcL),
    );
  }, [form.gliAge, form.heightCm, form.gliSex, form.gliEthnicity, form.postFev1L, form.postFvcL]);

  const gliFlag = (z?: number | null) => {
    if (z == null) return "";
    return z < -1.645 ? "Under LLN" : "Innenfor normalområde";
  };

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
    if (!isValidNbNumberInput(form.postFev1L)) e.postFev1L = "Ugyldig tall. Bruk f.eks. 1,8";
    if (!isValidNbNumberInput(form.postFvcL)) e.postFvcL = "Ugyldig tall. Bruk f.eks. 3,3";
    if (!isValidNbNumberInput(form.postFev1PercentPred)) e.postFev1PercentPred = "Ugyldig tall. Bruk f.eks. 57,0";
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
    if (fev1fvc != null && (fev1fvc <= 0 || fev1fvc > 120)) e.fev1Fvc = "FEV1/FVC (%) ser ugyldig ut";

    const postFev1Fvc = autoPostFev1Fvc;
    if (postFev1Fvc != null && (postFev1Fvc <= 0 || postFev1Fvc > 120)) e.postFev1Fvc = "Post-test FEV1/FVC (%) ser ugyldig ut";

    const heightCm = parseNbNumber(form.heightCm);
    if (heightCm != null && (heightCm < 100 || heightCm > 250)) e.heightCm = "Høyde må være mellom 100 og 250 cm";

    const weightKg = parseNbNumber(form.weightKg);
    if (weightKg != null && (weightKg < 20 || weightKg > 400)) e.weightKg = "Vekt må være mellom 20 og 400 kg";

    const chestXrayYear = parseNbNumber(form.chestXrayYear);
    const nowYear = new Date().getFullYear();
    if (chestXrayYear != null && (!Number.isInteger(chestXrayYear) || chestXrayYear < 1950 || chestXrayYear > nowYear)) {
      e.chestXrayYear = `Årstall må være et heltall mellom 1950 og ${nowYear}`;
    }

    const chestXrayMonth = parseNbNumber(form.chestXrayMonth);
    if (chestXrayMonth != null && (!Number.isInteger(chestXrayMonth) || chestXrayMonth < 1 || chestXrayMonth > 12)) {
      e.chestXrayMonth = "Måned må være heltall fra 1 til 12";
    }

    const lastRehabYear = parseNbNumber(form.lastRehabYear);
    if (lastRehabYear != null && (!Number.isInteger(lastRehabYear) || lastRehabYear < 1950 || lastRehabYear > nowYear)) {
      e.lastRehabYear = `Årstall må være et heltall mellom 1950 og ${nowYear}`;
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
      responseTestSaba: !!form.responseTestSaba,
      responseTestSama: !!form.responseTestSama,
      postFev1L: parseNbNumber(form.postFev1L),
      postFev1PercentPred: parseNbNumber(form.postFev1PercentPred),
      postFvcL: parseNbNumber(form.postFvcL),
      postFev1Fvc: autoPostFev1Fvc ?? parseNbNumber(form.postFev1Fvc),
      gliAge: parseNbNumber(form.gliAge),
      gliSex: form.gliSex || null,
      gliEthnicity: parseNbNumber(form.gliEthnicity),
      spo2: parseNbNumber(form.spo2),
      eosinophils: parseNbNumber(form.eosinophils),
      packYears: parseNbNumber(form.packYears),
      smokingActive: form.smokingActive === "" ? null : form.smokingActive === true || form.smokingActive === "true",
      heightCm: parseNbNumber(form.heightCm),
      weightKg: parseNbNumber(form.weightKg),
      bmi: autoBmi == null ? null : Number(autoBmi.toFixed(2)),
      chestXrayYear: parseNbNumber(form.chestXrayYear),
      chestXrayMonth: parseNbNumber(form.chestXrayMonth),
      receivesPhysiotherapy: !!form.receivesPhysiotherapy,
      lastRehabYear: parseNbNumber(form.lastRehabYear),
      spirometryDate: form.spirometryDate || null,
      reviewDate: form.reviewDate || null,
      planOrTiltak: form.planOrTiltak || null,
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
          <div style={{ display: "flex", alignItems: "end" }}>
            <a href={`/reviews/${id}/cat`} target="_blank" className="button-ghost" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "10px 12px", borderRadius: 10, border: "1px solid var(--border)", width: "fit-content" }}>
              Fyll ut CAT (åpnes i ny fane)
            </a>
          </div>
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
          <label>Pre-test FEV1 (L/s) <input value={String(form.fev1L ?? "")} onChange={(e) => setValue("fev1L", e.target.value)} />{errors.fev1L && <div className="error">{errors.fev1L}</div>}</label>
          <label>Pre-test FEV1 % pred <input value={String(form.fev1PercentPred ?? "")} onChange={(e) => setValue("fev1PercentPred", e.target.value)} />{errors.fev1PercentPred && <div className="error">{errors.fev1PercentPred}</div>}</label>
          <label>Pre-test FVC (L) <input value={String(form.fvcL ?? "")} onChange={(e) => setValue("fvcL", e.target.value)} />{errors.fvcL && <div className="error">{errors.fvcL}</div>}</label>
          <label>Pre-test FEV1/FVC (%) (auto) <input value={autoFev1Fvc == null ? "" : formatNbDecimal(autoFev1Fvc, 1)} readOnly />{errors.fev1Fvc && <div className="error">{errors.fev1Fvc}</div>}</label>

          <label><input type="checkbox" checked={Boolean(form.responseTestSaba)} onChange={(e) => setValue("responseTestSaba", e.target.checked)} /> Responstest gitt med SABA</label>
          <label><input type="checkbox" checked={Boolean(form.responseTestSama)} onChange={(e) => setValue("responseTestSama", e.target.checked)} /> Responstest gitt med SAMA</label>

          <label>Post-test FEV1 (L/s) <input value={String(form.postFev1L ?? "")} onChange={(e) => setValue("postFev1L", e.target.value)} />{errors.postFev1L && <div className="error">{errors.postFev1L}</div>}</label>
          <label>Post-test FEV1 % pred <input value={String(form.postFev1PercentPred ?? "")} onChange={(e) => setValue("postFev1PercentPred", e.target.value)} />{errors.postFev1PercentPred && <div className="error">{errors.postFev1PercentPred}</div>}</label>
          <label>Post-test FVC (L) <input value={String(form.postFvcL ?? "")} onChange={(e) => setValue("postFvcL", e.target.value)} />{errors.postFvcL && <div className="error">{errors.postFvcL}</div>}</label>
          <label>Post-test FEV1/FVC (%) (auto) <input value={autoPostFev1Fvc == null ? "" : formatNbDecimal(autoPostFev1Fvc, 1)} readOnly />{errors.postFev1Fvc && <div className="error">{errors.postFev1Fvc}</div>}</label>

          <label>Reversibilitet FEV1 (ml)
            <input value={reversibility.ml == null ? "" : formatNbDecimal(reversibility.ml, 0)} readOnly />
          </label>
          <label>Reversibilitet FEV1 (%)
            <input value={reversibility.pct == null ? "" : formatNbDecimal(reversibility.pct, 1)} readOnly />
          </label>

          <label>GLI alder (år)
            <input value={String(form.gliAge ?? "")} onChange={(e) => setValue("gliAge", e.target.value)} />
          </label>
          <label>GLI kjønn
            <select value={String(form.gliSex ?? "")} onChange={(e) => setValue("gliSex", e.target.value)}>
              <option value="">Velg</option>
              <option value="M">Mann</option>
              <option value="F">Kvinne</option>
            </select>
          </label>
          <label>GLI etnisitet
            <select value={String(form.gliEthnicity ?? "1")} onChange={(e) => setValue("gliEthnicity", e.target.value)}>
              <option value="1">Caucasian</option>
              <option value="2">African-American</option>
              <option value="3">North East Asian</option>
              <option value="4">South East Asian</option>
              <option value="5">Other / mixed</option>
            </select>
            <div className="muted" style={{ fontSize: 12 }}>Brukes kun til GLI-2012 beregning (%pred, z-score, LLN).</div>
          </label>

          <label>SpO2 <input value={String(form.spo2 ?? "")} onChange={(e) => setValue("spo2", e.target.value)} />{errors.spo2 && <div className="error">{errors.spo2}</div>}</label>
          <label>Eosinofile <input value={String(form.eosinophils ?? "")} onChange={(e) => setValue("eosinophils", e.target.value)} />{errors.eosinophils && <div className="error">{errors.eosinophils}</div>}</label>
          <label>Dato for spirometri
            <input type="date" value={String(form.spirometryDate ?? "")} onChange={(e) => setValue("spirometryDate", e.target.value)} />
          </label>
        </div>

        <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div style={{ border: "1px solid var(--border)", borderRadius: 10, padding: 10 }}>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>GLI-2012 (Pre-test)</div>
            <div className="muted">FEV1 %pred: {gliPre ? formatNbDecimal(gliPre.fev1.percentPred, 1) : ""} · z: {gliPre ? formatNbDecimal(gliPre.fev1.zScore, 2) : ""}</div>
            <div className="muted">FVC %pred: {gliPre ? formatNbDecimal(gliPre.fvc.percentPred, 1) : ""} · z: {gliPre ? formatNbDecimal(gliPre.fvc.zScore, 2) : ""}</div>
            <div className="muted">FEV1/FVC z: {gliPre ? formatNbDecimal(gliPre.ratio.zScore, 2) : ""} · LLN: {gliPre ? formatNbDecimal(gliPre.ratio.lln * 100, 1) : ""}%</div>
            <div style={{ marginTop: 6, fontWeight: 600, color: gliPre && gliPre.ratio.zScore < -1.645 ? "#b42318" : "#067647" }}>
              {gliPre ? gliFlag(gliPre.ratio.zScore) : ""}
            </div>
          </div>

          <div style={{ border: "1px solid var(--border)", borderRadius: 10, padding: 10 }}>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>GLI-2012 (Post-test)</div>
            <div className="muted">FEV1 %pred: {gliPost ? formatNbDecimal(gliPost.fev1.percentPred, 1) : ""} · z: {gliPost ? formatNbDecimal(gliPost.fev1.zScore, 2) : ""}</div>
            <div className="muted">FVC %pred: {gliPost ? formatNbDecimal(gliPost.fvc.percentPred, 1) : ""} · z: {gliPost ? formatNbDecimal(gliPost.fvc.zScore, 2) : ""}</div>
            <div className="muted">FEV1/FVC z: {gliPost ? formatNbDecimal(gliPost.ratio.zScore, 2) : ""} · LLN: {gliPost ? formatNbDecimal(gliPost.ratio.lln * 100, 1) : ""}%</div>
            <div style={{ marginTop: 6, fontWeight: 600, color: gliPost && gliPost.ratio.zScore < -1.645 ? "#b42318" : "#067647" }}>
              {gliPost ? gliFlag(gliPost.ratio.zScore) : ""}
            </div>
          </div>
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
          <label>Røntgen thorax (måned)
            <input value={String(form.chestXrayMonth ?? "")} onChange={(e) => setValue("chestXrayMonth", e.target.value)} />
            {errors.chestXrayMonth && <div className="error">{errors.chestXrayMonth}</div>}
          </label>
          <label>Røntgen thorax (år)
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

          <label><input type="checkbox" checked={Boolean(form.receivesPhysiotherapy)} onChange={(e) => setValue("receivesPhysiotherapy", e.target.checked)} /> Får fysioterapi</label>
          <label>Siste rehabiliteringsopphold (år)
            <input value={String(form.lastRehabYear ?? "")} onChange={(e) => setValue("lastRehabYear", e.target.value)} />
            {errors.lastRehabYear && <div className="error">{errors.lastRehabYear}</div>}
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
        <h3>Vaksiner, dato og plan</h3>
        <div className="grid grid-2">
          <label>Dato for utfylling av skjema
            <input type="date" value={String(form.reviewDate ?? "")} onChange={(e) => setValue("reviewDate", e.target.value)} />
          </label>
          <label>Influensa dato <input type="date" value={String(form.influenzaDate ?? "")} onChange={(e) => setValue("influenzaDate", e.target.value)} /></label>
          <label>Pneumokokk dato <input type="date" value={String(form.pneumococcalDate ?? "")} onChange={(e) => setValue("pneumococcalDate", e.target.value)} /></label>
          <label>Covid dato <input type="date" value={String(form.covidDate ?? "")} onChange={(e) => setValue("covidDate", e.target.value)} /></label>
          <label>RSV dato <input type="date" value={String(form.rsvDate ?? "")} onChange={(e) => setValue("rsvDate", e.target.value)} /></label>
        </div>
        <label style={{ marginTop: 10 }}>Forslag til videre behandling (automatisk fra KOLS-veileder)
          <textarea rows={4} style={{ width: "100%" }} value={String(form.treatmentStepSuggestion ?? "")} readOnly />
        </label>
        <label style={{ marginTop: 10 }}>Plan eller tiltak (til neste kontroll)
          <textarea rows={4} style={{ width: "100%" }} value={String(form.planOrTiltak ?? "")} onChange={(e) => setValue("planOrTiltak", e.target.value)} />
        </label>
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
