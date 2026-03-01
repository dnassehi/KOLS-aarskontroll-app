# AGENTS.md – Roller og ansvar i KOLS Årskontroll App

Dette dokumentet beskriver hvilke oppgaver de ulike agent-rollene forventes å utføre i prosjektet.

## Overordnede prinsipper
- Klinisk logikk skal være transparent og enkel å verifisere.
- Automatikk er beslutningsstøtte, ikke erstatning for klinisk skjønn.
- Endringer i klassifisering/behandlingsregler skal dokumenteres i commit-melding og changelog.
- Ingen hardkodede hemmeligheter.

---

## 1) Product/Clinical Agent

### Ansvar
- Vedlikeholde kravspesifikasjon basert på KOLS-veileder.
- Eie definisjon av felter, copy-regler og beslutningsregler.
- Godkjenne klinisk språk i journaltekst og PDF.

### Leveranser
- Oppdatert `README.md` (krav)
- Oppdatert `docs/clinical-rules.md` (når filen opprettes)
- Akseptkriterier per feature

### Definition of Done
- Alle kliniske regler er sporbare til dokumentert kilde
- Alle terskler og kategorier er eksplisitte

---

## 2) Frontend Agent

### Ansvar
- Implementere browser-basert UI
- Pasientsøk/opprettelse
- Årskontrollskjema med tydelig validering
- Clone-flow med synlig reset av felter

### Leveranser
- Formularsider
- Komponenter for CAT/mMRC/spirometri/medikamentkryss
- Feilmeldinger og brukerfeedback

### Definition of Done
- Bruker kan fullføre hele årskontroll uten teknisk hjelp
- Felter som ikke skal kopieres nullstilles korrekt i UI

---

## 3) Backend/API Agent

### Ansvar
- Designe API-er og tjenestelag
- Implementere klassifisering og behandlingsalgoritme
- Sikre konsistent clone-logikk i backend

### Leveranser
- Endepunkter for pasient, review, clone, eksport
- Valideringslogikk
- Enhetstester av regler

### Definition of Done
- API-respons er stabile og dokumenterte
- Regelmotor gir forventet resultat for testcases

---

## 4) Data/DB Agent

### Ansvar
- Prisma-modellering og migrasjoner
- Dataintegritet og constraints
- Strategi for backup/restore

### Leveranser
- `prisma/schema.prisma`
- Migrasjoner
- Seed-data for test

### Definition of Done
- Migrasjoner kjører clean på tom DB
- Clone-regel støttes robust av datamodell

---

## 5) Export Agent (PDF + tekst)

### Ansvar
- Lage standardisert journaltekst (copy/paste-vennlig)
- Generere PDF med samme innhold og struktur

### Leveranser
- Tekstmaler
- PDF-mal
- Snapshot-tester for output-format

### Definition of Done
- Tekst kan limes direkte i journal uten etterarbeid
- PDF inneholder alle sentrale felt og vurdering

---

## 6) QA/Test Agent

### Ansvar
- Testplan for kliniske regler og brukerflyt
- Verifisere copy-regler mellom år
- Edge-case-testing av inputgrenser

### Minimum testcases
1. Ny pasient → ny kontroll
2. Eksisterende pasient → clone fra forrige år
3. Verifiser reset: CAT/mMRC/eksaserbasjoner/spirometri
4. Verifiser obstruksjonsgrad ved FEV1%=85/65/40/25
5. Verifiser behandlingstrinn ved symptom- og risikoprofiler

### Definition of Done
- Alle prioriterte testcases passerer
- Kritiske feil = 0 før release

---

## 7) DevOps Agent

### Ansvar
- Lokal/dev setup
- Docker compose for app + database
- Enkel deploy-oppskrift

### Leveranser
- `docker-compose.yml`
- `.env.example`
- Runbook i `docs/deploy.md`

### Definition of Done
- Ny utvikler kan starte systemet lokalt på <15 min

---

## Samarbeid med Adam
Hvis Adam er klinisk/teknisk samarbeidspartner i prosjektet:
- Product/Clinical Agent avklarer kliniske prioriteringer med Adam.
- Backend Agent avklarer regelimplementasjon med Adam ved tvil.
- QA Agent går gjennom aksepttestene sammen med Adam før MVP-release.

Foreslått fast ritual:
- 1 kort sync før hver sprint
- 1 demo med Adam per sprintslutt

---

## Endringskontroll
Alle PR-er som påvirker kliniske regler må inneholde:
1. Hva som er endret
2. Hvorfor
3. Hvilke testcases som dekker endringen
4. Om outputtekst/PDF påvirkes
